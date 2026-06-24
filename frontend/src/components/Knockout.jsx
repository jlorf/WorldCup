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

const roundColors = {
  'R32': '#3498db',
  'R16': '#2ecc71',
  'QF': '#f39c12',
  'SF': '#e74c3c',
  '3rd': '#9b59b6',
  'F': '#ffd700'
}

const BRACKET_LEFT_R32 = [74, 77, 73, 75, 83, 84, 81, 82]
const BRACKET_LEFT_R16 = [89, 90, 93, 94]
const BRACKET_LEFT_QF = [97, 98]
const BRACKET_LEFT_SF = [101]

const BRACKET_RIGHT_R32 = [76, 78, 79, 80, 86, 88, 85, 87]
const BRACKET_RIGHT_R16 = [91, 92, 95, 96]
const BRACKET_RIGHT_QF = [99, 100]
const BRACKET_RIGHT_SF = [102]

function getRoundLabel(roundId) {
  const labels = { 'R32': 'Setzens', 'R16': 'Vuitens', 'QF': 'Quarts', 'SF': 'Semis', '3rd': '3r lloc', 'F': 'Final' }
  return labels[roundId] || roundId
}

function getRoundLabelFull(roundId) {
  const labels = { 'R32': 'Setzens de final', 'R16': 'Vuitens de final', 'QF': 'Quarts de final', 'SF': 'Semifinal', '3rd': 'Tercer lloc', 'F': 'FINAL' }
  return labels[roundId] || roundId
}

function Knockout({ user }) {
  const [rounds, setRounds] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedMatch, setExpandedMatch] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/knockout/rounds`)
      .then(res => res.json())
      .then(data => {
        setRounds(data)
        setLoading(false)
      })
  }, [])

  const refreshRounds = async () => {
    const res = await fetch(`${API_URL}/knockout/rounds`)
    const data = await res.json()
    setRounds(data)
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
    await refreshRounds()
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
    await refreshRounds()
  }

  const handleDelete = async (matchId) => {
    if (!confirm('Segur que vols eliminar el resultat?')) return
    const token = localStorage.getItem('token')
    await fetch(`${API_URL}/results/${matchId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    await refreshRounds()
  }

  if (loading) return <p style={{ textAlign: 'center' }}>Carregant...</p>

  const allMatches = {}
  rounds.forEach(round => {
    round.matches.forEach(m => {
      allMatches[m.id] = { ...m, roundId: round.id, roundName: round.name }
    })
  })

  function getNextMatch(matchId) {
    return Object.values(allMatches).find(
      m => m.team1 === `W${matchId}` || m.team2 === `W${matchId}` || m.team1 === `L${matchId}` || m.team2 === `L${matchId}`
    ) || null
  }

  function getNextMatchLabel(matchId, side) {
    const next = getNextMatch(matchId)
    if (!next) return null
    const isLoser = next.team1 === `L${matchId}` || next.team2 === `L${matchId}`
    const prefix = isLoser ? 'Perdedor' : 'Guanyador'
    const round = getRoundLabel(next.roundId)
    const arrow = side === 'right' ? '←' : '→'
    return `${prefix} ${arrow} ${round} #${next.id}`
  }

  const isMatchPassed = (match) => {
    const matchDateTime = new Date(`${match.date}T${match.time || '00:00'}`)
    return matchDateTime < new Date()
  }

  const getUserId = (match, username) => {
    return Object.keys(match.userResults || {}).find(
      uid => match.userResults[uid].username === username
    ) || null
  }

  const bracketLeft = {
    r32: BRACKET_LEFT_R32.map(id => allMatches[id]).filter(Boolean),
    r16: BRACKET_LEFT_R16.map(id => allMatches[id]).filter(Boolean),
    qf: BRACKET_LEFT_QF.map(id => allMatches[id]).filter(Boolean),
    sf: BRACKET_LEFT_SF.map(id => allMatches[id]).filter(Boolean),
  }

  const bracketRight = {
    r32: BRACKET_RIGHT_R32.map(id => allMatches[id]).filter(Boolean),
    r16: BRACKET_RIGHT_R16.map(id => allMatches[id]).filter(Boolean),
    qf: BRACKET_RIGHT_QF.map(id => allMatches[id]).filter(Boolean),
    sf: BRACKET_RIGHT_SF.map(id => allMatches[id]).filter(Boolean),
  }

  const finalMatch = allMatches[104]
  const thirdMatch = allMatches[103]

  return (
    <div className="knockout-container">
      <div className="knockout-header">
        <h2>Eliminatòries</h2>
        <Link to="/">
          <button className="back-btn">← Tornar</button>
        </Link>
      </div>

      <div className="bracket-layout">
        <BracketSide
          data={bracketLeft}
          side="left"
          user={user}
          expandedMatch={expandedMatch}
          setExpandedMatch={setExpandedMatch}
          getNextMatchLabel={getNextMatchLabel}
          isMatchPassed={isMatchPassed}
          getUserId={getUserId}
          handleScoreSubmit={handleScoreSubmit}
          handleScoreUpdate={handleScoreUpdate}
          handleDelete={handleDelete}
        />

        <div className="bracket-center">
          {finalMatch && (
            <CenterMatchCard
              match={finalMatch}
              icon="🏆"
              user={user}
              expandedMatch={expandedMatch}
              setExpandedMatch={setExpandedMatch}
              getNextMatchLabel={getNextMatchLabel}
              isMatchPassed={isMatchPassed}
              getUserId={getUserId}
              handleScoreSubmit={handleScoreSubmit}
              handleScoreUpdate={handleScoreUpdate}
              handleDelete={handleDelete}
            />
          )}
          {thirdMatch && (
            <CenterMatchCard
              match={thirdMatch}
              icon="🥉"
              user={user}
              expandedMatch={expandedMatch}
              setExpandedMatch={setExpandedMatch}
              getNextMatchLabel={getNextMatchLabel}
              isMatchPassed={isMatchPassed}
              getUserId={getUserId}
              handleScoreSubmit={handleScoreSubmit}
              handleScoreUpdate={handleScoreUpdate}
              handleDelete={handleDelete}
            />
          )}
        </div>

        <BracketSide
          data={bracketRight}
          side="right"
          user={user}
          expandedMatch={expandedMatch}
          setExpandedMatch={setExpandedMatch}
          getNextMatchLabel={getNextMatchLabel}
          isMatchPassed={isMatchPassed}
          getUserId={getUserId}
          handleScoreSubmit={handleScoreSubmit}
          handleScoreUpdate={handleScoreUpdate}
          handleDelete={handleDelete}
        />
      </div>
    </div>
  )
}

