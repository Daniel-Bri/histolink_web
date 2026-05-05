import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fichaService } from '../../services/fichaService'
import { parseDrfErrorResponse } from '../../services/pacienteService'
import { api } from '../../api/axiosConfig'
import type { FichaBrief, TriajeResumen, NivelUrgencia } from '../../types/triaje.types'
import { NIVEL_COLORS, NIVEL_LABELS } from '../../types/triaje.types'
import type { Paciente } from '../../types/paciente.types'
import QuickPatientModal from './QuickPatientModal'

// ── Colores nivel urgencia ────────────────────────────────────────────────────

const NIVEL_BG: Record<NivelUrgencia, string> = {
  ROJO: '#DC2626', NARANJA: '#EA580C', AMARILLO: '#CA8A04', VERDE: '#16A34A', AZUL: '#2563EB',
}

// ── Modal detalle triaje ──────────────────────────────────────────────────────

function TriajeDetalleModal({ triaje, paciente, correlativo, onClose }: {
  triaje: TriajeResumen
  paciente: { nombre_completo: string; ci: string }
  correlativo: string
  onClose: () => void
}) {
  const colors = NIVEL_COLORS[triaje.nivel_urgencia]

  const signo = (label: string, value: string | number | null, unit = '') =>
    value !== null && value !== undefined ? (
      <div key={label} style={{ padding: '8px 12px', borderBottom: '1px solid #F1F5F9' }}>
        <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>{label}</span>
        <span style={{ float: 'right', fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
          {value}{unit && <span style={{ fontWeight: 400, color: '#64748B' }}> {unit}</span>}
        </span>
      </div>
    ) : null

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '16px',
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '520px',
        maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ background: '#122268', borderRadius: '16px 16px 0 0', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '11px', margin: '0 0 3px', letterSpacing: '0.06em' }}>EVALUACIÓN DE TRIAJE — {correlativo}</p>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: '16px', margin: 0 }}>{paciente.nombre_completo}</p>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', margin: '2px 0 0' }}>CI: {paciente.ci}</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px' }}>

          {/* Nivel urgencia */}
          <div style={{
            background: colors.bg, border: `2px solid ${colors.border}`,
            borderRadius: '12px', padding: '14px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '16px',
          }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: colors.text, margin: '0 0 2px', letterSpacing: '0.06em' }}>NIVEL DE URGENCIA</p>
              <p style={{ fontSize: '22px', fontWeight: 900, color: colors.text, margin: 0 }}>{triaje.nivel_urgencia}</p>
              <p style={{ fontSize: '12px', color: colors.text, margin: '2px 0 0', opacity: 0.8 }}>{NIVEL_LABELS[triaje.nivel_urgencia]}</p>
            </div>
            <div style={{ textAlign: 'right', fontSize: '12px', color: colors.text }}>
              {triaje.reglas_duras_aplicadas && <p style={{ margin: '0 0 4px', fontWeight: 700 }}>⚠ Regla clínica</p>}
              {triaje.fue_sobreescrito && (
                <p style={{ margin: 0 }}>
                  ✎ Modificado<br />
                  <span style={{ opacity: 0.75 }}>IA sugirió: {triaje.nivel_sugerido_ia}</span>
                </p>
              )}
              {!triaje.fue_sobreescrito && triaje.nivel_sugerido_ia && (
                <p style={{ margin: 0, opacity: 0.75 }}>IA: {triaje.nivel_sugerido_ia}</p>
              )}
            </div>
          </div>

          {/* Motivo */}
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#475569', margin: '0 0 6px' }}>MOTIVO DE CONSULTA</p>
            <p style={{ fontSize: '13px', color: '#1E293B', background: '#F8FAFC', borderRadius: '8px', padding: '10px 14px', margin: 0 }}>
              {triaje.motivo_consulta_triaje}
            </p>
          </div>

          {/* Signos vitales */}
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#475569', margin: '0 0 6px' }}>SIGNOS VITALES</p>
          <div style={{ background: '#F8FAFC', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
            {signo('Peso', triaje.peso_kg, 'kg')}
            {signo('Talla', triaje.talla_cm, 'cm')}
            {signo('Frec. cardíaca', triaje.frecuencia_cardiaca, 'lpm')}
            {signo('Frec. respiratoria', triaje.frecuencia_respiratoria, 'rpm')}
            {signo('Presión sistólica', triaje.presion_sistolica, 'mmHg')}
            {signo('Presión diastólica', triaje.presion_diastolica, 'mmHg')}
            {signo('Temperatura', triaje.temperatura_celsius, '°C')}
            {signo('Saturación O₂', triaje.saturacion_oxigeno, '%')}
            {signo('Glucemia capilar', triaje.glucemia, 'mg/dL')}
            {signo('Escala de dolor EVA', triaje.escala_dolor, '/10')}
            {signo('Glasgow', triaje.glasgow, '/15')}
          </div>

          {/* Observaciones / justificación */}
          {triaje.observaciones && (
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#475569', margin: '0 0 4px' }}>OBSERVACIONES</p>
              <p style={{ fontSize: '13px', color: '#475569', background: '#F8FAFC', borderRadius: '8px', padding: '10px 14px', margin: 0 }}>
                {triaje.observaciones}
              </p>
            </div>
          )}
          {triaje.fue_sobreescrito && triaje.justificacion_override && (
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#C2410C', margin: '0 0 4px' }}>JUSTIFICACIÓN DEL CAMBIO</p>
              <p style={{ fontSize: '13px', color: '#C2410C', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '8px', padding: '10px 14px', margin: 0 }}>
                {triaje.justificacion_override}
              </p>
            </div>
          )}

          <p style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'right', margin: '8px 0 0' }}>
            Registrado: {new Date(triaje.hora_triaje).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
        </div>
      </div>
    </div>
  )
}

