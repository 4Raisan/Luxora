import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api'
import './Auth.css'

const Signup = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  })

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) return setError('Passwords do not match.')
    if (!agreed) return setError('Please accept the Terms of Service.')
    setError(''); setLoading(true)
    try {
      const res = await apiRequest('/auth/register', 'POST', {
        name: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: 'customer',
      })
      localStorage.setItem('luxora_token', res.token)
      localStorage.setItem('luxora_role', res.user.role)
      navigate('/customer-dashboard')
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
      <div className="auth-card auth-card--wide">
        <div className="auth-card__header">
          <h1 className="auth-card__title">Create Account</h1>
          <p className="auth-card__subtitle">Join the Luxora elite concierge network</p>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit} id="signup-form">
          {error && <div className="auth-error">{error}</div>}
          {/* Row: Name + Phone */}
          <div className="auth-form-row">
            <div className="auth-field">
              <input
                id="signup-fullname"
                name="fullName"
                type="text"
                className="auth-input"
                placeholder="Full Name"
                value={form.fullName}
                onChange={handleChange}
                required
                autoComplete="name"
              />
            </div>
            <div className="auth-field">
              <input
                id="signup-phone"
                name="phone"
                type="tel"
                className="auth-input"
                placeholder="Phone Number"
                value={form.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Email */}
          <div className="auth-field">
            <input
              id="signup-email"
              name="email"
              type="email"
              className="auth-input"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="auth-field">
            <div className="auth-input-wrap">
              <input
                id="signup-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-eye"
                id="signup-toggle-password"
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

          {/* Confirm Password */}
          <div className="auth-field">
            <div className="auth-input-wrap">
              <input
                id="signup-confirm"
                name="confirm"
                type={showConfirm ? 'text' : 'password'}
                className="auth-input"
                placeholder="Confirm Password"
                value={form.confirm}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-eye"
                id="signup-toggle-confirm"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label="Toggle confirm password visibility"
              >
                {showConfirm ? (
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

          {/* Terms */}
          <label className="auth-checkbox auth-checkbox--terms" htmlFor="agree-terms">
            <input
              id="agree-terms"
              type="checkbox"
              checked={agreed}
              onChange={() => setAgreed(!agreed)}
              required
            />
            <span className="auth-checkbox__box" />
            <span className="auth-checkbox__label">
              I agree to the{' '}
              <a href="#" className="auth-forgot">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="auth-forgot">Privacy Policy</a>
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            id="signup-submit-btn"
            className={`auth-submit ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading
              ? <span className="auth-spinner" />
              : 'CREATE ACCOUNT'
            }
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider"><span /></div>

        {/* Footer */}
        <div className="auth-card__footer">
          <p className="auth-card__footer-text">Already have an account?</p>
          <Link to="/login" className="auth-card__footer-link" id="signup-goto-login">
            SIGN IN →
          </Link>
        </div>
      </div>

      <p className="auth-tagline">EXCELLENCE REFINED</p>
    </div>
  )
}

export default Signup
