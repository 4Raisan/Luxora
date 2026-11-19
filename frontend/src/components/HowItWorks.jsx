import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import useScrollReveal from '../hooks/useScrollReveal'
import './HowItWorks.css'

const MOTION = {
  desktopPerspective: 1400,
  desktopStagger: 0.08,
  mobileStagger: 0.08,
  finalRotation: 180,
}

const steps = [
  {
    number: '01',
    category: 'Choose Your Care',
    description: 'Build a care experience around your home and lifestyle.',
    services: ['Auto Care', 'Garden Care', 'Pet Care', 'Combo packages'],
    note: 'Flexible care categories',
    backTitle: 'Create Account',
    backText: 'Sign up securely and access your personal Luxora customer portal.',
  },
  {
    number: '02',
    category: 'Schedule With Ease',
    description: 'Reserve your preferred service in a few clear steps.',
    services: ['Choose a package', 'Select date and time', 'Confirm your address', 'Pay or use credits'],
    note: 'Verified booking confirmation',
    backTitle: 'Purchase a Package',
    backText: 'Choose the care package that matches your needs and complete your secure purchase.',
  },
  {
    number: '03',
    category: 'Start Securely',
    description: 'A verified provider arrives for your confirmed appointment.',
    services: ['Automatic assignment', 'Provider details', 'Before-service photos', 'Secure Start PIN'],
    note: 'Protected service handover',
    backTitle: 'Book Your Service',
    backText: 'Select your service, preferred date and time, and confirm the booking from your portal.',
  },
  {
    number: '04',
    category: 'Review & Complete',
    description: 'Stay informed until the final service confirmation.',
    services: ['Track service status', 'Review after photos', 'Completion PIN', 'Rate your experience'],
    note: 'Complete portal visibility',
    backTitle: 'Enjoy',
    backText: 'Relax while Luxora coordinates your assigned provider and keeps every service detail visible.',
  },
]

export const Card = ({ step }) => (
  <article className="journey-card" aria-label={`${step.number}. ${step.backTitle}`}>
    <div className="journey-card__face journey-card__face--front" aria-hidden="true">
      <img className="journey-card__artwork" src="/luxora-journey-card.webp" alt="" width="500" height="680" draggable="false" decoding="async" />
    </div>

    <div className="journey-card__face journey-card__face--back" aria-hidden="true">
      <header className="journey-card__topline">
        <span className="journey-card__logo journey-card__logo--dark">L</span>
        <span className="journey-card__number">{step.number}</span>
      </header>
      <div className="journey-card__back-content">
        <span className="journey-card__back-mark">✦</span>
        <h3>{step.backTitle}</h3>
        <p>{step.backText}</p>
      </div>
      <footer className="journey-card__footer"><span />LUXORA CARE</footer>
    </div>
  </article>
)

