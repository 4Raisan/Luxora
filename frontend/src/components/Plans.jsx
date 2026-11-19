import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { apiRequest } from '../services/api'
import useScrollReveal from '../hooks/useScrollReveal'
import './Plans.css'

gsap.registerPlugin(ScrollTrigger)

const AutoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.7 2 10.8 2 11v5c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <path d="M9 17h6" />
    <circle cx="17" cy="17" r="2" />
  </svg>
)

const GardenIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22v-9" />
    <path d="M12 13C12 7.5 7.5 3 2 4c0 5.5 4.5 9 10 9z" />
    <path d="M12 9c2.8-3.3 6.7-4 10-4 0 5-3.3 9-10 9" />
  </svg>
)

const PetIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 13c-1.8 0-3.5-.8-3.5-2.5s1.7-2.5 3.5-2.5 3.5.8 3.5 2.5-1.7 2.5-3.5 2.5z" />
    <ellipse cx="6.5" cy="11.5" rx="1.5" ry="2" />
    <ellipse cx="17.5" cy="11.5" rx="1.5" ry="2" />
    <ellipse cx="9" cy="5.5" rx="1.5" ry="2" />
    <ellipse cx="15" cy="5.5" rx="1.5" ry="2" />
    <path d="M12 15c-3 0-5.5 1.5-5.5 4.5h11c0-3-2.5-4.5-5.5-4.5z" />
  </svg>
)

const ComboIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
    <path d="M2 9h20" />
    <path d="M10 3l-2 6 4 12 4-12-2-6" />
  </svg>
)

const CrownIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2 20h20v2H2v-2zm1-4l3.5-8.5L12 13l5.5-5.5L21 16H3z" />
  </svg>
)

const CATEGORIES = [
  { id: 'auto', label: 'Auto Care', icon: <AutoIcon /> },
  { id: 'garden', label: 'Garden Care', icon: <GardenIcon /> },
  { id: 'pet', label: 'Pet Care', icon: <PetIcon /> },
  { id: 'combo', label: 'Combo Packages', icon: <ComboIcon /> },
]

