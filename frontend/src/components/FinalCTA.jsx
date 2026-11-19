import { useLayoutEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import useScrollReveal from '../hooks/useScrollReveal'
import './FinalCTA.css'

gsap.registerPlugin(ScrollTrigger)

const FinalCTA = () => {
  const navigate = useNavigate()
  const sectionRef = useRef(null)
  const monolithRef = useRef(null)
  useScrollReveal(sectionRef, { stagger: 0.12, y: 28 })

  useLayoutEffect(() => {
    const section = sectionRef.current
    const monolith = monolithRef.current
    if (!section || !monolith) return undefined

    const context = gsap.context(() => {
      const media = gsap.matchMedia()
      media.add('(min-width: 769px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          monolith,
          { scale: 0.94, opacity: 0.72 },
          {
            scale: 1,
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top 86%',
              end: 'center center',
              scrub: 0.35,
            },
          }
        )
      })
      return () => media.revert()
    }, section)

    return () => context.revert()
  }, [])

  const scrollToPlans = () => {
    const el = document.getElementById('plans')
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    if (el) el.scrollIntoView({ behavior, block: 'start' })
  }

  return (
    <section className="final-cta" ref={sectionRef} aria-labelledby="final-cta-title">
      <div className="final-cta__monolith" ref={monolithRef}>
        <div className="final-cta__halo" aria-hidden="true" />
        <div className="final-cta__inner">
          <div className="final-cta__crest" aria-hidden="true">✦</div>
          <span className="section-label" data-reveal>08 // BEGIN TODAY</span>
          <h2 id="final-cta-title" className="final-cta__title" data-reveal>
            Exceptional Living,<br /><em>Effortlessly Managed.</em>
          </h2>
          <p className="final-cta__subtitle" data-reveal>
            Join Luxora and let verified professionals care for your vehicle,
            garden, and companions — all through one refined subscription.
          </p>
          <div className="final-cta__actions" data-reveal>
            <button
              type="button"
              className="final-cta__btn-primary"
              onClick={() => navigate('/signup')}
            >
              <span>Begin Your Journey</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              className="final-cta__btn-secondary"
              onClick={scrollToPlans}
            >
              Explore Plans
            </button>
          </div>
          <p className="final-cta__assurances" data-reveal>
            Verified Specialists <span>·</span> Transparent LKR Pricing <span>·</span> Dedicated Member Portal
          </p>
        </div>
      </div>
    </section>
  )
}

export default FinalCTA
