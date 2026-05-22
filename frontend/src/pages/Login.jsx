import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch {
      setError('Usuario o contrasena incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-branding">
        <div className="login-brand-icon">
          <img src="/logo-junical.png" alt="Clínica Junical" />
        </div>
      </div>

      <div className="login-form-side">
        <div className="login-form-container">
          <div className="login-form-header">
            <h2>Bienvenido</h2>
            <p>Ingrese sus credenciales para continuar</p>
          </div>

          {error && (
            <div className="login-alert">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="hc-form-group">
              <label className="hc-form-label">Usuario</label>
              <input className="hc-form-input" type="text" placeholder="Ingrese su usuario" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
            </div>
            <div className="hc-form-group">
              <label className="hc-form-label">Contrasena</label>
              <input className="hc-form-input" type="password" placeholder="Ingrese su contrasena" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="hc-btn hc-btn-primary hc-btn-block hc-btn-lg" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
