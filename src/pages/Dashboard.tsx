import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const rol = user.groups?.[0] ?? 'Sin rol'

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0F6FF' }}>

      {/* Navbar */}
      <div style={{ background: '#0003B8', padding: '0 32px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#00A896', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '13px' }}>
            HL
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '18px' }}>HistoLink</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#CCFAF4', fontSize: '14px' }}>{user.first_name} {user.last_name}</span>
          <button onClick={handleLogout} style={{ background: 'transparent', border: '1.5px solid #B3D4FF', color: 'white', padding: '6px 14px', fontSize: '13px' }}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ padding: '32px' }}>

        {/* Bienvenida */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '22px', color: '#0003B8', fontWeight: 700 }}>
            Bienvenido, {user.first_name} {user.last_name}
          </h1>
          <span style={{ display: 'inline-block', marginTop: '6px', background: '#CCFAF4', color: '#00A896', padding: '3px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
            {rol}
          </span>
        </div>

        {/* Tarjetas de módulos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {[
            { titulo: 'Pacientes', desc: 'Registro y búsqueda', color: '#0080FF' },
            { titulo: 'Historial Clínico', desc: 'Consultas y diagnósticos', color: '#00A896' },
            { titulo: 'Documentos', desc: 'Gestión documental', color: '#0003B8' },
            { titulo: 'Agenda', desc: 'Citas y turnos', color: '#B3D4FF' },
          ].map((mod) => (
            <div key={mod.titulo} style={{ background: 'white', borderRadius: '12px', padding: '20px', borderTop: `4px solid ${mod.color}`, boxShadow: '0 2px 8px rgba(0,3,184,0.06)', cursor: 'pointer' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0003B8', marginBottom: '6px' }}>{mod.titulo}</h3>
              <p style={{ fontSize: '13px', color: '#888' }}>{mod.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}