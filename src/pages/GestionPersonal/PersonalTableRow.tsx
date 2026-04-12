import type { PersonalSalud } from '../../services/personalService'

const ROL_LABELS: Record<PersonalSalud['rol'], string> = {
  medico: 'Médico',
  enfermera: 'Enfermera',
  admin: 'Admin',
}

interface PersonalTableRowProps {
  row: PersonalSalud
  index: number
  onEdit: () => void
  onDeactivate: () => void
  onReactivate: () => void
}

export default function PersonalTableRow({ row, index, onEdit, onDeactivate, onReactivate }: PersonalTableRowProps) {
  const nombre =
    [row.user.first_name, row.user.last_name].filter(Boolean).join(' ').trim() || row.user.username

  return (
    <tr
      style={{
        borderTop: '1px solid #F0F6FF',
        background: index % 2 === 0 ? 'white' : '#FAFCFF',
      }}
    >
      <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: '#0003B8' }}>
        {nombre}
      </td>
      <td style={{ padding: '12px 16px', fontSize: '14px' }}>{row.user.username}</td>
      <td style={{ padding: '12px 16px', fontSize: '14px', fontFamily: 'monospace', color: '#555' }}>
        {row.item_min_salud}
      </td>
      <td style={{ padding: '12px 16px', fontSize: '14px' }}>{ROL_LABELS[row.rol]}</td>
      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#555' }}>
        {row.especialidad?.nombre ?? '—'}
      </td>
      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#555' }}>
        {row.telefono?.trim() ? row.telefono : '—'}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 600,
            background: row.is_active ? '#CCFAF4' : '#FFEBEE',
            color: row.is_active ? '#00A896' : '#C62828',
          }}
        >
          {row.is_active ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onEdit}
            style={{
              background: 'transparent', color: '#0003B8',
              border: '1.5px solid #B3D4FF', borderRadius: '6px',
              padding: '6px 14px', cursor: 'pointer',
              fontSize: '12px', fontWeight: 600,
            }}
          >
            Editar
          </button>
          {row.is_active ? (
            <button
              type="button"
              onClick={onDeactivate}
              style={{
                background: 'transparent', color: '#C62828',
                border: '1.5px solid #FFCDD2', borderRadius: '6px',
                padding: '6px 14px', cursor: 'pointer',
                fontSize: '12px', fontWeight: 600,
              }}
            >
              Desactivar
            </button>
          ) : (
            <button
              type="button"
              onClick={onReactivate}
              style={{
                background: 'transparent', color: '#00A896',
                border: '1.5px solid #CCFAF4', borderRadius: '6px',
                padding: '6px 14px', cursor: 'pointer',
                fontSize: '12px', fontWeight: 600,
              }}
            >
              Reactivar
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
