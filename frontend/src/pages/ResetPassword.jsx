import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiRequest } from '../services/api'
import { ActionButton } from '../components/ui'
import PeekingEyes from '../components/PeekingEyes'
import './Auth.css'

const EyeIcon = ({ open }) => (open ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
))

export default function ResetPassword() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [isConfirmFocused, setIsConfirmFocused] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password) || password !== confirm) {
      setError('Passwords must match, be at least 8 characters, and contain both letters and numbers.')
      return
    }
    setLoading(true)
    try {
      await apiRequest('/auth/password-reset/confirm', 'POST', { token: params.get('reset_token'), password })
      setMessage('Password updated. You can now log in.')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <button
          className="auth-card-close-btn"
          onClick={() => navigate('/login')}
          aria-label="Back to Login"
          title="Back to Login"
          type="button"
        >
          ✕
        </button>
        <h1 className="auth-card__title">Set a new password</h1>
        <p className="auth-card__subtitle" style={{ marginBottom: '1.25rem' }}>Your Luxora reset link is valid for 15 minutes.</p>
        {error && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</p>}
        {message && <p style={{ color: '#22c55e', fontSize: '0.85rem' }}>{message}</p>}
        <form className="auth-form" onSubmit={submit}>
          <div className="auth-field auth-field--peeker">
            <div
              className="auth-input-wrap"
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsPasswordFocused(false) }}
            >
              <PeekingEyes
                isActive={isPasswordFocused}
                textLength={password.length}
                isPasswordVisible={showPassword}
              />
              <input
                className="auth-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="New password"
                aria-label="New password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle new password visibility"
                aria-pressed={showPassword}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          <div className="auth-field auth-field--peeker">
            <div
              className="auth-input-wrap"
              onFocus={() => setIsConfirmFocused(true)}
              onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsConfirmFocused(false) }}
            >
              <PeekingEyes
                isActive={isConfirmFocused}
                textLength={confirm.length}
                isPasswordVisible={showConfirm}
              />
              <input
                className="auth-input"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirm password"
                aria-label="Confirm password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label="Toggle confirm password visibility"
                aria-pressed={showConfirm}
              >
                <EyeIcon open={showConfirm} />
              </button>
            </div>
          </div>

          <ActionButton className="auth-submit" type="submit" loading={loading} loadingText="Updating password...">
            Update Password
          </ActionButton>
        </form>
      </div>
    </div>
  )
}
