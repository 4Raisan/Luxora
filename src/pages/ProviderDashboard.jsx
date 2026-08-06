import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { apiRequest } from '../services/api'
import './ProviderDashboard.css'

const NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'earnings', label: 'Earnings' },
  { id: 'availability', label: 'Availability' },
]

export default function ProviderDashboard() {
  const navigate = useNavigate()
  const [active, setActive] = useState('overview')
  const [token] = useState(localStorage.getItem('luxora_token') || '')
  const [bookings, setBookings] = useState([])
  const [earnings, setEarnings] = useState({ earnings: 0, completedJobs: 0, history: [] })
  const [availability, setAvailability] = useState('available')
  const [pinInput, setPinInput] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    loadBookings(); loadEarnings();
  }, [token])

  const loadBookings = async () => {
    try { const b = await apiRequest('/bookings/assigned', 'GET', null, token); setBookings(b) }
    catch (e) { setError(e.message) }
  }
  const loadEarnings = async () => {
    try { const e = await apiRequest('/provider/earnings', 'GET', null, token); setEarnings(e) }
    catch (e) { setError(e.message) }
  }

  const setStatus = async (id, status) => {
    const pin = pinInput[id] || ''
    try {
      await apiRequest(`/bookings/${id}/status`, 'PUT', { status, pin_code: pin }, token)
      setPinInput((p) => ({ ...p, [id]: '' }))
      loadBookings(); loadEarnings()
    } catch (e) { alert(e.message) }
  }

  const changeAvailability = async (status) => {
    try {
      await apiRequest('/provider/availability', 'PUT', { availability_status: status }, token)
      setAvailability(status)
    } catch (e) { alert(e.message) }
  }

  const assigned = bookings.filter((b) => b.status === 'assigned' || b.status === 'pending')
  const active2 = bookings.filter((b) => b.status === 'in_progress')
  const done = bookings.filter((b) => b.status === 'completed')

  return (
    <motion.div className="pd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <aside className="pd-sidebar">
        <div className="pd-sidebar__logo">
          <span className="pd-sidebar__logo-text">LUXORA</span>
          <span className="pd-sidebar__tier">PROVIDER</span>
        </div>
        <nav className="pd-nav">
          {NAV.map((n) => (
            <button key={n.id} className={`pd-nav__item ${active === n.id ? 'pd-nav__item--active' : ''}`} onClick={() => setActive(n.id)}>
              {n.label}
            </button>
          ))}
        </nav>
        <button className="pd-sidebar__concierge" onClick={() => { localStorage.removeItem('luxora_token'); navigate('/') }}>
          SIGN OUT
        </button>
      </aside>

      <div className="pd-main">
        <header className="pd-topbar">
          <h1 className="pd-greeting__title">Provider Suite</h1>
          <span className={`pd-avail pd-avail--${availability}`}>{availability}</span>
        </header>

        {error && <div className="pd-error">{error}</div>}

        {active === 'overview' && (
          <div className="pd-stats">
            <div className="pd-stat"><p className="pd-stat__label">ASSIGNED</p><p className="pd-stat__value">{assigned.length}</p></div>
            <div className="pd-stat"><p className="pd-stat__label">IN PROGRESS</p><p className="pd-stat__value">{active2.length}</p></div>
            <div className="pd-stat"><p className="pd-stat__label">COMPLETED</p><p className="pd-stat__value">{done.length}</p></div>
            <div className="pd-stat"><p className="pd-stat__label">EARNINGS (LKR)</p><p className="pd-stat__value pd-stat__value--gold">{Number(earnings.earnings).toLocaleString()}</p></div>
          </div>
        )}

        {active === 'bookings' && (
          <div className="pd-bookings-list">
            {bookings.length === 0 && <p className="pd-empty">No bookings yet.</p>}
            {bookings.map((b) => (
              <motion.div key={b.id} className="pd-booking-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                <div className="pd-booking-card__head">
                  <h3>{b.service_title}</h3>
                  <span className={`status-badge ${b.status}`}>{b.status}</span>
                </div>
                <p className="pd-booking-card__meta">
                  {b.booking_date} · {b.booking_time} · Customer: {b.customer_name} ({b.customer_phone})
                </p>
                {(b.status === 'assigned' || b.status === 'pending') && (
                  <div className="pd-booking-card__actions">
                    <input className="pd-pin-input" placeholder="Customer PIN" value={pinInput[b.id] || ''}
                      onChange={(e) => setPinInput((p) => ({ ...p, [b.id]: e.target.value }))} />
                    <button className="pd-btn-gold" onClick={() => setStatus(b.id, 'in_progress')}>Start (PIN)</button>
                  </div>
                )}
                {b.status === 'in_progress' && (
                  <div className="pd-booking-card__actions">
                    <input className="pd-pin-input" placeholder="Customer PIN" value={pinInput[b.id] || ''}
                      onChange={(e) => setPinInput((p) => ({ ...p, [b.id]: e.target.value }))} />
                    <button className="pd-btn-gold" onClick={() => setStatus(b.id, 'completed')}>Complete (PIN)</button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {active === 'earnings' && (
          <div className="pd-earnings">
            <div className="pd-earn-hero">
              <p className="pd-stat__label">TOTAL EARNINGS</p>
              <h2 className="pd-earn-amount">LKR {Number(earnings.earnings).toLocaleString()}</h2>
              <p className="pd-stat__label">{earnings.completedJobs} completed jobs · 85% payout</p>
            </div>
            <h3 className="pd-section-title">Job History</h3>
            <div className="pd-history">
              {earnings.history.length === 0 && <p className="pd-empty">No completed jobs yet.</p>}
              {earnings.history.map((h) => (
                <div key={h.id} className="pd-history-row">
                  <span>#{h.id} · {h.service_title}</span>
                  <span>{h.booking_date} · LKR {Number(h.total_price).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {active === 'availability' && (
          <div className="pd-avail-box">
            <h3 className="pd-section-title">Set Your Availability</h3>
            <div className="pd-avail-opts">
              {['available', 'busy', 'offline'].map((s) => (
                <button key={s} className={`pd-avail-opt ${availability === s ? 'pd-avail-opt--active' : ''}`} onClick={() => changeAvailability(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
