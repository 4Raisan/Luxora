import { useCallback, useEffect, useMemo, useState } from 'react';
import CategorySidebar from '../components/CategorySidebar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function Dashboard({ token, onLogout }) {
  const [profileForm, setProfileForm] = useState({
    steamId: '',
    region: 'USD',
    whatsappNumber: '',
    whatsappEnabled: false
  });
  const [games, setGames] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sortBy, setSortBy] = useState('atl');
  const [sortOrder, setSortOrder] = useState('asc');
  const [status, setStatus] = useState('Ready');

  const authHeaders = useMemo(() => {
    return {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    };
  }, [token]);

  const loadProfile = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/profile`, { headers: authHeaders });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setStatus(errorData.error || 'Failed to load profile');
        return;
      }
      const data = await response.json();
      setProfileForm({
        steamId: data.steamId || '',
        region: data.region || 'USD',
        whatsappNumber: data.whatsappNumber || '',
        whatsappEnabled: Boolean(data.whatsappEnabled)
      });
    } catch (error) {
      setStatus('Network error loading profile');
    }
  }, [authHeaders]);

  const loadGames = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/games?sortBy=${sortBy}&order=${sortOrder}`, {
        headers: authHeaders
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setStatus(errorData.error || 'Failed to load games');
        return;
      }
      const data = await response.json();
      setGames(data);
    } catch (error) {
      setStatus('Network error loading games');
    }
  }, [authHeaders, sortBy, sortOrder]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/categories`, { headers: authHeaders });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setStatus(errorData.error || 'Failed to load categories');
        return;
      }
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      setStatus('Network error loading categories');
    }
  }, [authHeaders]);

  useEffect(() => {
    loadProfile();
    loadGames();
    loadCategories();
  }, [loadProfile, loadGames, loadCategories]);

  const syncWishlist = async () => {
    setStatus('Syncing wishlist...');
    try {
      const response = await fetch(`${API_URL}/api/wishlist/sync`, {
        method: 'POST',
        headers: authHeaders
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus(payload.error || 'Failed to sync');
        return;
      }

      setStatus(`Synced ${payload.count} games`);
      loadGames();
    } catch (error) {
      setStatus('Network error syncing wishlist');
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setStatus('Saving profile...');
    try {
      const response = await fetch(`${API_URL}/api/profile/steam`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(profileForm)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setStatus(errorData.error || 'Profile update failed');
        return;
      }

      setStatus('Profile updated');
    } catch (error) {
      setStatus('Network error saving profile');
    }
  };

  const addCategory = async () => {
    const name = window.prompt('Category name');
    if (!name) return;

    try {
      const response = await fetch(`${API_URL}/api/categories`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ name })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setStatus(errorData.error || 'Failed to create category');
        return;
      }

      loadCategories();
    } catch (error) {
      setStatus('Network error creating category');
    }
  };

  const onDropGame = async (categoryId, steamAppId) => {
    try {
      const response = await fetch(`${API_URL}/api/categories/reorder`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          items: [{ categoryId, steamAppId, order: 0 }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setStatus(errorData.error || 'Failed to update category');
        return;
      }

      loadCategories();
      setStatus('Category updated');
    } catch (error) {
      setStatus('Network error updating category');
    }
  };

  const stats = {
    totalGames: games.length,
    discounted: games.filter((game) => (game.discountPercent || 0) > 0).length,
    cheapest: games.reduce(
      (lowest, game) =>
        game.currentPrice != null && (lowest == null || game.currentPrice < lowest)
          ? game.currentPrice
          : lowest,
      null
    )
  };

  return (
    <div className="dashboard-page">
      <header className="glass-panel topbar">
        <h2>SteamA Dashboard</h2>
        <div className="topbar-actions">
          <button className="ghost-button" onClick={syncWishlist} type="button">
            Sync Wishlist
          </button>
          <button className="ghost-button" onClick={onLogout} type="button">
            Logout
          </button>
        </div>
      </header>

      <section className="dashboard-grid">
        <CategorySidebar categories={categories} onAddCategory={addCategory} onDropGame={onDropGame} />

        <main className="glass-panel workspace">
          <form className="profile-form" onSubmit={saveProfile}>
            <input
              type="text"
              placeholder="Steam profile ID"
              value={profileForm.steamId}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, steamId: event.target.value }))}
            />
            <select
              value={profileForm.region}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, region: event.target.value }))}
            >
              {['USD', 'EUR', 'GBP', 'INR', 'BRL'].map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="WhatsApp number"
              value={profileForm.whatsappNumber}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, whatsappNumber: event.target.value }))
              }
            />
            <label>
              <input
                type="checkbox"
                checked={profileForm.whatsappEnabled}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, whatsappEnabled: event.target.checked }))
                }
              />
              WhatsApp alerts
            </label>
            <button className="glow-button" type="submit">
              Save
            </button>
          </form>

          <div className="filters">
            <label>
              Sort
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="atl">All-time low</option>
                <option value="discount">Discount %</option>
                <option value="price">Price</option>
                <option value="name">Name</option>
              </select>
            </label>
            <label>
              Order
              <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </label>
            <button className="ghost-button" type="button" onClick={loadGames}>
              Apply
            </button>
          </div>

          <div className="stats-overlay">
            <span>Total: {stats.totalGames}</span>
            <span>Discounted: {stats.discounted}</span>
            <span>Cheapest: {stats.cheapest ?? 'N/A'}</span>
            <span>{status}</span>
          </div>

          <div className="game-grid">
            {games.map((game) => (
              <article
                key={game.steamAppId}
                className="game-card"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('steamAppId', String(game.steamAppId));
                }}
              >
                {game.imageUrl ? <img src={game.imageUrl} alt={game.name} /> : null}
                <h4>{game.name}</h4>
                <p>Price: {game.currentPrice ?? 'N/A'}</p>
                <p>ATL: {game.allTimeLowPrice ?? 'N/A'}</p>
                <p>Discount: {game.discountPercent ?? 0}%</p>
              </article>
            ))}
          </div>
        </main>
      </section>
    </div>
  );
}

export default Dashboard;
