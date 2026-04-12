import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AlertError from '../../components/AlertError'
import ConfirmModal from '../../components/ConfirmModal'
import LoadingSpinner from '../../components/LoadingSpinner'
import {
  deactivatePersonal,
  fetchPersonal,
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

  const thStyle = {
    textAlign: 'left' as const,
    padding: '12px 14px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#0003B8',
    borderBottom: '2px solid #0003B8',
    background: '#F0F6FF',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0F6FF' }}>
      <div
        style={{
          background: '#0003B8',
          padding: '10px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
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
            ← Dashboard
          </button>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '18px' }}>Gestión de personal</span>
        </div>
      </div>

      <div style={{ padding: '32px' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label htmlFor="filtro-rol" style={{ fontSize: '14px', color: '#0003B8', fontWeight: 600 }}>
              Rol:
            </label>
            <select
              id="filtro-rol"
              value={rolFiltro}
              onChange={(e) => setRolFiltro(e.target.value as FiltroRol)}
              style={{ padding: '8px 12px', fontSize: '14px', borderRadius: '6px', border: '1px solid #B3D4FF' }}
            >
              <option value="todos">Todos</option>
              <option value="medico">Médico</option>
              <option value="enfermera">Enfermera</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => navigate('/personal/nuevo')}
            style={{
              background: '#00A896',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Crear nuevo personal
          </button>
        </div>

        <AlertError message={error} onDismiss={() => setError('')} />

        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,3,184,0.06)',
            overflow: 'auto',
          }}
        >
          {loading ? (
            <LoadingSpinner />
          ) : filtrados.length === 0 ? (
            <p style={{ padding: '32px', textAlign: 'center', color: '#888' }}>No hay personal para mostrar.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '880px' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Nombre completo</th>
                  <th style={thStyle}>Usuario</th>
                  <th style={thStyle}>Ítem MIN Salud</th>
                  <th style={thStyle}>Rol</th>
                  <th style={thStyle}>Especialidad</th>
                  <th style={thStyle}>Teléfono</th>
                  <th style={thStyle}>Estado</th>
                  <th style={thStyle}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((row) => (
                  <PersonalTableRow
                    key={row.id}
                    row={row}
                    onEdit={() => navigate(`/personal/${row.id}/editar`)}
                    onDeactivate={() => setDeactivateTarget(row)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
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
    </div>
  )
}
