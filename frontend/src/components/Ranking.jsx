import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API_URL } from '../App'

function Ranking() {
  const [rankings, setRankings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/ranking`)
      .then(res => res.json())
      .then(data => {
        setRankings(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <p style={{ textAlign: 'center' }}>Carregant...</p>

  return (
    <div className="ranking-container">
      <div className="ranking-header">
        <h2>Classificació</h2>
        <Link to="/">
          <button className="back-btn">← Tornar</button>
        </Link>
      </div>

      {rankings.length === 0 ? (
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#aaa' }}>
          Encara no hi ha resultats per mostrar.
        </p>
      ) : (
        <div className="ranking-table">
          <div className="ranking-row header">
            <span className="position">#</span>
            <span className="username">Usuari</span>
            <span className="points">Punts</span>
          </div>
          {rankings.map((r, index) => (
            <div key={r.userId} className={`ranking-row ${index < 3 ? `top-${index + 1}` : ''}`}>
              <span className="position">
                {index + 1 === 1 ? '🥇' : index + 1 === 2 ? '🥈' : index + 1 === 3 ? '🥉' : index + 1}
              </span>
              <span className="username">{r.username}</span>
              <span className="points">{r.points}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Ranking