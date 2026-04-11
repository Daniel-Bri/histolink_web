import type { CSSProperties, FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AlertError from '../../components/AlertError'
import LoadingSpinner from '../../components/LoadingSpinner'
import { fetchEspecialidades, type Especialidad } from '../../services/especialidadService'
import {
  ITEM_MIN_SALUD_PATTERN,
  createPersonal,
  fetchPersonalById,
  updatePersonal,
  type RolPersonal,
} from '../../services/personalService'
import { fetchUsuariosSinPerfil, type UsuarioSinPerfil } from '../../services/usuarioService'

function normalizeItemMinSaludInput(raw: string) {
  return raw.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 7)
}

function parseApiErrors(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Error al guardar.'
  const d = data as Record<string, unknown>
  if (typeof d.detail === 'string') return d.detail
  const parts: string[] = []
  for (const [k, v] of Object.entries(d)) {
    if (Array.isArray(v) && v.every((x) => typeof x === 'string')) {
      parts.push(`${k}: ${(v as string[]).join(' ')}`)
    } else if (typeof v === 'object' && v !== null) {
      parts.push(`${k}: ${JSON.stringify(v)}`)
    }
  }
  return parts.length ? parts.join(' ') : 'Error al guardar.'
}

export default function PersonalForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [loadingInit, setLoadingInit] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [usuariosSinPerfil, setUsuariosSinPerfil] = useState<UsuarioSinPerfil[]>([])
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([])

  const [userId, setUserId] = useState<number | ''>('')
  const [itemMinSalud, setItemMinSalud] = useState('')
  const [rol, setRol] = useState<RolPersonal>('enfermera')
  const [especialidadId, setEspecialidadId] = useState<number | ''>('')
  const [telefono, setTelefono] = useState('')

  const [userReadonly, setUserReadonly] = useState<{ label: string } | null>(null)

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    async function init() {
      setLoadingInit(true)
      setError('')
      try {
        const [espList] = await Promise.all([fetchEspecialidades()])
        if (cancelled) return
        setEspecialidades(espList)

        if (isEdit && id) {
          const detalle = await fetchPersonalById(Number(id))
          if (cancelled) return
          setUserReadonly({
            label: `${detalle.user.first_name} ${detalle.user.last_name} (${detalle.user.username})`.trim(),
          })
          setUserId(detalle.user.id)
          setItemMinSalud(detalle.item_min_salud)
          setRol(detalle.rol)
          setEspecialidadId(detalle.especialidad?.id ?? '')
          setTelefono(detalle.telefono ?? '')
        } else {
          const users = await fetchUsuariosSinPerfil()
          if (cancelled) return
          setUsuariosSinPerfil(users)
          setUserReadonly(null)
        }
      } catch {
        if (!cancelled) setError('No se pudieron cargar los datos del formulario.')
      } finally {
        if (!cancelled) setLoadingInit(false)
      }
    }
    void init()
    return () => {
      cancelled = true
    }
  }, [id, isEdit])

  const validate = (): boolean => {
    const fe: Record<string, string> = {}
    if (!isEdit && userId === '') fe.user_id = 'Selecciona un usuario.'
    if (!ITEM_MIN_SALUD_PATTERN.test(itemMinSalud.trim())) {
      fe.item_min_salud = 'Formato: 3 letras mayúsculas, guión, 3 números (ej. MED-001).'
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

    const payload = {
      user_id: Number(userId),
      item_min_salud: itemMinSalud.trim(),
      rol,
      especialidad: rol === 'medico' ? Number(especialidadId) : null,
      telefono: telefono.trim() || null,
    }

    setSaving(true)
    try {
      if (isEdit && id) {
        await updatePersonal(Number(id), payload)
      } else {
        await createPersonal(payload)
      }
      navigate('/personal')
    } catch (err: unknown) {
      const ax = err as { response?: { data?: unknown } }
      setError(parseApiErrors(ax.response?.data))
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    maxWidth: '400px',
    padding: '10px 12px',
    fontSize: '14px',
    borderRadius: '6px',
    border: '1px solid #B3D4FF',
    boxSizing: 'border-box',
  }

  const labelStyle: CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#0003B8',
    marginBottom: '6px',
  }

  if (loadingInit) {
    return (
      <div style={{ minHeight: '100vh', background: '#F0F6FF' }}>
        <div style={{ background: '#0003B8', padding: '10px 32px' }}>
          <span style={{ color: 'white', fontWeight: 700 }}>Gestión de personal</span>
        </div>
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0F6FF' }}>
      <div
        style={{
          background: '#0003B8',
          padding: '10px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/personal')}
          style={{
            background: 'transparent',
            border: '1.5px solid #B3D4FF',
            color: 'white',
            padding: '6px 12px',
            fontSize: '13px',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          ← Lista
        </button>
        <span style={{ color: 'white', fontWeight: 700, fontSize: '18px' }}>
          {isEdit ? 'Editar personal' : 'Nuevo personal'}
        </span>
      </div>

      <div style={{ padding: '32px', maxWidth: '560px' }}>
        <AlertError message={error} onDismiss={() => setError('')} />

        <form
          onSubmit={(e) => void handleSubmit(e)}
          style={{ background: 'white', padding: '28px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,3,184,0.06)' }}
        >
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Usuario</label>
            {isEdit && userReadonly ? (
              <p style={{ fontSize: '14px', color: '#333', margin: 0 }}>{userReadonly.label}</p>
            ) : (
              <>
                <select
                  required={!isEdit}
                  value={userId === '' ? '' : String(userId)}
                  onChange={(e) => setUserId(e.target.value ? Number(e.target.value) : '')}
                  style={{ ...inputStyle, maxWidth: '100%' }}
                >
                  <option value="">— Seleccionar usuario sin perfil —</option>
                  {usuariosSinPerfil.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} — {u.first_name} {u.last_name}
                    </option>
                  ))}
                </select>
                {fieldErrors.user_id && (
                  <p style={{ color: '#C62828', fontSize: '12px', marginTop: '6px' }}>{fieldErrors.user_id}</p>
                )}
                {usuariosSinPerfil.length === 0 && (
                  <p style={{ color: '#888', fontSize: '13px', marginTop: '8px' }}>
                    No hay usuarios disponibles sin perfil de personal. Crea usuarios en el sistema primero.
                  </p>
                )}
              </>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="item_min_salud" style={labelStyle}>
              Ítem MIN Salud
            </label>
            <input
              id="item_min_salud"
              value={itemMinSalud}
              onChange={(e) => setItemMinSalud(normalizeItemMinSaludInput(e.target.value))}
              placeholder="MED-001"
              style={inputStyle}
              maxLength={7}
            />
            {fieldErrors.item_min_salud && (
              <p style={{ color: '#C62828', fontSize: '12px', marginTop: '6px' }}>{fieldErrors.item_min_salud}</p>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="rol" style={labelStyle}>
              Rol
            </label>
            <select
              id="rol"
              value={rol}
              onChange={(e) => {
                const r = e.target.value as RolPersonal
                setRol(r)
                if (r !== 'medico') setEspecialidadId('')
              }}
              style={{ ...inputStyle, maxWidth: '100%' }}
            >
              <option value="medico">Médico</option>
              <option value="enfermera">Enfermera</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {rol === 'medico' && (
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="especialidad" style={labelStyle}>
                Especialidad
              </label>
              <select
                id="especialidad"
                value={especialidadId === '' ? '' : String(especialidadId)}
                onChange={(e) => setEspecialidadId(e.target.value ? Number(e.target.value) : '')}
                style={{ ...inputStyle, maxWidth: '100%' }}
              >
                <option value="">— Seleccionar —</option>
                {especialidades.map((esp) => (
                  <option key={esp.id} value={esp.id}>
                    {esp.nombre}
                  </option>
                ))}
              </select>
              {fieldErrors.especialidad && (
                <p style={{ color: '#C62828', fontSize: '12px', marginTop: '6px' }}>{fieldErrors.especialidad}</p>
              )}
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="telefono" style={labelStyle}>
              Teléfono <span style={{ fontWeight: 400, color: '#888' }}>(opcional)</span>
            </label>
            <input
              id="telefono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: '#0003B8',
                color: 'white',
                border: 'none',
                padding: '10px 22px',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: saving ? 'wait' : 'pointer',
              }}
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/personal')}
              disabled={saving}
              style={{ padding: '10px 22px', borderRadius: '8px', border: '1px solid #B3D4FF', background: 'white' }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
