import { useState, useRef, useEffect } from 'react'
import RatingBar from './RatingBar'
import translations from '../data/translations.json'
import './FilterPanel.css'
import './SearchBar.css'

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

export default function Sidebar({ filters, onFiltersChange, lang = 'EN', trails = [], selectedTrail, onSelectTrail }) {
  const [open, setOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const panelRef = useRef(null)

  const t = translations[lang]

  // Close the filter panel when clicking anywhere outside it
  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e) => {
      if (!panelRef.current) return
      if (!panelRef.current.contains(e.target)) {
        setOpen(false)
      }
    }

    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 50)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [open])

  const handleReset = () => {
    onFiltersChange({ trailType: 'All', maxLength: 30, search: '' })
    onSelectTrail(null)
  }

  const filteredTrails = trails.filter(tr =>
    (filters.trailType === 'All' || tr.trail_type === filters.trailType) &&
    Number(tr.length_km) <= filters.maxLength
  )

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Search bar - always visible */}
      <div className="search-bar">
        <button className="search-bar__icon-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
        <input
          className="search-bar__input"
          type="text"
          placeholder={lang === 'DE' ? 'Wege in Bamberg suchen' : 'Search trails in Bamberg'}
        />
      </div>

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
          <span className="filter-btn__label">{lang === 'DE' ? 'FILTER' : 'FILTER'}</span>
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
              {lang === 'DE' ? 'FILTER' : 'FILTER'}
            </div>
            <div className="filter-panel__header-actions">
              <button className="filter-panel__reset" onClick={handleReset}>
                {lang === 'DE' ? 'Zurücksetzen' : 'Reset'}
              </button>
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

          {/* Max length */}
          <div className="filter-panel__section">
            <div className="filter-panel__label">
              <span>{t.sidebar.maxLength}</span>
              <span><span className="filter-panel__slider-value">{filters.maxLength}</span><span className="filter-panel__slider-unit">{t.sidebar.km}</span></span>
            </div>
            <input
              type="range" min={1} max={50} step={1} value={filters.maxLength}
              className="filter-panel__slider"
              onChange={(e) => { onFiltersChange({ ...filters, maxLength: Number(e.target.value) }); onSelectTrail(null) }}
            />
            <div className="filter-panel__slider-labels">
              <span>1 {t.sidebar.km}</span>
              <span>50 {t.sidebar.km}</span>
            </div>
          </div>

          <div className="filter-panel__divider" />

          {/* Trail count header */}
          <div className="filter-panel__section" style={{ paddingBottom: 4 }}>
            <div className="filter-panel__label" style={{ marginBottom: 0 }}>
              <span>{t.sidebar.trails}</span>
              <span className="filter-panel__count-badge">{filteredTrails.length}</span>
            </div>
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
                  className={`trail-row ${selectedTrail?.id === trail.id ? 'trail-row--selected' : ''}`}
                  onClick={() => onSelectTrail(selectedTrail?.id === trail.id ? null : trail)}
                >
                  <div className="trail-row__dot" style={{ background: heatColor }} />
                  <div className="trail-row__body">
                    <div className="trail-row__name">{trail.trail_name}</div>
                    <div className="trail-row__meta">
                      {Number(trail.length_km).toFixed(2)} {t.sidebar.km} · {t.trailTypes[trail.trail_type] || trail.trail_type}
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

                    <div className="trail-detail__actions">
                      <button className="trail-detail__action-btn trail-detail__action-btn--primary">↓ GPX</button>
                      <button className="trail-detail__action-btn trail-detail__action-btn--secondary">↓ KML</button>
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
          </div>
        </div>
      )}
    </div>
  )
}