function BracketSide({ data, side, user, expandedMatch, setExpandedMatch, getNextMatchLabel, isMatchPassed, getUserId, handleScoreSubmit, handleScoreUpdate, handleDelete }) {
  if (!data.r32.length) return null

  const isReversed = side === 'right'

  const R32_ROW_STARTS = [1, 3, 5, 7, 9, 11, 13, 15]
  const R16_ROW_STARTS = [1, 5, 9, 13]
  const QF_ROW_STARTS = [1, 9]
  const SF_ROW_START = [1]

  const colR32 = isReversed ? 4 : 1
  const colR16 = isReversed ? 3 : 2
  const colQF = isReversed ? 2 : 3
  const colSF = isReversed ? 1 : 4

  const label = (matchId) => getNextMatchLabel(matchId, side)

  const headers = isReversed
    ? [
        { name: 'Semifinals', id: 'SF' },
        { name: 'Quarts', id: 'QF' },
        { name: 'Vuitens', id: 'R16' },
        { name: 'Setzens', id: 'R32' }
      ]
    : [
        { name: 'Setzens', id: 'R32' },
        { name: 'Vuitens', id: 'R16' },
        { name: 'Quarts', id: 'QF' },
        { name: 'Semifinals', id: 'SF' }
      ]

  return (
    <div className={`bracket-side ${isReversed ? 'side-reversed' : ''}`}>
      <div className="bracket-side-header">
        {headers.map(h => (
          <span key={h.id} className="bracket-col-label" style={{ '--h-color': roundColors[h.id] }}>
            {h.name}
          </span>
        ))}
      </div>
      <div className="bracket-grid">
        {data.r32.map((match, i) => (
          <div key={match.id} className="bracket-grid-cell" style={{ gridRow: `${R32_ROW_STARTS[i]} / span 2`, gridColumn: String(colR32) }}>
            <MatchCardSmall
              match={match}
              roundId="R32"
              matchIndex={i}
              user={user}
              expandedMatch={expandedMatch}
              setExpandedMatch={setExpandedMatch}
              nextLabel={label(match.id)}
              isMatchPassed={isMatchPassed}
              getUserId={getUserId}
              handleScoreSubmit={handleScoreSubmit}
              handleScoreUpdate={handleScoreUpdate}
              handleDelete={handleDelete}
            />
          </div>
        ))}
        {data.r16.map((match, i) => (
          <div key={match.id} className="bracket-grid-cell" style={{ gridRow: `${R16_ROW_STARTS[i]} / span 4`, gridColumn: String(colR16) }}>
            <MatchCardSmall
              match={match}
              roundId="R16"
              matchIndex={i}
              user={user}
              expandedMatch={expandedMatch}
              setExpandedMatch={setExpandedMatch}
              nextLabel={label(match.id)}
              isMatchPassed={isMatchPassed}
              getUserId={getUserId}
              handleScoreSubmit={handleScoreSubmit}
              handleScoreUpdate={handleScoreUpdate}
              handleDelete={handleDelete}
            />
          </div>
        ))}
        {data.qf.map((match, i) => (
          <div key={match.id} className="bracket-grid-cell" style={{ gridRow: `${QF_ROW_STARTS[i]} / span 8`, gridColumn: String(colQF) }}>
            <MatchCardSmall
              match={match}
              roundId="QF"
              matchIndex={i}
              user={user}
              expandedMatch={expandedMatch}
              setExpandedMatch={setExpandedMatch}
              nextLabel={label(match.id)}
              isMatchPassed={isMatchPassed}
              getUserId={getUserId}
              handleScoreSubmit={handleScoreSubmit}
              handleScoreUpdate={handleScoreUpdate}
              handleDelete={handleDelete}
            />
          </div>
        ))}
        {data.sf.map((match, i) => (
          <div key={match.id} className="bracket-grid-cell" style={{ gridRow: `${SF_ROW_START[i]} / span 16`, gridColumn: String(colSF) }}>
            <MatchCardSmall
              match={match}
              roundId="SF"
              matchIndex={i}
              user={user}
              expandedMatch={expandedMatch}
              setExpandedMatch={setExpandedMatch}
              nextLabel={label(match.id)}
              isMatchPassed={isMatchPassed}
              getUserId={getUserId}
              handleScoreSubmit={handleScoreSubmit}
              handleScoreUpdate={handleScoreUpdate}
              handleDelete={handleDelete}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function MatchCardSmall({ match, roundId, user, expandedMatch, setExpandedMatch, nextLabel, isMatchPassed, getUserId, handleScoreSubmit, handleScoreUpdate, handleDelete }) {
  const userResult = user && match.userResults?.[getUserId(match, user)]
  const matchPassed = isMatchPassed(match)
  const isExpanded = expandedMatch === match.id
  const color = roundColors[roundId] || '#ffd700'

  const team1Display = match.team1.startsWith('W') ? `Guanyador #${match.team1.slice(1)}`
    : match.team1.startsWith('L') ? `Perdedor #${match.team1.slice(1)}`
    : match.team1

  const team2Display = match.team2.startsWith('W') ? `Guanyador #${match.team2.slice(1)}`
    : match.team2.startsWith('L') ? `Perdedor #${match.team2.slice(1)}`
    : match.team2

  const showTeam1 = countryCodes[match.team1];
  const showTeam2 = countryCodes[match.team2];

  return (
    <div className="bracket-card-wrap">
      <div
        className={`bracket-card ${match.actualResult ? 'has-result' : ''} ${isExpanded ? 'is-expanded' : ''}`}
        style={{ '--card-color': color }}
      >
        <div className="bracket-card-teams">
          <div className={`bracket-card-team ${match.actualResult && match.actualResult.score1 > match.actualResult.score2 ? 'winner' : ''}`}>
            {showTeam1 ? (
              <img src={`https://flagcdn.com/20x15/${countryCodes[match.team1]}.png`} alt="" className="card-flag" />
            ) : (
              <span className="card-flag-placeholder">⚡</span>
            )}
            <span className="card-team-name" title={team1Display}>{match.team1.startsWith('W') || match.team1.startsWith('L') ? team1Display : match.team1}</span>
            <span className="card-score">
              {match.actualResult ? match.actualResult.score1 : (userResult?.score1 ?? '')}
            </span>
          </div>
          <div className={`bracket-card-team ${match.actualResult && match.actualResult.score2 > match.actualResult.score1 ? 'winner' : ''}`}>
            {showTeam2 ? (
              <img src={`https://flagcdn.com/20x15/${countryCodes[match.team2]}.png`} alt="" className="card-flag" />
            ) : (
              <span className="card-flag-placeholder">⚡</span>
            )}
            <span className="card-team-name" title={team2Display}>{match.team2.startsWith('W') || match.team2.startsWith('L') ? team2Display : match.team2}</span>
            <span className="card-score">
              {match.actualResult ? match.actualResult.score2 : (userResult?.score2 ?? '')}
            </span>
          </div>
        </div>

        <div className="card-footer">
          <span className="card-date">{match.date}</span>
          {matchPassed && <span className="card-passed">Fet</span>}
          {nextLabel && <span className="card-next">{nextLabel}</span>}
        </div>

        {user && !matchPassed && (
          <button
            className={`card-predict-btn ${userResult ? 'btn-outline' : 'btn-primary'} btn-sm`}
            onClick={() => setExpandedMatch(isExpanded ? null : match.id)}
          >
            {userResult ? 'Modif' : 'Prono'}
          </button>
        )}

        {userResult && matchPassed && (
          <div className="card-prediction">
            <strong>{userResult.score1} - {userResult.score2}</strong>
          </div>
        )}
      </div>

      {match.actualResult && match.actualResult.score1 !== undefined && (
        <div className="card-actual-score">
          {match.actualResult.score1} - {match.actualResult.score2}
        </div>
      )}

      {isExpanded && (
        <div className="bracket-score-form">
          <ScoreForm
            match={match}
            userResult={userResult}
            matchPassed={matchPassed}
            onSubmit={(id, s1, s2) => handleScoreSubmit(id, s1, s2)}
            onUpdate={(id, s1, s2) => handleScoreUpdate(id, s1, s2)}
            onDelete={(id) => handleDelete(id)}
            onClose={() => setExpandedMatch(null)}
          />
        </div>
      )}

      {match.userResults && Object.keys(match.userResults).length > 0 && !isExpanded && (
        <div className="card-others-toggle" onClick={() => setExpandedMatch(isExpanded ? null : match.id)}>
          <span>{Object.keys(match.userResults).length} pronòstics</span>
        </div>
      )}

      {isExpanded && !user && (
        <div className="bracket-score-form">
          <div className="login-notice">Inicia sessió per apuntar resultats</div>
        </div>
      )}
    </div>
  )
}

function CenterMatchCard({ match, icon, user, expandedMatch, setExpandedMatch, getNextMatchLabel, isMatchPassed, getUserId, handleScoreSubmit, handleScoreUpdate, handleDelete }) {
  const userResult = user && match.userResults?.[getUserId(match, user)]
  const matchPassed = isMatchPassed(match)
  const isExpanded = expandedMatch === match.id
  const color = roundColors[match.roundId] || '#ffd700'
  const nextLabel = getNextMatchLabel(match.id)

  const team1Display = match.team1.startsWith('W') ? `Guanyador #${match.team1.slice(1)}`
    : match.team1.startsWith('L') ? `Perdedor #${match.team1.slice(1)}`
    : match.team1

  const team2Display = match.team2.startsWith('W') ? `Guanyador #${match.team2.slice(1)}`
    : match.team2.startsWith('L') ? `Perdedor #${match.team2.slice(1)}`
    : match.team2

  const showTeam1 = countryCodes[match.team1];
  const showTeam2 = countryCodes[match.team2];

  return (
    <div className="center-card-wrap">
      <div className={`center-card ${match.actualResult ? 'has-result' : ''} ${isExpanded ? 'is-expanded' : ''}`} style={{ '--card-color': color }}>
        <div className="center-card-header">
          <span className="center-card-icon">{icon}</span>
          <span className="center-card-round">{getRoundLabelFull(match.roundId)}</span>
        </div>

        <div className="center-card-teams">
          <div className={`center-card-team ${match.actualResult && match.actualResult.score1 > match.actualResult.score2 ? 'winner' : ''}`}>
            {showTeam1 ? (
              <img src={`https://flagcdn.com/28x21/${countryCodes[match.team1]}.png`} alt="" className="card-flag-lg" />
            ) : (
              <span className="card-flag-placeholder-lg">⚡</span>
            )}
            <span className="center-team-name">{team1Display}</span>
            <span className="center-score">{match.actualResult ? match.actualResult.score1 : (userResult?.score1 ?? '')}</span>
          </div>
          <div className="center-card-vs">VS</div>
          <div className={`center-card-team ${match.actualResult && match.actualResult.score2 > match.actualResult.score1 ? 'winner' : ''}`}>
            {showTeam2 ? (
              <img src={`https://flagcdn.com/28x21/${countryCodes[match.team2]}.png`} alt="" className="card-flag-lg" />
            ) : (
              <span className="card-flag-placeholder-lg">⚡</span>
            )}
            <span className="center-team-name">{team2Display}</span>
            <span className="center-score">{match.actualResult ? match.actualResult.score2 : (userResult?.score2 ?? '')}</span>
          </div>
        </div>

        <div className="center-card-info">
          <span>📅 {match.date}</span>
          {match.time && <span>🕐 {match.time}</span>}
          {matchPassed && <span className="card-passed">Finalitzat</span>}
        </div>

        {user && !matchPassed && (
          <div className="center-card-buttons">
            {userResult ? (
              <button className="btn btn-outline btn-sm" onClick={() => setExpandedMatch(isExpanded ? null : match.id)}>
                Modificar pronòstic
              </button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={() => setExpandedMatch(isExpanded ? null : match.id)}>
                Pronosticar
              </button>
            )}
          </div>
        )}

        {userResult && matchPassed && (
          <div className="center-card-prediction">
            <span>El teu pronòstic: <strong>{userResult.score1} - {userResult.score2}</strong></span>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="bracket-score-form">
          <ScoreForm
            match={match}
            userResult={userResult}
            matchPassed={matchPassed}
            onSubmit={(id, s1, s2) => handleScoreSubmit(id, s1, s2)}
            onUpdate={(id, s1, s2) => handleScoreUpdate(id, s1, s2)}
            onDelete={(id) => handleDelete(id)}
            onClose={() => setExpandedMatch(null)}
          />
        </div>
      )}

      {match.userResults && Object.keys(match.userResults).length > 0 && !isExpanded && (
        <div className="card-others-toggle" onClick={() => setExpandedMatch(isExpanded ? null : match.id)}>
          <span>{Object.keys(match.userResults).length} pronòstics</span>
        </div>
      )}

      {isExpanded && !user && (
        <div className="bracket-score-form">
          <div className="login-notice">Inicia sessió per apuntar resultats</div>
        </div>
      )}
    </div>
  )
}

function ScoreForm({ match, userResult, matchPassed, onSubmit, onUpdate, onDelete, onClose }) {
  const [score1, setScore1] = useState(userResult?.score1 ?? '')
  const [score2, setScore2] = useState(userResult?.score2 ?? '')
  const [showAll, setShowAll] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    if (score1 === '' || score2 === '') return
    if (userResult) {
      onUpdate(match.id, score1, score2)
    } else {
      onSubmit(match.id, score1, score2)
    }
    onClose()
  }

  const handleDelete = () => {
    onDelete(match.id)
    onClose()
  }

  const otherResults = match.userResults
    ? Object.entries(match.userResults).filter(([uid]) => !userResult || uid !== Object.keys(match.userResults).find(k => match.userResults[k].username === userResult.username))
    : []

  return (
    <div className="score-form-content">
      <form className="score-input" onSubmit={handleSave}>
        <input
          type="number"
          min="0"
          placeholder="0"
          value={score1}
          onChange={e => setScore1(e.target.value)}
          disabled={matchPassed}
        />
        <span className="separator">-</span>
        <input
          type="number"
          min="0"
          placeholder="0"
          value={score2}
          onChange={e => setScore2(e.target.value)}
          disabled={matchPassed}
        />
        <button type="submit" className="btn btn-primary" disabled={matchPassed}>
          {userResult ? 'Actualitzar' : 'Guardar'}
        </button>
        {userResult && (
          <button type="button" className="btn btn-secondary" onClick={handleDelete} disabled={matchPassed}>
            Eliminar
          </button>
        )}
        <button type="button" className="btn btn-outline" onClick={onClose}>
          Cancel·lar
        </button>
      </form>

      {otherResults.length > 0 && (
        <div className="bracket-others">
          <button className="btn btn-outline btn-sm" onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Amagar' : `Veure ${otherResults.length} pronòstics`}
          </button>
          {showAll && (
            <div className="bracket-others-list">
              {otherResults.map(([uid, r]) => (
                <div key={uid} className="result-item">
                  <span className="username">{r.username}</span>
                  <span>{r.score1} - {r.score2}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Knockout
