import { useNavigate } from 'react-router-dom'

interface Props {
  titulo?: string
}

export default function EnConstruccion({ titulo = 'Sección' }: Props) {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: '#F0F6FF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '40px 48px', boxShadow: '0 4px 16px rgba(0,3,184,0.08)', textAlign: 'center', maxWidth: '400px' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚧</div>
        <h2 style={{ color: '#0003B8', fontWeight: 700, marginBottom: '8px' }}>{titulo}</h2>
        <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
          Esta sección está en desarrollo y estará disponible próximamente.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ background: '#0003B8', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer', fontWeight: 600 }}
        >
          Volver al dashboard
        </button>
      </div>
    </div>
  )
}
