import { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import MapStyles, { Compass, ZoomControl } from './MapStyles'
import Legend from './Legend'
import translations from '../data/translations.json'
import './MapControls.css'

const BAMBERG = [49.8988, 10.9028]

const LAYERS = {
  cyclosm: {
    label: 'Routes',
    url: 'https://tile.waymarkedtrails.org/cycling/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  topo: {
    label: 'Topographic',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  standard: {
    label: 'Streets',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
}

const TRAIL_COLORS = {
  cycling: '#6366F1',
  hiking: '#00A89D',
}
const TRAIL_COLOR_SELECTED = {
  cycling: '#6366F1',
  hiking: '#18D6C7',
}

// UV index thresholds per the WHO/EPA standard scale, used to color the
// UV badge in the weather card.

function weatherIcon(temp) {
  if (temp == null) return '🌡️'
  if (temp >= 35) return '🌞'
  if (temp >= 28) return '☀️'
  if (temp >= 20) return '⛅'
  return '🌥️'
}

function weatherCondition(temp, t) {
  if (temp == null) return ''
  if (temp >= 35) return t.weather.veryHot
  if (temp >= 28) return t.weather.clearSky
  if (temp >= 20) return t.weather.partlyCloudy
  return t.weather.cloudy
}

function wmoIcon(code) {
  if (code == null) return '🌡️'
  if (code === 0) return '☀️'
  if (code <= 2) return '⛅'
  if (code <= 3) return '☁️'
  if (code <= 49) return '🌫️'
  if (code <= 59) return '🌦️'
  if (code <= 69) return '🌧️'
  if (code <= 79) return '🌨️'
  if (code <= 84) return '🌧️'
  if (code <= 99) return '⛈️'
  return '🌡️'
}

function uvLabel(uv, t) {
  if (uv == null) return '—'
  if (uv < 3) return t.weather.uvLow
  if (uv < 6) return t.weather.uvModerate
  if (uv < 8) return t.weather.uvHigh
  if (uv < 11) return t.weather.uvVeryHigh
  return t.weather.uvExtreme
}

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

export default function Map({ filters, lang, trails = [], selectedTrail, onSelectTrail, flyToRef, weatherUpdateRef, onMapClick, searchOpen }) {
  const t = translations[lang] || translations.EN
  const [active, setActive] = useState('standard')
  const [locStatus, setLocStatus] = useState('idle')
  const [heatmapVisible, setHeatmapVisible] = useState(true)
  const [weather, setWeather] = useState(null)
  const [weatherExpanded, setWeatherExpanded] = useState(false)
  const [forecast, setForecast] = useState([])
  const [weatherLocation, setWeatherLocation] = useState('Bamberg')
  const mapRef = useRef(null)
  useEffect(() => {
    if (flyToRef) flyToRef.current = (lat, lng, zoom = 14) => {
      if (mapRef.current) mapRef.current.flyTo([lat, lng], zoom, { duration: 1.2 })
    }
    if (weatherUpdateRef) weatherUpdateRef.current = (lat, lng, name) => fetchWeather(lat, lng, name)
  }, [flyToRef, weatherUpdateRef])
  const markerRef = useRef(null)
  const pinMarkerRef = useRef(null)
  const circleRef = useRef(null)
  const heatLayersRef = useRef([])
  const heatmapLoadedRef = useRef(false)
  const trailLayersRef = useRef([])

  // Fetches current temperature, apparent temperature, and UV index for a
  // given coordinate from Open-Meteo. UV index is requested via the hourly
  // endpoint (rather than current) since it is not reliably available as
  // an instantaneous value across all Open-Meteo models; the first hourly
  // entry corresponds to the current hour.
  const fetchWeather = (lat, lon, locationName = 'Bamberg') => {
    setWeatherLocation(locationName)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m&hourly=uv_index&daily=temperature_2m_max,weathercode&timezone=auto`
    fetch(url)
      .then(r => r.json())
      .then(data => {
        const temp = data?.current?.temperature_2m
        const feelsLike = data?.current?.apparent_temperature
        const humidity = data?.current?.relative_humidity_2m
        const uv = Array.isArray(data?.hourly?.uv_index) ? data.hourly.uv_index[0] : null
        if (temp == null && feelsLike == null && uv == null) return
        setWeather({ temp, feelsLike, uv, humidity })
        if (data?.daily) {
          const days = data.daily.time.slice(0, 5).map((t, i) => ({
            date: new Date(t),
            maxTemp: data.daily.temperature_2m_max[i],
            code: data.daily.weathercode[i],
          }))
          setForecast(days)
        }
      })
      .catch(() => {})
  }

  // Loads weather for Bamberg by default
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

    fetch(`${import.meta.env.VITE_API_URL}/api/heatmap`)
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
            fillOpacity: 0.4,
            stroke: false,
            weight: 0,
            opacity: 0,
            interactive: false,
          }).addTo(map)



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
  Number(tr.length_km) <= filters.maxLength &&
  tr.hitzetauglichkeit >= (filters.minHeat || 1)
)

    const tempToColor = (temp) => {
      if (temp < 20) return '#6CC4E8'
      if (temp < 25) return '#9CD67A'
      if (temp < 30) return '#F2C66D'
      if (temp < 35) return '#EE8C5A'
      return '#DB5B52'
    }

    const toRad = d => d * Math.PI / 180
    const distBetween = ([lat1, lon1], [lat2, lon2]) => {
      const R = 6371000
      const dLat = toRad(lat2 - lat1)
      const dLon = toRad(lon2 - lon1)
      const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    }

    filtered.forEach(trail => {
      if (!Array.isArray(trail.waypoints) || trail.waypoints.length < 2) return

      const latlngs = trail.waypoints
        .map(p => [Number(p.lat), Number(p.lon)])
        .filter(([lat, lon]) => Number.isFinite(lat) && Number.isFinite(lon))

      if (latlngs.length < 2) return

      const isSelected = selectedTrail?.id === trail.id
      const baseColor = TRAIL_COLORS[trail.trail_type] || TRAIL_COLOR_DEFAULT
      const mainColor = isSelected ? TRAIL_COLOR_SELECTED[trail.trail_type] : baseColor

    
      const halo = window.L.polyline(latlngs, {
      color: '#ffffff',
      weight: isSelected ? 8 : 6,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: trail.trail_type === 'cycling' ? '8 4' : null,
    }).addTo(map)

    const line = window.L.polyline(latlngs, {
      color: mainColor,
      weight: isSelected ? 5 : 3,
      opacity: 1,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: isSelected ? '6 4' : (trail.trail_type === 'cycling' ? '8 4' : null),
      dashOffset: '0',
    }).addTo(map)

      if (isSelected) {
        let offset = 0
        const animate = () => {
          offset -= 1
          line.setStyle({ dashOffset: String(offset) })
          line._animFrame = requestAnimationFrame(animate)
        }
        line._animFrame = requestAnimationFrame(animate)
        line._stopAnim = () => cancelAnimationFrame(line._animFrame)
      }

      const handleClick = (e) => {
        window.L.DomEvent.stopPropagation(e)
        onSelectTrail(trail)
      }
      const handleOver = () => { if (!isSelected) { line.setStyle({ weight: 5 }); halo.setStyle({ weight: 8, opacity: 1.0 }) } }
      const handleOut = () => { if (!isSelected) { line.setStyle({ weight: 3 }); halo.setStyle({ weight: 6, opacity: 0.9 }) } }

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

  // Place/remove destination pin on trail end point
  useEffect(() => {
    const map = mapRef.current
    if (pinMarkerRef.current) { pinMarkerRef.current.remove(); pinMarkerRef.current = null }
    if (!map || !selectedTrail) return
    const wps = selectedTrail.waypoints
    if (!Array.isArray(wps) || wps.length < 2) return
    const end = wps[wps.length - 1]
    const lat = Number(end.lat), lon = Number(end.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return
    const icon = window.L.divIcon({
      className: '',
      html: `<div style="
        width:28px;height:36px;position:relative;
      ">
        <svg viewBox="0 0 28 36" width="28" height="36" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 0C6.27 0 0 6.27 0 14c0 9.33 14 22 14 22S28 23.33 28 14C28 6.27 21.73 0 14 0z" fill="#00A89D"/>
          <circle cx="14" cy="14" r="6" fill="white"/>
        </svg>
      </div>`,
      iconSize: [28, 36],
      iconAnchor: [14, 36],
    })
    pinMarkerRef.current = window.L.marker([lat, lon], { icon, zIndexOffset: 1000 }).addTo(map)
  }, [selectedTrail])

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>

      {/* Weather pill + expandable card */}
      {weather && !searchOpen && (
        <div style={{ position: 'absolute', top: 12, right: 260, zIndex: 999, fontFamily: 'Inter, sans-serif' }}>
          {!weatherExpanded ? (
            // Collapsed pill
            <div
              onClick={() => setWeatherExpanded(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
                borderRadius: 22, height: 44, padding: '0 16px',
                boxShadow: '0 4px 16px rgba(15,23,42,0.10)',
                cursor: 'pointer', userSelect: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <span style={{ fontSize: 18 }}>{weatherIcon(weather.temp)}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                {weather.temp != null ? `${Math.round(weather.temp)}°` : '—'}
              </span>
            </div>
          ) : (
            // Expanded card
            <div
              onClick={() => setWeatherExpanded(false)}
              style={{
                background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(16px)',
                borderRadius: 20, padding: '16px 20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.13)',
                cursor: 'pointer', userSelect: 'none', minWidth: 180,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 10 }}>
                {weatherLocation}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 34 }}>{weatherIcon(weather.temp)}</span>
                <span style={{ fontSize: 30, fontWeight: 700, color: '#0f172a' }}>
                  {weather.temp != null ? `${Math.round(weather.temp)}°C` : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {weather.feelsLike != null && (
                  <div style={{ fontSize: 13, color: '#475569' }}>
                    {t.weather.feelsLike} <strong>{Math.round(weather.feelsLike)}°C</strong>
                  </div>
                )}
                {weather.humidity != null && (
                  <div style={{ fontSize: 13, color: '#475569' }}>
                    {t.weather.humidity} <strong>{weather.humidity}%</strong>
                  </div>
                )}
                {weather.uv != null && (
                  <div style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {t.weather.uv} <span style={{ fontWeight: 700, padding: '1px 7px', borderRadius: 6, fontSize: 11, color: '#fff', background: uvColor(weather.uv) }}>
                      {uvLabel(weather.uv, t)}
                    </span>
                  </div>
                )}
                <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>
                  {weatherCondition(weather.temp, t)}
                </div>
              </div>
            </div>
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
        title={heatmapVisible ? t.map.hideHeatmap : t.map.showHeatmap}
        style={{
          position: 'absolute', top: 12, right: 140,
          zIndex: 1000, height: 44, padding: '0 18px',
          borderRadius: 22, border: 'none',
          background: heatmapVisible ? '#14B8A6' : '#F8F8F6',
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
        {t.map.heatmapLabel}
      </button>

      {/* Denied toast */}
      {locStatus === 'denied' && (
        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: '#0f172a', color: '#fff', fontSize: 12,
          padding: '8px 16px', borderRadius: 8, zIndex: 3000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)', whiteSpace: 'nowrap',
        }}>
          {t.map.locationDenied}
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
        <MapStyles active={active} onSelect={setActive} lang={lang} />
      </div>

      {heatmapVisible && <Legend lang={lang} />}

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
          mapInstance.target.on('click', (e) => {
            if (onMapClick) onMapClick()
            setWeatherExpanded(false)
            const { lat, lng } = e.latlng
            fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
              .then(r => r.json())
              .then(d => {
                const name = d.address?.city || d.address?.town || d.address?.village || d.address?.suburb || t.map.thisPlace
                fetchWeather(lat, lng, name)
              })
              .catch(() => fetchWeather(lat, lng, t.map.thisPlace))
          })
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
