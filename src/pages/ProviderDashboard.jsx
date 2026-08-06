import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { apiRequest } from '../services/api'
import './ProviderDashboard.css'

const NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'jobs', label: 'Jobs' },
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
  const [photoInput, setPhotoInput] = useState({}) // {id: {before, after}}
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

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

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2500) }

  const setStatus = async (id, status) => {
    const pin = pinInput[id] || ''
    const photos = photoInput[id] || {}
    try {
      await apiRequest(`/bookings/${id}/status`, 'PUT', {
        status, pin_code: pin,
        before_photo: photos.before || null,
        after_photo: photos.after || null,
      }, token)
      setPinInput((p) => ({ ...p, [id]: '' }))
      setPhotoInput((p) => ({ ...p, [id]: {} }))
      flash(status === 'in_progress' ? 'Service started' : 'Service completed — payout credited')
      loadBookings(); loadEarnings()
    } catch (e) { alert(e.message) }
  }

  const changeAvailability = async (status) => {
    try {
      await apiRequest('/provider/availability', 'PUT', { availability_status: status }, token)
      setAvailability(status); flash('Availability updated')
    } catch (e) { alert(e.message) }
  }

  const fileToB64 = (file) => new Promise((res, rej) => {
    const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file)
  })

  const onPhoto = async (id, kind, file) => {
    if (!file) return
    const b64 = await fileToB64(file)
    setPhotoInput((p) => ({ ...p, [id]: { ...(p[id] || {}), [kind]: b64 } }))
  }

  const pending = bookings.filter((b) => b.status === 'pending')
  const assigned = bookings.filter((b) => b.status === 'assigned')
  const active2 = bookings.filter((b) => b.status === 'in_progress')
  const done = bookings.filter((b) => b.status === 'completed')

  const statusColor = { pending: '#d97706', assigned: '#2563eb', in_progress: '#7c3aed', completed: '#059669', cancelled: '#6b7280' }

  return (
    <motion.div className="pd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <AnimatePresence>
        {toast && (
          <motion.div className="pd-toast" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <aside className="pd-sidebar">
        <div className="pd-sidebar__logo">
          <span className="pd-sidebar__logo-text">LUXORA</span>
          <span className="pd-sidebar__tier">PROVIDER</span>
        </div>
        <nav className="pd-nav">
          {NAV.map((n) => (
            <button key={n.id} className={`pd-nav__item ${active === n.id ? 'pd-nav__item--active' : ''}`} onClick={() => setActive(n.id)}>
              <span className="pd-nav__dot" />{n.label}
            </button>
          ))}
        </nav>
        <div className="pd-sidebar__profile">
          <span className={`pd-avail pd-avail--${availability}`}>{availability}</span>
        </div>
        <button className="pd-sidebar__concierge" onClick={() => { localStorage.removeItem('luxora_token'); navigate('/') }}>
          SIGN OUT
        </button>
      </aside>

      <div className="pd-main">
        <header className="pd-topbar">
          <div>
            <p className="pd-eyebrow">PROVIDER SUITE</p>
            <h1 className="pd-greeting__title">Welcome back, Pro</h1>
          </div>
        </header>

        {error && <div className="pd-error">{error}</div>}

        {active === 'overview' && (
          <>
            <div className="pd-stats">
              <div className="pd-stat"><p className="pd-stat__label">PENDING</p><p className="pd-stat__value">{pending.length}</p></div>
              <div className="pd-stat"><p className="pd-stat__label">ASSIGNED</p><p className="pd-stat__value">{assigned.length}</p></div>
              <div className="pd-stat"><p className="pd-stat__label">IN PROGRESS</p><p className="pd-stat__value">{active2.length}</p></div>
              <div className="pd-stat"><p className="pd-stat__label">EARNINGS (LKR)</p><p className="pd-stat__value pd-stat__value--gold">{(+earnings.earnings).toLocaleString()}</p></div>
            </div>
            <h3 className="pd-section-title">Next Up</h3>
            <div className="pd-jobs">
              {[...pending, ...assigned, ...active2].slice(0, 3).map((b) => (
                <div key={b.id} className="pd-job-row" onClick={() => setActive('jobs')}>
                  <div>
                    <p className="pd-job-title">{b.service_title}</p>
                    <p className="pd-job-meta">{b.booking_date} · {b.booking_time} · {b.customer_name}</p>
                  </div>
                  <span className="pd-job-badge" style={{ background: statusColor[b.status] }}>{b.status}</span>
                </div>
              ))}
              {pending.length + assigned.length + active2.length === 0 && <p className="pd-empty">No active jobs. Adjust availability to receive requests.</p>}
            </div>
          </>
        )}

        {active === 'jobs' && (
          <div className="pd-jobs-list">
            {bookings.length === 0 && <p className="pd-empty">No jobs yet.</p>}
            {bookings.map((b) => (
              <motion.div key={b.id} className="pd-job-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                <div className="pd-job-card__head">
                  <div>
                    <h3>{b.service_title}</h3>
                    <p className="pd-job-card__descr">{b.service_desc}</p>
                  </div>
                  <span className="pd-job-badge" style={{ background: statusColor[b.status] }}>{b.status}</span>
                </div>
                <div className="pd-job-card__grid">
                  <div><span>DATE</span><p>{b.booking_date} {b.booking_time}</p></div>
                  <div><span>CUSTOMER</span><p>{b.customer_name}</p></div>
                  <div><span>PHONE</span><a href={`tel:${b.customer_phone}`} className="pd-call">{b.customer_phone} ↗</a></div>
                  <div><span>PRICE</span><p>LKR {Number(b.total_price).toLocaleString()}</p></div>
                </div>

                {(b.status === 'assigned' || b.status === 'pending') && (
                  <div className="pd-job-card__actions">
                    <input className="pd-pin-input" placeholder="Customer PIN to start" value={pinInput[b.id] || ''}
                      onChange={(e) => setPinInput((p) => ({ ...p, [b.id]: e.target.value }))} />
                    <button className="pd-btn-gold" onClick={() => setStatus(b.id, 'in_progress')}>Start Job (PIN)</button>
                  </div>
                )}
                {b.status === 'in_progress' && (
                  <div className="pd-job-card__photos">
                    <label className="pd-photo-up">
                      Before <input type="file" accept="image/*" onChange={(e) => onPhoto(b.id, 'before', e.target.files[0])} />
                      {photoInput[b.id]?.before && <span className="pd-photo-ok">✓</span>}
                    </label>
                    <label className="pd-photo-up">
                      After <input type="file" accept="image/*" onChange={(e) => onPhoto(b.id, 'after', e.target.files[0])} />
                      {photoInput[b.id]?.after && <span className="pd-photo-ok">✓</span>}
                    </label>
                    <input className="pd-pin-input" placeholder="Customer PIN to complete" value={pinInput[b.id] || ''}
                      onChange={(e) => setPinInput((p) => ({ ...p, [b.id]: e.target.value }))} />
                    <button className="pd-btn-gold" disabled={!photoInput[b.id]?.after} onClick={() => setStatus(b.id, 'completed')}>
                      Complete (PIN + After Photo)
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {active === 'earnings' && (
          <div className="pd-earnings">
            <div className="pd-earn-hero">
              <p className="pd-stat__label">TOTAL EARNINGS (85% PAYOUT)</p>
              <h2 className="pd-earn-amount">LKR {(+earnings.earnings).toLocaleString()}</h2>
              <p className="pd-stat__label">{earnings.completedJobs} completed · LKR {earnings.history.reduce((s, h) => s + Number(h.total_price), 0).toLocaleString()} gross</p>
            </div>
            <h3 className="pd-section-title">Job History</h3>
            <div className="pd-history">
              {earnings.history.length === 0 && <p className="pd-empty">No completed jobs yet.</p>}
              {earnings.history.map((h) => (
                <div key={h.id} className="pd-history-row">
                  <span>#{h.id} · {h.service_title}</span>
                  <span className="pd-history-pay">LKR {Math.round(Number(h.total_price) * 0.85).toLocaleString()} · {h.booking_date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {active === 'availability' && (
          <div className="pd-avail-box">
            <h3 className="pd-section-title">Set Your Availability</h3>
            <p className="pd-avail-note">You only receive new job assignments when set to <strong>available</strong>.</p>
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
