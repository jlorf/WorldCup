import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../App'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (res.ok) {
        onLogin(data.token, data.username)
        navigate('/')
      } else {
        setError(data.error)
      }
    } catch {
      setError('Error de connexió')
    }
  }

  return (
    <div className="form-container">
      <h2>Iniciar Sessió</h2>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Usuari</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Contrasenya</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">Entrar</button>
      </form>
      <p>No tens compte? <a onClick={() => navigate('/register')}>Registra't</a></p>
    </div>
  )
}

export default Login