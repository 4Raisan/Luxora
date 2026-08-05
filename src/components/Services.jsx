import { useEffect, useRef } from 'react'
import './Services.css'

const services = [
  {
    id: 'auto-care',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 30l4-12h24l4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <rect x="6" y="30" width="36" height="8" rx="3" stroke="currentColor" strokeWidth="2"/>
        <circle cx="14" cy="38" r="3" stroke="currentColor" strokeWidth="2"/>
        <circle cx="34" cy="38" r="3" stroke="currentColor" strokeWidth="2"/>
        <path d="M14 24h8M26 24h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Auto Care',
    description: 'White-glove vehicle maintenance, detailing, and concierge chauffeur services for your fleet.',
    features: ['Fleet Management', 'On-Demand Detailing', 'Chauffeur Services'],
  },
  {
    id: 'garden-care',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 40V20M24 20C24 20 16 16 12 8c6 0 12 4 12 12zM24 20C24 20 32 16 36 8c-6 0-12 4-12 12z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 40h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M24 28C24 28 18 26 16 20c4 0 8 3 8 8zM24 28C24 28 30 26 32 20c-4 0-8 3-8 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Garden Care',
    description: 'Masterful landscape design and pristine estate grounds maintenance by certified horticulturists.',
    features: ['Landscape Design', 'Seasonal Planting', 'Pool & Water Features'],
  },
  {
    id: 'pet-wellness',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 12a4 4 0 100-8 4 4 0 000 8zM30 12a4 4 0 100-8 4 4 0 000 8zM10 22a4 4 0 100-8 4 4 0 000 8zM38 22a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="2"/>
        <path d="M24 44c-7 0-14-5-14-12 0-4 4-8 8-8h12c4 0 8 4 8 8 0 7-7 12-14 12z" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    title: 'Pet Wellness',
    description: 'Luxury pet care, grooming, veterinary coordination, and bespoke animal wellness programs.',
    features: ['Premium Grooming', 'Vet Coordination', 'Pet Sitting & Training'],
  },
  {
    id: 'estate-staffing',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 22a8 8 0 100-16 8 8 0 000 16zM8 42c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M34 28l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Estate Staffing',
    description: 'Curated recruitment of world-class household staff — butlers, chefs, housekeepers, and more.',
    features: ['Butler & Chef Placement', 'Household Management', 'Background Verification'],
  },
  {
    id: 'security',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 6l-16 6v14c0 9 7 17 16 20 9-3 16-11 16-20V12L24 6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M17 24l5 5 9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Security & Privacy',
    description: 'Discreet, elite-level residential security systems and personal protection services.',
    features: ['Smart Home Security', 'Personal Protection', 'Digital Privacy'],
  },
  {
    id: 'travel',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 38l8-8 6 4 12-16 10 4-16 20-6-4-8 6-6-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <circle cx="38" cy="12" r="6" stroke="currentColor" strokeWidth="2"/>
        <path d="M38 9v3l2 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Travel & Leisure',
    description: 'Bespoke travel experiences, private jet coordination, and exclusive global destination access.',
    features: ['Private Jet Charter', 'Luxury Itineraries', 'VIP Access & Tickets'],
  },
]

const Services = () => {
  const cardsRef = useRef([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )
    cardsRef.current.forEach((el) => { if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [])

  return (
    <section id="services" className="services">
      <div className="services__inner">
        {/* Header */}
        <div className="services__header">
          <span className="section-label">What We Offer</span>
          <h2 className="services__title">Uncompromising Excellence<br />in Every Detail</h2>
          <p className="services__subtitle">
            From estate management to personal concierge, every service is meticulously
            crafted to exceed the expectations of the world&apos;s most discerning clients.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="services__grid">
          {services.map((service, i) => (
            <div
              key={service.id}
              id={service.id}
              className="service-card"
              ref={(el) => (cardsRef.current[i] = el)}
              style={{ transitionDelay: `${i * 0.07}s` }}
            >
              <div className="service-card__icon">{service.icon}</div>
              <h3 className="service-card__title">{service.title}</h3>
              <p className="service-card__desc">{service.description}</p>
              <ul className="service-card__features">
                {service.features.map((f) => (
                  <li key={f}>
                    <span className="service-card__check">✦</span> {f}
                  </li>
                ))}
              </ul>
              <button className="service-card__cta">Learn More →</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Services