const PACKAGE_TYPE_BY_CATEGORY = {
  auto: 'Auto Care',
  garden: 'Garden Care',
  pet: 'Pet Care',
  combo: 'Combo Package',
}

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const Plans = () => {
  const navigate = useNavigate()
  const sectionRef = useRef(null)
  useScrollReveal(sectionRef, { stagger: 0.14 })
  const [activeCategory, setActiveCategory] = useState('auto')
  const [serverPlans, setServerPlans] = useState(null)
  const [plansUnavailable, setPlansUnavailable] = useState(false)
  const [showOffer, setShowOffer] = useState(false)
  const featuredOffer = (serverPlans || [])
    .filter((plan) => Number(plan.promotion?.discountPct) > 0)
    .sort((a, b) => b.promotion.discountPct - a.promotion.discountPct)[0]
  const offerId = featuredOffer?.promotion.id

  useEffect(() => {
    if (offerId == null || sessionStorage.getItem('token') || sessionStorage.getItem(`home-offer-${offerId}`)) return
    const timer = window.setTimeout(() => {
      if (sessionStorage.getItem('token')) return
      sessionStorage.setItem(`home-offer-${offerId}`, 'seen')
      setShowOffer(true)
    }, 4500)
    return () => window.clearTimeout(timer)
  }, [offerId])

  useEffect(() => {
    let cancelled = false
    apiRequest('/subscriptions')
      .then((plans) => {
        if (cancelled) return
        if (Array.isArray(plans) && plans.length) setServerPlans(plans)
        else setPlansUnavailable(true)
      })
      .catch(() => {
        if (!cancelled) setPlansUnavailable(true)
      })
      .finally(() => {
        if (!cancelled) {
          requestAnimationFrame(() => ScrollTrigger.refresh())
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const handleSelectCategory = (e) => {
      if (e.detail) {
        setActiveCategory(e.detail)
      }
    }
    window.addEventListener('select-plan-category', handleSelectCategory)
    return () => window.removeEventListener('select-plan-category', handleSelectCategory)
  }, [])

  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [activeCategory, serverPlans])

  const plansForCategory = (categoryId) => {
    if (!serverPlans) return null
    const packageType = PACKAGE_TYPE_BY_CATEGORY[categoryId]
    return serverPlans
      .filter((plan) => plan.type === packageType)
      .map((plan) => {
        const ents = plan.entitlements || []
        const coins = ents.reduce((total, entitlement) => total + (Number(entitlement.units) || 0), 0)
        return {
          id: `srv-${plan.id}`,
          serverId: plan.id,
          tier: plan.title,
          price: Number(plan.discountedPriceMonthly ?? plan.priceMonthly) || 0,
          originalPrice: Number(plan.originalPriceMonthly ?? plan.priceMonthly) || 0,
          promotion: plan.promotion,
          coins,
          highlight: Boolean(plan.recommended),
          description: plan.description || '',
          features: Array.isArray(plan.features) ? plan.features : [],
          off: [],
        }
      })
  }

  const currentPlans = plansForCategory(activeCategory) || (plansUnavailable ? [] : null)

  const handleGetStarted = (plan) => {
    try {
      const catObj = CATEGORIES.find((c) => c.id === activeCategory)
      const fullPlan = { ...plan, categoryLabel: catObj ? catObj.label : 'Auto', cat: activeCategory }
      sessionStorage.setItem('selected_home_plan', JSON.stringify(fullPlan))

      const token = sessionStorage.getItem('token')
      const user = sessionStorage.getItem('user')

      if (token && user) {
        navigate('/customer-dashboard')
      } else {
        navigate('/login')
      }
    } catch {
      navigate('/login')
    }
  }

  const handleCardPointerMove = (e) => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--card-mouse-x', `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty('--card-mouse-y', `${e.clientY - rect.top}px`)
  }

  return (
    <section id="plans" className="plans" ref={sectionRef} aria-labelledby="plans-heading">
      {showOffer && featuredOffer && createPortal(
        <aside className="plans-offer" aria-label="Current membership offer">
          <button type="button" className="plans-offer__close" aria-label="Dismiss offer" onClick={() => setShowOffer(false)}>×</button>
          <p role="status">Join Luxora and save {featuredOffer.promotion.discountPct}% on eligible packages.</p>
          <button type="button" className="plans-offer__link" onClick={() => {
            const category = CATEGORIES.find((item) => PACKAGE_TYPE_BY_CATEGORY[item.id] === featuredOffer.type)
            if (category) setActiveCategory(category.id)
            setShowOffer(false)
            sectionRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
            document.getElementById('plans-heading')?.focus({ preventScroll: true })
          }}>See offer and pricing →</button>
        </aside>,
        document.body,
      )}
      <div className="plans__inner">
        <div className="plans__header" data-reveal>
          <span className="section-label">05 // ATELIER MEMBERSHIPS</span>
          <h2 id="plans-heading" className="plans__title" tabIndex={-1}>
            Plans &amp; <em>Pricing</em>
          </h2>
          <p className="plans__subtitle">
            Choose from our curated service packages — transparent pricing,
            no hidden fees, and the full Luxora standard of care.
          </p>
        </div>

        <div className="plans__tabs" role="tablist" aria-label="Service plan categories" data-reveal>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={activeCategory === cat.id}
              id={`plans-tab-${cat.id}`}
              className={`plans__tab ${activeCategory === cat.id ? 'plans__tab--active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span className="plans__tab-icon" aria-hidden="true">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {currentPlans === null ? (
          <div className="plans__grid">
            <div className="plan-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2.5rem 1.5rem', color: '#888' }}>
              Loading live plans…
            </div>
          </div>
        ) : currentPlans.length === 0 ? (
          <div className="plans__grid">
            <div className="plan-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2.5rem 1.5rem', color: '#888' }}>
              Plans are currently unavailable for {CATEGORIES.find((c) => c.id === activeCategory)?.label || 'this category'}.
              <br />
              <small>Please check back shortly.</small>
            </div>
          </div>
        ) : (
          <div
            className={`plans__grid ${currentPlans.length === 1 ? 'plans__grid--single' : currentPlans.length === 2 ? 'plans__grid--double' : ''}`}
            key={activeCategory}
          >
            {currentPlans.map((plan) => (
              <div
                key={plan.id}
                id={`plan-${plan.id}`}
                className={`plan-card ${plan.highlight ? 'plan-card--featured' : ''}`}
                onPointerMove={handleCardPointerMove}
              >
                {plan.highlight && (
                  <div className="plan-card__badge">
                    <CrownIcon />
                    <span>MOST POPULAR</span>
                  </div>
                )}

                <div className="plan-card__header">
                  <p className="plan-card__tier">{plan.tier}</p>
                  {plan.promotion && plan.originalPrice > plan.price && (
                    <p className="plan-card__promotion">{plan.promotion.code ? `${plan.promotion.code} · ` : ''}{plan.promotion.discountPct}% off</p>
                  )}
                  <div className="plan-card__price-wrap">
                    <span className="plan-card__currency">LKR</span>
                    <span className="plan-card__amount">{plan.price.toLocaleString()}</span>
                    {plan.originalPrice > plan.price && <del className="plan-card__original">LKR {plan.originalPrice.toLocaleString()}</del>}
                  </div>
                  <p className="plan-card__period">
                    ✦ {plan.coins} {plan.coins === 1 ? 'coin' : 'coins'} per month
                  </p>
                  {plan.description && <p className="plan-card__summary">{plan.description}</p>}
                </div>

                <div className="plan-card__divider" />

                <ul className="plan-card__features">
                  {plan.features.map((f, i) => (
                    <li key={i} className="plan-card__feature plan-card__feature--on">
                      <span className="plan-card__check plan-card__check--on"><CheckIcon /></span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className="plan-card__cta"
                  id={`plan-${plan.id}-btn`}
                  onClick={() => handleGetStarted(plan)}
                >
                  Get Started →
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="plans__note" data-reveal>
          All prices are in Sri Lankan Rupees (LKR) and include service visits as described.
          Contact us to customise a package for your specific needs.
        </p>
      </div>
    </section>
  )
}

export default Plans
