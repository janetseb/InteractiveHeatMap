import './Legend.css'
import translations from '../data/translations.json'

export default function Legend({ lang = 'EN' }) {
  const t = translations[lang]
  return (
    <div className="legend-card">
      <div className="legend-card__bar" />
      <div className="legend-card__ticks">
        <span>{t.legend.cool}</span>
        <span>{t.legend.hot}</span>
      </div>
    </div>
  )
}
