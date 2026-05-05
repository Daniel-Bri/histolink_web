import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { crearPaciente, parseDrfErrorResponse } from '../../services/pacienteService'
import { fichaService } from '../../services/fichaService'
import type { PacienteCreatePayload } from '../../types/paciente.types'

interface Props {
  onClose: () => void
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '8px 12px', boxSizing: 'border-box',
  border: '1px solid #B3D4FF', borderRadius: '8px',
  fontSize: '14px', background: '#fff', color: '#1E293B',
  outline: 'none',
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 600,
  color: '#475569', marginBottom: '4px',
}

function generateTempCI(): string {
  return '9' + Date.now().toString().slice(-7)
}

export default function QuickPatientModal({ onClose }: Props) {
  const navigate = useNavigate()

  const [esNN, setEsNN] = useState(false)
  const [form, setForm] = useState({
    ci: '',
    nombre: '',
    apellido: '',
    apellido_materno: '',
    fecha_nacimiento: '',
    genero: 'M' as 'M' | 'F' | 'O',
    telefono: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const handleNNToggle = (checked: boolean) => {
    setEsNN(checked)
    if (checked) {
      setForm(prev => ({
        ...prev,
        ci: generateTempCI(),
        nombre: 'No Identificado',
        apellido: 'NN',
        apellido_materno: '',
        fecha_nacimiento: new Date().toISOString().slice(0, 10),
        genero: 'O',
      }))
    } else {
      setForm(prev => ({ ...prev, ci: '', nombre: '', apellido: '', fecha_nacimiento: '', genero: 'M' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    setGeneralError('')

    const errors: Record<string, string> = {}
    if (!esNN && !/^\d{4,10}$/.test(form.ci)) errors.ci = 'CI debe tener 4-10 dígitos.'
    if (!form.nombre.trim()) errors.nombre = 'Requerido.'
    if (!form.apellido.trim()) errors.apellido = 'Requerido.'
    if (!form.fecha_nacimiento) errors.fecha_nacimiento = 'Requerido.'

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    try {
      const payload: PacienteCreatePayload = {
        ci: form.ci,
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        apellido_materno: form.apellido_materno.trim() || undefined,
        fecha_nacimiento: form.fecha_nacimiento,
        genero: form.genero,
        telefono: form.telefono.trim() || undefined,
      }

      const pacienteRes = await crearPaciente(payload)
      const paciente = pacienteRes.data

      const fichaRes = await fichaService.crear(paciente.id)
      const ficha = fichaRes.data

      navigate(`/urgencias/${ficha.id}/triaje`)
    } catch (err: unknown) {
      const data = (err as { response?: { data?: unknown } })?.response?.data
      if (data) {
        const { fields, general } = parseDrfErrorResponse(data)
        setFieldErrors(fields)
        if (general.length > 0) setGeneralError(general.join(' '))
        else if (Object.keys(fields).length === 0) setGeneralError('Error al registrar. Verifica los datos.')
      } else {
        setGeneralError('Error de conexión.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.45)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px',
        width: '480px', maxWidth: '95vw',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: '#122268', padding: '16px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: '15px', margin: 0 }}>
              Nuevo Ingreso Urgente
            </p>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', margin: '2px 0 0' }}>
              Registro rápido de paciente
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.12)', border: 'none',
              color: '#fff', borderRadius: '8px', padding: '6px 10px',
              cursor: 'pointer', fontSize: '16px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px' }}>
          {/* NN toggle */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '16px', cursor: 'pointer',
            padding: '10px 12px', borderRadius: '8px',
            background: esNN ? '#FEF9C3' : '#F8FAFC',
            border: `1px solid ${esNN ? '#CA8A04' : '#E2E8F0'}`,
          }}>
            <input
              type="checkbox"
              checked={esNN}
              onChange={e => handleNNToggle(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '13px', fontWeight: 600, color: esNN ? '#92400E' : '#475569' }}>
              Paciente no identificado (NN) — emergencia sin identificación
            </span>
          </label>

          {generalError && (
            <div style={{
              background: '#FEE2E2', border: '1px solid #FECACA',
              borderRadius: '8px', padding: '10px 14px',
              color: '#991B1B', fontSize: '13px', marginBottom: '14px',
            }}>
              {generalError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* CI */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LABEL_STYLE}>CI {!esNN && <span style={{ color: '#DC2626' }}>*</span>}</label>
              <input
                style={{ ...INPUT_STYLE, background: esNN ? '#F1F5F9' : '#fff' }}
                value={form.ci}
                onChange={e => set('ci', e.target.value.replace(/\D/g, ''))}
                placeholder={esNN ? 'Generado automáticamente' : 'Cédula de identidad'}
                readOnly={esNN}
                maxLength={10}
              />
              {fieldErrors.ci && <p style={{ color: '#DC2626', fontSize: '11px', margin: '3px 0 0' }}>{fieldErrors.ci}</p>}
            </div>

            {/* Nombres */}
            <div>
              <label style={LABEL_STYLE}>Nombres <span style={{ color: '#DC2626' }}>*</span></label>
              <input
                style={{ ...INPUT_STYLE, background: esNN ? '#F1F5F9' : '#fff' }}
                value={form.nombre}
                onChange={e => set('nombre', e.target.value)}
                placeholder="Nombres"
                readOnly={esNN}
              />
              {fieldErrors.nombre && <p style={{ color: '#DC2626', fontSize: '11px', margin: '3px 0 0' }}>{fieldErrors.nombre}</p>}
            </div>

            {/* Apellido paterno */}
            <div>
              <label style={LABEL_STYLE}>Apellido paterno <span style={{ color: '#DC2626' }}>*</span></label>
              <input
                style={{ ...INPUT_STYLE, background: esNN ? '#F1F5F9' : '#fff' }}
                value={form.apellido}
                onChange={e => set('apellido', e.target.value)}
                placeholder="Apellido paterno"
                readOnly={esNN}
              />
              {fieldErrors.apellido && <p style={{ color: '#DC2626', fontSize: '11px', margin: '3px 0 0' }}>{fieldErrors.apellido}</p>}
            </div>

            {/* Apellido materno */}
            <div>
              <label style={LABEL_STYLE}>Apellido materno</label>
              <input
                style={INPUT_STYLE}
                value={form.apellido_materno}
                onChange={e => set('apellido_materno', e.target.value)}
                placeholder="Opcional"
              />
            </div>

            {/* Fecha nacimiento */}
            <div>
              <label style={LABEL_STYLE}>Fecha de nacimiento <span style={{ color: '#DC2626' }}>*</span></label>
              <input
                type="date"
                style={{ ...INPUT_STYLE, background: esNN ? '#F1F5F9' : '#fff' }}
                value={form.fecha_nacimiento}
                onChange={e => set('fecha_nacimiento', e.target.value)}
                readOnly={esNN}
                max={new Date().toISOString().slice(0, 10)}
              />
              {fieldErrors.fecha_nacimiento && <p style={{ color: '#DC2626', fontSize: '11px', margin: '3px 0 0' }}>{fieldErrors.fecha_nacimiento}</p>}
            </div>

            {/* Sexo */}
            <div>
              <label style={LABEL_STYLE}>Sexo <span style={{ color: '#DC2626' }}>*</span></label>
              <select
                style={{ ...INPUT_STYLE, background: esNN ? '#F1F5F9' : '#fff' }}
                value={form.genero}
                onChange={e => set('genero', e.target.value)}
                disabled={esNN}
              >
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="O">Otro / No especificado</option>
              </select>
            </div>

            {/* Teléfono */}
            <div>
              <label style={LABEL_STYLE}>Teléfono</label>
              <input
                style={INPUT_STYLE}
                value={form.telefono}
                onChange={e => set('telefono', e.target.value.replace(/\D/g, ''))}
                placeholder="Opcional"
                maxLength={15}
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '10px', border: '1px solid #E2E8F0',
                borderRadius: '8px', background: '#F8FAFC',
                color: '#64748B', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2, padding: '10px',
                background: loading ? '#9CA3AF' : '#00A896',
                border: 'none', borderRadius: '8px',
                color: '#fff', fontSize: '14px', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Registrando...' : 'Registrar e ir a Triaje →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
