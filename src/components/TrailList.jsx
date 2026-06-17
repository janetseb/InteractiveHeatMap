import translations from '../data/translations.json'

export default function TrailList({ trails, filters, onSelectTrail, lang = 'EN' }) {
  const t = translations[lang]

  const filtered = trails.filter(tr => {
    const matchType = filters.trailType === 'All' || tr.type === filters.trailType
    const matchLength = tr.length <= filters.maxLength
    const matchSearch = tr.name.toLowerCase().includes(filters.search?.toLowerCase() || '')
    return matchType && matchLength && matchSearch
  })

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0,
      width: 300, height: '100%',
      background: 'white', borderLeft: '1px solid #e0e0e0',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'sans-serif', zIndex: 2000,
      boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
    }}>

      <div style={{ padding: '14px 12px', borderBottom: '1px solid #eee' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
          {t.sidebar.trails} ({filtered.length})
        </span>
      </div>

      <div style={{ overflowY: 'auto', flex: 1 }}>
        {filtered.length === 0 && (
          <div style={{ padding: 20, color: '#999', fontSize: 13, textAlign: 'center' }}>
            {t.sidebar.noTrails}
          </div>
        )}
        {filtered.map(trail => (
          <div
            key={trail.id}
            onClick={() => onSelectTrail(trail)}
            style={{ padding: '12px', borderBottom: '1px solid #eee', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}
          >
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: trail.heatColor, marginTop: 4, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#111', marginBottom: 3 }}>{trail.name}</div>
              <div style={{ fontSize: 11, color: '#888' }}>
                {t.trailTypes[trail.type] || trail.type} · {trail.length} {t.sidebar.km} · {trail.heatLevel} {t.sidebar.heatDot}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}