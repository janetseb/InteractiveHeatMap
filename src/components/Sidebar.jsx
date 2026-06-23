import { useState, useRef, useEffect } from 'react'
import RatingBar from './RatingBar'
import translations from '../data/translations.json'
import './FilterPanel.css'
import './SearchBar.css'

function tempToColor(temp) {
  if (temp < 22) return '#4DB6E5'
  if (temp < 27) return '#8DD87B'
  if (temp < 31) return '#F2C14E'
  if (temp < 35) return '#F58B54'
  return '#E45454'
}

function HeatProfileBar({ segments }) {
  if (!Array.isArray(segments) || segments.length === 0) {
    return <div style={{ height: 12, borderRadius: 6, background: '#e2e8f0' }} />
  }
  const total = segments.reduce((sum, s) => sum + s.length_m, 0)
  return (
    <div style={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden' }}>
      {segments.map((seg, i) => (
        <div
          key={i}
          title={`${seg.temperature.toFixed(1)}°C`}
          style={{
            width: `${(seg.length_m / total) * 100}%`,
            background: tempToColor(seg.temperature),
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  )
}

function HeatIcon({ level }) {
  const common = { width: 18, height: 18, fill: 'none', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (!level) return (
    <svg {...common} viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  )
  if (level === '3') return (
    <svg {...common} viewBox="0 0 24 24" stroke="currentColor">
      <path d="M12 3a4 4 0 0 1 0 8 4 4 0 0 1 0-8z"/>
      <path d="M12 11v8"/>
      <path d="M9 18c1-1.5 3-1.5 3-1.5s2 0 3 1.5"/>
      <path d="M7 14c1.5-1 3-1 5-1s3.5 0 5 1"/>
    </svg>
  )
  if (level === '2') return (
    <svg {...common} viewBox="0 0 24 24" stroke="currentColor">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/>
      <path d="M12 6v2M8.5 8.5l1.5 1.5M18.5 8.5l-1.5 1.5"/>
      <circle cx="12" cy="4" r="1" fill="currentColor"/>
    </svg>
  )
  if (level === '1') return (
    <svg {...common} viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  )
  return null
}

const HEAT_FILTERS = [
  { key: 'All', label: 'Alle' },
  { key: '3', label: 'Sehr geeignet' },
  { key: '2', label: 'Gut geeignet' },
  { key: '1', label: 'Nicht geeignet' },
]

const TRAIL_TYPES = [
  { key: 'All', icon: 'layers' },
  { key: 'cycling', icon: 'bike' },
  { key: 'hiking', icon: 'mountain' },
]

function ChipIcon({ icon }) {
  const common = { width: 18, height: 18, fill: 'none', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (icon === 'layers') return (
    <svg {...common} viewBox="0 0 24 24" stroke="currentColor">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  )
  if (icon === 'mountain') return (
    <svg {...common} viewBox="0 0 24 24" stroke="currentColor">
      <path d="M3 20 L9 8 L13 15 L16 10 L21 20 Z"/>
    </svg>
  )
  if (icon === 'bike') return (
    <svg {...common} viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="5.5" cy="17.5" r="3.5"/>
      <circle cx="18.5" cy="17.5" r="3.5"/>
      <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 17.5V14l-3-3 4-3 2 3h3"/>
    </svg>
  )
  return null
}


function ElevationChart({ elevationProfile, heatProfile }) {
  if (!elevationProfile) return null
  const results = elevationProfile?.results
  if (!Array.isArray(results) || results.length < 2) return null

  const elevations = results.map(r => r.elevation)
  const min = Math.min(...elevations)
  const max = Math.max(...elevations)
  const range = max - min || 1
  const W = 260, H = 60
  const n = elevations.length

  // Build a colour for each elevation point based on heat profile
  // by mapping cumulative heat distance to point index position
  let pointColors = null
  if (Array.isArray(heatProfile) && heatProfile.length > 0) {
    const totalHeat = heatProfile.reduce((s, seg) => s + seg.length_m, 0)
    pointColors = elevations.map((_, i) => {
      const frac = i / (n - 1)
      let cum = 0
      for (const seg of heatProfile) {
        cum += seg.length_m
        if (cum / totalHeat >= frac) return tempToColor(seg.temperature)
      }
      return tempToColor(heatProfile[heatProfile.length - 1].temperature)
    })
  }

  const pts = elevations.map((e, i) => ({
    x: (i / (n - 1)) * W,
    y: H - ((e - min) / range) * (H - 4) - 2,
  }))

  // Build coloured segments between consecutive points
  const segments = []
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i], p2 = pts[i + 1]
    const color = pointColors ? pointColors[i] : '#0EA5E9'
    const areaPath = `M${p1.x},${H} L${p1.x},${p1.y} L${p2.x},${p2.y} L${p2.x},${H} Z`
    const linePath = `M${p1.x},${p1.y} L${p2.x},${p2.y}`
    segments.push({ areaPath, linePath, color })
  }

  return (
    <div style={{ marginTop: 10, marginBottom: 4 }}>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 5, fontWeight: 500 }}>
        Höhenprofil · {min}m – {max}m
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="60" style={{ display: 'block', borderRadius: 6, overflow: 'hidden' }}>
        {segments.map((seg, i) => (
          <path key={`a${i}`} d={seg.areaPath} fill={seg.color} fillOpacity="0.25" />
        ))}
        {segments.map((seg, i) => (
          <path key={`l${i}`} d={seg.linePath} fill="none" stroke={seg.color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>
        <span>Start</span><span>Ende</span>
      </div>
    </div>
  )
}

export default function Sidebar({ filters, onFiltersChange, lang = 'EN', sidebarOpen, onSidebarOpen, trails = [], selectedTrail, onSelectTrail, flyTo, onWeatherUpdate, collapseSearchRef, onSearchToggle }) {
  const open = sidebarOpen ?? false
  const setOpen = (val) => onSidebarOpen?.(val)
  const [showProfile, setShowProfile] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  useEffect(() => { if (onSearchToggle) onSearchToggle(searchOpen) }, [searchOpen])
  useEffect(() => {
    if (collapseSearchRef) collapseSearchRef.current = () => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]) }
  }, [collapseSearchRef])
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const searchTimerRef = useRef(null)
  const panelRef = useRef(null)
  const selectedRowRef = useRef(null)

  const t = translations[lang]
  useEffect(() => {
    if (open && selectedTrail && selectedRowRef.current) {
      setTimeout(() => {
        selectedRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 80)
    }
  }, [open, selectedTrail])


  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e) => {
      if (!panelRef.current) return
      if (e.target.closest('.leaflet-container')) return
      if (!panelRef.current.contains(e.target)) setOpen(false)
    }
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 50)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [open])

  const handleSearch = (query) => {
    setSearchQuery(query)
    clearTimeout(searchTimerRef.current)
    if (!query.trim()) { setSearchResults([]); return }
    setSearchLoading(true)
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ", Bavaria")}&format=json&limit=5&viewbox=9.0,47.3,13.8,50.6&bounded=1&countrycodes=de`,
          { headers: { 'Accept-Language': 'de' } }
        )
        const data = await res.json()
        setSearchResults(data.filter(r => r.display_name.includes('Bayern') || r.display_name.includes('Bavaria')))
      } catch { setSearchResults([]) }
      finally { setSearchLoading(false) }
    }, 400)
  }

  const handleSelectResult = (result) => {
    const name = result.display_name.split(',')[0]
    setSearchQuery('')
    setSearchResults([])
    setSearchOpen(false)
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    if (flyTo) flyTo(lat, lng, 14)
    if (onWeatherUpdate) onWeatherUpdate(lat, lng, name)
  }

  const handleReset = () => {
    onFiltersChange({ trailType: 'All', maxLength: 30, heatFilter: 'All', search: '' })
    onSelectTrail(null)
  }

  const filteredTrails = trails.filter(tr =>
    (filters.trailType === 'All' || tr.trail_type === filters.trailType) &&
    Number(tr.length_km) <= filters.maxLength &&
    (filters.heatFilter === 'All' || tr.hitzetauglichkeit >= Number(filters.heatFilter))
  )

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Search */}
      {!searchOpen ? (
        <button
          onClick={() => setSearchOpen(true)}
          style={{
            position: 'absolute', top: 12, left: 12, zIndex: 2000,
            width: 44, height: 44, borderRadius: '50%', border: 'none',
            background: 'rgba(255,255,255,0.95)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
      ) : (
        <div style={{
          position: 'absolute', top: 12, left: 12, width: 320, zIndex: 2000,
          background: '#fff', borderRadius: searchResults.length > 0 || searchLoading ? '16px 16px 16px 16px' : 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          fontFamily: "'Inter', sans-serif", overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '6px 6px 6px 12px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2.2" style={{ flexShrink: 0, marginRight: 10 }}>
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="search-bar__input"
              type="text"
              autoFocus
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              placeholder={lang === 'DE' ? 'Orte oder Wege suchen' : 'Search places or trails'}
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#1e293b' }}
            />
          </div>
          {(searchResults.length > 0 || searchLoading) && (
            <div style={{ borderTop: '1px solid #f1f3f4', maxHeight: 260, overflowY: 'auto' }}>
              {searchLoading && (
                <div style={{ padding: '12px 16px', fontSize: 13, color: '#94a3b8' }}>Suche...</div>
              )}
              {searchResults.map((r, i) => (
                <div key={i} onClick={() => handleSelectResult(r)} style={{
                  padding: '12px 16px', fontSize: 14, color: '#0f172a', cursor: 'pointer',
                  borderBottom: i < searchResults.length - 1 ? '1px solid #f1f3f4' : 'none',
                  lineHeight: 1.4
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  <div style={{ fontWeight: 500 }}>{r.display_name.split(',')[0]}</div>
                  <div style={{ fontSize: 12, color: '#9aa0a6', marginTop: 2 }}>{r.display_name.split(',').slice(1, 3).join(',')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter toggle button */}
      {!open && (
        <button className={`filter-btn`} onClick={() => setOpen(true)}>
          <span className="filter-btn__icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6"/><circle cx="9" cy="6" r="2" fill="#0f172a"/>
              <line x1="4" y1="12" x2="20" y2="12"/><circle cx="15" cy="12" r="2" fill="#0f172a"/>
              <line x1="4" y1="18" x2="20" y2="18"/><circle cx="11" cy="18" r="2" fill="#0f172a"/>
            </svg>
          </span>
          <span className="filter-btn__label">Filter</span>
        </button>
      )}

      {/* Filter panel */}
      {open && (
        <div className="filter-panel">
          <div className="filter-panel__header">
            <div className="filter-panel__title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                <line x1="4" y1="6" x2="20" y2="6"/><circle cx="9" cy="6" r="2" fill="#0f172a"/>
                <line x1="4" y1="12" x2="20" y2="12"/><circle cx="15" cy="12" r="2" fill="#0f172a"/>
                <line x1="4" y1="18" x2="20" y2="18"/><circle cx="11" cy="18" r="2" fill="#0f172a"/>
              </svg>
              Filter
            </div>
            <div className="filter-panel__header-actions">

              <button className="filter-panel__close" onClick={() => setOpen(false)}>×</button>
            </div>
          </div>

          {/* Trail type */}
          <div className="filter-panel__section">
            <div className="filter-panel__label">{t.sidebar.trailType}</div>
            <div className="filter-panel__chip-grid">
              {TRAIL_TYPES.map(({ key, icon }) => (
                <button
                  key={key}
                  className={`filter-panel__chip ${filters.trailType === key ? 'filter-panel__chip--active' : ''}`}
                  onClick={() => { onFiltersChange({ ...filters, trailType: key }); onSelectTrail(null) }}
                >
                  <ChipIcon icon={icon} />
                  {t.trailTypes[key] || key}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-panel__divider" />

          {/* Heat filter */}
          <div className="filter-panel__section">
            <div className="filter-panel__label">Hitzetauglichkeit</div>
            <div className="filter-panel__chip-grid">
              {HEAT_FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  className={`filter-panel__chip ${filters.heatFilter === key ? 'filter-panel__chip--active' : ''}`}
                  onClick={() => { onFiltersChange({ ...filters, heatFilter: key }); onSelectTrail(null) }}
                >
                  <HeatIcon level={key === 'All' ? null : key} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-panel__divider" />

          {/* Max length */}
          <div className="filter-panel__section">
            <div className="filter-panel__label">
              <span>{t.sidebar.maxLength}</span>
              <span style={{
                background: '#F1F5F9', borderRadius: 12, padding: '10px 16px',
                fontSize: 14, fontWeight: 600, color: '#0F172A'
              }}>{filters.maxLength} {t.sidebar.km}</span>
            </div>
            <input
              type="range" min={1} max={50} step={1} value={filters.maxLength}
              onChange={(e) => { onFiltersChange({ ...filters, maxLength: Number(e.target.value) }); onSelectTrail(null) }}
              style={{
                width: '100%', margin: "10px 0 6px", cursor: "pointer",
                WebkitAppearance: 'none', appearance: 'none',
                height: 6, borderRadius: 3, outline: 'none', border: 'none',
                background: `linear-gradient(to right, #14B8A6 ${((filters.maxLength - 1) / 49) * 100}%, #E2E8F0 ${((filters.maxLength - 1) / 49) * 100}%)`,
              }}
            />
            <div className="filter-panel__slider-labels">
              <span>1 {t.sidebar.km}</span>
              <span>50 {t.sidebar.km}</span>
            </div>
          </div>

          <div className="filter-panel__divider" />

          <div className="filter-panel__section" style={{ paddingBottom: 4 }}>
            <div className="filter-panel__label" style={{ marginBottom: 0 }}>{t.sidebar.trails}</div>
          </div>

          {filteredTrails.length === 0 && (
            <div className="filter-panel__empty">{t.sidebar.noTrails}</div>
          )}

          {/* Trail list */}
          {filteredTrails.map(trail => {
            const heatColor = trail.heatColor || '#94a3b8'
            return (
              <div key={trail.id}>
                <div
                  ref={selectedTrail?.id === trail.id ? selectedRowRef : null}
                  className={`trail-row ${selectedTrail?.id === trail.id ? 'trail-row--selected' : ''}`}
                  onClick={() => onSelectTrail(selectedTrail?.id === trail.id ? null : trail)}
                >

                  <div className="trail-row__body">
                    <div className="trail-row__name">{trail.trail_name}</div>
                    <div className="trail-row__meta">
                      {t.trailTypes[trail.trail_type] || trail.trail_type}
                    </div>
                  </div>
                  <span className="trail-row__arrow">›</span>
                </div>

                {selectedTrail?.id === trail.id && (
                  <div className="trail-detail">
                    <div className="trail-detail__stats">
                      <div className="trail-detail__stat">
                        <div className="trail-detail__stat-value">{Number(trail.length_km).toFixed(2)} {t.sidebar.km}</div>
                        <div className="trail-detail__stat-label">{t.sidebar.length}</div>
                      </div>
                      <div
                        className="trail-detail__stat"
                        onClick={() => setShowProfile(true)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="trail-detail__stat-value" style={{ fontSize: 13, lineHeight: 1.3 }}>
                          {t.sidebar.fullProfile}
                        </div>
                      </div>
                    </div>

                    <RatingBar label={t.sidebar.kondition}     value={trail.kondition || 0} />
                    <RatingBar label={t.sidebar.technik}       value={trail.technik || 0} />
                    <RatingBar label={t.sidebar.erlebniswert}  value={trail.erlebniswert || 0} />
                    <RatingBar label={t.sidebar.hitzetauglich} value={trail.hitzetauglichkeit || 0} color="#EE8C5A" max={4} />

                    <div style={{ marginTop: 10, marginBottom: 4 }}>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 5, fontWeight: 500 }}>
                        Komfortprofil
                      </div>
                      <HeatProfileBar segments={trail.heat_profile} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>
                        <span>Start</span><span>Ende</span>
                      </div>
                    </div>

                    <ElevationChart elevationProfile={trail.elevation_profile} heatProfile={trail.heat_profile} />
                    <div className="trail-detail__actions">
                      <button
                        className="trail-detail__action-btn trail-detail__action-btn--secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          const a = document.createElement('a')
                          a.href = `${import.meta.env.VITE_API_URL}/api/trails/${trail.id}/gpx`
                          a.download = ''
                          a.click()
                        }}
                      >↓ GPX</button>
                      <button
                        className="trail-detail__action-btn trail-detail__action-btn--secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          const a = document.createElement('a')
                          a.href = `${import.meta.env.VITE_API_URL}/api/trails/${trail.id}/kml`
                          a.download = ''
                          a.click()
                        }}
                      >↓ KML</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Full Profile modal */}
      {showProfile && selectedTrail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 20, width: 400, maxHeight: '80vh', overflowY: 'auto', padding: 24, fontFamily: "'Inter', sans-serif", boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>{selectedTrail.trail_name}</span>
              <button onClick={() => setShowProfile(false)} style={{ background: 'none', border: 'none', fontSize: 22, color: '#94a3b8', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.65, marginBottom: 16 }}>{selectedTrail.description}</p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[
                { val: `${Number(selectedTrail.length_km).toFixed(2)} ${t.sidebar.km}`, label: t.sidebar.lengthLabel },
                { val: t.trailTypes[selectedTrail.trail_type] || selectedTrail.trail_type, label: t.sidebar.type },
              ].map(({ val, label, color }) => (
                <div key={label} style={{ flex: 1, background: '#fafbfc', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 12, padding: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: color || '#0f172a', letterSpacing: '-0.3px' }}>{val}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>

            <RatingBar label={t.sidebar.kondition}     value={selectedTrail.kondition || 0} />
            <RatingBar label={t.sidebar.technik}       value={selectedTrail.technik || 0} />
            <RatingBar label={t.sidebar.erlebniswert}  value={selectedTrail.erlebniswert || 0} />
            <RatingBar label={t.sidebar.hitzetauglich} value={selectedTrail.hitzetauglichkeit || 0} color="#EE8C5A" max={4} />

            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 5, fontWeight: 500 }}>
                Komfortprofil · ⌀ {selectedTrail.mean_temperature != null ? `${Number(selectedTrail.mean_temperature).toFixed(1)}°C` : '—'}
              </div>
              <HeatProfileBar segments={selectedTrail.heat_profile} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>
                <span>Start</span><span>Ende</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
