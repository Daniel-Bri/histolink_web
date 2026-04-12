import type { CSSProperties, FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AlertError from '../../components/AlertError'
import { fetchEspecialidades, type Especialidad } from '../../services/especialidadService'
import {
  ITEM_MIN_SALUD_PATTERN,
  createPersonal,
  fetchPersonalById,
  updatePersonal,
  type RolPersonal,
} from '../../services/personalService'

function parseApiErrors(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Error al guardar.'
  const d = data as Record<string, unknown>
  if (typeof d.detail === 'string') return d.detail
  const parts: string[] = []
  for (const [k, v] of Object.entries(d)) {
    const label: Record<string, string> = {
      username: 'Usuario',
      first_name: 'Nombre',
      last_name: 'Apellido',
      email: 'Email',
      password: 'Contraseña',
      item_min_salud: 'Ítem MIN Salud',
      especialidad: 'Especialidad',
      non_field_errors: '',
    }
    const key = label[k] ?? k
    if (Array.isArray(v)) {
      parts.push(key ? `${key}: ${(v as string[]).join(' ')}` : (v as string[]).join(' '))
    }
  }
  return parts.length ? parts.join(' | ') : 'Error al guardar.'
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 700,
  color: '#0003B8',
  opacity: 0.75,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '6px',
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '14px',
  borderRadius: '8px',
  border: '1.5px solid #B3D4FF',
  boxSizing: 'border-box',
  color: '#333',
  background: 'white',
  outline: 'none',
}

const fieldWrap: CSSProperties = { marginBottom: '18px' }

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p style={{ color: '#C62828', fontSize: '12px', marginTop: '5px', margin: '5px 0 0 0' }}>{msg}</p>
}

