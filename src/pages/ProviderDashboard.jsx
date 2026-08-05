import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Calendar from '../components/Calendar'
import './ProviderDashboard.css'

/* ── Mock Data ─────────────────────────────────────── */
const NAV_ITEMS = [
  { id: 'overview',      icon: <GridIcon />,   label: 'Overview' },
  { id: 'bookings',      icon: <CalIcon />,    label: 'Bookings' },
  { id: 'services',      icon: <BriefIcon />,  label: 'Services' },
  { id: 'notifications', icon: <BellIcon />,   label: 'Notifications' },
  { id: 'subscription',  icon: <StarIcon />,   label: 'Subscription' },
  { id: 'settings',      icon: <GearIcon />,   label: 'Settings' },
]

const STATS = [
  { label: 'ACTIVE BOOKINGS', value: '3',        accent: false },
  { label: 'TOTAL SPENT',     value: '$12.5k',   accent: false },
  { label: 'MEMBER TIER',     value: 'Elite',    accent: true  },
  { label: 'NEXT SERVICE',    value: 'Tomorrow', accent: false },
]

const SERVICES = [
  {
    id: 1,
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
    status: 'ACTIVE',
    title: 'Automotive Stewardship',
    desc: 'Weekly detailing and mechanical health monitoring for your fleet.',
    next: 'Next: Friday, 10:00 AM',
  },
  {
    id: 2,
    img: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=600&q=80',
    status: 'ACTIVE',
    title: 'Architectural Landscaping',
    desc: 'Seasonal curation and nightly maintenance of exterior...',
    next: 'Next: Monday, 08:30 AM',
  },
]

const BOOKINGS = [
  { month: 'OCT', day: '14', title: 'Private Jet Charter – Aspen',   sub: 'Global Express 6000 • Teterboro (TEB)', status: 'CONFIRMED', color: '#C9A84C' },
  { month: 'OCT', day: '18', title: 'Private Dining – Omakase',       sub: 'Chef K. Murata • Residence',             status: 'PENDING',   color: '#666' },
  { month: 'OCT', day: '22', title: 'Yacht Maintenance Survey',        sub: 'Portofino Marine Hub',                   status: 'CONFIRMED', color: '#C9A84C' },
]

const NOTIFICATIONS = [
  { icon: '✦', title: 'Service completed', body: 'Automotive detailing at the Residence was finalized by Specialist Marco.', time: '2 HOURS AGO' },
  { icon: '▣', title: 'New invoice available', body: 'Invoice INV-2024-008 for Concierge Services is ready for review.', time: 'YESTERDAY' },
]

const TIMELINE = [
  { dot: '#C9A84C', title: 'Renewal confirmed',  sub: 'Elite Membership active until 2026', date: 'OCT 01' },
  { dot: '#555',    title: 'New property added',  sub: 'Portofino Villa integrated to profile', date: 'SEP 19' },
  { dot: '#555',    title: 'Milestone achieved',  sub: 'One year with Luxora Concierge', date: 'AUG 29' },
]


/* ── SVG Icons ─────────────────────────────────────── */
function GridIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg> }
function CalIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }
function BriefIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.5"/></svg> }
function BellIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }
function StarIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg> }
function GearIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.5"/></svg> }
function SearchIcon(){ return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }
function LinkIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function DotsIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="19" r="1.5" fill="currentColor"/></svg> }
function PlusIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> }
function UserIcon()  { return <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }

