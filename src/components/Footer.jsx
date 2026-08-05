import './Footer.css'

const Footer = () => {
  const year = new Date().getFullYear()

  const columns = [
    {
      heading: 'Services',
      links: ['Auto Care', 'Garden Care', 'Pet Wellness', 'Estate Staffing', 'Security & Privacy', 'Travel & Leisure'],
    },
    {
      heading: 'Company',
      links: ['Our Vision', 'Careers', 'Global Offices', 'Contact'],
    },
    {
      heading: 'Legal',
      links: ['Privacy Policy', 'Terms of Service', 'Membership T&Cs', 'Cookie Policy'],
    },
  ]

  return (
    <footer className="footer" id="contact">
      <div className="footer__inner">
        {/* Top */}
        <div className="footer__top">
          {/* Brand */}
          <div className="footer__brand">
            <div className="footer__logo">
              <img src="/luxora-logo.png" alt="LUXORA" className="footer__logo-img" />
            </div>
            <p className="footer__tagline">
              The definitive platform for elite estate management and personal concierge excellence.
            </p>
            <div className="footer__socials">
              <a href="#" className="footer__social" id="footer-social-share" aria-label="Share">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </a>
              <a href="#" className="footer__social" id="footer-social-rss" aria-label="RSS Feed">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M4 11a9 9 0 019 9M4 4a16 16 0 0116 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="5" cy="19" r="1" fill="currentColor"/>
                </svg>
              </a>
              <a href="#" className="footer__social" id="footer-social-linkedin" aria-label="LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M7 10v7M7 7v.01M11 17v-3.5a2.5 2.5 0 015 0V17M11 10v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Columns */}
          {columns.map((col) => (
            <div key={col.heading} className="footer__col">
              <h4 className="footer__col-heading">{col.heading.toUpperCase()}</h4>
              <ul className="footer__col-links">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="footer__link"
                      id={`footer-${link.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="footer__divider" />

        {/* Bottom */}
        <div className="footer__bottom">
          <p className="footer__copy">
            © {year} LUXORA Concierge. All rights reserved.
          </p>
          <div className="footer__bottom-links">
            <a href="#" className="footer__bottom-link">Privacy</a>
            <span className="footer__dot">·</span>
            <a href="#" className="footer__bottom-link">Terms</a>
            <span className="footer__dot">·</span>
            <a href="#" className="footer__bottom-link">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
