import { useLayoutEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './Hero.css'

gsap.registerPlugin(ScrollTrigger)

const DISCIPLINE_CHAPTERS = [
  { num: '01', name: 'Auto Care', note: 'Concours Detailing', targetId: 'auto-care' },
  { num: '02', name: 'Garden Care', note: 'Estate Grounds', targetId: 'garden-care' },
  { num: '03', name: 'Pet Care', note: 'Companion Spa', targetId: 'pet-care' },
]

const PHILOSOPHY_WORDS = [
  { text: 'True', gold: false },
  { text: 'luxury', gold: true },
  { text: 'is', gold: false },
  { text: 'never', gold: false },
  { text: 'loud.', gold: false },
  { text: 'It', gold: false },
  { text: 'is', gold: false },
  { text: 'the', gold: false },
  { text: 'quiet', gold: true },
  { text: 'certainty', gold: true },
  { text: 'that', gold: false },
  { text: 'every', gold: false },
  { text: 'detail', gold: false },
  { text: 'of', gold: false },
  { text: 'your', gold: false },
  { text: 'estate,', gold: false },
  { text: 'your', gold: false },
  { text: 'vehicles,', gold: false },
  { text: 'and', gold: false },
  { text: 'your', gold: false },
  { text: 'companions', gold: false },
  { text: 'is', gold: false },
  { text: 'cared', gold: true },
  { text: 'for', gold: false },
  { text: 'before', gold: false },
  { text: 'you', gold: false },
  { text: 'even', gold: false },
  { text: 'ask.', gold: false },
]

const Hero = () => {
  const navigate = useNavigate()
  const wrapperRef = useRef(null)
  const beginBtnRef = useRef(null)

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return undefined

    const context = gsap.context(() => {
      const heroSection = wrapper.querySelector('.hero')
      const introSection = wrapper.querySelector('.brand-intro')
      const introWords = gsap.utils.toArray('.brand-intro__word', wrapper)
      const portalFrame = wrapper.querySelector('.brand-intro__portal-frame')
      const portalImg = wrapper.querySelector('.brand-intro__portal-img')
      const media = gsap.matchMedia()

      media.add('(prefers-reduced-motion: no-preference)', () => {
        // Initial entrance choreography for Scene 1
        gsap.fromTo(
          '.hero__line-inner',
          { yPercent: 105, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.9, ease: 'power4.out', stagger: 0.12, delay: 0.08 }
        )
        gsap.fromTo(
          ['.hero__badge', '.hero__subtitle', '.hero__actions', '.hero__chapter'],
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.75, ease: 'power3.out', stagger: 0.06, delay: 0.2 }
        )
      })

      media.add('(min-width: 769px) and (prefers-reduced-motion: no-preference)', () => {
        // Scene 1 scroll exit consolidated into a single ScrollTrigger timeline
        const exitTl = gsap.timeline({
          scrollTrigger: { trigger: heroSection, start: 'top top', end: 'bottom top', scrub: true },
        })
        exitTl
          .to('.hero__bg-img', { scale: 1.14, yPercent: 9, ease: 'none' }, 0)
          .to('.hero__content', { yPercent: -12, opacity: 0.18, ease: 'none' }, 0)
          .to('.hero__scroll', { opacity: 0, ease: 'none' }, 0)

        // Scene 2 compositor-only opacity word reveal (static gold/cream colors in CSS)
        if (introWords.length) {
          gsap.fromTo(
            introWords,
            { opacity: 0.22 },
            {
              opacity: 1,
              stagger: 0.035,
              ease: 'none',
              scrollTrigger: {
                trigger: introSection,
                start: 'top 80%',
                end: '42% 45%',
                scrub: true,
              },
            }
          )
        }

        // Scene 2 single-timeline compositor portal scale/lift transition
        if (portalFrame && portalImg) {
          const portalTl = gsap.timeline({
            scrollTrigger: {
              trigger: '.brand-intro__portal',
              start: 'top 86%',
              end: 'top 28%',
              scrub: true,
            },
          })
          portalTl
            .fromTo(
              portalFrame,
              { scale: 0.9, y: 28, opacity: 0.72 },
              { scale: 1, y: 0, opacity: 1, ease: 'none' },
              0
            )
            .fromTo(portalImg, { scale: 1.14 }, { scale: 1, ease: 'none' }, 0)
        }
      })

      media.add('(max-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        if (introWords.length) {
          gsap.fromTo(
            introWords,
            { opacity: 0.35 },
            {
              opacity: 1,
              stagger: 0.02,
              duration: 0.5,
              ease: 'power2.out',
              scrollTrigger: { trigger: introSection, start: 'top 84%', once: true },
            }
          )
        }
      })

      return () => media.revert()
    }, wrapper)

    return () => context.revert()
  }, [])

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    if (el) el.scrollIntoView({ behavior, block: 'start' })
  }

  const handleMagneticMove = (e) => {
    const btn = beginBtnRef.current
    if (!btn || window.matchMedia('(prefers-reduced-motion: reduce), (pointer: coarse)').matches) return
    const rect = btn.getBoundingClientRect()
    const dx = ((e.clientX - rect.left) / rect.width - 0.5) * 10
    const dy = ((e.clientY - rect.top) / rect.height - 0.5) * 6
    btn.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`
  }

  const resetMagnetic = () => {
    if (beginBtnRef.current) beginBtnRef.current.style.transform = ''
  }

  return (
    <div className="hero-narrative" ref={wrapperRef}>
      {/* ── SCENE 1: CINEMATIC HERO ── */}
      <section id="home" className="hero">
        <div className="hero__stage" aria-hidden="true">
          <div className="hero__bg">
            <img
              src="/dark_luxury_mansion.jpg"
              alt=""
              className="hero__bg-img"
              width="1920"
              height="1080"
              decoding="async"
              fetchPriority="high"
            />
          </div>
          <div className="hero__overlay" />
          <div className="hero__light-beam" />
          <div className="hero__frame">
            <div className="hero__coords">
              <span>01 // PRIVATE ESTATE CONCIERGE</span>
              <span>COLOMBO · SRI LANKA</span>
            </div>
          </div>
        </div>

        <div className="hero__content">
          <div className="hero__badge">
            <span className="hero__badge-dot" />
            <span>Elite Concierge Network</span>
            <span className="hero__badge-sep" aria-hidden="true">·</span>
            <span className="hero__badge-sub">Estate · Auto · Companion</span>
          </div>

          <h1 className="hero__heading">
            <span className="hero__line">
              <span className="hero__line-inner">The Gold Standard</span>
            </span>
            <span className="hero__line hero__line--serif">
              <span className="hero__line-inner">of Modern Living.</span>
            </span>
          </h1>

          <p className="hero__subtitle">
            Bespoke concierge services for the world&apos;s most discerning homeowners.
            Seamless, invisible, and utterly exceptional.
          </p>

          <div className="hero__actions">
            <button
              ref={beginBtnRef}
              type="button"
              className="hero__btn-primary"
              id="hero-begin-btn"
              onClick={() => navigate('/signup')}
              onPointerMove={handleMagneticMove}
              onPointerLeave={resetMagnetic}
            >
              <span>Begin Your Journey</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              className="hero__btn-secondary"
              id="hero-plans-btn"
              onClick={() => scrollTo('plans')}
            >
              View Plans
            </button>
          </div>

          <div className="hero__chapters" aria-label="Core service disciplines">
            {DISCIPLINE_CHAPTERS.map((ch) => (
              <button
                key={ch.num}
                type="button"
                className="hero__chapter"
                onClick={() => scrollTo('services')}
              >
                <span className="hero__chapter-num">{ch.num}</span>
                <span className="hero__chapter-meta">
                  <strong>{ch.name}</strong>
                  <small>{ch.note}</small>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="hero__scroll" aria-hidden="true">
          <div className="hero__scroll-line" />
          <span>Scroll</span>
        </div>
      </section>

      {/* ── SCENE 2: IMMERSIVE BRAND INTRODUCTION ── */}
      <section className="brand-intro" aria-labelledby="brand-intro-label">
        <div className="brand-intro__inner">
          <span id="brand-intro-label" className="section-label">02 // THE LUXORA STANDARD</span>

          <p className="brand-intro__statement">
            {PHILOSOPHY_WORDS.map((w, idx) => (
              <span
                key={idx}
                data-gold={w.gold ? 'true' : 'false'}
                className={`brand-intro__word ${w.gold ? 'brand-intro__word--gold' : ''}`}
              >
                {w.text}{' '}
              </span>
            ))}
          </p>

          <div className="brand-intro__portal">
            <div className="brand-intro__portal-frame">
              <img
                src="/dark_luxury_mansion.jpg"
                alt="Luxora curated residence architecture at dusk"
                className="brand-intro__portal-img"
                width="1600"
                height="900"
                decoding="async"
              />
              <div className="brand-intro__portal-scrim" />
              <div className="brand-intro__portal-caption">
                <div className="brand-intro__portal-tag">
                  <span>CURATED RESIDENCE CARE</span>
                  <strong>Auto · Garden · Pet</strong>
                </div>
                <ul className="brand-intro__specs">
                  <li>Verified Specialists</li>
                  <li>Dual-PIN Handover</li>
                  <li>Single Monthly Membership</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Hero
