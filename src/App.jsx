import { useState, useEffect, useRef, useCallback } from 'react'

import LandingPage from './components/LandingPage'
import Map from './components/Map'
import Sidebar from './components/Sidebar'

const DEFAULT_FILTERS = {
  trailType: 'All',
  maxLength: 30,
  minHeat: 1,
  search: '',
}

export default function App() {
  const [showMap, setShowMap] = useState(() => sessionStorage.getItem('mobi_showMap') === 'true')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [lang, setLang] = useState('DE')
  const [trails, setTrails] = useState([])
  const [selectedTrail, setSelectedTrail] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const flyToRef = useRef(null)
  const flyTo = (lat, lng, zoom = 14) => { if (flyToRef.current) flyToRef.current(lat, lng, zoom) }
  const weatherUpdateRef = useRef(null)
  const onWeatherUpdate = (lat, lng, name) => { if (weatherUpdateRef.current) weatherUpdateRef.current(lat, lng, name) }
  const collapseSearchRef = useRef(null)
  const onMapClick = useCallback(() => { if (collapseSearchRef.current) collapseSearchRef.current() }, [])
  
  const handleSelectTrail = useCallback((trail) => { 
  setSelectedTrail(prev => { if (prev?.id === trail?.id) return null; return trail })
  if (trail) setSidebarOpen(true) 
  }, [])

  const enterMap = () => {
    history.pushState({ page: 'map' }, '')
    sessionStorage.setItem('mobi_showMap', 'true')
    setShowMap(true)
  }

  useEffect(() => {
    const handlePop = () => {
      sessionStorage.removeItem('mobi_showMap')
      setShowMap(false)
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/trails`)
      .then(r => r.json())
      .then(data => setTrails(data))
      .catch(() => {})
  }, [])

  if (!showMap) {
    return <LandingPage onEnter={enterMap} lang={lang} setLang={setLang} />
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Map
        filters={filters}
        lang={lang}
        trails={trails}
        selectedTrail={selectedTrail}
        onSelectTrail={handleSelectTrail}
        flyToRef={flyToRef}
        weatherUpdateRef={weatherUpdateRef}
        onMapClick={onMapClick}
        searchOpen={searchOpen}
      />
      <Sidebar
  filters={filters}
  onFiltersChange={setFilters}
  lang={lang}
  trails={trails}
  selectedTrail={selectedTrail}
  onSelectTrail={handleSelectTrail}
  sidebarOpen={sidebarOpen}
  onSidebarOpen={setSidebarOpen}
  flyTo={flyTo}
  onWeatherUpdate={onWeatherUpdate}
  collapseSearchRef={collapseSearchRef}
  onSearchToggle={setSearchOpen}
/>
    </div>
  )
}