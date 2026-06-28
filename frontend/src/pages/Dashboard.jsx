import { useCallback, useEffect, useMemo, useState } from 'react';
import CategorySidebar from '../components/CategorySidebar';
import { apiFetch, authHeaders } from '../utils/api';

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

  const headers = useMemo(() => authHeaders(token), [token]);

  const loadProfile = useCallback(async () => {
    try {
      const data = await apiFetch('/api/profile', { headers });
      setProfileForm({
        steamId: data.steamId || '',
        region: data.region || 'USD',
        whatsappNumber: data.whatsappNumber || '',
        whatsappEnabled: Boolean(data.whatsappEnabled)
      });
    } catch { /* auth failure handled elsewhere */ }
  }, [headers]);

  const loadGames = useCallback(async () => {
    try {
      const data = await apiFetch(`/api/games?sortBy=${sortBy}&order=${sortOrder}`, { headers });
      setGames(data);
    } catch { /* auth failure handled elsewhere */ }
  }, [headers, sortBy, sortOrder]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await apiFetch('/api/categories', { headers });
      setCategories(data);
    } catch { /* auth failure handled elsewhere */ }
  }, [headers]);

  useEffect(() => {
    loadProfile();
    loadGames();
    loadCategories();
  }, [loadProfile, loadGames, loadCategories]);

  const syncWishlist = async () => {
    setStatus('Syncing wishlist...');
    try {
      const payload = await apiFetch('/api/wishlist/sync', { method: 'POST', headers });
      setStatus(`Synced ${payload.count} games`);
      loadGames();
    } catch (error) {
      setStatus(error.message || 'Failed to sync');
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setStatus('Saving profile...');
    try {
      await apiFetch('/api/profile/steam', {
        method: 'PUT',
        headers,
        body: JSON.stringify(profileForm)
      });
      setStatus('Profile updated');
    } catch {
      setStatus('Profile update failed');
    }
  };

  const addCategory = async () => {
    const name = window.prompt('Category name');
    if (!name) return;

    try {
      await apiFetch('/api/categories', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name })
      });
      loadCategories();
    } catch { /* category creation failed silently */ }
  };

  const onDropGame = async (categoryId, steamAppId) => {
    try {
      await apiFetch('/api/categories/reorder', {
        method: 'POST',
        headers,
        body: JSON.stringify({ items: [{ categoryId, steamAppId, order: 0 }] })
      });
      loadCategories();
      setStatus('Category updated');
    } catch { /* reorder failed silently */ }
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
