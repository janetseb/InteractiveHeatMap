import { useState } from 'react'
import RatingBar from './RatingBar'
import translations from '../data/translations.json'

export default function TrailDetail({ trail, onClose, lang = 'EN' }) {
  const [showProfile, setShowProfile] = useState(false)
  const t = translations[lang]

  return (
    <>
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 300, height: '100%',
        background: 'white', borderLeft: '1px solid #e0e0e0',
        display: 'flex', flexDirection: 'column',
        fontFamily: 'sans-serif', fontSize: 13,
        zIndex: 2000, overflowY: 'auto',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
      }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 12px', borderBottom: '1px solid #eee' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{trail.name}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: '#999', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ padding: '10px 12px', borderBottom: '1px solid #eee', display: 'flex', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#666' }}>🏃 {t.trailTypes[trail.type] || trail.type}</span>
          <span style={{ fontSize: 12, color: '#666' }}>📏 {trail.length} {t.sidebar.km}</span>
        </div>

        <div style={{ padding: '10px 12px', borderBottom: '1px solid #eee' }}>
          <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>{t.sidebar.avgHeat}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: trail.heatColor, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#333', textTransform: 'capitalize' }}>{trail.heatLevel}</span>
          </div>
        </div>

        <div style={{ padding: '10px 12px', borderBottom: '1px solid #eee' }}>
          <RatingBar label={t.sidebar.kondition}     value={trail.kondition} />
          <RatingBar label={t.sidebar.technik}       value={trail.technik} />
          <RatingBar label={t.sidebar.erlebniswert}  value={trail.erlebniswert} />
          <RatingBar label={t.sidebar.hitzetauglich} value={trail.hitzetauglich} color="#f47b20" />
        </div>

        <div style={{ padding: '10px 12px', borderBottom: '1px solid #eee' }}>
          <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>
            {t.sidebar.temperaturprofil} ({trail.temperaturOffset})
          </div>
          <div style={{ height: 12, borderRadius: 6, background: 'linear-gradient(to right, #60b347, #f7c948, #f47b20, #e53e3e)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#aaa', marginTop: 3 }}>
            <span>Start</span><span>End</span>
          </div>
        </div>

        <div style={{ padding: '12px', display: 'flex', gap: 8 }}>
          <button style={{ flex: 1, padding: '8px 4px', background: '#EAF3DE', border: '1px solid #639922', borderRadius: 8, fontSize: 12, color: '#27500A', cursor: 'pointer' }}>GPX</button>
          <button style={{ flex: 1, padding: '8px 4px', background: '#f5f5f5', border: '1px solid #ccc', borderRadius: 8, fontSize: 12, color: '#333', cursor: 'pointer' }}>KML</button>
          <button onClick={() => setShowProfile(true)} style={{ flex: 1, padding: '8px 4px', background: '#f5f5f5', border: '1px solid #ccc', borderRadius: 8, fontSize: 12, color: '#333', cursor: 'pointer' }}>
            {t.sidebar.fullProfile}
          </button>
        </div>

      </div>

      {showProfile && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 14, width: 420, maxHeight: '80vh', overflowY: 'auto', padding: 20, fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 600 }}>{trail.name}</span>
              <button onClick={() => setShowProfile(false)} style={{ background: 'none', border: 'none', fontSize: 22, color: '#999', cursor: 'pointer' }}>×</button>
            </div>

            {trail.images[0] && (
              <img src={trail.images[0]} alt={trail.name}
                style={{ width: '100%', borderRadius: 10, marginBottom: 12, objectFit: 'cover', height: 200 }}
                onError={(e) => { e.target.style.display = 'none' }}
              />
            )}

            <p style={{ fontSize: 13, color: '#444', lineHeight: 1.6, marginBottom: 16 }}>{trail.description}</p>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, background: '#f5f5f5', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{trail.length} {t.sidebar.km}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{t.sidebar.lengthLabel}</div>
              </div>
              <div style={{ flex: 1, background: '#f5f5f5', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: trail.heatColor }}>{trail.temperaturOffset}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{t.sidebar.heatOffset}</div>
              </div>
              <div style={{ flex: 1, background: '#f5f5f5', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{t.trailTypes[trail.type] || trail.type}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{t.sidebar.type}</div>
              </div>
            </div>

            <RatingBar label={t.sidebar.kondition}     value={trail.kondition} />
            <RatingBar label={t.sidebar.technik}       value={trail.technik} />
            <RatingBar label={t.sidebar.erlebniswert}  value={trail.erlebniswert} />
            <RatingBar label={t.sidebar.hitzetauglich} value={trail.hitzetauglich} color="#f47b20" />
          </div>
        </div>
      )}
    </>
  )
}