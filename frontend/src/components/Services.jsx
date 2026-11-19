import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './Services.css'

gsap.registerPlugin(ScrollTrigger)

const services = [
  {
    id: 'auto-care',
    categoryKey: 'auto',
    num: '01',
    eyebrow: 'CONCOURS AUTOMOTIVE DETAILING',
    signature: 'Showroom preservation at your residence',
    image: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&w=1400&q=85',
    fallbackImage: '/dark_luxury_mansion.jpg',
    imageAlt: 'Detailed luxury automobile finish in private lighting',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 30l4-12h24l4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <rect x="6" y="30" width="36" height="8" rx="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="14" cy="38" r="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="34" cy="38" r="3" stroke="currentColor" strokeWidth="2" />
        <path d="M14 24h8M26 24h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    title: 'Auto Care',
    description:
      'A meticulous standard of vehicle care, preserving every detail from a pristine exterior to an immaculate interior.',
    features: ['Pristine Exterior Care', 'Immaculate Interior Care', 'Tyre & Glass Finishing'],
  },
  {
    id: 'garden-care',
    categoryKey: 'garden',
    num: '02',
    eyebrow: 'BOTANICAL & ESTATE GROUNDS',
    signature: 'Manicured sanctuary, season after season',
    image: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?auto=format&fit=crop&w=1400&q=85',
    fallbackImage: '/dark_luxury_mansion.jpg',
    imageAlt: 'Architectural residence surrounded by manicured green grounds',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M24 40V20M24 20C24 20 16 16 12 8c6 0 12 4 12 12zM24 20C24 20 32 16 36 8c-6 0-12 4-12 12z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M14 40h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M24 28C24 28 18 26 16 20c4 0 8 3 8 8zM24 28C24 28 30 26 32 20c-4 0-8 3-8 8z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    title: 'Garden Care',
    description:
      'Thoughtfully maintained grounds, where manicured lawns, healthy greenery, and refined presentation come together effortlessly.',
    features: ['Precision Lawn Maintenance', 'Expert Garden Grooming', 'Plant Health & Pruning'],
  },
  {
    id: 'pet-care',
    categoryKey: 'pet',
    num: '03',
    eyebrow: 'COMPANION SPA & WELLBEING',
    signature: 'Gentle, attentive care in familiar surroundings',
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=1400&q=85',
    fallbackImage: '/luxora-journey-card.webp',
    imageAlt: 'Well-groomed companion pet resting calmly indoors',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M18 12a4 4 0 100-8 4 4 0 000 8zM30 12a4 4 0 100-8 4 4 0 000 8zM10 22a4 4 0 100-8 4 4 0 000 8zM38 22a4 4 0 100-8 4 4 0 000 8z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M24 44c-7 0-14-5-14-12 0-4 4-8 8-8h12c4 0 8 4 8 8 0 7-7 12-14 12z"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
    title: 'Pet Care',
    description:
      'Exceptional care for cherished companions, combining gentle grooming, refined hygiene, and attentive personal care.',
    features: ['Signature Spa Grooming', 'Gentle Hygiene Care', 'Coat & Comfort Care'],
  },
]

