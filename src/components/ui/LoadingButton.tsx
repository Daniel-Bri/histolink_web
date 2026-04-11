import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean
}

export default function LoadingButton({
  loading,
  disabled,
  children,
  type = 'button',
  ...rest
}: Props) {
  return (
    <button type={type} disabled={disabled || loading} {...rest}>
      {loading ? 'Guardando...' : children}
    </button>
  )
}
