import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [username, setUsername]           = useState('')
  const [password, setPassword]           = useState('')
  const [error, setError]                 = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [loading, setLoading]             = useState(false)
  const navigate                          = useNavigate()
  const { login, isAuthenticated }        = useAuth()
  const passwordRef                       = useRef<HTMLInputElement>(null)
  const usernameRef                       = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  // Auto-foco en usuario al cargar
  useEffect(() => { usernameRef.current?.focus() }, [])

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Completa usuario y contraseña.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await login(username, password)
      navigate('/dashboard', { replace: true })
    } catch {
      setError('Usuario o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F6FF' }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '40px', width: '360px', boxShadow: '0 4px 24px rgba(0,3,184,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
          <div style={{ background: '#00A896', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '14px' }}>
            HL
          </div>
          <span style={{ fontWeight: 700, fontSize: '20px', color: '#0003B8' }}>HistoLink</span>
        </div>

        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px', color: '#0003B8' }}>Iniciar sesión</h2>
        <p style={{ fontSize: '13px', color: '#888', marginBottom: '24px' }}>Sistema de gestión clínica</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            ref={usernameRef}
            placeholder="Usuario"
            value={username}
            onChange={e => setUsername(e.target.value)}
            // Enter en usuario mueve el foco al campo contraseña
            onKeyDown={e => e.key === 'Enter' && passwordRef.current?.focus()}
            disabled={loading}
          />
          <div style={{ position: 'relative' }}>
            <input
              ref={passwordRef}
              placeholder="Contraseña"
              type={mostrarPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              // Enter en contraseña o Ctrl+S desde cualquier campo → ingresar
              onKeyDown={e => (e.key === 'Enter' || ((e.ctrlKey || e.metaKey) && e.key === 's')) && void handleLogin()}
              style={{ width: '100%', paddingRight: '40px', boxSizing: 'border-box' }}
              disabled={loading}
            />
            <button
              onClick={() => setMostrarPassword(!mostrarPassword)}
              tabIndex={-1}
              style={{
                position: 'absolute', right: '10px', top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              {mostrarPassword ? <Eye size={18} color="#888" /> : <EyeOff size={18} color="#888" />}
            </button>
          </div>

          {error && <p style={{ color: '#E53935', fontSize: '13px', margin: 0 }}>{error}</p>}

          <button
            onClick={() => void handleLogin()}
            disabled={loading}
            style={{ marginTop: '4px', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Ingresando...' : 'Entrar'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '11px', color: '#aaa', margin: 0 }}>
            Enter en usuario → pasa a contraseña · Enter o Ctrl+S → ingresar
          </p>

          <div style={{ textAlign: 'center', marginTop: '4px' }}>
            <Link to="/olvidar-password" style={{ fontSize: '13px', color: '#0023B8', textDecoration: 'none', opacity: 0.8 }}>
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
