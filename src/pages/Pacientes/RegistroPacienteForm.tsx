import { useCallback, useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import DatePickerField from '../../components/ui/DatePickerField'
import ErrorAlert from '../../components/ui/ErrorAlert'
import InputField from '../../components/ui/InputField'
import LoadingButton from '../../components/ui/LoadingButton'
import SelectField from '../../components/ui/SelectField'
import { useForm } from '../../hooks/useForm'
import { crearPaciente, parseDrfErrorResponse } from '../../services/pacienteService'
import type { RegistroPacienteFormValues } from '../../types/paciente.types'
import { REGISTRO_PACIENTE_INITIAL } from '../../types/paciente.types'
import {
  toCreatePayload,
  validateRegistroPacienteAll,
  validateRegistroPacienteField,
} from './RegistroPacienteValidation'

const SEXO_OPTIONS = [
  { value: '', label: 'Seleccione…' },
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
  { value: 'O', label: 'Otro' },
]

type Props = {
  onSuccess: () => void
  onCancel: () => void
}

export default function RegistroPacienteForm({ onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false)

  const validateField = useCallback(
    (field: keyof RegistroPacienteFormValues, vals: RegistroPacienteFormValues) =>
      validateRegistroPacienteField(field, vals),
    [],
  )

  const validateAll = useCallback((vals: RegistroPacienteFormValues) => validateRegistroPacienteAll(vals), [])

  const form = useForm<RegistroPacienteFormValues>({
    initialValues: REGISTRO_PACIENTE_INITIAL,
    validateField,
    validateAll,
  })

  const setField = (name: keyof RegistroPacienteFormValues, raw: string) => {
    if (name === 'ci') {
      const digits = raw.replace(/\D/g, '').slice(0, 10)
      form.setValue(name, digits)
      return
    }
    if (name === 'ci_complemento') {
      const up = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 2)
      form.setValue(name, up)
      return
    }
    if (name === 'telefono') {
      form.setValue(name, raw.replace(/\D/g, '').slice(0, 15))
      return
    }
    if (name === 'nombres' || name === 'apellido_paterno' || name === 'apellido_materno') {
      form.setValue(name, raw.slice(0, 100))
      return
    }
    if (name === 'direccion') {
      form.setValue(name, raw.slice(0, 200))
      return
    }
    form.setValue(name, raw)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.runSubmitValidation()) return

    setLoading(true)
    try {
      await crearPaciente(toCreatePayload(form.values))
      form.reset()
      onSuccess()
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 400) {
        const { fields, general } = parseDrfErrorResponse(err.response.data)
        form.setServerFieldErrors(fields as Partial<Record<keyof RegistroPacienteFormValues, string>>)
        form.setGeneralErrors(general)
        return
      }
      form.setGeneralErrors(['Error de red o del servidor. Intente nuevamente.'])
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    form.reset()
    onCancel()
  }

  const { values, mergedErrors, showFieldError, handleBlur, isValid } = form

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate>
      <ErrorAlert messages={form.nonFieldErrors} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '0 20px',
        }}
      >
        <InputField
          label="CI"
          value={values.ci}
          required
          autoComplete="off"
          inputMode="numeric"
          error={mergedErrors.ci}
          showError={showFieldError('ci')}
          onValueChange={(v) => setField('ci', v)}
          onFieldBlur={() => handleBlur('ci')}
        />
        <InputField
          label="CI complemento"
          value={values.ci_complemento}
          maxLength={2}
          autoComplete="off"
          error={mergedErrors.ci_complemento}
          showError={showFieldError('ci_complemento')}
          onValueChange={(v) => setField('ci_complemento', v)}
          onFieldBlur={() => handleBlur('ci_complemento')}
        />
        <InputField
          label="Nombres"
          value={values.nombres}
          required
          maxLength={100}
          error={mergedErrors.nombres}
          showError={showFieldError('nombres')}
          onValueChange={(v) => setField('nombres', v)}
          onFieldBlur={() => handleBlur('nombres')}
        />
        <InputField
          label="Apellido paterno"
          value={values.apellido_paterno}
          required
          maxLength={100}
          error={mergedErrors.apellido_paterno}
          showError={showFieldError('apellido_paterno')}
          onValueChange={(v) => setField('apellido_paterno', v)}
          onFieldBlur={() => handleBlur('apellido_paterno')}
        />
        <InputField
          label="Apellido materno"
          value={values.apellido_materno}
          maxLength={100}
          error={mergedErrors.apellido_materno}
          showError={showFieldError('apellido_materno')}
          onValueChange={(v) => setField('apellido_materno', v)}
          onFieldBlur={() => handleBlur('apellido_materno')}
        />
        <DatePickerField
          label="Fecha de nacimiento"
          value={values.fecha_nacimiento}
          required
          error={mergedErrors.fecha_nacimiento}
          showError={showFieldError('fecha_nacimiento')}
          onValueChange={(v) => setField('fecha_nacimiento', v)}
          onFieldBlur={() => handleBlur('fecha_nacimiento')}
        />
        <SelectField
          label="Sexo"
          options={SEXO_OPTIONS}
          value={values.sexo}
          required
          error={mergedErrors.sexo}
          showError={showFieldError('sexo')}
          onValueChange={(v) => setField('sexo', v)}
          onFieldBlur={() => handleBlur('sexo')}
        />
        <InputField
          label="Email"
          type="email"
          value={values.email}
          autoComplete="email"
          error={mergedErrors.email}
          showError={showFieldError('email')}
          onValueChange={(v) => setField('email', v)}
          onFieldBlur={() => handleBlur('email')}
        />
        <InputField
          label="Teléfono"
          type="tel"
          value={values.telefono}
          inputMode="numeric"
          error={mergedErrors.telefono}
          showError={showFieldError('telefono')}
          onValueChange={(v) => setField('telefono', v)}
          onFieldBlur={() => handleBlur('telefono')}
        />
        <div style={{ gridColumn: '1 / -1' }}>
          <InputField
            label="Dirección"
            value={values.direccion}
            maxLength={200}
            error={mergedErrors.direccion}
            showError={showFieldError('direccion')}
            onValueChange={(v) => setField('direccion', v)}
            onFieldBlur={() => handleBlur('direccion')}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
        <LoadingButton type="submit" loading={loading} disabled={!isValid}>
          Guardar
        </LoadingButton>
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          style={{
            background: 'transparent',
            color: '#0003B8',
            border: '1.5px solid #B3D4FF',
          }}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
