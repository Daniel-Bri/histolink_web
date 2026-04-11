interface AlertErrorProps {
  message: string
  onDismiss?: () => void
}

export default function AlertError({ message, onDismiss }: AlertErrorProps) {
  if (!message) return null

  return (
    <div
      role="alert"
      style={{
        background: '#FFEBEE',
        border: '1px solid #E57373',
        color: '#C62828',
        padding: '12px 14px',
        borderRadius: '8px',
        fontSize: '13px',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '12px',
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#C62828',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: 1,
            padding: '0 4px',
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}
