import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, CheckCircle, SkipForward, RefreshCw, XCircle, AlertTriangle, UserPlus } from 'lucide-react'
import { api } from '../api/axiosConfig'
import { fichaService } from '../services/fichaService'
import { parseDrfErrorResponse } from '../services/pacienteService'
import type { Paciente } from '../types/paciente.types'
import type { FichaBrief } from '../types/triaje.types'
import { hasRole } from '../utils/auth'

const COLORS = {
  primary:    '#0003B8',
  success:    '#00A896',
  danger:     '#DC2626',
  warning:    '#EA580C',
  info:       '#1D4ED8',
  border:     '#B3D4FF',
  text:       '#1E293B',
  textMuted:  '#64748B',
  rowHover:   '#F0F6FF',
  rowSelected:'#DBEAFE',
}

const ESTADO_META: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  ABIERTA:    { label: 'Esperando',   bg: '#DBEAFE', text: '#1D4ED8', icon: <RefreshCw size={12} /> },
  EN_TRIAJE:  { label: 'En Triaje',   bg: '#FEF3C7', text: '#B45309', icon: <AlertTriangle size={12} /> },
  EN_ATENCION:{ label: 'En Atención', bg: '#DCFCE7', text: '#15803D', icon: <Play size={12} /> },
  CERRADA:    { label: 'Finalizado',  bg: '#F1F5F9', text: '#64748B', icon: <CheckCircle size={12} /> },
  CANCELADA:  { label: 'Cancelada',   bg: '#FEE2E2', text: '#DC2626', icon: <XCircle size={12} /> },
}

