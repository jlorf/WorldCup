import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../App'

function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Les contrasenyes no coincideixen')
      return
    }
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (res.ok) {
        alert('Registre complet! Ara pots iniciar sessió.')
        navigate('/login')
      } else {
        setError(data.error)
      }
    } catch {
      setError('Error de connexió')
    }
  }

  return (
    <div className="form-container">
      <h2>Registrar-se</h2>
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
        <div className="form-group">
          <label>Confirmar Contrasenya</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">Crear compte</button>
      </form>
      <p>Ja tens compte? <a onClick={() => navigate('/login')}>Inicia sessió</a></p>
    </div>
  )
}

export default Register