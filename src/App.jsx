import { useState, useEffect } from 'react'
import './app.css'
import LandingPage from './components/LandingPage'
import Map from './components/Map'
import Sidebar from './components/Sidebar'

// Default filter state applied on first load and on reset.
const DEFAULT_FILTERS = {
  trailType: 'All',
  maxLength: 30,
  search: '',
}

export default function App() {
  // Persisted across refreshes within the same tab via sessionStorage, so a
  // reload while on the map view doesn't bounce the user back to the landing page.
  const [showMap, setShowMap] = useState(() => sessionStorage.getItem('mobi_showMap') === 'true')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [lang, setLang] = useState('DE')
  const [trails, setTrails] = useState([])
  const [selectedTrail, setSelectedTrail] = useState(null)

  // Transitions from the landing page to the map view and registers a
  // history entry so the browser back button returns to the landing page.
  const enterMap = () => {
    history.pushState({ page: 'map' }, '')
    sessionStorage.setItem('mobi_showMap', 'true')
    setShowMap(true)
  }

  // Handles the browser back/forward navigation triggered by enterMap's
  // pushState call, returning the user to the landing page.
  useEffect(() => {
    const handlePop = () => {
      sessionStorage.removeItem('mobi_showMap')
      setShowMap(false)
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  // Fetches the full trail list once on mount. Trails are filtered
  useEffect(() => {
    fetch('http://localhost:3001/api/trails')
      .then(r => r.json())
      .then(data => setTrails(data))
      .catch(() => {
        // Trail fetch failures are non-fatal; the map and sidebar simply
        // render with an empty trail list until the backend is reachable.
      })
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
        onSelectTrail={setSelectedTrail}
      />
      <Sidebar
        filters={filters}
        onFiltersChange={setFilters}
        lang={lang}
        trails={trails}
        selectedTrail={selectedTrail}
        onSelectTrail={setSelectedTrail}
      />
    </div>
  )
}