/* ── Component ─────────────────────────────────────── */
const ProviderDashboard = () => {
  const navigate = useNavigate()
  const [activeNav, setActiveNav] = useState('overview')
  const [search, setSearch] = useState('')

  return (
    <div className="pd">
      {/* ── Sidebar ── */}
      <aside className="pd-sidebar">
        <div className="pd-sidebar__logo">
          <img src="/luxora-logo.png" alt="LUXORA" className="pd-sidebar__logo-img" />
          <span className="pd-sidebar__tier">ELITE MEMBER</span>
        </div>

        <nav className="pd-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              id={`pd-nav-${item.id}`}
              className={`pd-nav__item ${activeNav === item.id ? 'pd-nav__item--active' : ''}`}
              onClick={() => setActiveNav(item.id)}
            >
              <span className="pd-nav__icon">{item.icon}</span>
              <span className="pd-nav__label">{item.label}</span>
              {activeNav === item.id && <div className="pd-nav__bar" />}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="pd-sidebar__user">
          <div className="pd-sidebar__avatar"><UserIcon /></div>
          <div>
            <p className="pd-sidebar__name">Julian V.</p>
            <p className="pd-sidebar__status">ELITE STATUS</p>
          </div>
        </div>

        <button className="pd-sidebar__concierge" id="pd-book-concierge">
          BOOK CONCIERGE
        </button>
      </aside>

      {/* ── Main ── */}
      <div className="pd-main">
        {/* Top Bar */}
        <header className="pd-topbar">
          <div className="pd-topbar__search">
            <SearchIcon />
            <input
              id="pd-search"
              type="text"
              placeholder="Search services, bookings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pd-topbar__input"
            />
          </div>
          <div className="pd-topbar__actions">
            <button className="pd-topbar__icon-btn" id="pd-notif-btn" aria-label="Notifications">
              <BellIcon />
              <span className="pd-topbar__badge">2</span>
            </button>
            <button className="pd-topbar__icon-btn" id="pd-settings-btn" aria-label="Settings"><GearIcon /></button>
            <button className="pd-topbar__icon-btn pd-topbar__avatar-btn" id="pd-profile-btn" aria-label="Profile"
              onClick={() => navigate('/login')}>
              <UserIcon />
            </button>
          </div>
        </header>

        {/* ── Content ── */}
        <div className="pd-content">
          {/* Left Panel */}
          <div className="pd-panel-left">
            {/* Greeting */}
            <div className="pd-greeting">
              <div>
                <p className="pd-greeting__label">DASHBOARD OVERVIEW</p>
                <h1 className="pd-greeting__title">Welcome back, Julian.</h1>
              </div>
              <button className="pd-quick-book" id="pd-quick-book-btn">
                <PlusIcon /> QUICK BOOK
              </button>
            </div>

            {/* Stats */}
            <div className="pd-stats">
              {STATS.map((s) => (
                <div key={s.label} className="pd-stat">
                  <p className="pd-stat__label">{s.label}</p>
                  <p className={`pd-stat__value ${s.accent ? 'pd-stat__value--gold' : ''}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Current Services */}
            <div className="pd-section-header">
              <h2 className="pd-section-title">Current Services</h2>
              <button className="pd-section-link" id="pd-manage-all-btn">MANAGE ALL →</button>
            </div>
            <div className="pd-services-grid">
              {SERVICES.map((svc) => (
                <div key={svc.id} className="pd-service-card" id={`pd-service-${svc.id}`}>
                  <div className="pd-service-card__img-wrap">
                    <img src={svc.img} alt={svc.title} className="pd-service-card__img" />
                  </div>
                  <div className="pd-service-card__body">
                    <span className="pd-service-card__badge">{svc.status}</span>
                    <h3 className="pd-service-card__title">{svc.title}</h3>
                    <p className="pd-service-card__desc">{svc.desc}</p>
                    <div className="pd-service-card__footer">
                      <span className="pd-service-card__next">{svc.next}</span>
                      <button className="pd-service-card__link" aria-label="Open"><LinkIcon /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Upcoming Bookings */}
            <div className="pd-section-header" style={{ marginTop: '2rem' }}>
              <h2 className="pd-section-title">Upcoming Bookings</h2>
              <button className="pd-section-link" id="pd-view-archive-btn">View Archive</button>
            </div>
            <div className="pd-bookings">
              {BOOKINGS.map((b, i) => (
                <div key={i} className="pd-booking" id={`pd-booking-${i}`}>
                  <div className="pd-booking__date">
                    <span className="pd-booking__month">{b.month}</span>
                    <span className="pd-booking__day">{b.day}</span>
                  </div>
                  <div className="pd-booking__info">
                    <p className="pd-booking__title">{b.title}</p>
                    <p className="pd-booking__sub">{b.sub}</p>
                  </div>
                  <span className="pd-booking__status" style={{ borderColor: b.color, color: b.color }}>
                    {b.status}
                  </span>
                  <button className="pd-booking__dots" aria-label="More options"><DotsIcon /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel */}
          <div className="pd-panel-right">
            {/* Calendar */}
            <div className="pd-widget">
              <Calendar />
            </div>

            {/* Notifications */}
            <div className="pd-widget">
              <h3 className="pd-widget__title">RECENT NOTIFICATIONS</h3>
              <div className="pd-notifs">
                {NOTIFICATIONS.map((n, i) => (
                  <div key={i} className="pd-notif" id={`pd-notif-${i}`}>
                    <div className="pd-notif__icon">{n.icon}</div>
                    <div className="pd-notif__body">
                      <p className="pd-notif__title">{n.title}</p>
                      <p className="pd-notif__text">{n.body}</p>
                      <p className="pd-notif__time">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="pd-widget">
              <h3 className="pd-widget__title">ACTIVITY TIMELINE</h3>
              <div className="pd-timeline">
                {TIMELINE.map((t, i) => (
                  <div key={i} className="pd-timeline__item" id={`pd-timeline-${i}`}>
                    <div className="pd-timeline__dot" style={{ background: t.dot }} />
                    <div className="pd-timeline__track" />
                    <div className="pd-timeline__content">
                      <p className="pd-timeline__title">{t.title}</p>
                      <p className="pd-timeline__sub">{t.sub}</p>
                      <p className="pd-timeline__date">{t.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProviderDashboard
