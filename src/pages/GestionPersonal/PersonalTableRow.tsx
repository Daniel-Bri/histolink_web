import type { CSSProperties } from 'react'
import type { PersonalSalud } from '../../services/personalService'

const ROL_LABELS: Record<PersonalSalud['rol'], string> = {
  medico: 'Médico',
  enfermera: 'Enfermera',
  admin: 'Admin',
}

const cellStyle: CSSProperties = {
  padding: '12px 14px',
  fontSize: '13px',
  borderBottom: '1px solid #E8ECF4',
  color: '#333',
}

interface PersonalTableRowProps {
  row: PersonalSalud
  onEdit: () => void
  onDeactivate: () => void
}

export default function PersonalTableRow({ row, onEdit, onDeactivate }: PersonalTableRowProps) {
  const nombre =
    [row.user.first_name, row.user.last_name].filter(Boolean).join(' ').trim() || row.user.username
  const especialidad = row.especialidad?.nombre ?? '—'

  return (
    <tr style={{ background: row.is_active ? 'white' : '#FAFAFA' }}>
      <td style={cellStyle}>{nombre}</td>
      <td style={cellStyle}>{row.user.username}</td>
      <td style={{ ...cellStyle, fontFamily: 'monospace' }}>{row.item_min_salud}</td>
      <td style={cellStyle}>{ROL_LABELS[row.rol]}</td>
      <td style={cellStyle}>{especialidad}</td>
      <td style={cellStyle}>{row.telefono?.trim() ? row.telefono : '—'}</td>
      <td style={cellStyle}>
        <span
          style={{
            display: 'inline-block',
            padding: '2px 10px',
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
      <td style={{ ...cellStyle, whiteSpace: 'nowrap' }}>
        <button type="button" onClick={onEdit} style={{ marginRight: '8px', fontSize: '12px', padding: '6px 10px' }}>
          Editar
        </button>
        {row.is_active && (
          <button
            type="button"
            onClick={onDeactivate}
            style={{ fontSize: '12px', padding: '6px 10px', color: '#C62828' }}
          >
            Desactivar
          </button>
        )}
      </td>
    </tr>
  )
}
