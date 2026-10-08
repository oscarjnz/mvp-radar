import { useEffect } from 'react'
import { BrowserRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { ThemeProvider, useTheme } from './lib/theme'
import Home from './pages/Home'
import Race from './pages/Race'
import Player from './pages/Player'
import History from './pages/History'
import Voters from './pages/Voters'
import Snubs from './pages/Snubs'
import Method from './pages/Method'

const TITLES: Record<string, string> = {
  '/': 'MVP Radar',
  '/carrera': 'Carrera MVP 2026 · MVP Radar',
  '/historial': 'Últimos 10 MVP · MVP Radar',
  '/que-premian': 'Qué premian los votantes · MVP Radar',
  '/injusticias': 'Debió ser MVP · MVP Radar',
  '/metodologia': 'Metodología · MVP Radar',
}

function RouteEffects() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = pathname.startsWith('/jugador') ? 'Perfil de jugador · MVP Radar' : TITLES[pathname] || 'MVP Radar'
  }, [pathname])
  return null
}

function Header() {
  const { mode, toggle } = useTheme()
  return (
    <header className="site-header">
      <div className="wrap">
        <NavLink to="/" className="brand" aria-label="MVP Radar, inicio">
          <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="12" fill="none" stroke="var(--s1)" strokeWidth="2.5" /><circle cx="16" cy="16" r="6" fill="none" stroke="var(--s2)" strokeWidth="2.5" /><path d="M16 16 L26 8" stroke="var(--s4)" strokeWidth="2.5" strokeLinecap="round" /></svg>
          MVP Radar
        </NavLink>
        <nav className="nav" aria-label="Principal">
          <NavLink to="/carrera">Carrera 2026</NavLink>
          <NavLink to="/historial">Historial</NavLink>
          <NavLink to="/que-premian">Qué premian</NavLink>
          <NavLink to="/injusticias">Debió ser MVP</NavLink>
          <NavLink to="/metodologia">Metodología</NavLink>
        </nav>
        <button className="theme-btn" onClick={toggle} aria-label={mode === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'} title="Cambiar tema">{mode === 'dark' ? '☀' : '☾'}</button>
      </div>
    </header>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <RouteEffects />
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/carrera" element={<Race />} />
            <Route path="/jugador/:id" element={<Player />} />
            <Route path="/historial" element={<History />} />
            <Route path="/que-premian" element={<Voters />} />
            <Route path="/injusticias" element={<Snubs />} />
            <Route path="/metodologia" element={<Method />} />
            <Route path="*" element={<div className="wrap"><h1>Página no encontrada</h1><p><NavLink to="/">Volver al inicio</NavLink></p></div>} />
          </Routes>
        </main>
        <footer className="footer">
          <div className="wrap">
            <p>MVP Radar es un proyecto independiente de análisis de béisbol. Datos de MLB Stats API, Baseball Savant, Baseball Reference y FanGraphs. No afiliado a MLB.</p>
            <p>Primer análisis de un laboratorio que seguirá creciendo: el Cy Young es el siguiente.</p>
          </div>
        </footer>
      </BrowserRouter>
    </ThemeProvider>
  )
}
