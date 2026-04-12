import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AlertError from '../../components/AlertError'
import ConfirmModal from '../../components/ConfirmModal'
import {
  deactivatePersonal,
  fetchPersonal,
  reactivatePersonal,
  type PersonalSalud,
  type RolPersonal,
} from '../../services/personalService'
import PersonalTableRow from './PersonalTableRow'

type FiltroRol = RolPersonal | 'todos'

function nombreCompleto(p: PersonalSalud) {
  return [p.user.first_name, p.user.last_name].filter(Boolean).join(' ').trim() || p.user.username
}

export default function PersonalList() {
  const navigate = useNavigate()
  const [items, setItems] = useState<PersonalSalud[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rolFiltro, setRolFiltro] = useState<FiltroRol>('todos')
  const [deactivateTarget, setDeactivateTarget] = useState<PersonalSalud | null>(null)
  const [deactivateLoading, setDeactivateLoading] = useState(false)
  const [reactivateTarget, setReactivateTarget] = useState<PersonalSalud | null>(null)
  const [reactivateLoading, setReactivateLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchPersonal(true)
      setItems(data)
    } catch {
      setError('No se pudo cargar el personal. Verifica la sesión y el servidor.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtrados = useMemo(() => {
    if (rolFiltro === 'todos') return items
    return items.filter((p) => p.rol === rolFiltro)
  }, [items, rolFiltro])

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return
    setDeactivateLoading(true)
    try {
      await deactivatePersonal(deactivateTarget.id)
      setDeactivateTarget(null)
      await load()
    } catch {
      setError('No se pudo desactivar el registro.')
    } finally {
      setDeactivateLoading(false)
    }
  }

  const confirmReactivate = async () => {
    if (!reactivateTarget) return
    setReactivateLoading(true)
    try {
      await reactivatePersonal(reactivateTarget.id)
      setReactivateTarget(null)
      await load()
    } catch {
      setError('No se pudo reactivar el registro.')
    } finally {
      setReactivateLoading(false)
    }
  }

  return (
    <div style={{ padding: '32px' }}>

      {/* Encabezado */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        justifyContent: 'space-between', gap: '16px', marginBottom: '24px',
      }}>
        <div>
          <h1 style={{ fontSize: '22px', color: '#0003B8', fontWeight: 700, margin: 0 }}>
            Personal de Salud
          </h1>
          <p style={{ color: '#888', fontSize: '13px', margin: '4px 0 0 0' }}>
            {items.length > 0
              ? `${items.length} registro${items.length !== 1 ? 's' : ''} en el sistema`
              : 'Gestiona el personal clínico registrado'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/personal/nuevo')}
          style={{
            background: '#0003B8', color: 'white',
            border: 'none', borderRadius: '8px',
            padding: '10px 20px', cursor: 'pointer',
            fontSize: '14px', fontWeight: 600,
          }}
        >
          + Nuevo personal
        </button>
      </div>

      {/* Filtro de rol */}
      <div style={{
        background: 'white', borderRadius: '12px', padding: '14px 20px',
        marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,3,184,0.06)',
        display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap',
      }}>
        <label htmlFor="filtro-rol" style={{ fontSize: '13px', color: '#0003B8', fontWeight: 600 }}>
          Filtrar por rol:
        </label>
        <select
          id="filtro-rol"
          value={rolFiltro}
          onChange={(e) => setRolFiltro(e.target.value as FiltroRol)}
          style={{
            padding: '8px 12px', fontSize: '13px', borderRadius: '8px',
            border: '1.5px solid #B3D4FF', color: '#0003B8', background: 'white',
            cursor: 'pointer',
          }}
        >
          <option value="todos">Todos los roles</option>
          <option value="medico">Médico</option>
          <option value="enfermera">Enfermera</option>
          <option value="admin">Admin</option>
        </select>
        {rolFiltro !== 'todos' && (
          <button
            type="button"
            onClick={() => setRolFiltro('todos')}
            style={{
              background: 'transparent', color: '#0003B8',
              border: '1.5px solid #B3D4FF', borderRadius: '8px',
              padding: '8px 16px', cursor: 'pointer',
              fontSize: '13px', fontWeight: 600,
            }}
          >
            Limpiar
          </button>
        )}
      </div>

      <AlertError message={error} onDismiss={() => setError('')} />

      {/* Tabla */}
      <div style={{
        background: 'white', borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,3,184,0.06)', overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#0003B8', fontWeight: 600 }}>
            Cargando personal...
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#888' }}>
            {items.length === 0
              ? 'No hay personal registrado aún.'
              : 'No hay personal con el rol seleccionado.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: '#F0F6FF' }}>
                {['Nombre completo', 'Usuario', 'Ítem MIN Salud', 'Rol', 'Especialidad', 'Teléfono', 'Estado', ''].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '12px 16px',
                      textAlign: h === '' ? 'right' : 'left',
                      fontSize: '12px', fontWeight: 700, color: '#0003B8',
                      letterSpacing: '0.04em', textTransform: 'uppercase',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((row, i) => (
                <PersonalTableRow
                  key={row.id}
                  row={row}
                  index={i}
                  onEdit={() => navigate(`/personal/${row.id}/editar`)}
                  onDeactivate={() => setDeactivateTarget(row)}
                  onReactivate={() => setReactivateTarget(row)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        open={!!deactivateTarget}
        title="Desactivar personal"
        message={
          deactivateTarget
            ? `¿Estás seguro de desactivar a ${nombreCompleto(deactivateTarget)}?`
            : ''
        }
        confirmLabel="Desactivar"
        loading={deactivateLoading}
        onConfirm={() => void confirmDeactivate()}
        onCancel={() => !deactivateLoading && setDeactivateTarget(null)}
      />

      <ConfirmModal
        open={!!reactivateTarget}
        title="Reactivar personal"
        message={
          reactivateTarget
            ? `¿Reactivar a ${nombreCompleto(reactivateTarget)}? Volverá a aparecer como personal activo.`
            : ''
        }
        confirmLabel="Reactivar"
        loading={reactivateLoading}
        onConfirm={() => void confirmReactivate()}
        onCancel={() => !reactivateLoading && setReactivateTarget(null)}
      />
    </div>
  )
}
