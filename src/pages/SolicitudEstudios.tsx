import { useEffect, useMemo, useState } from 'react'
import type { AxiosError } from 'axios'
import { hasRole, getStoredUser } from '../utils/auth'
import {
  crearOrdenEstudio,
  listarConsultasParaEstudio,
  type ConsultaOption,
  type CrearOrdenPayload,
} from '../services/estudiosService'

type TipoEstudio = CrearOrdenPayload['tipo']

const TIPOS: Array<{ value: TipoEstudio; label: string }> = [
  { value: 'LAB', label: 'Laboratorio' },
  { value: 'RX', label: 'Radiografía' },
  { value: 'ECO', label: 'Ecografía' },
  { value: 'TC', label: 'Tomografía Computarizada' },
  { value: 'RMN', label: 'Resonancia Magnética' },
  { value: 'ECG', label: 'Electrocardiograma' },
  { value: 'END', label: 'Endoscopía' },
  { value: 'OTRO', label: 'Otro' },
]

function parseApiError(err: unknown, defaultMessage: string): string {
  const axiosErr = err as AxiosError<Record<string, unknown>>
  const status = axiosErr.response?.status
  const data = axiosErr.response?.data
  const token = localStorage.getItem('access_token')
  if (!token) return 'No hay token de sesión. Inicia sesión para continuar.'
  if (!status) return 'No se pudo conectar con el servidor. Verifica backend, red o CORS.'
  if (status === 401) return '401: token inválido o expirado.'
  if (status === 403) return '403: tu rol no tiene permiso para esta operación.'
  if (status === 404) return '404: endpoint no encontrado en backend.'
  if (status === 400 && data && typeof data === 'object') {
    const first = Object.values(data)[0]
    if (Array.isArray(first) && first[0]) return `400: ${String(first[0])}`
    if (typeof first === 'string') return `400: ${first}`
    return '400: el backend rechazó datos. Revisa consulta seleccionada y campos obligatorios.'
  }
  return `${defaultMessage} (HTTP ${status}).`
}

function nombrePaciente(c: ConsultaOption): string {
  if (c.paciente_nombre) return c.paciente_nombre
  if (c.paciente_display) return c.paciente_display
  if (typeof c.paciente === 'string' && c.paciente.trim()) return c.paciente
  if (typeof c.paciente === 'number') return `Paciente #${c.paciente}`
  return 'Paciente no disponible'
}

export default function SolicitudEstudios() {
  const puedeSolicitar = useMemo(() => hasRole('Médico', 'Administrativo', 'Director'), [])
  const user = getStoredUser()
  const [consultas, setConsultas] = useState<ConsultaOption[]>([])
  const [search, setSearch] = useState('')
  const [consultaId, setConsultaId] = useState<number | null>(null)
  const [loadingConsultas, setLoadingConsultas] = useState(false)
  const [tipo, setTipo] = useState<TipoEstudio>('LAB')
  const [descripcion, setDescripcion] = useState('')
  const [indicacion, setIndicacion] = useState('')
  const [urgente, setUrgente] = useState(false)
  const [motivoUrgencia, setMotivoUrgencia] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [consultasVaciasMsg, setConsultasVaciasMsg] = useState('')

  useEffect(() => {
    if (!puedeSolicitar) return
    const load = async () => {
      setLoadingConsultas(true)
      setError('')
      setConsultasVaciasMsg('')
      try {
        const data = await listarConsultasParaEstudio()
        setConsultas(data)
        if (data.length === 0) {
          setConsultasVaciasMsg('No hay consultas completadas disponibles para solicitar estudios.')
        }
      } catch (err) {
        setError(parseApiError(err, 'Falló la carga de consultas'))
      } finally {
        setLoadingConsultas(false)
      }
    }
    void load()
  }, [puedeSolicitar])

  const consultasFiltradas = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return consultas
    return consultas.filter((c) => {
      const texto = [
        nombrePaciente(c),
        c.ficha_correlativo ?? '',
        String(c.ficha ?? ''),
        c.motivo_consulta ?? '',
        c.impresion_diagnostica ?? '',
        c.codigo_cie10_principal ?? '',
        c.creado_en ?? '',
      ].join(' ').toLowerCase()
      return texto.includes(q)
    })
  }, [consultas, search])

  const selected = useMemo(
    () => consultas.find((c) => c.id === consultaId) ?? null,
    [consultas, consultaId],
  )

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setOk('')

    if (!localStorage.getItem('access_token')) {
      setError('No hay token de sesión. Vuelve a iniciar sesión.')
      return
    }
    if (!puedeSolicitar) {
      setError('No tienes permisos para solicitar estudios.')
      return
    }
    if (!consultaId) {
      setError('Debes seleccionar una consulta.')
      return
    }
    if (!indicacion.trim()) {
      setError('La indicación clínica es obligatoria.')
      return
    }
    if (!descripcion.trim()) {
      setError('La descripción del estudio es obligatoria.')
      return
    }
    if (urgente && !motivoUrgencia.trim()) {
      setError('Debes especificar el motivo de urgencia.')
      return
    }

    setLoading(true)
    try {
      const payload: CrearOrdenPayload = {
        consulta_id: consultaId,
        tipo,
        descripcion: descripcion.trim(),
        indicacion_clinica: indicacion.trim(),
        urgente,
        motivo_urgencia: urgente ? motivoUrgencia.trim() : undefined,
      }
      const created = await crearOrdenEstudio(payload)
      setOk(`Orden ${created.correlativo_orden} creada correctamente.`)
      setDescripcion('')
      setIndicacion('')
      setUrgente(false)
      setMotivoUrgencia('')
    } catch (err) {
      setError(parseApiError(err, 'No se pudo crear la orden'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '28px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', color: '#0003B8', margin: 0 }}>Solicitud de Estudios</h1>
        <p style={{ color: '#5f6b8a', margin: '6px 0 0', fontSize: 13 }}>
          Módulo clínico para generar órdenes a partir de consultas completadas.
        </p>
      </div>

      {!puedeSolicitar && (
        <div className="estudios-alert estudios-alert-warn" style={{ marginBottom: 12 }}>
          Este módulo no está habilitado para tu rol.
        </div>
      )}
      {error && <div className="estudios-alert estudios-alert-error" style={{ marginBottom: 12 }}>{error}</div>}
      {ok && <div className="estudios-alert estudios-alert-ok" style={{ marginBottom: 12 }}>{ok}</div>}

      <form onSubmit={onSubmit}>
        <div className="estudios-layout-grid">
          <section className="estudios-shell-card">
            <h2 className="estudios-section-title">Consulta base</h2>
            <div>
              <label className="estudios-label">Buscar consulta</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por paciente, ficha, motivo, diagnóstico o CIE-10"
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <label className="estudios-label">Seleccionar consulta</label>
              <div className="consulta-lista">
                {loadingConsultas && <div className="consulta-item consulta-item-muted">Cargando consultas...</div>}
                {!loadingConsultas && consultasFiltradas.length === 0 && (
                  <div className="consulta-item consulta-item-muted">
                    {consultasVaciasMsg || 'No hay consultas que coincidan con tu búsqueda.'}
                  </div>
                )}
                {!loadingConsultas && consultasFiltradas.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    className={`consulta-item ${consultaId === c.id ? 'consulta-item-active' : ''}`}
                    onClick={() => setConsultaId(c.id)}
                  >
                    <div className="consulta-item-title">{nombrePaciente(c)}</div>
                    <div className="consulta-item-sub">
                      {c.ficha_correlativo ? `Ficha ${c.ficha_correlativo}` : `Ficha #${c.ficha ?? '—'}`} · {c.creado_en ? new Date(c.creado_en).toLocaleString() : 'Sin fecha'}
                    </div>
                    <div className="consulta-item-sub">{c.motivo_consulta || 'Sin motivo de consulta'}</div>
                    <div className="consulta-item-date">
                      {c.impresion_diagnostica || 'Sin diagnóstico'}{c.codigo_cie10_principal ? ` · CIE-10: ${c.codigo_cie10_principal}` : ''}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            {selected && (
              <div style={{ marginTop: 12 }} className="consulta-resumen">
                <h3 style={{ margin: '0 0 8px', color: '#0F2C7A', fontSize: 14 }}>Consulta seleccionada</h3>
                <p style={{ margin: '4px 0', fontSize: 13 }}><strong>Paciente:</strong> {nombrePaciente(selected)}</p>
                <p style={{ margin: '4px 0', fontSize: 13 }}><strong>Ficha:</strong> {selected.ficha_correlativo || `#${selected.ficha ?? '—'}`}</p>
                <p style={{ margin: '4px 0', fontSize: 13 }}><strong>Fecha:</strong> {selected.creado_en ? new Date(selected.creado_en).toLocaleString() : 'Sin fecha'}</p>
                <p style={{ margin: '4px 0', fontSize: 13 }}><strong>Motivo:</strong> {selected.motivo_consulta || '—'}</p>
                <p style={{ margin: '4px 0', fontSize: 13 }}><strong>Diagnóstico:</strong> {selected.impresion_diagnostica || '—'}{selected.codigo_cie10_principal ? ` (${selected.codigo_cie10_principal})` : ''}</p>
              </div>
            )}
          </section>

          <section className="estudios-shell-card">
            <h2 className="estudios-section-title">Tipo de estudio</h2>
            <div className="tipo-grid">
              {TIPOS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`tipo-chip ${tipo === t.value ? 'tipo-chip-active' : ''}`}
                  onClick={() => setTipo(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </section>

          <section className="estudios-shell-card">
            <h2 className="estudios-section-title">Información clínica</h2>
            <div>
              <label className="estudios-label">Descripción del estudio</label>
              <input
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: Perfil hepático completo"
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <label className="estudios-label">Indicación clínica</label>
              <textarea
                value={indicacion}
                onChange={(e) => setIndicacion(e.target.value)}
                rows={5}
                placeholder="Describe la razón médica del estudio..."
              />
            </div>
          </section>

          <section className="estudios-shell-card">
            <h2 className="estudios-section-title">Prioridad del estudio</h2>
            <div className="prioridad-card">
              <div className="prioridad-grid">
                <button
                  type="button"
                  className={`prioridad-btn ${!urgente ? 'prioridad-btn-active prioridad-btn-normal' : ''}`}
                  onClick={() => setUrgente(false)}
                >
                  Normal
                </button>
                <button
                  type="button"
                  className={`prioridad-btn ${urgente ? 'prioridad-btn-active prioridad-btn-urgente' : ''}`}
                  onClick={() => setUrgente(true)}
                >
                  Urgente
                </button>
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#60708d' }}>
                Normal: flujo estándar. Urgente: prioridad en cola de laboratorio.
              </p>
              {urgente && (
                <div style={{ marginTop: 12 }}>
                  <label className="estudios-label">Motivo de urgencia</label>
                  <textarea
                    value={motivoUrgencia}
                    onChange={(e) => setMotivoUrgencia(e.target.value)}
                    rows={5}
                    placeholder="Explica por qué este estudio requiere prioridad..."
                  />
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="estudios-shell-card" style={{ marginTop: 14 }}>
          <button type="submit" disabled={loading || !puedeSolicitar} className="estudios-submit-btn">
            {loading ? 'Enviando...' : 'Crear orden de estudio'}
          </button>
          <p style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
            Usuario: <strong>{user?.username ?? 'sin sesión'}</strong>
          </p>
        </div>
      </form>
    </div>
  )
}