const ESTADO_META: Record<string, { label: string; bg: string; text: string }> = {
  ABIERTA:     { label: 'Esperando triaje', bg: '#DBEAFE', text: '#1D4ED8' },
  EN_TRIAJE:   { label: 'En espera médico', bg: '#DCFCE7', text: '#15803D' },
  EN_ATENCION: { label: 'En atención',      bg: '#FFEDD5', text: '#C2410C' },
  CERRADA:     { label: 'Cerrada',          bg: '#F1F5F9', text: '#64748B' },
  CANCELADA:   { label: 'Cancelada',        bg: '#FEE2E2', text: '#DC2626' },
}

export default function UrgenciasPage() {
  const navigate = useNavigate()

  const [fichas, setFichas]     = useState<FichaBrief[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [showModal, setShowModal] = useState(false)

  const [search, setSearch]         = useState('')
  const [searchResults, setSearchResults] = useState<Paciente[]>([])
  const [searching, setSearching]   = useState(false)
  const [searchError, setSearchError] = useState('')
  const [creatingFicha, setCreatingFicha] = useState<number | null>(null)
  const [fichaDetalle, setFichaDetalle]   = useState<FichaBrief | null>(null)

  const loadFichas = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fichaService.listar({ en_curso: true })
      const activas = res.data.results.filter(f =>
        f.estado === 'ABIERTA' || f.estado === 'EN_TRIAJE'
      )
      setFichas(activas)
    } catch {
      setError('No se pudo cargar la cola de urgencias.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadFichas() }, [loadFichas])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!search.trim()) return
    setSearching(true)
    setSearchError('')
    setSearchResults([])
    try {
      const res = await api.get<{ results: Paciente[] }>('pacientes/pacientes/', {
        params: { search: search.trim(), page_size: 8 },
      })
      setSearchResults(res.data.results ?? [])
      if ((res.data.results ?? []).length === 0) setSearchError('No se encontraron pacientes.')
    } catch {
      setSearchError('Error al buscar.')
    } finally {
      setSearching(false)
    }
  }

  const handleCrearFicha = async (pacienteId: number) => {
    setCreatingFicha(pacienteId)
    try {
      const res = await fichaService.crear(pacienteId)
      navigate(`/urgencias/${res.data.id}/triaje`)
    } catch (err: unknown) {
      const data = (err as { response?: { data?: unknown } })?.response?.data
      const { general } = parseDrfErrorResponse(data)
      alert(general.join(' ') || 'No se pudo crear la ficha. El usuario debe tener perfil de personal de salud.')
    } finally {
      setCreatingFicha(null)
    }
  }

  const pendientesTriaje = fichas.filter(f => f.estado === 'ABIERTA')
  const enEspera         = fichas.filter(f => f.estado === 'EN_TRIAJE')

  return (
    <div style={{ padding: '28px 32px', fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1E293B', margin: 0 }}>
            Urgencias
          </h1>
          <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0' }}>
            Cola de atención y registro de triaje
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => void loadFichas()}
            style={{
              padding: '8px 14px', border: '1px solid #B3D4FF',
              borderRadius: '8px', background: '#fff',
              color: '#1D4ED8', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            ↻ Actualizar
          </button>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '8px 18px', border: 'none',
              borderRadius: '8px', background: '#00A896',
              color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
            }}
          >
            + Nuevo Ingreso Urgente
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: '#FEE2E2', border: '1px solid #FECACA',
          borderRadius: '8px', padding: '12px 16px',
          color: '#991B1B', fontSize: '13px', marginBottom: '20px',
        }}>
          {error}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Pendientes de triaje', value: pendientesTriaje.length, color: '#1D4ED8', bg: '#DBEAFE' },
          { label: 'En espera de médico',  value: enEspera.length,         color: '#15803D', bg: '#DCFCE7' },
          { label: 'Total en cola',         value: fichas.length,           color: '#374151', bg: '#F1F5F9' },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, borderRadius: '12px', padding: '14px 20px',
            minWidth: '160px',
          }}>
            <p style={{ fontSize: '28px', fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: '12px', color: s.color, margin: '2px 0 0', fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px', alignItems: 'start' }}>

        {/* Cola principal */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{
            padding: '14px 20px', background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>Cola de urgencias</span>
            <span style={{
              background: '#DBEAFE', color: '#1D4ED8',
              fontSize: '11px', fontWeight: 700,
              padding: '2px 8px', borderRadius: '12px',
            }}>{fichas.length}</span>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
              Cargando...
            </div>
          ) : fichas.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <p style={{ fontSize: '32px', margin: '0 0 8px' }}>✓</p>
              <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
                No hay pacientes en cola
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Ficha', 'Paciente', 'CI', 'Hora ingreso', 'Estado', ''].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontSize: '11px', fontWeight: 700,
                      color: '#64748B', letterSpacing: '0.05em',
                      borderBottom: '1px solid #E2E8F0',
                    }}>
                      {h.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fichas.map((ficha, idx) => {
                  const meta = ESTADO_META[ficha.estado] ?? { label: ficha.estado, bg: '#F1F5F9', text: '#64748B' }
                  return (
                    <tr
                      key={ficha.id}
                      style={{ background: idx % 2 === 0 ? '#fff' : '#FAFBFF' }}
                    >
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: '#1D4ED8', borderBottom: '1px solid #F1F5F9' }}>
                        {ficha.correlativo}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#1E293B', borderBottom: '1px solid #F1F5F9' }}>
                        {ficha.paciente.nombre_completo}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569', borderBottom: '1px solid #F1F5F9' }}>
                        {ficha.paciente.ci}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>
                        {new Date(ficha.fecha_apertura).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9' }}>
                        <span style={{
                          background: meta.bg, color: meta.text,
                          fontSize: '11px', fontWeight: 700,
                          padding: '3px 10px', borderRadius: '12px',
                        }}>
                          {meta.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9' }}>
                        {ficha.estado === 'ABIERTA' && (
                          <button
                            onClick={() => navigate(`/urgencias/${ficha.id}/triaje`)}
                            style={{
                              padding: '6px 14px', border: 'none',
                              borderRadius: '6px', background: '#0080FF',
                              color: '#fff', fontSize: '12px',
                              fontWeight: 700, cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Realizar triaje →
                          </button>
                        )}
                        {ficha.estado === 'EN_TRIAJE' && ficha.triaje_resumen && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              background: NIVEL_BG[ficha.triaje_resumen.nivel_urgencia],
                              color: '#fff', fontSize: '11px', fontWeight: 800,
                              padding: '3px 10px', borderRadius: '12px',
                              letterSpacing: '0.04em',
                            }}>
                              {ficha.triaje_resumen.nivel_urgencia}
                            </span>
                            <button
                              onClick={() => setFichaDetalle(ficha)}
                              style={{
                                padding: '4px 10px', border: '1px solid #B3D4FF',
                                borderRadius: '6px', background: '#fff',
                                color: '#1D4ED8', fontSize: '11px',
                                fontWeight: 600, cursor: 'pointer',
                              }}
                            >
                              Ver evaluación
                            </button>
                          </div>
                        )}
                        {ficha.estado === 'EN_TRIAJE' && !ficha.triaje_resumen && (
                          <span style={{ fontSize: '12px', color: '#64748B' }}>Triaje completo</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Panel derecho: búsqueda de paciente existente */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', margin: 0 }}>
              Buscar paciente existente
            </p>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>
              Busca por CI o apellido para abrir una ficha
            </p>
          </div>

          <div style={{ padding: '16px' }}>
            <form onSubmit={e => void handleSearch(e)} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="CI o apellido..."
                style={{
                  flex: 1, padding: '8px 12px',
                  border: '1px solid #B3D4FF', borderRadius: '8px',
                  fontSize: '13px', outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={searching}
                style={{
                  padding: '8px 14px', border: 'none',
                  borderRadius: '8px', background: '#122268',
                  color: '#fff', fontSize: '13px',
                  fontWeight: 600, cursor: 'pointer',
                }}
              >
                {searching ? '...' : 'Buscar'}
              </button>
            </form>

            {searchError && (
              <p style={{ color: '#DC2626', fontSize: '12px', margin: '0 0 10px' }}>{searchError}</p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {searchResults.map(p => (
                <div
                  key={p.id}
                  style={{
                    padding: '10px 14px', border: '1px solid #E2E8F0',
                    borderRadius: '8px', background: '#FAFBFF',
                  }}
                >
                  <p style={{ fontWeight: 600, fontSize: '13px', color: '#1E293B', margin: '0 0 2px' }}>
                    {p.nombre} {p.apellido}
                  </p>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 8px' }}>
                    CI: {p.ci}
                  </p>
                  <button
                    onClick={() => void handleCrearFicha(p.id)}
                    disabled={creatingFicha === p.id}
                    style={{
                      padding: '5px 12px', border: 'none',
                      borderRadius: '6px',
                      background: creatingFicha === p.id ? '#9CA3AF' : '#00A896',
                      color: '#fff', fontSize: '12px',
                      fontWeight: 700, cursor: creatingFicha === p.id ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {creatingFicha === p.id ? 'Abriendo...' : 'Abrir ficha e ir a triaje →'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showModal && <QuickPatientModal onClose={() => setShowModal(false)} />}

      {fichaDetalle?.triaje_resumen && (
        <TriajeDetalleModal
          triaje={fichaDetalle.triaje_resumen}
          paciente={fichaDetalle.paciente}
          correlativo={fichaDetalle.correlativo}
          onClose={() => setFichaDetalle(null)}
        />
      )}
    </div>
  )
}
