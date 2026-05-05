import { useEffect, useMemo, useState } from 'react'
import type { AxiosError } from 'axios'
import { hasRole } from '../utils/auth'
import {
  cambiarEstadoOrden,
  obtenerColaLaboratorio,
  obtenerOrdenDetalle,
  subirResultadoEstudio,
  type OrdenEstado,
  type OrdenEstudioDetail,
  type OrdenEstudioListItem,
} from '../services/estudiosService'

function fmtDate(raw: string) {
  try {
    return new Date(raw).toLocaleString()
  } catch {
    return raw
  }
}

function parseApiError(err: unknown): string {
  const axiosErr = err as AxiosError<Record<string, unknown>>
  const status = axiosErr.response?.status
  const data = axiosErr.response?.data
  if (!status) return 'No hay conexión con backend. Revisa CORS o API base URL.'
  if (status === 401) return '401: token faltante o expirado.'
  if (status === 403) return '403: rol sin permiso para cola de laboratorio.'
  if (status === 404) return '404: endpoint no encontrado (/api/ordenes-estudio/cola-laboratorio/).'
  if (status === 400) {
    if (data && typeof data === 'object') {
      const entries = Object.entries(data)
      if (entries.length > 0) {
        const [field, raw] = entries[0]
        const msg = Array.isArray(raw) ? String(raw[0] ?? '') : String(raw ?? '')
        if (field === 'orden' && msg) return `400: esta orden ya tiene resultado cargado. ${msg}`
        if (msg) return `400: ${msg}`
      }
    }
    return '400: payload inválido (estado, archivo o campos obligatorios).'
  }
  return `Error ${status}: solicitud fallida.`
}

