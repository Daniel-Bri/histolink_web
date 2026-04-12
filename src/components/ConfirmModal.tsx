interface ConfirmModalProps {
  open: boolean
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  title = 'Confirmar',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  loading,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,3,184,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={loading ? undefined : onCancel}
    >
      <div
        role="dialog"
        aria-modal
        aria-labelledby="confirm-modal-title"
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 8px 32px rgba(0,3,184,0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-modal-title" style={{ fontSize: '17px', color: '#0003B8', marginBottom: '12px', fontWeight: 700 }}>
          {title}
        </h2>
        <p style={{ fontSize: '14px', color: '#444', marginBottom: '20px', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} disabled={loading} style={{ padding: '8px 16px', fontSize: '13px' }}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              background: '#E53935',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            {loading ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
