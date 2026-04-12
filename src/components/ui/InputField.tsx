import type { CSSProperties, InputHTMLAttributes } from 'react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'onBlur' | 'onChange'> & {
  label: string
  error?: string
  showError?: boolean
  onValueChange: (value: string) => void
  onFieldBlur?: () => void
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: '#0003B8',
  marginBottom: '6px',
}

export default function InputField({
  label,
  error,
  showError,
  onValueChange,
  onFieldBlur,
  id,
  ...inputProps
}: Props) {
  const inputId = id ?? label.replace(/\s/g, '-').toLowerCase()
  const visible = showError && error

  return (
    <div style={{ marginBottom: '14px' }}>
      <label htmlFor={inputId} style={labelStyle}>
        {label}
      </label>
      <input
        id={inputId}
        {...inputProps}
        onChange={(e) => onValueChange(e.target.value)}
        onBlur={() => onFieldBlur?.()}
        aria-invalid={Boolean(visible)}
        aria-describedby={visible ? `${inputId}-err` : undefined}
        style={{
          width: '100%',
          ...(inputProps.style as object),
          borderColor: visible ? '#E53935' : undefined,
        }}
      />
      {visible ? (
        <p id={`${inputId}-err`} style={{ color: '#E53935', fontSize: '12px', marginTop: '4px' }}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
