import type { CSSProperties, SelectHTMLAttributes } from 'react'

export type SelectOption = { value: string; label: string }

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onBlur' | 'onChange'> & {
  label: string
  options: SelectOption[]
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

export default function SelectField({
  label,
  options,
  error,
  showError,
  onValueChange,
  onFieldBlur,
  id,
  value,
  ...rest
}: Props) {
  const inputId = id ?? label.replace(/\s/g, '-').toLowerCase()
  const visible = showError && error

  return (
    <div style={{ marginBottom: '14px' }}>
      <label htmlFor={inputId} style={labelStyle}>
        {label}
      </label>
      <select
        id={inputId}
        {...rest}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onBlur={() => onFieldBlur?.()}
        aria-invalid={Boolean(visible)}
        style={{
          width: '100%',
          padding: '10px 14px',
          border: visible ? '1.5px solid #E53935' : '1.5px solid #B3D4FF',
          borderRadius: '8px',
          fontSize: '15px',
          background: 'white',
          color: '#0003B8',
          outline: 'none',
        }}
      >
        {options.map((o) => (
          <option key={o.value || 'empty'} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {visible ? (
        <p style={{ color: '#E53935', fontSize: '12px', marginTop: '4px' }}>{error}</p>
      ) : null}
    </div>
  )
}
