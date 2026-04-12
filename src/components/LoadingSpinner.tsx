interface LoadingSpinnerProps {
  label?: string
}

export default function LoadingSpinner({ label = 'Cargando…' }: LoadingSpinnerProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '40px',
        color: '#0003B8',
        fontWeight: 600,
        fontSize: '14px',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          border: '3px solid #B3D4FF',
          borderTopColor: '#0003B8',
          borderRadius: '50%',
          animation: 'histolink-spin 0.8s linear infinite',
        }}
      />
      <span>{label}</span>
      <style>{`@keyframes histolink-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
