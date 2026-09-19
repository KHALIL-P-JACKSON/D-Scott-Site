import { Sparkles, Star, Brush, Gem, Heart, Clock, ArrowRight, ShieldCheck } from 'lucide-react'
import { HeroCarousel } from './HeroCarousel'
import './Hero.css'

export function Hero() {
  return (
    <header className="radix-hero-section">
      <div className="hero-shell">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="hero-badge">
              <Sparkles size={14} />
              <span>Premier Local Nail Studio</span>
            </div>

            <h1 className="radix-hero-title">
              Acrylics, Gel &amp; Artistry. <span className="title-highlight">Pamper Your Nails.</span>
            </h1>

            <p className="radix-hero-desc">
              Experience custom acrylic sets in every length, glossy gel manicures, and artisan nail art in an upscale, boutique environment crafted for your glow up.
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
                <span>Master Nail Artists</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="radix-hero-card">
              <HeroCarousel />

              <div className="hero-top-meta">
                <span className="hero-tag">Today at D'Luxe Beauty</span>
                <div className="hero-hours-row">
                  <Clock size={16} color="var(--gray-11)" />
                  <span>Studio hours: Mon–Fri 9:00 AM – 7:00 PM</span>
                </div>
              </div>

              <div className="hero-feature-grid">
                <div className="hero-feature-box">
                  <div className="feature-icon-wrapper acrylic-theme">
                    <Brush size={22} />
                  </div>
                  <h4>Acrylic Sets &amp; Fill Ins</h4>
                  <p>Short to XX long sculpted sets and flawless rebalances</p>
                </div>

                <div className="hero-feature-box">
                  <div className="feature-icon-wrapper nail-theme">
                    <Gem size={22} />
                  </div>
                  <h4>Gel, Press-Ons &amp; Art</h4>
                  <p>Gel manicures, custom press-ons, French tips &amp; chrome</p>
                </div>
              </div>

              <div className="radix-client-quote">
                <div className="quote-row">
                  <Clock size={16} style={{ marginTop: '2px', color: 'var(--ruby-9)', flexShrink: 0 }} />
                  <p>
                    “D'Luxe Beauty is the only studio I trust with my nails. My acrylic fills always look flawless and last weeks without a single lift!”
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
