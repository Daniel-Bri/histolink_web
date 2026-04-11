import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

interface User {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  groups: string[]
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Primero cargamos del localStorage para mostrar algo inmediato
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))

    // Luego intentamos refrescar desde el backend
    api.get('/api/auth/profile/')
      .then(res => {
        setUser(res.data)
        localStorage.setItem('user', JSON.stringify(res.data))
      })
      .catch((err) => {
        // Solo logueamos el error, no redirigimos
        console.log('Error profile:', err.response?.status, err.response?.data)
      })
  }, [])

  const handleLogout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token')
      await api.post('/api/auth/logout/', { refresh })
    } catch {
      console.log('Error al cerrar sesión')
    } finally {
      localStorage.clear()
      navigate('/login')
    }
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F6FF' }}>
        <p style={{ color: '#0003B8', fontWeight: 600 }}>Cargando...</p>
      </div>
    )
  }

  const rol = user.groups?.[0] ?? 'Sin rol'

  return (
    <div style={{ minHeight: '100vh', background: '#F0F6FF' }}>

      {/* Navbar */}
      <div style={{ background: '#0003B8', padding: '10px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#00A896', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '13px' }}>
            HL
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '18px' }}>HistoLink</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
          <span style={{ color: '#CCFAF4', fontSize: '13px' }}>{user.first_name} {user.last_name}</span>
          <button onClick={handleLogout} style={{ background: 'transparent', border: '1.5px solid #B3D4FF', color: 'white', padding: '5px 14px', fontSize: '13px' }}>
            Cerrar sesión
          </button>
          <button onClick={() => navigate('/cambiar-password')} style={{ background: 'transparent', border: '1.5px solid #B3D4FF', color: 'white', padding: '5px 14px', fontSize: '13px' }}>
            Cambiar contraseña
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ padding: '32px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '22px', color: '#0003B8', fontWeight: 700 }}>
            Bienvenido, {user.first_name} {user.last_name}
          </h1>
          <span style={{ display: 'inline-block', marginTop: '6px', background: '#CCFAF4', color: '#00A896', padding: '3px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
            {rol}
          </span>
        </div>

        {/* Tarjetas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {[
            { titulo: 'Pacientes', desc: 'Registro y búsqueda', color: '#0080FF', ruta: '/pacientes' },
            { titulo: 'Historial Clínico', desc: 'Consultas y diagnósticos', color: '#00A896', ruta: '/historial' },
            { titulo: 'Documentos', desc: 'Gestión documental', color: '#0003B8', ruta: '/documentos' },
            { titulo: 'Agenda', desc: 'Citas y turnos', color: '#B3D4FF', ruta: '/agenda' },
          ].map((mod) => (
            <div
              key={mod.titulo}
              onClick={() => navigate(mod.ruta)}
              style={{ background: 'white', borderRadius: '12px', padding: '20px', borderTop: `4px solid ${mod.color}`, boxShadow: '0 2px 8px rgba(0,3,184,0.06)', cursor: 'pointer' }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0003B8', marginBottom: '6px' }}>{mod.titulo}</h3>
              <p style={{ fontSize: '13px', color: '#888' }}>{mod.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}