export const CardSection = () => {
  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  useScrollReveal(sectionRef, { stagger: 0.14, y: 28 })

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return undefined

    const context = gsap.context(() => {
      const cards = gsap.utils.toArray('.journey-card', section)
      const pathLine = section.querySelector('.how-it-works__journey-path')
      const glowLine = section.querySelector('.how-it-works__journey-glow')

      const media = gsap.matchMedia()
      media.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(cards, { clearProps: 'all' })
      })

      const buildDesktopTimeline = () => {
        gsap.set(cards, {
          force3D: true,
          opacity: 1,
          rotationX: 0,
          rotationY: 0,
          scale: 1,
          transformOrigin: '50% 50%',
          x: 0,
          y: 0,
          z: 0,
        })

        const paths = [pathLine, glowLine].filter(Boolean)
        paths.forEach((p) => {
          const len = typeof p.getTotalLength === 'function' ? p.getTotalLength() : 1400
          gsap.set(p, { strokeDasharray: len, strokeDashoffset: len })
        })

        const timeline = gsap.timeline({ paused: true })

        if (paths.length) {
          timeline.to(paths, { duration: 0.95, strokeDashoffset: 0, ease: 'power2.out' }, 0)
        }

        timeline.to(
          cards,
          {
            duration: 0.8,
            rotationY: MOTION.finalRotation,
            stagger: MOTION.desktopStagger,
            ease: 'power2.inOut',
            overwrite: 'auto',
          },
          0
        )

        const playTrigger = ScrollTrigger.create({
          trigger: track,
          start: 'top 82%',
          end: 'bottom 18%',
          onEnter: () => timeline.play(),
          onEnterBack: () => timeline.play(),
        })

        const resetTrigger = ScrollTrigger.create({
          trigger: track,
          start: 'top bottom',
          end: 'bottom top',
          onLeave: () => timeline.pause(0),
          onLeaveBack: () => timeline.pause(0),
        })

        return () => {
          playTrigger.kill()
          resetTrigger.kill()
          timeline.kill()
        }
      }

      const buildMobileTimeline = () => {
        gsap.set(cards, { clearProps: 'transform' })
        gsap.set(cards, { opacity: 0, y: 20 })

        const paths = [pathLine, glowLine].filter(Boolean)
        paths.forEach((p) => {
          const len = typeof p.getTotalLength === 'function' ? p.getTotalLength() : 1400
          gsap.set(p, { strokeDasharray: len, strokeDashoffset: len })
        })

        const timeline = gsap.timeline({ paused: true })
        if (paths.length) {
          timeline.to(paths, { duration: 1.0, strokeDashoffset: 0, ease: 'power2.out' }, 0)
        }
        timeline.to(
          cards,
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            ease: 'power3.out',
            stagger: MOTION.mobileStagger,
          },
          0.1
        )

        const trigger = ScrollTrigger.create({
          trigger: track,
          start: 'top 85%',
          once: true,
          onEnter: () => timeline.play(),
        })

        return () => {
          trigger.kill()
          timeline.kill()
        }
      }

      media.add('(min-width: 769px) and (prefers-reduced-motion: no-preference)', buildDesktopTimeline)
      media.add('(max-width: 768px) and (prefers-reduced-motion: no-preference)', buildMobileTimeline)
      return () => media.revert()
    }, section)

    return () => context.revert()
  }, [])

  return (
    <section ref={sectionRef} className="how-it-works" aria-labelledby="how-it-works-title" style={{ '--journey-perspective': `${MOTION.desktopPerspective}px` }}>
      <div className="how-it-works__inner">
        <span className="section-label how-it-works__eyebrow" data-reveal>06 // THE CARE PROTOCOL</span>
        <h2 id="how-it-works-title" className="how-it-works__title" data-reveal>Your Seamless <em>Care Journey</em></h2>
        <p className="how-it-works__intro" data-reveal>From choosing a service to verified completion, every step is designed around your time and peace of mind.</p>

        <div className="how-it-works__timeline" data-reveal aria-hidden="true">
          <svg className="how-it-works__journey" viewBox="0 0 1200 130" preserveAspectRatio="none" focusable="false">
            <defs>
              <linearGradient id="journey-gold" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="#b9964a" /><stop offset="0.32" stopColor="#f4dfaa" />
                <stop offset="0.67" stopColor="#c8a458" /><stop offset="1" stopColor="#edd59b" />
              </linearGradient>
            </defs>
            <path className="how-it-works__journey-glow" d="M 8 76 C 245 13, 510 28, 720 62 S 1012 108, 1192 46" />
            <path className="how-it-works__journey-path" d="M 8 76 C 245 13, 510 28, 720 62 S 1012 108, 1192 46" />
            <g className="how-it-works__journey-points">
              <circle cx="8" cy="76" r="7" /><circle cx="395" cy="31" r="7" /><circle cx="760" cy="69" r="7" /><circle cx="1192" cy="46" r="7" />
            </g>
          </svg>
        </div>

        <div className="how-it-works__stage">
          <div ref={trackRef} className="how-it-works__steps">
            {steps.map((step) => <Card key={step.number} step={step} />)}
          </div>
        </div>
      </div>
    </section>
  )
}

const HowItWorks = () => <CardSection />

export default HowItWorks