const Services = () => {
  const sectionRef = useRef(null)
  const stageRef = useRef(null)
  const pinTriggerRef = useRef(null)
  const progressBarRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useLayoutEffect(() => {
    const section = sectionRef.current
    const stage = stageRef.current
    if (!section || !stage) return undefined

    const context = gsap.context(() => {
      const cards = gsap.utils.toArray('.service-card', section)
      const plates = gsap.utils.toArray('.services__plate', section)
      const plateImgs = gsap.utils.toArray('.services__plate-img', section)
      const media = gsap.matchMedia()

      media.add('(min-width: 961px) and (min-height: 520px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.set(cards[0], { autoAlpha: 1, yPercent: 0 })
        gsap.set([cards[1], cards[2]], { autoAlpha: 0, yPercent: 14 })
        gsap.set(plates[0], { autoAlpha: 1, yPercent: 0 })
        gsap.set([plates[1], plates[2]], { autoAlpha: 0, yPercent: 12 })
        gsap.set([plateImgs[1], plateImgs[2]], { scale: 1.1 })

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: stage,
            start: 'top top',
            end: '+=210%',
            pin: true,
            scrub: 0.45,
            anticipatePin: 1,
            onUpdate: (self) => {
              if (progressBarRef.current) {
                progressBarRef.current.style.transform = `scaleX(${self.progress.toFixed(4)})`
              }
              const nextIdx = self.progress < 0.34 ? 0 : self.progress < 0.68 ? 1 : 2
              setActiveIndex((prev) => (prev === nextIdx ? prev : nextIdx))
            },
          },
        })

        pinTriggerRef.current = tl.scrollTrigger

        // Segment 1 -> 2 (sequential non-overlapping card swap + plate transition)
        tl.to(cards[0], { autoAlpha: 0, yPercent: -10, duration: 0.12, ease: 'power2.in' }, 0.22)
          .fromTo(cards[1], { autoAlpha: 0, yPercent: 10 }, { autoAlpha: 1, yPercent: 0, duration: 0.14, ease: 'power2.out' }, 0.35)
          .to(plates[1], { autoAlpha: 1, yPercent: 0, duration: 0.24, ease: 'power2.out' }, 0.24)
          .to(plateImgs[1], { scale: 1, duration: 0.24, ease: 'power2.out' }, 0.24)

        // Segment 2 -> 3 (sequential non-overlapping card swap + plate transition)
        tl.to(cards[1], { autoAlpha: 0, yPercent: -10, duration: 0.12, ease: 'power2.in' }, 0.58)
          .fromTo(cards[2], { autoAlpha: 0, yPercent: 10 }, { autoAlpha: 1, yPercent: 0, duration: 0.14, ease: 'power2.out' }, 0.71)
          .to(plates[2], { autoAlpha: 1, yPercent: 0, duration: 0.24, ease: 'power2.out' }, 0.60)
          .to(plateImgs[2], { scale: 1, duration: 0.24, ease: 'power2.out' }, 0.60)

        return () => {
          pinTriggerRef.current = null
        }
      })

      media.add('(max-width: 960px) and (prefers-reduced-motion: no-preference), (max-height: 519px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.set(cards, { clearProps: 'all' })
        gsap.fromTo(
          cards,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power3.out',
            stagger: 0.12,
            scrollTrigger: { trigger: section, start: 'top 84%', once: true },
          }
        )
      })

      return () => media.revert()
    }, section)

    return () => context.revert()
  }, [])

  const selectChapter = (idx) => {
    setActiveIndex(idx)
    const st = pinTriggerRef.current
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    if (st && typeof st.start === 'number' && typeof st.end === 'number') {
      const targetProgress = idx === 0 ? 0.14 : idx === 1 ? 0.50 : 0.88
      const y = st.start + targetProgress * (st.end - st.start)
      window.scrollTo({ top: y, behavior })
      return
    }
    const cardEl = document.getElementById(services[idx].id)
    if (cardEl) cardEl.scrollIntoView({ behavior, block: 'center' })
  }

  const navigateToPlans = (categoryKey) => {
    window.dispatchEvent(new CustomEvent('select-plan-category', { detail: categoryKey }))
    const el = document.getElementById('plans')
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    if (el) el.scrollIntoView({ behavior, block: 'start' })
  }

  const activeService = services[activeIndex] || services[0]

  return (
    <section id="services" className="services" ref={sectionRef} aria-labelledby="services-heading">
      <div className="services__stage" ref={stageRef}>
        <div className="services__inner">
          {/* Header & Desktop Chapter Rail */}
          <div className="services__top">
            <div className="services__header">
              <span className="section-label">03 // WHAT WE OFFER</span>
              <h2 id="services-heading" className="services__title">
                Uncompromising Excellence{' '}<br />in Every Detail
              </h2>
              <p className="services__subtitle">
                From estate management to personal concierge, every service is meticulously
                crafted to exceed the expectations of the world&apos;s most discerning clients.
              </p>
            </div>

            <div className="services__chapters" role="navigation" aria-label="Service pillars">
              {services.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  className={`services__chapter-btn ${activeIndex === idx ? 'is-active' : ''}`}
                  onClick={() => selectChapter(idx)}
                  aria-current={activeIndex === idx ? 'step' : undefined}
                >
                  <span className="services__chapter-num">{s.num}</span>
                  <span>{s.title}</span>
                </button>
              ))}
              <div className="services__scrub-track" aria-hidden="true">
                <div ref={progressBarRef} className="services__scrub-fill" />
              </div>
            </div>
          </div>

          {/* Pinned Two-Column Showcase (Desktop) / Stacked Editorial Cards (Mobile) */}
          <div className="services__grid">
            <div className="services__cards-deck">
              {services.map((service, idx) => {
                const isActive = activeIndex === idx
                return (
                  <article
                    key={service.id}
                    id={service.id}
                    className={`service-card ${isActive ? 'service-card--active' : ''}`}
                  >
                    <div className="service-card__media">
                      <img
                        src={service.image}
                        alt={service.imageAlt}
                        width="1400"
                        height="875"
                        loading="lazy"
                        fetchPriority="low"
                        decoding="async"
                        onError={(e) => {
                          if (!e.currentTarget.dataset.fallback) {
                            e.currentTarget.dataset.fallback = '1'
                            e.currentTarget.src = service.fallbackImage
                          }
                        }}
                      />
                      <span className="service-card__media-num">{service.num}</span>
                    </div>

                    <div className="service-card__body">
                      <div className="service-card__meta">
                        <div className="service-card__icon" aria-hidden="true">{service.icon}</div>
                        <span className="service-card__eyebrow">{service.eyebrow}</span>
                      </div>

                      <h3 className="service-card__title">{service.title}</h3>
                      <p className="service-card__signature">{service.signature}</p>
                      <p className="service-card__desc">{service.description}</p>

                      <ul className="service-card__features">
                        {service.features.map((f) => (
                          <li key={f}>
                            <span className="service-card__check" aria-hidden="true">✦</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>

                      <button
                        type="button"
                        className="service-card__cta"
                        onClick={() => navigateToPlans(service.categoryKey)}
                      >
                        Learn More →
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="services__visual-col" aria-hidden="true">
              <div className="services__viewport">
                {services.map((service, idx) => (
                  <div
                    key={service.id}
                    className="services__plate"
                    style={{ zIndex: idx + 1 }}
                  >
                    <img
                      src={service.image}
                      alt=""
                      className="services__plate-img"
                      width="1400"
                      height="875"
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      fetchPriority="low"
                      decoding="async"
                      onError={(e) => {
                        if (!e.currentTarget.dataset.fallback) {
                          e.currentTarget.dataset.fallback = '1'
                          e.currentTarget.src = service.fallbackImage
                        }
                      }}
                    />
                    <div className="services__plate-scrim" />
                  </div>
                ))}

                <div className="services__viewport-hud">
                  <span className="services__hud-index">{activeService.num} / 03</span>
                  <div className="services__hud-caption">
                    <strong>{activeService.title}</strong>
                    <small>{activeService.signature}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Services
