type Props = {
  messages: string[]
}

export default function ErrorAlert({ messages }: Props) {
  if (!messages.length) return null
  return (
    <div
      role="alert"
      style={{
        marginBottom: '16px',
        padding: '12px 14px',
        borderRadius: '8px',
        background: '#FFEBEE',
        border: '1px solid #E53935',
        color: '#B71C1C',
        fontSize: '14px',
      }}
    >
      <strong style={{ display: 'block', marginBottom: '6px' }}>No se pudo guardar</strong>
      <ul style={{ margin: 0, paddingLeft: '18px' }}>
        {messages.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
    </div>
  )
}
