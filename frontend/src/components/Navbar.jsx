import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './Navbar.css'

const SECTION_IDS = [
  { id: 'home', name: 'Home' },
  { id: 'services', name: 'Services' },
  { id: 'plans', name: 'Plans' },
  { id: 'contact', name: 'Contact' },
]

const Navbar = () => {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeLink, setActiveLink] = useState('Home')

  useEffect(() => {
    let rafId = 0
    let cachedOffsets = []

    const measureOffsets = () => {
      cachedOffsets = SECTION_IDS.map((sec) => {
        const el = document.getElementById(sec.id)
        return el ? { name: sec.name, top: Math.round(el.getBoundingClientRect().top + window.scrollY) } : null
      }).filter(Boolean)
    }

    const updateNav = () => {
      rafId = 0
      const y = window.scrollY
      const vh = window.innerHeight
      const docHeight = document.documentElement.scrollHeight
      const isScrolled = y > 20
      setScrolled((prev) => (prev === isScrolled ? prev : isScrolled))

      if (!cachedOffsets.length) measureOffsets()

      const contactEntry = cachedOffsets.find((c) => c.name === 'Contact')
      const atBottom = y + vh >= docHeight - 60
      const contactVisible = contactEntry ? y + vh * 0.72 >= contactEntry.top : false
      if (atBottom || contactVisible) {
        setActiveLink((prev) => (prev === 'Contact' ? prev : 'Contact'))
        return
      }

      const scrollPos = y + 180
      for (let i = cachedOffsets.length - 1; i >= 0; i--) {
        if (scrollPos >= cachedOffsets[i].top) {
          const matched = cachedOffsets[i].name
          setActiveLink((prev) => (prev === matched ? prev : matched))
          break
        }
      }
    }

    const handleScroll = () => {
      if (!rafId) rafId = requestAnimationFrame(updateNav)
    }

    measureOffsets()
    updateNav()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', measureOffsets, { passive: true })
    ScrollTrigger.addEventListener('refresh', measureOffsets)
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', measureOffsets)
      ScrollTrigger.removeEventListener('refresh', measureOffsets)
    }
  }, [])

  useEffect(() => {
    if (!menuOpen) return undefined
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  const navLinks = ['Home', 'Services', 'Plans', 'Contact']

  const handleNavClick = (link) => {
    setActiveLink(link)
    setMenuOpen(false)
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    if (link === 'Contact') {
      window.scrollTo({
        top: Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
        behavior,
      })
      return
    }
    const targetId = link.toLowerCase()
    const el = document.getElementById(targetId)
    if (el) {
      const navOffset = 76
      const elementPosition = el.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - navOffset
      window.scrollTo({
        top: offsetPosition,
        behavior
      })
    }
  }

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        {/* Logo */}
        <a
          href="#home"
          className="navbar__logo"
          onClick={(e) => {
            e.preventDefault()
            handleNavClick('Home')
          }}
        >
          <img src="/luxora-logo.png" alt="LUXORA" className="navbar__logo-img" />
        </a>

        {/* Desktop Nav Links */}
        <ul className="navbar__links">
          {navLinks.map((link) => (
            <li key={link}>
              <button
                className={`navbar__link ${activeLink === link ? 'navbar__link--active' : ''}`}
                onClick={() => handleNavClick(link)}
              >
                {link}
              </button>
            </li>
          ))}
        </ul>

        {/* CTA Buttons */}
        <div className="navbar__actions">
          <button className="navbar__btn-outline" onClick={() => navigate('/provider-register')}>Become Provider</button>
          <button className="navbar__btn-signup" id="navbar-signup-btn" onClick={() => navigate('/signup')}>
            Sign Up
          </button>
          <button className="navbar__btn-gold" id="navbar-login-btn" onClick={() => navigate('/login')}>
            Login
          </button>
        </div>

        {/* Hamburger */}
        <button
          type="button"
          className={`navbar__hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          aria-controls="navbar-mobile-drawer"
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile Menu */}
      <div id="navbar-mobile-drawer" className={`navbar__mobile ${menuOpen ? 'navbar__mobile--open' : ''}`}>
        {navLinks.map((link) => (
          <button
            key={link}
            className={`navbar__mobile-link ${activeLink === link ? 'active' : ''}`}
            onClick={() => handleNavClick(link)}
          >
            {link}
          </button>
        ))}
        <div className="navbar__mobile-actions">
          <button className="navbar__btn-outline" onClick={() => navigate('/provider-register')}>Become Provider</button>
          <button className="navbar__btn-signup" id="navbar-mobile-signup-btn" onClick={() => navigate('/signup')}>Sign Up</button>
          <button className="navbar__btn-gold" id="navbar-mobile-login-btn" onClick={() => navigate('/login')}>Login</button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
