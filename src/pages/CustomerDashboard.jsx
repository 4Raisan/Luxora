import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { apiRequest } from '../services/api'
import './CustomerDashboard.css'

const STATUS_LABEL = {
  pending: 'Awaiting Provider',
  assigned: 'Provider Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export default function CustomerDashboard() {
  const navigate = useNavigate()
  const [token, setToken] = useState(localStorage.getItem('luxora_token') || '')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    load()
  }, [token])

  const load = async () => {
    try {
      const dash = await apiRequest('/customer/dashboard', 'GET', null, token)
      setData(dash)
    } catch (err) {
      setError(err.message)
      if (err.message === 'Access token required' || err.message.includes('token')) {
        localStorage.removeItem('luxora_token')
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const cancelBooking = async (id) => {
    if (!confirm('Cancel this booking?')) return
    try {
      await apiRequest(`/bookings/${id}/cancel`, 'PUT', {}, token)
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  const logout = () => {
    localStorage.removeItem('luxora_token')
    navigate('/login')
  }

  if (loading) return <div className="cd-loading">Curating your dashboard…</div>
  if (error && !data) return <div className="cd-loading">Error: {error}</div>

  const { profile, activeSubscriptions = [], upcomingBookings = [], pastBookings = [], reviews = [] } = data || {}

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  }
  const item = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  }

  return (
    <motion.div className="cd" initial="hidden" animate="show" variants={container}>
      <header className="cd-header">
        <div>
          <p className="cd-eyebrow">MEMBER DASHBOARD</p>
          <h1 className="cd-title">Welcome back, {profile?.name?.split(' ')[0] || 'Member'}.</h1>
        </div>
        <button className="cd-logout" onClick={logout}>Sign Out</button>
      </header>

      {/* Subscriptions */}
      <motion.section className="cd-section" variants={item}>
        <h2 className="cd-section-title">Your Membership</h2>
        <div className="cd-subs">
          {activeSubscriptions.length === 0 && (
            <div className="cd-empty">
              No active subscription.{' '}
              <button className="cd-link" onClick={() => navigate('/')}>Explore plans →</button>
            </div>
          )}
          {activeSubscriptions.map((s) => (
            <div key={s.id} className="cd-sub-card">
              <span className="cd-sub-tier">{s.type === 'combo' ? 'TRI-COMBO' : 'SINGLE'}</span>
              <h3>{s.title}</h3>
              <p className="cd-sub-price">LKR {Number(s.price_monthly).toLocaleString()}<span>/mo</span></p>
              <p className="cd-sub-desc">{s.description}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Upcoming bookings */}
      <motion.section className="cd-section" variants={item}>
        <div className="cd-section-head">
          <h2 className="cd-section-title">Upcoming Services</h2>
          <button className="cd-book-btn" onClick={() => navigate('/book')}>＋ Book a Service</button>
        </div>
        <div className="cd-bookings">
          {upcomingBookings.length === 0 && (
            <div className="cd-empty">No upcoming bookings yet.</div>
          )}
          {upcomingBookings.map((b) => (
            <div key={b.id} className="cd-booking">
              <div className="cd-booking-date">
                <span>{b.booking_date}</span>
                <small>{b.booking_time}</small>
              </div>
              <div className="cd-booking-main">
                <h4>{b.service_title}</h4>
                <p>{b.category_name} · {b.provider_name ? `Provider: ${b.provider_name}` : 'Auto-assigning a verified provider'}</p>
              </div>
              <div className="cd-booking-right">
                <span className={`cd-status cd-status--${b.status}`}>{STATUS_LABEL[b.status] || b.status}</span>
                {(b.status === 'pending' || b.status === 'assigned') && (
                  <div className="cd-pin">PIN: <strong>{b.pin_code}</strong></div>
                )}
                {(b.status === 'pending' || b.status === 'assigned') && (
                  <button className="cd-cancel" onClick={() => cancelBooking(b.id)}>Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Past bookings */}
      <motion.section className="cd-section" variants={item}>
        <h2 className="cd-section-title">Service History</h2>
        <div className="cd-bookings">
          {pastBookings.length === 0 && <div className="cd-empty">No past services.</div>}
          {pastBookings.map((b) => (
            <div key={b.id} className="cd-booking cd-booking--past">
              <div className="cd-booking-date">
                <span>{b.booking_date}</span>
                <small>{b.booking_time}</small>
              </div>
              <div className="cd-booking-main">
                <h4>{b.service_title}</h4>
                <p>{b.category_name} · LKR {Number(b.total_price).toLocaleString()}</p>
              </div>
              <div className="cd-booking-right">
                <span className={`cd-status cd-status--${b.status}`}>{STATUS_LABEL[b.status] || b.status}</span>
                <button className="cd-link" onClick={() => navigate('/reviews')}>Review</button>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Reviews */}
      <motion.section className="cd-section" variants={item}>
        <div className="cd-section-head">
          <h2 className="cd-section-title">Your Reviews</h2>
          <button className="cd-link" onClick={() => navigate('/reviews')}>Write a review →</button>
        </div>
        <div className="cd-reviews">
          {reviews.length === 0 && <div className="cd-empty">You haven't reviewed any service yet.</div>}
          {reviews.map((r) => (
            <div key={r.id} className="cd-review">
              <div className="cd-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
              <p>{r.comment}</p>
              <small>{r.service_title} · {r.provider_name}</small>
            </div>
          ))}
        </div>
      </motion.section>
    </motion.div>
  )
}
