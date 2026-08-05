import { useEffect, useRef } from 'react'
import './Hero.css'

const Hero = () => {
  const headingRef = useRef(null)
  const subtitleRef = useRef(null)
  const actionsRef = useRef(null)
  const glowRef = useRef(null)

  useEffect(() => {
    const els = [headingRef.current, subtitleRef.current, actionsRef.current]
    els.forEach((el, i) => {
      if (el) {
        el.style.animationDelay = `${0.3 + i * 0.2}s`
        el.classList.add('animate-fade-up')
      }
    })

    const onMove = (e) => {
      if (!glowRef.current) return
      const { innerWidth: w, innerHeight: h } = window
      const x = (e.clientX / w) * 100
      const y = (e.clientY / h) * 100
      glowRef.current.style.background = `radial-gradient(600px 400px at ${x}% ${y}%, rgba(201,168,76,0.12), transparent 60%)`
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="home" className="hero">
      {/* Background */}
      <div className="hero__bg">
        <div className="hero__overlay" />
        <div className="hero__glow" ref={glowRef} />
      </div>

      {/* Content */}
      <div className="hero__content">
        <div className="hero__badge">
          <span className="hero__badge-dot" />
          Elite Concierge Network
        </div>

        <h1 className="hero__heading" ref={headingRef}>
          The Gold Standard<br />
          <span className="hero__heading-accent">of Modern Living.</span>
        </h1>

        <p className="hero__subtitle" ref={subtitleRef}>
          Bespoke concierge services for the world&apos;s most discerning homeowners.<br />
          Seamless, invisible, and utterly exceptional.
        </p>

        <div className="hero__actions" ref={actionsRef}>
          <button
            className="hero__btn-primary"
            id="hero-begin-btn"
            onClick={() => scrollTo('membership')}
          >
            Begin Your Journey
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            className="hero__btn-secondary"
            id="hero-services-btn"
            onClick={() => scrollTo('services')}
          >
            View Services
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hero__scroll">
        <div className="hero__scroll-line" />
        <span>Scroll</span>
      </div>
    </section>
  )
}

export default Hero
