import InputField from './InputField'

type Props = {
  label: string
  value: string
  error?: string
  showError?: boolean
  onValueChange: (value: string) => void
  onFieldBlur?: () => void
  required?: boolean
}

export default function DatePickerField({
  label,
  value,
  error,
  showError,
  onValueChange,
  onFieldBlur,
  required,
}: Props) {
  return (
    <InputField
      label={label}
      type="date"
      value={value}
      required={required}
      error={error}
      showError={showError}
      onValueChange={onValueChange}
      onFieldBlur={onFieldBlur}
    />
  )
}