function toIsoDay(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

export default function AperturaFichaColaDia() {
  const navigate = useNavigate()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null)

  const esMedico = useMemo(() => hasRole('Médico', 'Director'), [])
  const hoyIso   = useMemo(() => toIsoDay(new Date()), [])

  const [loading, setLoading]           = useState(false)
  const [fichas, setFichas]             = useState<FichaBrief[]>([])
  const [selectedFichaId, setSelectedFichaId] = useState<number | null>(null)

  const [searchQuery, setSearchQuery]   = useState('')
  const [searching, setSearching]       = useState(false)
  const [searchResults, setSearchResults] = useState<Paciente[]>([])

  const [toast, setToast]               = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [confirmModal, setConfirmModal] = useState<{ fichaId: number; nextState: string } | null>(null)
  const [dontAskAgain, setDontAskAgain] = useState(false)

  // ── Toast ────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  // ── Cargar cola ──────────────────────────────────────────────────────────
  const cargarColaDia = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fichaService.listar({ fecha_desde: hoyIso, fecha_hasta: hoyIso, page_size: 100 })
      setFichas(res.data.results ?? [])
    } catch {
      showToast('No se pudo cargar la cola de atención.', 'error')
    } finally {
      setLoading(false)
    }
  }, [hoyIso, showToast])

  useEffect(() => { void cargarColaDia() }, [cargarColaDia])

  // ── Auto-focus al cargar ─────────────────────────────────────────────────
  useEffect(() => { searchInputRef.current?.focus() }, [])

  // ── Búsqueda automática con debounce 300ms ───────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const q = searchQuery.trim()
    if (!q) { setSearchResults([]); return }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await api.get<{ results: Paciente[] }>('pacientes/pacientes/', {
          params: { search: q, page_size: 20 },
        })
        setSearchResults(res.data.results ?? [])
        if ((res.data.results ?? []).length === 0) showToast('No se encontraron pacientes.', 'info')
      } catch {
        showToast('Error al buscar pacientes.', 'error')
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchQuery])

  // ── Ctrl+F → enfocar | Escape → limpiar ─────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      }
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('')
        setSearchResults([])
        searchInputRef.current?.focus()
      }
      if (selectedFichaId) {
        const ficha = fichas.find(f => f.id === selectedFichaId)
        if (!ficha) return
        if (e.key === 'F2' && (ficha.estado === 'ABIERTA' || ficha.estado === 'EN_TRIAJE')) {
          e.preventDefault(); void handleCambiarEstado(ficha.id, 'EN_ATENCION')
        }
        if (e.key === 'F3' && ficha.estado === 'EN_ATENCION') {
          e.preventDefault(); void handleCambiarEstado(ficha.id, 'CERRADA')
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [searchQuery, selectedFichaId, fichas])

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleAbrirFicha = async (pacienteId: number) => {
    const yaTiene = fichas.find(f => f.paciente.id === pacienteId && f.estado !== 'CANCELADA')
    if (yaTiene) {
      showToast(`${yaTiene.paciente.nombre_completo} ya tiene una ficha abierta hoy.`, 'info')
      setSelectedFichaId(yaTiene.id)
      setSearchQuery(''); setSearchResults([])
      return
    }
    setLoading(true)
    try {
      const res = await fichaService.crear(pacienteId)
      showToast(`Ficha ${res.data.correlativo} abierta correctamente.`, 'success')
      await cargarColaDia()
      setSearchQuery(''); setSearchResults([])
    } catch (err: any) {
      const { general } = parseDrfErrorResponse(err.response?.data)
      showToast(general[0] || 'Error al abrir ficha.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCambiarEstado = async (fichaId: number, nextState: string, bypassConfirm = false) => {
    if (nextState === 'CERRADA' && !bypassConfirm && !dontAskAgain) {
      setConfirmModal({ fichaId, nextState }); return
    }
    setLoading(true)
    try {
      await fichaService.cambiarEstado(fichaId, nextState)
      showToast('Estado actualizado.', 'success')
      await cargarColaDia()
    } catch (err: any) {
      const { general } = parseDrfErrorResponse(err.response?.data)
      showToast(general[0] || 'No se pudo cambiar el estado.', 'error')
    } finally {
      setLoading(false); setConfirmModal(null)
    }
  }

  const handleSiguientePaciente = async () => {
    const siguiente = fichas.find(f => f.estado === 'ABIERTA' || f.estado === 'EN_TRIAJE')
    if (!siguiente) { showToast('No hay pacientes esperando.', 'info'); return }
    await handleCambiarEstado(siguiente.id, 'EN_ATENCION')
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '32px' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
          background: toast.type === 'error' ? COLORS.danger : toast.type === 'success' ? COLORS.success : COLORS.info,
          color: 'white', padding: '12px 20px', borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontWeight: 600, fontSize: '14px',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: COLORS.primary, margin: 0 }}>Apertura de Ficha</h1>
          <p style={{ color: COLORS.textMuted, fontSize: '13px', margin: '4px 0 0 0' }}>
            {fichas.length > 0 ? `${fichas.length} ficha${fichas.length !== 1 ? 's' : ''} hoy` : 'Cola de atención del día'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => void cargarColaDia()}
            disabled={loading}
            style={{ background: 'white', border: `1.5px solid ${COLORS.border}`, color: COLORS.info, padding: '9px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} /> Actualizar
          </button>
          {esMedico && (
            <button
              onClick={handleSiguientePaciente}
              disabled={loading}
              style={{ background: COLORS.success, color: 'white', border: 'none', padding: '9px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(0,168,150,0.25)' }}
            >
              <SkipForward size={16} /> Siguiente Paciente
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>

        {/* Panel izquierdo: Cola */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,3,184,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0F6FF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: COLORS.text, fontSize: '14px' }}>Pacientes en cola hoy</span>
            <span style={{ fontSize: '12px', color: COLORS.textMuted }}>F2 = iniciar · F3 = finalizar</span>
          </div>

          {loading && fichas.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: COLORS.primary, fontWeight: 600 }}>
              Cargando...
            </div>
          ) : fichas.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: COLORS.textMuted }}>
              <p style={{ margin: 0 }}>No hay pacientes registrados hoy.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F0F6FF' }}>
                  {['Ficha', 'Paciente', 'CI', 'Hora', 'Estado', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: h === '' ? 'right' : 'left', fontSize: '11px', fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fichas.map((ficha, i) => {
                  const isSelected = selectedFichaId === ficha.id
                  const meta = ESTADO_META[ficha.estado] ?? { label: ficha.estado, bg: '#eee', text: '#333', icon: null }

                  const onDoubleClick = () => {
                    if (!esMedico) return
                    if (ficha.estado === 'ABIERTA' || ficha.estado === 'EN_TRIAJE') void handleCambiarEstado(ficha.id, 'EN_ATENCION')
                    else if (ficha.estado === 'EN_ATENCION') void handleCambiarEstado(ficha.id, 'CERRADA')
                  }

                  return (
                    <tr
                      key={ficha.id}
                      onClick={() => setSelectedFichaId(ficha.id)}
                      onDoubleClick={onDoubleClick}
                      style={{
                        background: isSelected ? COLORS.rowSelected : i % 2 === 0 ? 'white' : '#FAFCFF',
                        cursor: 'pointer',
                        borderTop: '1px solid #F0F6FF',
                        transition: 'background 0.15s',
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: COLORS.info }}>{ficha.correlativo}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600 }}>{ficha.paciente.nombre_completo}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: COLORS.textMuted }}>{ficha.paciente.ci}</td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: COLORS.textMuted }}>
                        {new Date(ficha.fecha_apertura).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: meta.bg, color: meta.text, fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px' }}>
                          {meta.icon}{meta.label}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          {(ficha.estado === 'ABIERTA' || ficha.estado === 'EN_TRIAJE') && esMedico && (
                            <button
                              onClick={async e => { e.stopPropagation(); await fichaService.cambiarEstado(ficha.id, 'EN_ATENCION').catch(() => {}); navigate(`/consulta/ficha/${ficha.id}`) }}
                              style={{ background: COLORS.primary, color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Atender
                            </button>
                          )}
                          {ficha.estado === 'EN_ATENCION' && esMedico && (
                            <button
                              onClick={e => { e.stopPropagation(); void handleCambiarEstado(ficha.id, 'CERRADA') }}
                              style={{ background: COLORS.success, color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Finalizar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Panel derecho: Búsqueda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,3,184,0.06)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: COLORS.primary, margin: '0 0 4px 0' }}>Apertura de Ficha</h3>
            <p style={{ fontSize: '12px', color: COLORS.textMuted, margin: '0 0 16px 0' }}>Busca al paciente por CI o apellido (Ctrl+F)</p>

            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Escape' && (setSearchQuery(''), setSearchResults([]))}
                placeholder="Buscar por CI o apellido... (Ctrl+F)"
                autoFocus
                style={{
                  width: '100%', padding: '10px 36px 10px 12px',
                  border: `1.5px solid ${COLORS.border}`, borderRadius: '8px',
                  fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                }}
              />
              {searching && (
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: COLORS.textMuted }}>
                  ...
                </span>
              )}
              {searchQuery && !searching && (
                <button
                  onClick={() => { setSearchQuery(''); setSearchResults([]) }}
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '16px', lineHeight: 1 }}
                >×</button>
              )}
            </div>

            <button
              onClick={() => navigate('/pacientes/registro')}
              style={{
                width: '100%', padding: '9px', background: 'transparent',
                border: `1.5px dashed ${COLORS.border}`, borderRadius: '8px',
                color: COLORS.info, fontWeight: 600, fontSize: '13px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                cursor: 'pointer',
              }}
            >
              <UserPlus size={15} /> Registrar nuevo paciente
            </button>
          </div>

          {/* Resultados */}
          {searchResults.length > 0 && (
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,3,184,0.06)', overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid #F0F6FF', fontSize: '11px', fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} — clic para abrir ficha
              </div>
              {searchResults.map(p => {
                const yaHoy = fichas.find(f => f.paciente.id === p.id && f.estado !== 'CANCELADA')
                return (
                  <div
                    key={p.id}
                    onClick={() => void handleAbrirFicha(p.id)}
                    style={{
                      padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #F0F6FF',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F0F6FF')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                  >
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: COLORS.text }}>
                        {p.nombre} {p.apellido}{p.apellido_materno ? ` ${p.apellido_materno}` : ''}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: COLORS.textMuted }}>
                        CI: {p.ci}{p.ci_complemento ? `-${p.ci_complemento}` : ''}
                      </p>
                    </div>
                    {yaHoy ? (
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#059669', background: '#DCFCE7', padding: '2px 8px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                        Ya tiene ficha
                      </span>
                    ) : (
                      <span style={{ fontSize: '10px', fontWeight: 700, color: COLORS.primary, background: '#EFF6FF', padding: '2px 8px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                        + Abrir ficha
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Ayuda de atajos */}
          <div style={{ background: '#F8FAFF', border: '1px solid #E6EEFF', borderRadius: '10px', padding: '14px 16px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: COLORS.textMuted, margin: '0 0 8px', textTransform: 'uppercase' }}>Atajos</p>
            {[
              ['Ctrl+F', 'Enfocar buscador'],
              ['Escape', 'Limpiar búsqueda'],
              ['F2', 'Iniciar atención (fila seleccionada)'],
              ['F3', 'Finalizar atención (fila seleccionada)'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <code style={{ background: '#E2E8F0', padding: '1px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>{k}</code>
                <span style={{ fontSize: '11px', color: COLORS.textMuted }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal confirmación finalizar */}
      {confirmModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '28px', borderRadius: '12px', maxWidth: '380px', width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: COLORS.primary, marginBottom: '10px' }}>¿Finalizar atención?</h3>
            <p style={{ fontSize: '13px', color: COLORS.textMuted, lineHeight: 1.5 }}>
              Esto marcará al paciente como atendido y cerrará su ficha.
            </p>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="dontAsk" checked={dontAskAgain} onChange={e => setDontAskAgain(e.target.checked)} />
              <label htmlFor="dontAsk" style={{ fontSize: '12px', cursor: 'pointer' }}>No preguntar de nuevo hoy</label>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmModal(null)} style={{ flex: 1, padding: '10px', background: '#F1F5F9', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button
                onClick={() => handleCambiarEstado(confirmModal.fichaId, confirmModal.nextState, true)}
                style={{ flex: 1, padding: '10px', background: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
