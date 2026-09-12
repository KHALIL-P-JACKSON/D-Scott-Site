import { Sparkles, Star, Scissors, Heart, Clock, ArrowRight, ShieldCheck } from 'lucide-react'
import './Hero.css'

export function Hero() {
  return (
    <header className="radix-hero-section">
      <div className="hero-shell">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="hero-badge">
              <Sparkles size={14} />
              <span>Premier Local Hair &amp; Nail Lounge</span>
            </div>

            <h1 className="radix-hero-title">
              Hair and Nail. <span className="title-highlight">Pamper Your Nails.</span>
            </h1>

            <p className="radix-hero-desc">
              Experience bespoke hair styling, vibrant color transformations, and artisan nail enhancements in an upscale, boutique environment crafted for your glow up.
            </p>

            <div className="hero-cta-group">
              <a href="#booking" className="hero-button primary-button">
                <span>Book Your Appointment</span>
                <ArrowRight size={18} />
              </a>
              <a href="#services" className="hero-button secondary-button">
                Explore Services &amp; Pricing
              </a>
            </div>

            <div className="hero-divider" />

            <div className="hero-metrics">
              <div className="hero-metric">
                <div className="metric-row">
                  <Star size={18} fill="#f59e0b" color="#f59e0b" />
                  <strong>4.9 / 5.0</strong>
                </div>
                <span>350+ Local Reviews</span>
              </div>

              <div className="hero-metric">
                <div className="metric-row">
                  <ShieldCheck size={18} color="var(--ruby-9)" />
                  <strong>100% Clean</strong>
                </div>
                <span>Non-Toxic Formulations</span>
              </div>

              <div className="hero-metric">
                <div className="metric-row">
                  <Heart size={18} color="var(--ruby-9)" />
                  <strong>10+ Years</strong>
                </div>
                <span>Master Stylists &amp; Artists</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="radix-hero-card">
              <div className="hero-top-meta">
                <span className="hero-tag">Today at D'Luxe Beauty</span>
                <div className="hero-hours-row">
                  <Clock size={16} color="var(--gray-11)" />
                  <span>Studio hours: Mon–Fri 9:00 AM – 7:00 PM</span>
                </div>
              </div>

              <div className="hero-feature-grid">
                <div className="hero-feature-box">
                  <div className="feature-icon-wrapper hair-theme">
                    <Scissors size={22} />
                  </div>
                  <h4>Hair Studio</h4>
                  <p>Cuts, balayage, silk press, treatments &amp; gloss</p>
                </div>

                <div className="hero-feature-box">
                  <div className="feature-icon-wrapper nail-theme">
                    <Sparkles size={22} />
                  </div>
                  <h4>Nail Lounge</h4>
                  <p>BIAB gel, custom acrylics, chrome &amp; pedicures</p>
                </div>
              </div>

              <div className="radix-client-quote">
                <div className="quote-row">
                  <Clock size={16} style={{ marginTop: '2px', color: 'var(--ruby-9)', flexShrink: 0 }} />
                  <p>
                    “D'Luxe Beauty is the only salon I trust with both my blonde highlights and my BIAB overlay. Impeccable attention to detail!”
                  </p>
                </div>
                <p className="quote-author">— Jessica M., Regular Client</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
