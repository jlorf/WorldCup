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

function Groups() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/groups`)
      .then(res => res.json())
      .then(data => {
        setGroups(data)
        setLoading(false)
      })
  }, [])

  if (loading) return <p style={{ textAlign: 'center' }}>Carregant...</p>

  return (
    <div className="groups-grid">
      {groups.map(group => (
        <div key={group.id} className="group-card">
          <h2>Grup {group.id}</h2>
          <ul>
            {group.teams.map((team, idx) => (
              <li key={idx}>
                <img
                  src={`https://flagcdn.com/24x18/${countryCodes[team] || 'un'}.png`}
                  alt={team}
                  className="flag-icon"
                />
                {team}
              </li>
            ))}
          </ul>
          <Link to={`/matches/${group.id}`}>
            <button className="btn btn-primary">Veure partits</button>
          </Link>
        </div>
      ))}
    </div>
  )
}

export default Groups