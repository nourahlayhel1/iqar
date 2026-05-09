import Link from "next/link";

const whatsappUrl =
  process.env.NEXT_PUBLIC_WHATSAPP_URL ??
  "https://wa.me/96170000001?text=Hello%2C%20I%20want%20to%20ask%20about%20a%20property.";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <section className="footer-cta">
        <div>
          <h2>Ready to Find Your Dream Property?</h2>
          <p>Connect with our real estate advisors to begin your journey.</p>
          <Link href="/requests/new" className="btn">Schedule a Consultation</Link>
        </div>
      </section>

      <section className="footer-main">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="site-brand footer-logo" aria-label="IQAR home">
              <img className="site-logo footer-site-logo" src="/assets/brand/iqar-logo.png" alt="IQAR" />
            </Link>
            <p>Curating exceptional properties for discerning clients. Experience a refined real estate journey.</p>
            <div className="social-links" aria-label="Social links">
              <a href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="WhatsApp">W</a>
              <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram">I</a>
              <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn">in</a>
              <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook">f</a>
            </div>
          </div>

          <div>
            <h3>Quick Links</h3>
            <nav className="footer-links" aria-label="Footer quick links">
              <Link href="/properties">Search Properties</Link>
              <Link href="/requests/new">Buy a Property</Link>
              <Link href="/requests/new">Rent a Property</Link>
              <Link href="/properties/new">List Your Property</Link>
              <Link href="/requests/new">Contact Us</Link>
            </nav>
          </div>

          <div>
            <h3>Local Offices</h3>
            <div className="office-list">
              <p><strong>Beirut</strong><span>Achrafieh, Beirut</span></p>
              <p><strong>Dubai</strong><span>Downtown Dubai</span></p>
              <p><strong>Riyadh</strong><span>King Fahd District</span></p>
            </div>
          </div>

          <div>
            <h3>Newsletter</h3>
            <p className="footer-muted">Subscribe to receive exclusive property insights.</p>
            <form className="newsletter-form">
              <input type="email" placeholder="Email Address" aria-label="Email Address" />
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 IQAR Estates. All rights reserved.</span>
          <div>
            <Link href="/requests/new">Privacy Policy</Link>
            <Link href="/requests/new">Terms of Service</Link>
          </div>
        </div>
      </section>
    </footer>
  );
}
