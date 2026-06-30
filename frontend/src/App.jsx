import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import Groups from './components/Groups'
import Matches from './components/Matches'
import Knockout from './components/Knockout'
import Ranking from './components/Ranking'
import Summary from './components/Summary'
import Login from './components/Login'
import Register from './components/Register'
import { useState, useEffect } from 'react'

//const API_URL = `${window.location.protocol}//${window.location.hostname}:3001/api`
const API_URL = '/api'

export { API_URL }

function App() {
  const [user, setUser] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetch(`${API_URL}/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.valid) setUser(data.username)
        })
        .catch(() => localStorage.removeItem('token'))
    }
  }, [])

  const handleLogin = (token, username) => {
    localStorage.setItem('token', token)
    setUser(username)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setMenuOpen(false)
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <BrowserRouter>
      <div className="container">
        <header>
          <div className="header-top">
            <h1>🏆 Mundial 2026</h1>
            <button
              className="hamburger-btn"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Obrir menú"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
          <nav className={`header-nav${menuOpen ? ' open' : ''}`}>
            {user ? (
              <div className="user-info">
                <span>Benvingut, {user}!</span>
                <Link to="/knockout" onClick={closeMenu}>
                  <button className="btn btn-outline">Eliminatòries</button>
                </Link>
                <Link to="/summary" onClick={closeMenu}>
                  <button className="btn btn-outline">Resum</button>
                </Link>
                <Link to="/ranking" onClick={closeMenu}>
                  <button className="btn btn-outline">Classificació</button>
                </Link>
                <button className="btn btn-secondary" onClick={handleLogout}>Tancar sessió</button>
              </div>
            ) : (
              <div className="nav-buttons">
                <Link to="/knockout" onClick={closeMenu}>
                  <button className="btn btn-outline">Eliminatòries</button>
                </Link>
                <Link to="/summary" onClick={closeMenu}>
                  <button className="btn btn-outline">Resum</button>
                </Link>
                <Link to="/ranking" onClick={closeMenu}>
                  <button className="btn btn-outline">Classificació</button>
                </Link>
                <button className="btn btn-primary" onClick={() => { window.location.href = '/login'; closeMenu() }}>Iniciar sessió</button>
                <button className="btn btn-secondary" onClick={() => { window.location.href = '/register'; closeMenu() }}>Registrar-se</button>
              </div>
            )}
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<Groups />} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
          <Route path="/matches/:group" element={<Matches user={user} />} />
          <Route path="/knockout" element={<Knockout user={user} />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/summary" element={<Summary />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App