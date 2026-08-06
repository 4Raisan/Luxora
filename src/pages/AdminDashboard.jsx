import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { apiRequest } from '../services/api'
import './AdminDashboard.css'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, totalProviders: 0, totalBookings: 0, totalRevenue: 0 })
  const [providers, setProviders] = useState([])
  const [bookings, setBookings] = useState([])
  const [complaints, setComplaints] = useState([])
  const [tab, setTab] = useState('overview')
  const [token, setToken] = useState(localStorage.getItem('luxora_token') || '')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) { setError('Not authenticated'); return }
    loadAll()
  }, [token])

  const loadAll = async () => {
    try {
      const [s, p, b, c] = await Promise.all([
        apiRequest('/admin/stats', 'GET', null, token),
        apiRequest('/admin/providers', 'GET', null, token),
        apiRequest('/admin/bookings', 'GET', null, token),
        apiRequest('/admin/complaints', 'GET', null, token),
      ])
      setStats(s); setProviders(p); setBookings(b); setComplaints(c)
    } catch (err) {
      setError(err.message)
      if (/token/i.test(err.message)) { localStorage.removeItem('luxora_token'); }
    }
  }

  const handleKyc = async (id, status) => {
    try { await apiRequest(`/admin/providers/${id}/kyc`, 'PUT', { status }, token); loadAll() }
    catch (err) { alert(err.message) }
  }
  const handleComplaint = async (id, status) => {
    try { await apiRequest(`/admin/complaints/${id}`, 'PUT', { status }, token); loadAll() }
    catch (err) { alert(err.message) }
  }

  const statCards = [
    { label: 'Customers', value: stats.totalUsers, accent: false },
    { label: 'Active Providers', value: stats.totalProviders, accent: true },
    { label: 'Bookings', value: stats.totalBookings, accent: false },
    { label: 'Revenue (LKR)', value: Number(stats.totalRevenue || 0).toLocaleString(), accent: true },
  ]

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'providers', label: 'Providers' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'complaints', label: 'Complaints' },
  ]

  return (
    <motion.div className="admin-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">ADMINISTRATION</p>
          <h2>Luxora Operations Center</h2>
        </div>
        <button className="admin-logout" onClick={() => { localStorage.removeItem('luxora_token'); window.location.href = '/' }}>
          Sign Out
        </button>
      </header>

      <nav className="admin-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`admin-tab ${tab === t.id ? 'admin-tab--active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      {error && <div className="admin-error">{error}</div>}

      {tab === 'overview' && (
        <div className="stats-grid">
          {statCards.map((s, i) => (
            <motion.div key={s.label} className="stat-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <h3>{s.label}</h3>
              <p className={s.accent ? 'stat-accent' : ''}>{s.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'providers' && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Email</th><th>Category</th><th>NIC</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td><td>{p.name}</td><td>{p.email}</td><td>{p.category}</td><td>{p.nic || 'N/A'}</td>
                  <td><span className={`status-badge ${p.kyc_status}`}>{p.kyc_status}</span></td>
                  <td>
                    {p.kyc_status === 'pending' && (
                      <>
                        <button className="btn-approve" onClick={() => handleKyc(p.id, 'approved')}>Approve</button>
                        <button className="btn-reject" onClick={() => handleKyc(p.id, 'rejected')}>Reject</button>
                      </>
                    )}
                    {p.kyc_status === 'approved' && <span className="text-verified">Verified</span>}
                    {p.kyc_status === 'rejected' && <span className="text-rejected">Rejected</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'bookings' && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>ID</th><th>Service</th><th>Customer</th><th>Provider</th><th>Date</th><th>Status</th><th>Total</th></tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.id}</td><td>{b.service_title}</td><td>{b.customer_name}</td>
                  <td>{b.provider_name || '—'}</td><td>{b.booking_date} {b.booking_time}</td>
                  <td><span className={`status-badge ${b.status}`}>{b.status}</span></td>
                  <td>LKR {Number(b.total_price).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'complaints' && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>ID</th><th>Subject</th><th>Customer</th><th>Service</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {complaints.length === 0 && <tr><td colSpan="6" className="admin-empty">No complaints filed.</td></tr>}
              {complaints.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td><td>{c.subject}</td><td>{c.customer_name}</td><td>{c.service_title || '—'}</td>
                  <td><span className={`status-badge ${c.status}`}>{c.status}</span></td>
                  <td>
                    <select className="admin-select" value={c.status} onChange={(e) => handleComplaint(c.id, e.target.value)}>
                      <option value="open">open</option>
                      <option value="in_review">in_review</option>
                      <option value="resolved">resolved</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  )
}
