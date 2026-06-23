import './Legend.css'
export default function Legend() {
  return (
    <div className="legend-card">
      <div className="legend-card__bar" />
      <div className="legend-card__ticks">
        <span>Kühl</span>
        <span>Heiß</span>
      </div>
    </div>
  )
}
