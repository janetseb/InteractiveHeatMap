import './Legend.css'

const TICKS = [21, 24, 27, 30, 33, 35, 38]

export default function Legend({ lang = 'EN' }) {
  return (
    <div className="legend-card">
      <div className="legend-card__title">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2">
          <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
        </svg>
        {lang === 'DE' ? 'Oberflächentemperatur' : 'Surface Temperature'}
      </div>
      <div className="legend-card__bar" />
      <div className="legend-card__ticks">
        {TICKS.map(t => <span key={t}>{t}°</span>)}
      </div>
    </div>
  )
}