export default function ColaLaboratorio() {
  const puedeVer = useMemo(() => hasRole('Laboratorio', 'Administrativo', 'Director'), [])
  const [rows, setRows] = useState<OrdenEstudioDetail[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [selected, setSelected] = useState<OrdenEstudioDetail | null>(null)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [fechaResultado, setFechaResultado] = useState('')
  const [valores, setValores] = useState('')
  const [interpretacion, setInterpretacion] = useState('')
  const [uploading, setUploading] = useState(false)
  const [modalError, setModalError] = useState('')

  const cargarCola = async () => {
    setLoading(true)
    setError('')
    try {
      const cola = await obtenerColaLaboratorio()
      const joined: OrdenEstudioListItem[] = [...cola.urgentes, ...cola.en_proceso, ...cola.normales]
      const unique = Array.from(new Map(joined.map((r) => [r.id, r])).values())
      const details = await Promise.all(unique.map((r) => obtenerOrdenDetalle(r.id)))
      details.sort((a, b) => Number(b.urgente) - Number(a.urgente) || Date.parse(a.fecha_solicitud) - Date.parse(b.fecha_solicitud))
      setRows(details)
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (puedeVer) void cargarCola()
  }, [puedeVer])

  const cambiarEstado = async (id: number, estado: OrdenEstado) => {
    setMsg('')
    setError('')
    try {
      await cambiarEstadoOrden(id, estado)
      setMsg(`Orden #${id} actualizada a ${estado}.`)
      await cargarCola()
    } catch (err) {
      setError(parseApiError(err))
    }
  }

  const cargarResultado = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    setError('')
    setModalError('')
    if (!selected) return
    if (!archivo) {
      setModalError('Debes seleccionar un archivo PDF o imagen.')
      return
    }
    if (!fechaResultado) {
      setModalError('Debes definir fecha del resultado.')
      return
    }
    setUploading(true)
    try {
      const iso = new Date(fechaResultado).toISOString()
      const res = await subirResultadoEstudio({
        orden: selected.id,
        fecha_resultado: iso,
        archivo_adjunto: archivo,
        valores_resultado: valores,
        interpretacion_medica: interpretacion,
      })
      if (res.hash_sha256) {
        // Dato técnico disponible para depuración, no visible para el usuario final.
        console.log('hash_sha256 generado por backend:', res.hash_sha256)
      }
      await cambiarEstadoOrden(selected.id, 'COMPLETADA')
      setMsg('Resultado cargado correctamente y orden completada.')
      setSelected(null)
      setArchivo(null)
      setValores('')
      setInterpretacion('')
      setFechaResultado('')
      await cargarCola()
    } catch (err) {
      const apiErr = parseApiError(err)
      setModalError(apiErr)
      setError(apiErr)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: '22px', color: '#0003B8', margin: 0 }}>Cola de Laboratorio</h1>
        <p style={{ color: '#5b6480', marginTop: 6, fontSize: 13 }}>
          Órdenes pendientes priorizadas por urgencia.
        </p>
      </div>

      {!puedeVer && <div style={{ background: '#FFF3CD', color: '#664D03', border: '1px solid #FFECB5', borderRadius: 10, padding: 12 }}>Sin permisos para ver esta cola.</div>}
      {error && <div style={{ marginBottom: 12, color: '#B42318', background: '#FEF3F2', border: '1px solid #FECACA', padding: 10, borderRadius: 8 }}>{error}</div>}
      {msg && <div style={{ marginBottom: 12, color: '#0A7B57', background: '#ECFDF3', border: '1px solid #ABEFC6', padding: 10, borderRadius: 8 }}>{msg}</div>}

      {puedeVer && (
        <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,3,184,0.06)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 24, color: '#0003B8', fontWeight: 600 }}>Cargando cola...</div>
          ) : (
            <>
              <div className="estudios-desktop-table">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F0F6FF' }}>
                      {['Paciente', 'Consulta', 'Tipo', 'Indicación', 'Estado', 'Fecha', 'Médico', ''].map((h) => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: h === '' ? 'right' : 'left', fontSize: 11, color: '#0003B8', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} style={{ borderTop: '1px solid #EDF1FF' }}>
                        <td style={{ padding: '10px 12px' }}>{r.paciente_nombre || '—'}{r.urgente ? ' (Urgente)' : ''}</td>
                        <td style={{ padding: '10px 12px' }}>#{r.consulta_id}</td>
                        <td style={{ padding: '10px 12px' }}>{r.tipo_label}</td>
                        <td style={{ padding: '10px 12px', maxWidth: 240 }}>{r.indicacion_clinica}</td>
                        <td style={{ padding: '10px 12px' }}>{r.estado_label}</td>
                        <td style={{ padding: '10px 12px' }}>{fmtDate(r.fecha_solicitud)}</td>
                        <td style={{ padding: '10px 12px' }}>{r.medico_solicitante_nombre || '—'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            {r.estado === 'SOLICITADA' && <button onClick={() => void cambiarEstado(r.id, 'EN_PROCESO')}>Iniciar</button>}
                            <button onClick={() => setSelected(r)}>Cargar resultado</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="estudios-mobile-cards">
                {rows.map((r) => (
                  <div key={r.id} style={{ borderTop: '1px solid #EDF1FF', padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <strong>{r.paciente_nombre || 'Sin paciente'}</strong>
                      <span style={{ color: '#0003B8', fontWeight: 600 }}>{r.estado_label}</span>
                    </div>
                    <p style={{ margin: '6px 0', color: '#4B5565', fontSize: 13 }}>Consulta #{r.consulta_id} · {r.tipo_label}</p>
                    <p style={{ margin: '6px 0', fontSize: 13 }}>{r.indicacion_clinica}</p>
                    <p style={{ margin: '6px 0', color: '#6B7280', fontSize: 12 }}>Médico: {r.medico_solicitante_nombre || '—'}</p>
                    <p style={{ margin: '6px 0', color: '#6B7280', fontSize: 12 }}>{fmtDate(r.fecha_solicitud)}</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      {r.estado === 'SOLICITADA' && <button onClick={() => void cambiarEstado(r.id, 'EN_PROCESO')}>Iniciar</button>}
                      <button onClick={() => setSelected(r)}>Cargar resultado</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {selected && (
        <div className="estudios-modal-overlay">
          <div className="estudios-modal estudios-modal-lg">
            <h3 style={{ margin: 0, color: '#0003B8', fontSize: 20 }}>Cargar resultado de estudio</h3>
            <p style={{ margin: '6px 0 12px', color: '#5b6480', fontSize: 13 }}>
              Adjunta documento clínico y completa los datos de interpretación.
            </p>

            <div className="resultado-contexto-card">
              <p><strong>Paciente:</strong> {selected.paciente_nombre || 'Sin paciente'}</p>
              <p><strong>Tipo de estudio:</strong> {selected.tipo_label}</p>
              <p><strong>Estado de la orden:</strong> {selected.estado_label}</p>
              <p><strong>Prioridad:</strong> {selected.urgente ? 'Urgente' : 'Normal'}</p>
              <p><strong>Indicación clínica:</strong> {selected.indicacion_clinica || '—'}</p>
            </div>

            <form onSubmit={cargarResultado}>
              <div className="modal-grid">
                <div>
                  <label className="estudios-label">Fecha del resultado</label>
                  <input type="datetime-local" value={fechaResultado} onChange={(e) => setFechaResultado(e.target.value)} />
                </div>
                <div>
                  <label className="estudios-label">Archivo (PDF o imagen)</label>
                  <label className="file-picker">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                    />
                    <span>{archivo ? `Archivo seleccionado: ${archivo.name}` : 'Seleccionar archivo'}</span>
                  </label>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="estudios-label">Valores de resultado (opcional)</label>
                  <textarea
                    rows={5}
                    value={valores}
                    onChange={(e) => setValores(e.target.value)}
                    placeholder="Ej: Hb 13.2 g/dL, Glucosa 95 mg/dL..."
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="estudios-label">Interpretación médica (opcional)</label>
                  <textarea
                    rows={5}
                    value={interpretacion}
                    onChange={(e) => setInterpretacion(e.target.value)}
                    placeholder="Resumen clínico de interpretación del resultado..."
                  />
                </div>
              </div>

              {modalError && (
                <div className="estudios-alert estudios-alert-error" style={{ marginTop: 10 }}>
                  {modalError}
                </div>
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => {
                    setSelected(null)
                    setModalError('')
                  }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={uploading} className="btn-primary">
                  {uploading ? 'Subiendo...' : 'Subir resultado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
