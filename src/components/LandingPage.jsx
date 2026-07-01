import './LandingPage.css'
import heroImage from '../assets/bamberg-hero.jpeg'
import translations from '../data/translations.json'

export default function LandingPage({ onEnter, lang, setLang }) {
  const t = translations[lang] || translations.DE

  return (
    <div className="landing" style={{ backgroundImage: `url(${heroImage})` }}>
      <div className="landing__overlay" />

      <header className="landing__nav">
        <div />
        <select
          className="landing__lang-select"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
        >
          <option value="DE">DE</option>
          <option value="EN">EN</option>
        </select>
      </header>

      {/* Left-aligned content block, upper-left quadrant */}
      <main className="landing__content">
        <h1 className="landing__title">
          {t.landing.titleLine1}<br />
          <span className="landing__title-accent">{t.landing.titleLine2}</span>
        </h1>

        <button className="landing__cta-primary" onClick={onEnter}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
            <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z"/>
            <path d="M9 4v14M15 6v14"/>
          </svg>
          {t.landing.cta}
          <span className="landing__cta-arrow">→</span>
        </button>
      </main>

      <footer className="landing__footer">
        <span>{t.landing.footerLeft}</span>
      </footer>
    </div>
  )
}
