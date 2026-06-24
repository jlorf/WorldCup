import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { API_URL } from '../App'

const countryCodes = {
  'Spain': 'es', 'Mexico': 'mx', 'South Africa': 'za', 'Czech Republic': 'cz', 'South Korea': 'kr',
  'Canada': 'ca', 'Bosnia & Herzegovina': 'ba', 'Qatar': 'qa', 'Switzerland': 'ch',
  'Brazil': 'br', 'Morocco': 'ma', 'Haiti': 'ht', 'Scotland': 'gb-sct',
  'USA': 'us', 'Paraguay': 'py', 'Australia': 'au', 'Turkey': 'tr',
  'Germany': 'de', 'Ivory Coast': 'ci', 'Curaçao': 'cw', 'Ecuador': 'ec',
  'Netherlands': 'nl', 'Japan': 'jp', 'Sweden': 'se', 'Tunisia': 'tn',
  'Belgium': 'be', 'Egypt': 'eg', 'Iran': 'ir', 'New Zealand': 'nz',
  'Cape Verde': 'cv', 'Saudi Arabia': 'sa', 'Uruguay': 'uy',
  'France': 'fr', 'Senegal': 'sn', 'Iraq': 'iq', 'Norway': 'no',
  'Argentina': 'ar', 'Algeria': 'dz', 'Austria': 'at', 'Jordan': 'jo',
  'Portugal': 'pt', 'DR Congo': 'cd', 'Uzbekistan': 'uz', 'Colombia': 'co',
  'England': 'gb-eng', 'Croatia': 'hr', 'Ghana': 'gh', 'Panama': 'pa'
}

function Matches({ user }) {
  const { group } = useParams()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/matches/${group}`)
      .then(res => res.json())
      .then(data => {
        setMatches(data)
        setLoading(false)
      })
  }, [group])

  const refreshMatches = async () => {
    const res = await fetch(`${API_URL}/matches/${group}`)
    const data = await res.json()
    setMatches(data)
  }

  const handleScoreSubmit = async (matchId, score1, score2) => {
    const token = localStorage.getItem('token')
    await fetch(`${API_URL}/results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ matchId, score1: parseInt(score1), score2: parseInt(score2) })
    })
    await refreshMatches()
  }

  const handleScoreUpdate = async (matchId, score1, score2) => {
    const token = localStorage.getItem('token')
    await fetch(`${API_URL}/results`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ matchId, score1: parseInt(score1), score2: parseInt(score2) })
    })
    await refreshMatches()
  }

  const handleDelete = async (matchId) => {
    if (!confirm('Segur que vols eliminar el resultat?')) return
    const token = localStorage.getItem('token')
    await fetch(`${API_URL}/results/${matchId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    await refreshMatches()
  }

  if (loading) return <p style={{ textAlign: 'center' }}>Carregant...</p>

  const isMatchPassed = (match) => {
    const matchDateTime = new Date(`${match.date}T${match.time || '00:00'}`)
    return matchDateTime < new Date()
  }

  return (
    <div className="matches-container">
      <div className="matches-header">
        <h2>Partits Grup {group}</h2>
        <Link to="/">
          <button className="back-btn">← Tornar</button>
        </Link>
      </div>

      {matches.map(match => {
        const userResult = user && match.userResults?.[getUserId(match, user)]
        const matchPassed = isMatchPassed(match)
        return (
          <div key={match.id} className="match-card">
            <h3>{match.date} - {match.time}{matchPassed && <span className="match-passed"> (Finalitzat)</span>}</h3>
            <div className="teams">
              <span className="team">
                <img src={`https://flagcdn.com/24x18/${countryCodes[match.team1] || 'un'}.png`} alt={match.team1} className="team-flag" />
                {match.team1}
              </span>
              <span className="vs">VS</span>
              <span className="team">
                <img src={`https://flagcdn.com/24x18/${countryCodes[match.team2] || 'un'}.png`} alt={match.team2} className="team-flag" />
                {match.team2}
              </span>
            </div>

            {user ? (
              userResult ? (
                <UserResult
                  result={userResult}
                  matchPassed={matchPassed}
                  onUpdate={(s1, s2) => handleScoreUpdate(match.id, s1, s2)}
                  onDelete={() => handleDelete(match.id)}
                />
              ) : (
                <ScoreInput matchId={match.id} matchPassed={matchPassed} onSubmit={handleScoreSubmit} />
              )
            ) : (
              <div className="login-notice">
                Inicia sessió per apuntar resultats
              </div>
            )}

            {match.userResults && Object.keys(match.userResults).length > 0 && (
              <div className="results-section">
                <h4>Resultats apuntats:</h4>
                {Object.entries(match.userResults).map(([uid, result]) => (
                  <div key={uid} className="result-item">
                    <span className="username">{result.username}</span>
                    <span>{result.score1} - {result.score2}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function getUserId(match, username) {
  return Object.keys(match.userResults || {}).find(
    uid => match.userResults[uid].username === username
  ) || null
}

function UserResult({ result, matchPassed, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [score1, setScore1] = useState(result.score1)
  const [score2, setScore2] = useState(result.score2)

  const handleSave = () => {
    onUpdate(score1, score2)
    setEditing(false)
  }

  const handleCancel = () => {
    setScore1(result.score1)
    setScore2(result.score2)
    setEditing(false)
  }

  return (
    <div className="user-result">
      <div className="score-input">
        {editing ? (
          <>
            <input
              type="number"
              min="0"
              value={score1}
              onChange={e => setScore1(parseInt(e.target.value) || 0)}
              disabled={matchPassed}
            />
            <span>-</span>
            <input
              type="number"
              min="0"
              value={score2}
              onChange={e => setScore2(parseInt(e.target.value) || 0)}
              disabled={matchPassed}
            />
            <button className="btn btn-primary" onClick={handleSave}>Guardar</button>
            <button className="btn btn-outline" onClick={handleCancel}>Cancel·lar</button>
          </>
        ) : (
          <>
            <span className="your-result">El teu resultat: <strong>{result.score1} - {result.score2}</strong></span>
            <button className="btn btn-outline" onClick={() => setEditing(true)} disabled={matchPassed}>Modificar</button>
            <button className="btn btn-secondary" onClick={onDelete} disabled={matchPassed}>Eliminar</button>
          </>
        )}
      </div>
    </div>
  )
}

function ScoreInput({ matchId, matchPassed, onSubmit }) {
  const [score1, setScore1] = useState('')
  const [score2, setScore2] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (score1 !== '' && score2 !== '') {
      onSubmit(matchId, score1, score2)
      setScore1('')
      setScore2('')
    }
  }

  return matchPassed ? (
    <div className="login-notice">Partit finalitzat - no es poden afegir resultats</div>
  ) : (
    <form className="score-input" onSubmit={handleSubmit}>
      <input
        type="number"
        min="0"
        placeholder="0"
        value={score1}
        onChange={e => setScore1(e.target.value)}
      />
      <span>-</span>
      <input
        type="number"
        min="0"
        placeholder="0"
        value={score2}
        onChange={e => setScore2(e.target.value)}
      />
      <button type="submit" className="btn btn-primary">Guardar</button>
    </form>
  )
}

export default Matches