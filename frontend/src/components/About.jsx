import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import useScrollReveal from '../hooks/useScrollReveal'
import './About.css'
import './Footer.css'

gsap.registerPlugin(ScrollTrigger)

const About = () => {
  const sectionRef = useRef(null)
  useScrollReveal(sectionRef, { stagger: 0.1 })
  const [showVisionModal, setShowVisionModal] = useState(false)

  useEffect(() => {
    if (!showVisionModal) return undefined
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShowVisionModal(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [showVisionModal])

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return undefined

    const context = gsap.context(() => {
      const media = gsap.matchMedia()
      media.add('(min-width: 769px) and (prefers-reduced-motion: no-preference)', () => {
        const img = section.querySelector('.about__editorial-img')
        if (img) {
          gsap.fromTo(
            img,
            { yPercent: -8, scale: 1.12 },
            {
              yPercent: 8,
              scale: 1.04,
              ease: 'none',
              scrollTrigger: {
                trigger: '.about__editorial-frame',
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
              },
            }
          )
        }
      })
      return () => media.revert()
    }, section)

    return () => context.revert()
  }, [])

  const pillars = [
    { roman: 'I', icon: '◈', title: 'Discretion', desc: 'Your privacy, preferences, and personal spaces are treated with the utmost respect.' },
    { roman: 'II', icon: '◇', title: 'Precision', desc: 'Every service is thoughtfully coordinated and every detail handled with care.' },
    { roman: 'III', icon: '◉', title: 'Trust', desc: 'Verified professionals, dependable service, and a standard you can rely on.' },
    { roman: 'IV', icon: '◆', title: 'Continuity', desc: 'Consistent care, seamlessly managed through one refined monthly experience.' },
  ]

  return (
    <section id="about" className="about" ref={sectionRef} aria-labelledby="about-heading">
      <div className="about__inner">
        {/* Left Editorial Column */}
        <div className="about__left" data-reveal>
          <span className="section-label">07 // OUR STORY</span>
          <h2 id="about-heading" className="about__title">
            A More Refined{' '}<br /><em>Way to Live</em>
          </h2>
          <div className="about__divider" />

          <div className="about__editorial-frame">
            <img
              src="/dark_luxury_mansion.jpg"
              alt="Private Luxora estate residence at evening"
              className="about__editorial-img"
              width="1600"
              height="900"
              loading="lazy"
              decoding="async"
            />
            <div className="about__editorial-scrim" />
            <div className="about__editorial-meta">
              <span>COLOMBO · EST. 2026</span>
              <span>PRIVATE CONCIERGE</span>
            </div>
          </div>

          <p className="about__text">
            Luxury is not simply about what surrounds you.
            <br />
            It is about having the freedom to enjoy it without the burden of managing every detail.
          </p>
          <p className="about__text">
            <strong className="about__highlight">
              Luxora was created to make exceptional living effortless.
            </strong>
          </p>
          <p className="about__text">
            From the care of your vehicle and the refinement of your garden to the wellbeing of your pets, Luxora brings essential home services together through one seamless concierge experience.
          </p>
          <p className="about__text">
            Our approach is simple: carefully selected professionals, thoughtfully managed services, and a consistent standard of care — all coordinated around your lifestyle.
          </p>
          <button
            type="button"
            className="about__cta"
            id="about-our-vision-btn"
            onClick={() => setShowVisionModal(true)}
          >
            Our Vision
            <span aria-hidden="true">→</span>
          </button>
        </div>

        {/* Right Principles & Quote Column */}
        <div className="about__right">
          <h3 className="about__section-heading" data-reveal>Our Principles</h3>
          <div className="about__pillars">
            {pillars.map((p) => (
              <article key={p.title} className="about__pillar" data-reveal>
                <div className="about__pillar-head">
                  <div className="about__pillar-icon" aria-hidden="true">{p.icon}</div>
                  <span className="about__pillar-roman">{p.roman}</span>
                </div>
                <div>
                  <h4 className="about__pillar-title">{p.title}</h4>
                  <p className="about__pillar-desc">{p.desc}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="about__quote" data-reveal>
            <div className="about__quote-mark" aria-hidden="true">&ldquo;</div>
            <p>
              &ldquo;True luxury is not having more to manage.
              <br />
              It is having more time to live.&rdquo;
            </p>
            <div className="about__quote-author">— The Luxora Philosophy</div>
          </div>
        </div>
      </div>

      {/* Our Vision Modal Pop-up Window */}
      {showVisionModal && (
        <div className="about-modal__backdrop" role="presentation" onClick={() => setShowVisionModal(false)}>
          <div
            className="about-modal__window vision-modal__window"
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-vision-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="about-modal__close"
              onClick={() => setShowVisionModal(false)}
              aria-label="Close Vision Window"
            >
              ✕
            </button>

            <div className="about-modal__badge">OUR VISION</div>
            <h2 id="about-vision-modal-title" className="about-modal__title">Excellence Refined</h2>

            <div className="vision-modal__quote-wrap">
              <span className="vision-modal__quote-mark">“</span>
              <p className="vision-modal__quote">
                To become Sri Lanka&apos;s most trusted home concierge platform, delivering premium, convenient, and reliable home services that simplify everyday living.
              </p>
            </div>

            <div className="about-modal__footer">
              <button
                type="button"
                className="about-modal__btn"
                onClick={() => setShowVisionModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default About
