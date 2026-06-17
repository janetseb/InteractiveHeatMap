import { useState } from 'react'
import { useMap } from 'react-leaflet'
import './MapControls.css'

const STYLES = [
  { key: 'standard', label: 'Standard', preview: 'https://tile.openstreetmap.org/12/2179/1422.png' },
  { key: 'cyclosm', label: 'CyclOSM', preview: 'https://tile.openstreetmap.org/12/2179/1422.png' },
  { key: 'topo', label: 'Topo', preview: 'https://tile.opentopomap.org/12/2179/1422.png' },
]

export function Compass() {
  return (
    <div className="map-controls__btn">
      <svg width="22" height="22" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="44" fill="none" stroke="#e2e8f0" strokeWidth="5"/>
        <polygon points="50,10 44,50 56,50" fill="#ef4444"/>
        <polygon points="50,90 44,50 56,50" fill="#cbd5e1"/>
        <circle cx="50" cy="50" r="6" fill="#0f172a"/>
        <text x="50" y="8" textAnchor="middle" fontSize="13" fontWeight="700" fill="#ef4444" fontFamily="Inter, sans-serif">N</text>
      </svg>
    </div>
  )
}

export function ZoomControl() {
  const map = useMap()
  return (
    <div className="map-controls__zoom">
      <button className="map-controls__zoom-btn" onClick={() => map.zoomIn()}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.4" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
      <div className="map-controls__zoom-divider" />
      <button className="map-controls__zoom-btn" onClick={() => map.zoomOut()}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.4" strokeLinecap="round">
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    </div>
  )
}

export default function MapStyles({ active, onSelect }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className="map-controls__btn"
        onClick={() => setOpen(!open)}
        title="Map Styles"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="1.8">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'absolute', inset: 0, zIndex: 2001, background: 'transparent' }} />
          <div style={{
            position: 'absolute', bottom: 96, left: 12,
            zIndex: 2002, background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(16px)',
            borderRadius: 18, boxShadow: '0 8px 32px rgba(15,23,42,0.16)',
            padding: 16, width: 280, fontFamily: 'Inter, sans-serif',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Map Styles</span>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: 20, color: '#94a3b8', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {STYLES.map(style => (
                <div key={style.key} onClick={() => { onSelect(style.key); setOpen(false) }} style={{ cursor: 'pointer', textAlign: 'center', flex: 1 }}>
                  <div style={{
                    width: '100%', aspectRatio: '1', borderRadius: 12, overflow: 'hidden',
                    border: active === style.key ? '3px solid #0EA5E9' : '2px solid #e2e8f0',
                    marginBottom: 6,
                  }}>
                    <img src={style.preview} alt={style.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: active === style.key ? 700 : 500, color: '#0f172a' }}>{style.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}