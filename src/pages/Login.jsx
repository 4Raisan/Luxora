import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api'
import './Auth.css'

const Login = () => {
  const navigate = useNavigate()
  const [tab, setTab] = useState('customer')
  const [showPassword, setShowPassword] = useState(false)
  const [keepSigned, setKeepSigned] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '' })

  const tabs = [
    { id: 'customer', label: 'Customer' },
    { id: 'provider', label: 'Provider' },
    { id: 'admin', label: 'Admin' },
  ]

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await apiRequest('/auth/login', 'POST', { email: form.email, password: form.password })
      localStorage.setItem('luxora_token', res.token)
      localStorage.setItem('luxora_role', res.user.role)
      const role = res.user.role
      if (role === 'provider') navigate('/provider-dashboard')
      else if (role === 'admin') navigate('/admin-dashboard')
      else navigate('/customer-dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* Background */}
      <div className="auth-bg" />

      {/* Logo */}
      <Link to="/" className="auth-logo">
        <img src="/luxora-logo.png" alt="LUXORA" className="auth-logo-img" />
      </Link>

      {/* Card */}
      <div className="auth-card">
        <div className="auth-card__header">
          <h1 className="auth-card__title">Welcome Back</h1>
          <p className="auth-card__subtitle">Access your elite concierge suite</p>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              id={`login-tab-${t.id}`}
              className={`auth-tab ${tab === t.id ? 'auth-tab--active' : ''}`}
              onClick={() => setTab(t.id)}
              type="button"
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit} id="login-form">
          {error && <div className="auth-error">{error}</div>}
          <div className="auth-field">
            <input
              id="login-email"
              name="email"
              type="text"
              className="auth-input"
              placeholder={tab === 'provider' ? 'Provider Email' : tab === 'admin' ? 'Admin Username' : 'Username or Email'}
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </div>

          <div className="auth-field">
            <div className="auth-input-wrap">
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-eye"
                id="login-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember & Forgot */}
          <div className="auth-row">
            <label className="auth-checkbox" htmlFor="keep-signed">
              <input
                id="keep-signed"
                type="checkbox"
                checked={keepSigned}
                onChange={() => setKeepSigned(!keepSigned)}
              />
              <span className="auth-checkbox__box" />
              <span className="auth-checkbox__label">Keep me signed in</span>
            </label>
            <a href="#" className="auth-forgot" id="login-forgot-link">Forgot Password?</a>
          </div>

          {/* Submit */}
          <button
            type="submit"
            id="login-submit-btn"
            className={`auth-submit ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading
              ? <span className="auth-spinner" />
              : 'SIGN IN'
            }
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span />
        </div>

        {/* Footer */}
        <div className="auth-card__footer">
          <p className="auth-card__footer-text">New to the Luxora experience?</p>
          <Link to="/signup" className="auth-card__footer-link" id="login-goto-signup">
            REQUEST MEMBERSHIP →
          </Link>
        </div>
      </div>

      <p className="auth-tagline">EXCELLENCE REFINED</p>
    </div>
  )
}

export default Login
