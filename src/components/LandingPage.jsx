import './LandingPage.css'
import heroImage from '../assets/bamberg-hero.jpeg'

const COPY = {
  DE: {
    titleLine1: 'Bamberg entdecken',
    titleLine2: 'ein Trail nach dem anderen',
    subtitle: 'Sieben Hügel und endlose Entdeckungen entlang der Regnitz.',
    ctaPrimary: 'Hitzekarte erkunden',
    footerLeft: '© 2026 HeatIslanders',
  },
  EN: {
    titleLine1: 'Explore Bamberg',
    titleLine2: 'One Trail at a Time',
    subtitle: "Seven Hills and Endless Discoveries along the Regnitz River.",
    ctaPrimary: 'Explore Heatmap',
    footerLeft: '© 2026 HeatIslanders',
  },
}


export default function LandingPage({ onEnter, lang, setLang }) {
  const t = COPY[lang] || COPY.DE

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
          {t.titleLine1}<br />
          <span className="landing__title-accent">{t.titleLine2}</span>
        </h1>

        <p className="landing__subtitle">{t.subtitle}</p>

        <button className="landing__cta-primary" onClick={onEnter}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
            <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z"/>
            <path d="M9 4v14M15 6v14"/>
          </svg>
          {t.ctaPrimary}
          <span className="landing__cta-arrow">→</span>
        </button>
      </main>

      <footer className="landing__footer">
        <span>{t.footerLeft}</span>
      </footer>
    </div>
  )
}