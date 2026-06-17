import { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import MapStyles, { Compass, ZoomControl } from './MapStyles'
import Legend from './Legend'
import './MapControls.css'

const BAMBERG = [49.8988, 10.9028]

const LAYERS = {
  cyclosm: {
    label: 'CyclOSM',
    url: 'https://tile.waymarkedtrails.org/cycling/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  topo: {
    label: 'Topo',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  standard: {
    label: 'Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
}

const TRAIL_COLORS = {
  cycling: '#0EA5E9',
  hiking: '#14B8A6',
}
const TRAIL_COLOR_DEFAULT = '#64748b'
const TRAIL_COLOR_SELECTED = '#f59e0b'

// UV index thresholds per the WHO/EPA standard scale, used to color the
// UV badge in the weather card.
function uvColor(uv) {
  if (uv == null) return '#94a3b8'
  if (uv < 3) return '#16a34a'
  if (uv < 6) return '#eab308'
  if (uv < 8) return '#f97316'
  if (uv < 11) return '#dc2626'
  return '#7c3aed'
}

function MapRef({ mapRef }) {
  mapRef.current = useMap()
  return null
}

export default function Map({ filters, lang, trails = [], selectedTrail, onSelectTrail }) {
  const [active, setActive] = useState('standard')
  const [locStatus, setLocStatus] = useState('idle')
  const [heatmapVisible, setHeatmapVisible] = useState(true)
  const [weather, setWeather] = useState(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const circleRef = useRef(null)
  const heatLayersRef = useRef([])
  const heatmapLoadedRef = useRef(false)
  const trailLayersRef = useRef([])

  // Fetches current temperature, apparent temperature, and UV index for a
  // given coordinate from Open-Meteo. UV index is requested via the hourly
  // endpoint (rather than current) since it is not reliably available as
  // an instantaneous value across all Open-Meteo models; the first hourly
  // entry corresponds to the current hour.
  const fetchWeather = (lat, lon) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature&hourly=uv_index&timezone=auto`

    fetch(url)
      .then(r => r.json())
      .then(data => {
        const temp = data?.current?.temperature_2m
        const feelsLike = data?.current?.apparent_temperature
        const uv = Array.isArray(data?.hourly?.uv_index) ? data.hourly.uv_index[0] : null

        if (temp == null && feelsLike == null && uv == null) return

        setWeather({ temp, feelsLike, uv })
      })
      .catch(() => {
        // Weather failures are non-fatal; the card simply does not render.
      })
  }

  // Loads weather for Bamberg by default on mount.
  useEffect(() => {
    fetchWeather(BAMBERG[0], BAMBERG[1])
  }, [])

  const handleLocate = () => {
    if (locStatus === 'active') {
      if (markerRef.current) { markerRef.current.remove(); markerRef.current = null }
      if (circleRef.current) { circleRef.current.remove(); circleRef.current = null }
      setLocStatus('idle')
      return
    }
    if (!navigator.geolocation) { setLocStatus('denied'); return }
    setLocStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        const map = mapRef.current
        if (!map) return
        if (markerRef.current) markerRef.current.remove()
        if (circleRef.current) circleRef.current.remove()
        circleRef.current = window.L.circle([latitude, longitude], {
          radius: accuracy, color: '#0EA5E9', fillColor: '#0EA5E9',
          fillOpacity: 0.08, weight: 1,
        }).addTo(map)
        const icon = window.L.divIcon({
          className: '',
          html: `
            <div style="position:relative;width:18px;height:18px;">
              <div style="position:absolute;inset:0;background:#0EA5E9;border-radius:50%;border:2.5px solid white;box-shadow:0 0 0 2px #0EA5E9;animation:locpulse 2s infinite;"></div>
            </div>
            <style>@keyframes locpulse{0%{box-shadow:0 0 0 0 rgba(14,165,233,0.5)}70%{box-shadow:0 0 0 10px rgba(14,165,233,0)}100%{box-shadow:0 0 0 0 rgba(14,165,233,0)}}</style>
          `,
          iconSize: [18, 18], iconAnchor: [9, 9],
        })
        markerRef.current = window.L.marker([latitude, longitude], { icon }).addTo(map)
        map.flyTo([latitude, longitude], 15, { duration: 1.5 })
        setLocStatus('active')
        fetchWeather(latitude, longitude)
      },
      () => { setLocStatus('denied'); setTimeout(() => setLocStatus('idle'), 3000) },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Fetches and renders the land-surface-temperature heatmap as a grid of
  // colored rectangles. Existing layers are cleared first to avoid
  // duplicates if this is called more than once (e.g. React StrictMode).
  const loadHeatmap = (map) => {
    heatLayersRef.current.forEach(l => l.remove())
    heatLayersRef.current = []

    fetch('http://localhost:3001/api/heatmap')
      .then(r => r.json())
      .then(data => {
        const halfLat = 0.0050
        const halfLng = 0.0050
        const layers = []

        data.forEach(d => {
          const lat = parseFloat(d.latitude)
          const lng = parseFloat(d.longitude)
          const intensity = parseFloat(d.mean_lst_celsius)

          const ratio = Math.min(1, Math.max(0, (intensity - 21.29) / (37.95 - 21.29)))
          let color
          if (ratio < 0.5) {
            const t = ratio / 0.5
            color = `rgb(${Math.round(t * 255)},${Math.round(t * 255)},${Math.round(255 - t * 255)})`
          } else {
            const t = (ratio - 0.5) / 0.5
            color = `rgb(255,${Math.round(255 - t * 255)},0)`
          }

          const bounds = [
            [lat - halfLat, lng - halfLng],
            [lat + halfLat, lng + halfLng],
          ]

          const layer = window.L.rectangle(bounds, {
            fillColor: color,
            fillOpacity: 0.5,
            stroke: false,
            weight: 0,
            opacity: 0,
          }).addTo(map)

          layer.bindPopup(`
  <div style="font-family:Inter,sans-serif;text-align:center;padding:2px 4px;">
    <div style="font-size:16px;font-weight:700;color:#0f172a">${intensity.toFixed(1)}°C</div>
  </div>
`, { minWidth: 60, autoPanPadding: [20, 20] })

          layers.push(layer)
        })

        heatLayersRef.current = layers
      })
      .catch(() => {
        // Heatmap failures are non-fatal; the map still renders without
        // the temperature overlay if the backend is unreachable.
      })
  }

  // Draws filtered trails as halo + colored polylines whenever trails or
  // filters change. Also re-runs on selectedTrail change to restyle the
  // active trail without recomputing geometry for the others.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !window.L) return

    trailLayersRef.current.forEach(group => group.forEach(l => l.remove()))
    trailLayersRef.current = []

    const filtered = trails.filter(tr =>
      (filters.trailType === 'All' || tr.trail_type === filters.trailType) &&
      Number(tr.length_km) <= filters.maxLength
    )

    filtered.forEach(trail => {
      if (!Array.isArray(trail.waypoints) || trail.waypoints.length < 2) return

      const latlngs = trail.waypoints
        .map(p => [Number(p.lat), Number(p.lon)])
        .filter(([lat, lon]) => Number.isFinite(lat) && Number.isFinite(lon))

      if (latlngs.length < 2) return

      const isSelected = selectedTrail?.id === trail.id
      const baseColor = TRAIL_COLORS[trail.trail_type] || TRAIL_COLOR_DEFAULT
      const mainColor = isSelected ? TRAIL_COLOR_SELECTED : baseColor

      // White halo underneath so the colored line reads clearly against any tile style.
      const halo = window.L.polyline(latlngs, {
        color: '#ffffff',
        weight: isSelected ? 9 : 6,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map)

      const line = window.L.polyline(latlngs, {
        color: mainColor,
        weight: isSelected ? 5 : 3.5,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map)

      const handleClick = (e) => {
        window.L.DomEvent.stopPropagation(e)
        onSelectTrail(isSelected ? null : trail)
      }
      const handleOver = () => { if (!isSelected) { line.setStyle({ weight: 5 }); halo.setStyle({ weight: 8 }) } }
      const handleOut = () => { if (!isSelected) { line.setStyle({ weight: 3.5 }); halo.setStyle({ weight: 6 }) } }

      line.on('click', handleClick)
      halo.on('click', handleClick)
      line.on('mouseover', handleOver)
      halo.on('mouseover', handleOver)
      line.on('mouseout', handleOut)
      halo.on('mouseout', handleOut)

      trailLayersRef.current.push([halo, line])
    })
  }, [trails, filters, selectedTrail])

  // Flies the map to fit the selected trail's bounding box.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedTrail) return

    const { bbox_north, bbox_south, bbox_east, bbox_west } = selectedTrail
    if ([bbox_north, bbox_south, bbox_east, bbox_west].some(v => v == null)) return

    const bounds = [
      [Number(bbox_south), Number(bbox_west)],
      [Number(bbox_north), Number(bbox_east)],
    ]
    map.flyToBounds(bounds, { padding: [60, 60], duration: 1.2 })
  }, [selectedTrail])

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>

      {/* Weather card, positioned left of the Heatmap toggle */}
      {weather && (
        <div
          title={lang === 'DE' ? 'Aktuelles Wetter' : 'Current weather'}
          style={{
            position: 'absolute', top: 12, right: 280,
            zIndex: 1000, height: 44, padding: '0 16px',
            borderRadius: 22, border: 'none',
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 4px 16px rgba(15,23,42,0.10)',
            fontFamily: 'Inter, sans-serif',
            whiteSpace: 'nowrap',
          }}
        >
          {weather.temp != null && (
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
              {Math.round(weather.temp)}°C
            </span>
          )}
          {weather.feelsLike != null && (
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {lang === 'DE' ? 'gef.' : 'feels'} {Math.round(weather.feelsLike)}°C
            </span>
          )}
          {weather.uv != null && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '2px 7px',
              borderRadius: 8, color: '#fff', background: uvColor(weather.uv),
            }}>
              UV {Math.round(weather.uv)}
            </span>
          )}
        </div>
      )}

      {/* Heatmap toggle, positioned left of the Filter button */}
      <button
        onClick={() => {
          const next = !heatmapVisible
          setHeatmapVisible(next)
          heatLayersRef.current.forEach(l => {
            if (next) l.addTo(mapRef.current)
            else l.remove()
          })
        }}
        title={heatmapVisible ? 'Hide heatmap' : 'Show heatmap'}
        style={{
          position: 'absolute', top: 12, right: 140,
          zIndex: 1000, height: 44, padding: '0 18px',
          borderRadius: 22, border: 'none',
          background: heatmapVisible ? '#0EA5E9' : 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(15,23,42,0.10)',
          fontFamily: 'Inter, sans-serif',
          fontSize: 13, fontWeight: 700,
          color: heatmapVisible ? 'white' : '#0f172a',
          whiteSpace: 'nowrap',
        }}
      >
        Heatmap
      </button>

      {/* Denied toast */}
      {locStatus === 'denied' && (
        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: '#0f172a', color: '#fff', fontSize: 12,
          padding: '8px 16px', borderRadius: 8, zIndex: 3000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)', whiteSpace: 'nowrap',
        }}>
          {lang === 'DE' ? 'Standortzugriff verweigert' : 'Location access denied'}
        </div>
      )}

      {/* Bottom-left: location button + layers picker (stacked above legend) */}
      <div className="map-controls">
        <button
          className={`map-controls__btn ${locStatus === 'active' ? 'map-controls__btn--active' : ''}`}
          onClick={handleLocate}
          style={{ cursor: locStatus === 'loading' ? 'wait' : 'pointer' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke={locStatus === 'active' ? 'white' : locStatus === 'denied' ? '#94a3b8' : '#0f172a'}
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          </svg>
        </button>
        <MapStyles active={active} onSelect={setActive} />
      </div>

      <Legend lang={lang} />

      <MapContainer
        center={BAMBERG}
        zoom={13}
        minZoom={9}
        maxZoom={18}
        maxBounds={[
          [47.2, 8.9],
          [50.6, 13.9],
        ]}
        maxBoundsViscosity={1.0}
        zoomControl={false}
        attributionControl={false}
        style={{ width: '100%', height: '100%' }}
        whenReady={(mapInstance) => {
          mapRef.current = mapInstance.target
          if (!heatmapLoadedRef.current) {
            heatmapLoadedRef.current = true
            setTimeout(() => loadHeatmap(mapInstance.target), 500)
          }
        }}
      >
        <TileLayer
          key={active}
          url={LAYERS[active].url}
          attribution={LAYERS[active].attribution}
        />
        <MapRef mapRef={mapRef} />
        {/* Zoom + Compass need Leaflet context, so they render inside MapContainer
            but are visually positioned above the location/layers stack */}
        <div className="map-controls" style={{ position: 'absolute', bottom: 260, left: 12 }}>
          <ZoomControl />
          <Compass />
        </div>
      </MapContainer>
    </div>
  )
}
