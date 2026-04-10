import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) navigate('/dashboard')
  }, [])

  const handleLogin = async () => {
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/auth/login/', { username, password })
      localStorage.setItem('access_token', res.data.access)
      localStorage.setItem('refresh_token', res.data.refresh)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/dashboard')
    } catch {
      setError('Usuario o contraseña incorrectos')
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
            placeholder="Usuario"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <div style={{ position: 'relative' }}>
            <input
              placeholder="Contraseña"
              type={mostrarPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ width: '100%', paddingRight: '40px', boxSizing: 'border-box' }}
            />
            <button
              onClick={() => setMostrarPassword(!mostrarPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {mostrarPassword ? <Eye size={18} color="#888" /> : <EyeOff size={18} color="#888" />}
            </button>
          </div>
          {error && <p style={{ color: '#E53935', fontSize: '13px' }}>{error}</p>}
          <button onClick={handleLogin} style={{ marginTop: '4px' }}>Entrar</button>
        </div>
      </div>
    </div>
  )
}