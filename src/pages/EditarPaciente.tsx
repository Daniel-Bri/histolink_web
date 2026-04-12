import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/axiosConfig'

interface PacienteForm {
  ci: string
  ci_complemento: string
  nombres: string
  apellido_paterno: string
  apellido_materno: string
  fecha_nacimiento: string
  sexo: string
  email: string
  telefono: string
  direccion: string
}

const VACIO: PacienteForm = {
  ci: '', ci_complemento: '', nombres: '',
  apellido_paterno: '', apellido_materno: '',
  fecha_nacimiento: '', sexo: '', email: '',
  telefono: '', direccion: '',
}

const LABEL = () => ({
  display: 'block',
  fontSize: '12px', fontWeight: 700 as const,
  color: '#0003B8', opacity: 0.7,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  marginBottom: '5px',
})

const INPUT: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '10px 12px', borderRadius: '8px',
  border: '1.5px solid #B3D4FF', fontSize: '14px',
  color: '#333', outline: 'none',
  fontFamily: "'Segoe UI', sans-serif",
}

export default function EditarPaciente() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [form, setForm]         = useState<PacienteForm>(VACIO)
  const [loading, setLoading]   = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError]       = useState('')
  const [exito, setExito]       = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof PacienteForm, string>>>({})

  useEffect(() => {
    if (!id) { setError('ID inválido.'); setLoading(false); return }
    api.get(`pacientes/pacientes/${id}/`)
      .then(r => {
        const d = r.data
        setForm({
          ci:               d.ci              ?? '',
          ci_complemento:   d.ci_complemento  ?? '',
          // El serializer devuelve aliases: nombre, apellido, genero
          nombres:          d.nombre          ?? '',
          apellido_paterno: d.apellido        ?? '',
          apellido_materno: d.apellido_materno  ?? '',
          fecha_nacimiento: d.fecha_nacimiento ?? '',
          sexo:             d.genero          ?? '',
          email:            d.email           ?? '',
          telefono:         d.telefono        ?? '',
          direccion:        d.direccion       ?? '',
        })
      })
      .catch(e => setError(e?.response?.data?.error ?? 'No se pudo cargar el paciente.'))
      .finally(() => setLoading(false))
  }, [id])

  const set = (key: keyof PacienteForm, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setFieldErrors(prev => ({ ...prev, [key]: undefined }))
    setExito('')
    setError('')
  }

  const guardar = async () => {
    if (!id) return
    setGuardando(true); setError(''); setExito(''); setFieldErrors({})
    // El serializer usa alias: nombre→nombres, apellido→apellido_paterno, genero→sexo
    const payload = {
      ci:               form.ci,
      ci_complemento:   form.ci_complemento,
      nombre:           form.nombres,
      apellido:         form.apellido_paterno,
      apellido_materno: form.apellido_materno,
      fecha_nacimiento: form.fecha_nacimiento,
      genero:           form.sexo,
      email:            form.email,
      telefono:         form.telefono,
      direccion:        form.direccion,
    }
    try {
      await api.patch(`pacientes/pacientes/${id}/`, payload)
      setExito('Paciente actualizado correctamente.')
      setTimeout(() => navigate(`/pacientes/${id}/expediente`), 1200)
    } catch (e: any) {
      const data = e?.response?.data
      if (data && typeof data === 'object') {
        const fErrs: Partial<Record<keyof PacienteForm, string>> = {}
        const general: string[] = []
        for (const [k, raw] of Object.entries(data)) {
          const msg = Array.isArray(raw) ? String(raw[0]) : String(raw)
          const map: Record<string, keyof PacienteForm> = {
            nombre: 'nombres', apellido: 'apellido_paterno',
            genero: 'sexo', ci: 'ci', ci_complemento: 'ci_complemento',
            fecha_nacimiento: 'fecha_nacimiento', email: 'email',
            telefono: 'telefono', direccion: 'direccion',
          }
          if (k in map) fErrs[map[k]] = msg
          else if (k === 'non_field_errors' || k === 'detail') general.push(msg)
          else general.push(msg)
        }
        setFieldErrors(fErrs)
        if (general.length > 0) setError(general.join(' '))
      } else {
        setError('Error al guardar los datos del paciente.')
      }
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div style={{ padding: '32px' }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
        <button
          onClick={() => navigate(`/pacientes/${id}/expediente`)}
          style={{ background: 'transparent', border: 'none', color: '#0080FF', fontSize: '13px', cursor: 'pointer', padding: 0, fontWeight: 600 }}
        >
          ← Expediente
        </button>
        <span style={{ color: '#B3D4FF' }}>/</span>
        <span style={{ color: '#0003B8', fontSize: '13px', fontWeight: 600 }}>Editar Paciente</span>
      </div>

      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0003B8', margin: '0 0 6px 0' }}>
        Editar Datos del Paciente
      </h1>
      <p style={{ fontSize: '13px', color: '#888', margin: '0 0 28px 0' }}>
        Modifica los datos de identificación y contacto del paciente.
      </p>

      {loading && (
        <div style={{ background: 'white', borderRadius: '14px', padding: '40px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,3,184,0.06)' }}>
          <p style={{ color: '#0003B8', fontWeight: 600 }}>Cargando...</p>
        </div>
      )}

      {!loading && error && !exito && (
        <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px' }}>
          <p style={{ color: '#E53935', margin: 0, fontWeight: 600 }}>{error}</p>
        </div>
      )}

      {exito && (
        <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px' }}>
          <p style={{ color: '#2E7D32', margin: 0, fontWeight: 600 }}>{exito}</p>
        </div>
      )}

      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Identificación */}
          <div style={{ background: 'white', borderRadius: '14px', padding: '22px 26px', boxShadow: '0 2px 8px rgba(0,3,184,0.06)' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0003B8', margin: '0 0 20px 0' }}>
              IDENTIFICACIÓN
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>

              <div>
                <label style={LABEL()}>CI *</label>
                <input
                  value={form.ci}
                  onChange={e => set('ci', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  inputMode="numeric"
                  style={{ ...INPUT, borderColor: fieldErrors.ci ? '#E53935' : '#B3D4FF' }}
                />
                {fieldErrors.ci && <p style={{ color: '#E53935', fontSize: '11px', margin: '3px 0 0' }}>{fieldErrors.ci}</p>}
              </div>

              <div>
                <label style={LABEL()}>Complemento CI</label>
                <input
                  value={form.ci_complemento}
                  onChange={e => set('ci_complemento', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 2))}
                  maxLength={2}
                  placeholder="Ej: 1A"
                  style={{ ...INPUT, borderColor: fieldErrors.ci_complemento ? '#E53935' : '#B3D4FF' }}
                />
                {fieldErrors.ci_complemento && <p style={{ color: '#E53935', fontSize: '11px', margin: '3px 0 0' }}>{fieldErrors.ci_complemento}</p>}
              </div>

              <div>
                <label style={LABEL()}>Nombres *</label>
                <input
                  value={form.nombres}
                  onChange={e => set('nombres', e.target.value.slice(0, 100))}
                  style={{ ...INPUT, borderColor: fieldErrors.nombres ? '#E53935' : '#B3D4FF' }}
                />
                {fieldErrors.nombres && <p style={{ color: '#E53935', fontSize: '11px', margin: '3px 0 0' }}>{fieldErrors.nombres}</p>}
              </div>

              <div>
                <label style={LABEL()}>Apellido paterno *</label>
                <input
                  value={form.apellido_paterno}
                  onChange={e => set('apellido_paterno', e.target.value.slice(0, 100))}
                  style={{ ...INPUT, borderColor: fieldErrors.apellido_paterno ? '#E53935' : '#B3D4FF' }}
                />
                {fieldErrors.apellido_paterno && <p style={{ color: '#E53935', fontSize: '11px', margin: '3px 0 0' }}>{fieldErrors.apellido_paterno}</p>}
              </div>

              <div>
                <label style={LABEL()}>Apellido materno</label>
                <input
                  value={form.apellido_materno}
                  onChange={e => set('apellido_materno', e.target.value.slice(0, 100))}
                  style={{ ...INPUT, borderColor: fieldErrors.apellido_materno ? '#E53935' : '#B3D4FF' }}
                />
                {fieldErrors.apellido_materno && <p style={{ color: '#E53935', fontSize: '11px', margin: '3px 0 0' }}>{fieldErrors.apellido_materno}</p>}
              </div>

              <div>
                <label style={LABEL()}>Fecha de nacimiento *</label>
                <input
                  type="date"
                  value={form.fecha_nacimiento}
                  onChange={e => set('fecha_nacimiento', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  style={{ ...INPUT, borderColor: fieldErrors.fecha_nacimiento ? '#E53935' : '#B3D4FF' }}
                />
                {fieldErrors.fecha_nacimiento && <p style={{ color: '#E53935', fontSize: '11px', margin: '3px 0 0' }}>{fieldErrors.fecha_nacimiento}</p>}
              </div>

              <div>
                <label style={LABEL()}>Sexo *</label>
                <select
                  value={form.sexo}
                  onChange={e => set('sexo', e.target.value)}
                  style={{ ...INPUT, cursor: 'pointer', borderColor: fieldErrors.sexo ? '#E53935' : '#B3D4FF' }}
                >
                  <option value="">Seleccione...</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="O">Otro</option>
                </select>
                {fieldErrors.sexo && <p style={{ color: '#E53935', fontSize: '11px', margin: '3px 0 0' }}>{fieldErrors.sexo}</p>}
              </div>

            </div>
          </div>

          {/* Contacto */}
          <div style={{ background: 'white', borderRadius: '14px', padding: '22px 26px', boxShadow: '0 2px 8px rgba(0,3,184,0.06)' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0003B8', margin: '0 0 20px 0' }}>
              CONTACTO
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>

              <div>
                <label style={LABEL()}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="correo@ejemplo.com"
                  style={{ ...INPUT, borderColor: fieldErrors.email ? '#E53935' : '#B3D4FF' }}
                />
                {fieldErrors.email && <p style={{ color: '#E53935', fontSize: '11px', margin: '3px 0 0' }}>{fieldErrors.email}</p>}
              </div>

              <div>
                <label style={LABEL()}>Teléfono</label>
                <input
                  value={form.telefono}
                  onChange={e => set('telefono', e.target.value.replace(/\D/g, '').slice(0, 15))}
                  inputMode="numeric"
                  placeholder="Ej: 70012345"
                  style={{ ...INPUT, borderColor: fieldErrors.telefono ? '#E53935' : '#B3D4FF' }}
                />
                {fieldErrors.telefono && <p style={{ color: '#E53935', fontSize: '11px', margin: '3px 0 0' }}>{fieldErrors.telefono}</p>}
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={LABEL()}>Dirección</label>
                <input
                  value={form.direccion}
                  onChange={e => set('direccion', e.target.value.slice(0, 200))}
                  placeholder="Calle, número, zona..."
                  style={{ ...INPUT, borderColor: fieldErrors.direccion ? '#E53935' : '#B3D4FF' }}
                />
                {fieldErrors.direccion && <p style={{ color: '#E53935', fontSize: '11px', margin: '3px 0 0' }}>{fieldErrors.direccion}</p>}
              </div>

            </div>
          </div>

          {/* Acciones */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => navigate(`/pacientes/${id}/expediente`)}
              disabled={guardando}
              style={{
                padding: '11px 26px', borderRadius: '8px',
                border: '1.5px solid #B3D4FF', background: 'transparent',
                color: '#0003B8', fontWeight: 600, fontSize: '14px',
                cursor: guardando ? 'not-allowed' : 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={guardando}
              style={{
                padding: '11px 30px', borderRadius: '8px',
                background: guardando ? '#B3D4FF' : '#0003B8',
                color: 'white', fontWeight: 600, fontSize: '14px',
                border: 'none', cursor: guardando ? 'not-allowed' : 'pointer',
              }}
            >
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>

        </div>
      )}
    </div>
  )
}
