import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/axiosConfig'
import { useAuth } from '../hooks/useAuth'
import type { AuthUser } from '../services/authService'

const MODULOS = [
  { titulo: 'Pacientes',  desc: 'Registro, búsqueda y expedientes',  icon: '👥', color: '#0003B8', ruta: '/pacientes' },
  { titulo: 'Historial',  desc: 'Consultas y diagnósticos previos',   icon: '📋', color: '#00A896', ruta: '/historial', soon: true },
  { titulo: 'Documentos', desc: 'Gestión documental clínica',         icon: '📄', color: '#0080FF', ruta: '/documentos', soon: true },
  { titulo: 'Agenda',     desc: 'Citas y turnos programados',         icon: '📅', color: '#5C6BC0', ruta: '/agenda',     soon: true },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, setUser } = useAuth()

  useEffect(() => {
    api
      .get<AuthUser>('auth/profile/')
      .then((res) => {
        setUser(res.data)
        localStorage.setItem('user', JSON.stringify(res.data))
      })
      .catch((err) => {
        console.log('Error profile:', err.response?.status, err.response?.data)
      })
  }, [setUser])

  if (!user) {
    return (
      <div style={{ padding: '40px', color: '#0003B8', fontWeight: 600 }}>Cargando...</div>
    )
  }

  const rol = user.groups?.[0] ?? 'Sin rol'

  return (
    <div style={{ padding: '32px' }}>

      {/* Saludo */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{ color: '#0080FF', fontSize: '14px', fontWeight: 600, margin: '0 0 4px 0' }}>
          Bienvenido de vuelta
        </p>
        <h1 style={{ fontSize: '26px', color: '#0003B8', fontWeight: 700, margin: '0 0 8px 0' }}>
          {user.first_name} {user.last_name}
        </h1>
        <span style={{
          display: 'inline-block',
          background: '#CCFAF4', color: '#00A896',
          padding: '4px 14px', borderRadius: '20px',
          fontSize: '13px', fontWeight: 600,
        }}>
          {rol}
        </span>
      </div>

      {/* Módulos */}
      <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#0003B8', marginBottom: '16px', opacity: 0.7 }}>
        MÓDULOS DISPONIBLES
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
        {MODULOS.map(mod => (
          <div
            key={mod.titulo}
            onClick={() => navigate(mod.ruta)}
            style={{
              background: 'white',
              borderRadius: '14px',
              padding: '22px 20px',
              borderTop: `4px solid ${mod.color}`,
              boxShadow: '0 2px 10px rgba(0,3,184,0.07)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'box-shadow 0.15s',
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>{mod.icon}</div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0003B8', margin: '0 0 4px 0' }}>
              {mod.titulo}
            </h3>
            <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>{mod.desc}</p>
            {mod.soon && (
              <span style={{
                position: 'absolute', top: '12px', right: '12px',
                background: '#F0F6FF', color: '#B3D4FF',
                fontSize: '10px', fontWeight: 700, padding: '2px 8px',
                borderRadius: '8px', border: '1px solid #B3D4FF',
              }}>
                Pronto
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