export default function PersonalForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [loadingInit, setLoadingInit] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([])
  const [espError, setEspError] = useState(false)

  // Campos solo para creación
  const [username, setUsername] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Campos comunes (creación y edición)
  const [itemMinSalud, setItemMinSalud] = useState('')
  const [rol, setRol] = useState<RolPersonal>('enfermera')
  const [especialidadId, setEspecialidadId] = useState<number | ''>('')
  const [telefono, setTelefono] = useState('')

  // Para mostrar datos en modo edición
  const [editUserLabel, setEditUserLabel] = useState('')

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    async function init() {
      setLoadingInit(true)
      setError('')

      // Especialidades: fallo no es fatal, el formulario igual carga
      try {
        const espList = await fetchEspecialidades()
        if (!cancelled) {
          setEspecialidades(espList)
          setEspError(false)
        }
      } catch {
        if (!cancelled) setEspError(true)
      }

      // En edición, cargar datos del registro
      if (isEdit && id) {
        try {
          const detalle = await fetchPersonalById(Number(id))
          if (cancelled) return
          const nombre = [detalle.user.first_name, detalle.user.last_name].filter(Boolean).join(' ').trim()
          setEditUserLabel(nombre ? `${nombre} (${detalle.user.username})` : detalle.user.username)
          setItemMinSalud(detalle.item_min_salud)
          setRol(detalle.rol)
          setEspecialidadId(detalle.especialidad?.id ?? '')
          setTelefono(detalle.telefono ?? '')
        } catch {
          if (!cancelled) setError('No se pudo cargar el registro. Verifica la conexión con el servidor.')
        }
      }

      if (!cancelled) setLoadingInit(false)
    }
    void init()
    return () => { cancelled = true }
  }, [id, isEdit])

  const recargarEspecialidades = async () => {
    setEspError(false)
    try {
      const espList = await fetchEspecialidades()
      setEspecialidades(espList)
    } catch {
      setEspError(true)
    }
  }

  const validate = (): boolean => {
    const fe: Record<string, string> = {}

    if (!isEdit) {
      if (!username.trim()) fe.username = 'El nombre de usuario es obligatorio.'
      if (!firstName.trim()) fe.first_name = 'El nombre es obligatorio.'
      if (!lastName.trim()) fe.last_name = 'El apellido es obligatorio.'
      if (password.length < 6) fe.password = 'La contraseña debe tener al menos 6 caracteres.'
      if (password !== confirmPassword) fe.confirm_password = 'Las contraseñas no coinciden.'
    }

    if (!ITEM_MIN_SALUD_PATTERN.test(itemMinSalud.trim())) {
      fe.item_min_salud = 'Formato requerido: 3 letras, guión, 3 números (ej. MED-001).'
    }
    if (rol === 'medico' && especialidadId === '') {
      fe.especialidad = 'La especialidad es obligatoria para médicos.'
    }

    setFieldErrors(fe)
    return Object.keys(fe).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validate()) return

    setSaving(true)
    try {
      if (isEdit && id) {
        await updatePersonal(Number(id), {
          item_min_salud: itemMinSalud.trim(),
          rol,
          especialidad: rol === 'medico' ? Number(especialidadId) : null,
          telefono: telefono.trim() || null,
        })
      } else {
        await createPersonal({
          username: username.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim() || undefined,
          password,
          item_min_salud: itemMinSalud.trim(),
          rol,
          especialidad: rol === 'medico' ? Number(especialidadId) : null,
          telefono: telefono.trim() || null,
        })
      }
      navigate('/personal')
    } catch (err: unknown) {
      const ax = err as { response?: { data?: unknown } }
      setError(parseApiErrors(ax.response?.data))
    } finally {
      setSaving(false)
    }
  }

  if (loadingInit) {
    return (
      <div style={{ padding: '32px' }}>
        <div style={{ color: '#0003B8', fontWeight: 600 }}>Cargando...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px' }}>

      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button
          type="button"
          onClick={() => navigate('/personal')}
          style={{
            background: 'transparent', color: '#0003B8',
            border: '1.5px solid #B3D4FF', borderRadius: '8px',
            padding: '7px 16px', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600,
          }}
        >
          ← Personal
        </button>
        <h1 style={{ fontSize: '22px', color: '#0003B8', fontWeight: 700, margin: 0 }}>
          {isEdit ? 'Editar personal' : 'Registrar personal'}
        </h1>
      </div>

      <AlertError message={error} onDismiss={() => setError('')} />

      <div style={{
        background: 'white', borderRadius: '12px', padding: '28px 32px',
        boxShadow: '0 2px 8px rgba(0,3,184,0.06)', maxWidth: '620px',
      }}>
        <form onSubmit={(e) => void handleSubmit(e)} noValidate>

          {/* ── Sección datos de acceso (solo creación) ── */}
          {!isEdit ? (
            <>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#0003B8', marginBottom: '14px', borderBottom: '1px solid #E8ECF4', paddingBottom: '8px' }}>
                Datos de acceso al sistema
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <div style={fieldWrap}>
                  <label htmlFor="first_name" style={labelStyle}>Nombre</label>
                  <input id="first_name" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} placeholder="Ej. Juan" />
                  <FieldError msg={fieldErrors.first_name} />
                </div>
                <div style={fieldWrap}>
                  <label htmlFor="last_name" style={labelStyle}>Apellido</label>
                  <input id="last_name" value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle} placeholder="Ej. Pérez" />
                  <FieldError msg={fieldErrors.last_name} />
                </div>
              </div>

              <div style={fieldWrap}>
                <label htmlFor="username" style={labelStyle}>Nombre de usuario</label>
                <input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                  style={inputStyle}
                  placeholder="Ej. dr_perez"
                  autoComplete="off"
                />
                <FieldError msg={fieldErrors.username} />
              </div>

              <div style={fieldWrap}>
                <label htmlFor="email" style={labelStyle}>
                  Email <span style={{ textTransform: 'none', fontWeight: 400, opacity: 0.8 }}>(opcional)</span>
                </label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="correo@ejemplo.com" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <div style={fieldWrap}>
                  <label htmlFor="password" style={labelStyle}>Contraseña</label>
                  <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} autoComplete="new-password" />
                  <FieldError msg={fieldErrors.password} />
                </div>
                <div style={fieldWrap}>
                  <label htmlFor="confirm_password" style={labelStyle}>Confirmar contraseña</label>
                  <input id="confirm_password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} autoComplete="new-password" />
                  <FieldError msg={fieldErrors.confirm_password} />
                </div>
              </div>

              <p style={{ fontSize: '13px', fontWeight: 700, color: '#0003B8', margin: '8px 0 14px 0', borderBottom: '1px solid #E8ECF4', paddingBottom: '8px' }}>
                Datos del perfil clínico
              </p>
            </>
          ) : (
            <div style={{ ...fieldWrap, background: '#F8F9FF', borderRadius: '8px', padding: '12px 14px', border: '1px solid #E8ECF4' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#0003B8', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Profesional
              </p>
              <p style={{ fontSize: '14px', color: '#333', margin: 0 }}>{editUserLabel}</p>
            </div>
          )}

          {/* Ítem MIN Salud */}
          <div style={fieldWrap}>
            <label htmlFor="item_min_salud" style={labelStyle}>Ítem MIN Salud</label>
            <input
              id="item_min_salud"
              value={itemMinSalud}
              onChange={(e) => setItemMinSalud(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 7))}
              placeholder="MED-001"
              style={inputStyle}
              maxLength={7}
            />
            <FieldError msg={fieldErrors.item_min_salud} />
          </div>

          {/* Rol */}
          <div style={fieldWrap}>
            <label htmlFor="rol" style={labelStyle}>Rol</label>
            <select
              id="rol"
              value={rol}
              onChange={(e) => {
                setRol(e.target.value as RolPersonal)
                if (e.target.value !== 'medico') setEspecialidadId('')
              }}
              style={inputStyle}
            >
              <option value="medico">Médico</option>
              <option value="enfermera">Enfermera</option>
              <option value="admin">Administrativo</option>
            </select>
          </div>

          {/* Especialidad (solo médicos) */}
          {rol === 'medico' && (
            <div style={fieldWrap}>
              <label htmlFor="especialidad" style={labelStyle}>Especialidad</label>
              {espError ? (
                <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: '8px', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#795548' }}>No se pudieron cargar las especialidades.</span>
                  <button
                    type="button"
                    onClick={() => void recargarEspecialidades()}
                    style={{ background: '#0003B8', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Reintentar
                  </button>
                </div>
              ) : (
                <select
                  id="especialidad"
                  value={especialidadId === '' ? '' : String(especialidadId)}
                  onChange={(e) => setEspecialidadId(e.target.value ? Number(e.target.value) : '')}
                  style={inputStyle}
                >
                  <option value="">— Seleccionar especialidad —</option>
                  {especialidades.map((esp) => (
                    <option key={esp.id} value={esp.id}>{esp.nombre}</option>
                  ))}
                </select>
              )}
              <FieldError msg={fieldErrors.especialidad} />
            </div>
          )}

          {/* Teléfono */}
          <div style={{ ...fieldWrap, marginBottom: '28px' }}>
            <label htmlFor="telefono" style={labelStyle}>
              Teléfono <span style={{ textTransform: 'none', fontWeight: 400, opacity: 0.8 }}>(opcional)</span>
            </label>
            <input
              id="telefono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej. 70012345"
              style={inputStyle}
            />
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: saving ? '#B3D4FF' : '#0003B8',
                color: 'white', border: 'none',
                padding: '10px 24px', borderRadius: '8px',
                fontWeight: 600, fontSize: '14px',
                cursor: saving ? 'wait' : 'pointer',
              }}
            >
              {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Registrar personal'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/personal')}
              disabled={saving}
              style={{
                background: 'transparent', color: '#0003B8',
                border: '1.5px solid #B3D4FF',
                padding: '10px 24px', borderRadius: '8px',
                fontWeight: 600, fontSize: '14px',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              Cancelar
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
