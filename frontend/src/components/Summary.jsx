import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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

const monthNames = {
  '01': 'gener', '02': 'febrer', '03': 'març', '04': 'abril',
  '05': 'maig', '06': 'juny', '07': 'juliol', '08': 'agost',
  '09': 'setembre', '10': 'octubre', '11': 'novembre', '12': 'desembre'
}

function formatDate(dateStr) {
  const [, month, day] = dateStr.split('-')
  return `${parseInt(day)} de ${monthNames[month]}`
}

function Summary() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedPredictions, setExpandedPredictions] = useState({})
  const [collapsedSections, setCollapsedSections] = useState({})

  useEffect(() => {
    fetch(`${API_URL}/summary`)
      .then(res => res.json())
      .then(data => {
        setMatches(data)
        const dates = [...new Set(data.map(m => m.date))]
        const initialCollapsed = {}
        dates.forEach(d => { initialCollapsed[d] = true })
        setCollapsedSections(initialCollapsed)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const togglePredictions = (id) => {
    setExpandedPredictions(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleSection = (key) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const pad = (n) => String(n).padStart(2, '0')
  const windowStart = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}T08:00`
  const windowEnd = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T08:00`

  const isTodayOrAfter = (date) => date >= now.toISOString().split('T')[0]

  const recentMatches = matches
    .filter(m => `${m.date}T${m.time}` >= windowStart && `${m.date}T${m.time}` < windowEnd)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

  const otherMatches = matches
    .filter(m => `${m.date}T${m.time}` < windowStart || `${m.date}T${m.time}` >= windowEnd)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

  const groupedByDate = {}
  otherMatches.forEach(m => {
    if (!groupedByDate[m.date]) groupedByDate[m.date] = {}
    if (!groupedByDate[m.date][m.group]) groupedByDate[m.date][m.group] = []
    groupedByDate[m.date][m.group].push(m)
  })

  const sortedDates = Object.keys(groupedByDate).sort()

  if (loading) return <p style={{ textAlign: 'center' }}>Carregant...</p>

  return (
    <div className="summary-container">
      <div className="summary-header">
        <h2>Resum de resultats</h2>
        <Link to="/">
          <button className="back-btn">← Tornar</button>
        </Link>
      </div>

      {recentMatches.length > 0 && (
        <section className="summary-section">
          <div className="section-header" onClick={() => toggleSection('recent')}>
            <h3 className="section-title today-title">
              Últims partits
            </h3>
            <span className={`section-arrow ${collapsedSections['recent'] ? 'collapsed' : ''}`}>▼</span>
          </div>
          {!collapsedSections['recent'] && (
            <div className="section-content">
              {recentMatches.map(match => renderMatchCard(match, expandedPredictions, togglePredictions))}
            </div>
          )}
        </section>
      )}

      {sortedDates.map(date => (
        <section key={date} className="summary-section">
          <div className="section-header" onClick={() => toggleSection(date)}>
            <h3 className={`section-title ${isTodayOrAfter(date) ? 'today-title' : ''}`}>
              {formatDate(date)}
            </h3>
            <span className={`section-arrow ${collapsedSections[date] ? 'collapsed' : ''}`}>▼</span>
          </div>
          {!collapsedSections[date] && (
            <div className="section-content">
              {Object.keys(groupedByDate[date]).sort().map(group => (
                <div key={group} className="date-group-section">
                  <h4 className="date-group-title">{group.length <= 2 ? `Grup ${group}` : group}</h4>
                  {groupedByDate[date][group].map(match => renderMatchCard(match, expandedPredictions, togglePredictions))}
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}

function renderMatchCard(match, expandedPredictions, togglePredictions) {
  const hasPredictions = Object.keys(match.userResults || {}).length > 0
  const isExpanded = expandedPredictions[match.id]

  return (
    <div key={match.id} className={`summary-card ${match.actualResult ? 'has-result' : ''}`}>
      <div className="summary-card-header">
        <span className="summary-group">{match.id <= 72 ? `Grup ${match.group}` : match.group}</span>
        <span className="summary-date">{match.date} - {match.time}</span>
      </div>

      <div className="summary-teams">
        <span className="summary-team">
          <img src={`https://flagcdn.com/24x18/${countryCodes[match.team1] || 'un'}.png`} alt={match.team1} className="team-flag" />
          {match.team1}
        </span>

        {match.actualResult ? (
          <span className="summary-score">
            {match.actualResult.score1} - {match.actualResult.score2}
          </span>
        ) : (
          <span className="summary-vs">VS</span>
        )}

        <span className="summary-team">
          <img src={`https://flagcdn.com/24x18/${countryCodes[match.team2] || 'un'}.png`} alt={match.team2} className="team-flag" />
          {match.team2}
        </span>
      </div>

      {hasPredictions && (
        <div className="summary-predictions-toggle">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => togglePredictions(match.id)}
          >
            {isExpanded ? 'Amagar pronòstics' : `Veure pronòstics (${Object.keys(match.userResults).length})`}
          </button>
        </div>
      )}

      {isExpanded && hasPredictions && (
        <div className="summary-predictions">
          {Object.entries(match.userResults).map(([uid, result]) => (
            <div key={uid} className="summary-prediction-item">
              <span className="prediction-user">{result.username}</span>
              <span className="prediction-score">{result.score1} - {result.score2}</span>
              {result.points !== null && result.points !== undefined && (
                <span className={`prediction-points ${result.points === 3 ? 'points-exact' : result.points === 1 ? 'points-draw' : 'points-zero'}`}>
                  {result.points === 3 ? '+3' : result.points === 1 ? '+1' : '+0'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {!hasPredictions && match.actualResult && (
        <div className="summary-no-predictions">Ningú ha apuntat resultat</div>
      )}
    </div>
  )
}

export default Summary
