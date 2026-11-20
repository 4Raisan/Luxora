import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './Stats.css'

gsap.registerPlugin(ScrollTrigger)

const StatItem = ({ num, value, label, meterRatio, started }) => {
  const valueRef = useRef(null)

  useEffect(() => {
    const el = valueRef.current
    if (!el || !value) return undefined
    const targetStr = String(value)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!started || targetStr.includes('/') || prefersReducedMotion) {
      el.textContent = targetStr
      return undefined
    }

    let startTime = null
    const duration = 2200
    const numericTarget = parseInt(targetStr.replace(/\D/g, ''), 10) || 0
    const suffix = targetStr.replace(/[0-9]/g, '')
    let reqId = 0

    const step = (timestamp) => {
      const currentTimestamp =
        typeof timestamp === 'number'
          ? timestamp
          : typeof performance !== 'undefined'
            ? performance.now()
            : Date.now()
      if (!startTime) startTime = currentTimestamp
      const progress = Math.min((currentTimestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      el.textContent = Math.floor(eased * numericTarget) + suffix
      if (progress < 1) reqId = requestAnimationFrame(step)
    }

    reqId = requestAnimationFrame(step)
    return () => {
      if (reqId) cancelAnimationFrame(reqId)
    }
  }, [started, value])

  return (
    <article className="stat" data-reveal>
      <div className="stat__head">
        <span className="stat__num">{num}</span>
        <span className="stat__spark" aria-hidden="true">✦</span>
      </div>
      <div ref={valueRef} className="stat__value">{value}</div>
      <div className="stat__label">{label}</div>
      <div className="stat__meter" aria-hidden="true">
        <div
          className="stat__meter-fill"
          style={{ transform: `scaleX(${started ? meterRatio : 0})` }}
        />
      </div>
    </article>
  )
}

const Stats = () => {
  const [started, setStarted] = useState(false)
  const ref = useRef(null)

  useLayoutEffect(() => {
    const section = ref.current
    if (!section) return undefined

    const context = gsap.context(() => {
      const media = gsap.matchMedia()
      media.add('(prefers-reduced-motion: no-preference)', () => {
        const targets = gsap.utils.toArray('[data-reveal]', section)
        gsap.fromTo(
          targets,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            ease: 'power3.out',
            stagger: 0.12,
            scrollTrigger: {
              trigger: section,
              start: 'top 84%',
              once: true,
              onEnter: () => setStarted(true),
            },
          }
        )
      })
      media.add('(prefers-reduced-motion: reduce)', () => {
        setStarted(true)
      })
      return () => media.revert()
    }, section)

    return () => context.revert()
  }, [])

  const stats = [
    { num: '01', value: '500+', label: 'LUXURY ESTATES', meterRatio: 0.9 },
    { num: '02', value: '98%', label: 'CLIENT RETENTION', meterRatio: 0.98 },
    { num: '03', value: '24/7', label: 'ELITE SUPPORT', meterRatio: 1 },
  ]

  return (
    <section className="stats" ref={ref} aria-labelledby="stats-heading">
      <div className="stats__shell">
        <header className="stats__header" data-reveal>
          <span className="section-label">04 // CONTINUITY AT SCALE</span>
          <h2 id="stats-heading" className="stats__heading">Trusted Across Private Residences</h2>
        </header>

        <div className="stats__inner">
          {stats.map((s) => (
            <StatItem key={s.label} {...s} started={started} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Stats
