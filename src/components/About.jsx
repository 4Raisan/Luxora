import './About.css'
import Reveal from './Reveal'

const About = () => {
  const pillars = [
    { icon: '◈', title: 'Discretion', desc: 'Absolute privacy and confidentiality in every engagement.' },
    { icon: '◇', title: 'Craftsmanship', desc: 'Every detail executed to the highest possible standard.' },
    { icon: '◉', title: 'Exclusivity', desc: 'An intimate network of the world\'s finest service providers.' },
    { icon: '◆', title: 'Continuity', desc: 'Seamless 24/7 service that anticipates your every need.' },
  ]

  return (
    <section id="about" className="about">
      <div className="about__inner">
        {/* Left Column */}
        <div className="about__left">
          <span className="section-label">Our Story</span>
          <h2 className="about__title">Born from the Belief<br />That Excellence is<br />Non-Negotiable</h2>
          <div className="about__divider" />
          <p className="about__text">
            Luxora was founded with a singular vision: to create the world&apos;s most
            refined estate management and concierge platform. We serve an exclusive clientele
            of homeowners who demand nothing short of perfection.
          </p>
          <p className="about__text">
            Our curated network of elite service providers spans over 40 countries,
            ensuring that wherever your estate is located, Luxora&apos;s standard of
            excellence follows seamlessly.
          </p>
          <button className="about__cta" id="about-our-vision-btn">
            Our Vision
            <span>→</span>
          </button>
        </div>

        {/* Right Column */}
        <div className="about__right">
          <div className="about__pillars">
            {pillars.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.1}>
                <div className="about__pillar">
                  <div className="about__pillar-icon">{p.icon}</div>
                  <div>
                    <h4 className="about__pillar-title">{p.title}</h4>
                    <p className="about__pillar-desc">{p.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Quote */}
          <Reveal delay={0.1}>
            <div className="about__quote">
            <div className="about__quote-mark">&ldquo;</div>
            <p>
              The finest luxury is not what you own, but the life you live within it.
            </p>
            <div className="about__quote-author">— Luxora Founding Charter</div>
          </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

export default About
