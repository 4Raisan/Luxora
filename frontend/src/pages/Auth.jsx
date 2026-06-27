import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Authentication failed');
      }

      onLogin(payload.token);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="glass-panel auth-card" onSubmit={submit}>
        <h1>SteamA</h1>
        <p>Wishlist monitor and automated alert center</p>

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={formData.password}
          onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
          required
          minLength={6}
        />

        {error ? <p className="error-text">{error}</p> : null}

        <button className="glow-button" type="submit" disabled={loading}>
          {loading ? 'Please wait...' : mode === 'register' ? 'Create account' : 'Log in'}
        </button>

        <button
          className="ghost-button"
          type="button"
          onClick={() => setMode((prev) => (prev === 'login' ? 'register' : 'login'))}
        >
          {mode === 'login' ? 'Need an account? Register' : 'Already registered? Log in'}
        </button>
      </form>
    </div>
  );
}

export default Auth;
