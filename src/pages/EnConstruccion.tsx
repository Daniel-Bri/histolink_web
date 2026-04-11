interface Props {
  titulo?: string
}

export default function EnConstruccion({ titulo = 'Sección' }: Props) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100%', padding: '48px 32px',
    }}>
      <div style={{
        background: 'white', borderRadius: '16px',
        padding: '48px', boxShadow: '0 4px 16px rgba(0,3,184,0.08)',
        textAlign: 'center', maxWidth: '420px', width: '100%',
      }}>
        <div style={{ fontSize: '52px', marginBottom: '16px' }}>🚧</div>
        <h2 style={{ color: '#0003B8', fontWeight: 700, marginBottom: '10px', fontSize: '20px' }}>
          {titulo}
        </h2>
        <p style={{ color: '#888', fontSize: '14px', lineHeight: 1.6 }}>
          Esta sección está en desarrollo y estará disponible próximamente
        </p>
      </div>
    </div>
  )
}
