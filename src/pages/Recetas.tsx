import { useEffect, useState } from 'react'
import api from '../api/axios'

interface DetalleReceta {
  id?: number
  medicamento: string
  concentracion: string
  forma_farmaceutica: string
  via_administracion: string
  dosis: string
  frecuencia: string
  duracion: string
  cantidad_total: string
  instrucciones: string
  orden: number
}

interface Receta {
  id: number
  numero_receta: string
  fecha_emision: string
  estado: 'EMITIDA' | 'DISPENSADA' | 'ANULADA'
  observaciones: string
  medico: number
  consulta: number
  dispensada_por: number | null
  fecha_dispensacion: string | null
  detalles: DetalleReceta[]
}

interface Consulta {
  id: number
  estado: string
  motivo_consulta: string
  codigo_cie10_principal: string
  ficha?: { paciente?: { nombres?: string; apellido_paterno?: string } }
}

const ESTADO_COLORES: Record<string, string> = {
  EMITIDA: '#0080FF',
  DISPENSADA: '#00A896',
  ANULADA: '#E53935',
}

const VIA_OPCIONES = [
  { value: 'VO', label: 'Oral' },
  { value: 'IV', label: 'Intravenosa' },
  { value: 'IM', label: 'Intramuscular' },
  { value: 'SC', label: 'Subcutánea' },
  { value: 'TOP', label: 'Tópica' },
  { value: 'INH', label: 'Inhalatoria' },
  { value: 'SL', label: 'Sublingual' },
  { value: 'REC', label: 'Rectal' },
  { value: 'OFT', label: 'Oftálmica' },
  { value: 'OTR', label: 'Otra' },
]

const detalleVacio = (): DetalleReceta => ({
  medicamento: '', concentracion: '', forma_farmaceutica: '',
  via_administracion: 'VO', dosis: '', frecuencia: '',
  duracion: '', cantidad_total: '', instrucciones: '', orden: 1,
})

export default function Recetas() {
  const [recetas, setRecetas] = useState<Receta[]>([])
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [recetaSeleccionada, setRecetaSeleccionada] = useState<Receta | null>(null)
  const [accionLoading, setAccionLoading] = useState(false)

  // Formulario nueva receta
  const [consultaId, setConsultaId] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [detalles, setDetalles] = useState<DetalleReceta[]>([detalleVacio()])
  const [guardandoReceta, setGuardandoReceta] = useState(false)

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const esFarmacia = user.groups?.some((g: string | { name: string }) =>
    typeof g === 'string' ? g === 'Farmacia' : g.name === 'Farmacia'
  )
  const esMedico = user.groups?.some((g: string | { name: string }) =>
    typeof g === 'string' ? g === 'Médico' : g.name === 'Médico'
  )

  const cargarDatos = async () => {
    setLoading(true)
    setError('')
    try {
      const [recetasRes, consultasRes] = await Promise.all([
        api.get('/api/clinica/recetas/'),
        api.get('/api/consultas/consultas/?estado=COMPLETADA'),
      ])
      setRecetas(recetasRes.data.results ?? recetasRes.data)
      setConsultas(consultasRes.data.results ?? consultasRes.data)
    } catch {
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarDatos() }, [])

  const handleAgregarMedicamento = () => {
    setDetalles(prev => [...prev, { ...detalleVacio(), orden: prev.length + 1 }])
  }

  const handleEliminarMedicamento = (index: number) => {
    setDetalles(prev => prev.filter((_, i) => i !== index))
  }

  const handleCambiarDetalle = (index: number, campo: keyof DetalleReceta, valor: string) => {
    setDetalles(prev => prev.map((d, i) => i === index ? { ...d, [campo]: valor } : d))
  }

  const handleGuardarReceta = async () => {
    if (!consultaId) { setError('Selecciona una consulta'); return }
    if (detalles.some(d => !d.medicamento || !d.dosis || !d.frecuencia || !d.duracion)) {
      setError('Completa todos los campos obligatorios de cada medicamento')
      return
    }
    setGuardandoReceta(true)
    setError('')
    try {
      await api.post('/api/clinica/recetas/', {
        consulta: parseInt(consultaId),
        observaciones,
        detalles: detalles.map((d, i) => ({ ...d, orden: i + 1 })),
      })
      setExito('Receta emitida exitosamente')
      setConsultaId('')
      setObservaciones('')
      setDetalles([detalleVacio()])
      await cargarDatos()
      setTimeout(() => setExito(''), 3000)
    } catch {
      setError('Error al guardar la receta')
    } finally {
      setGuardandoReceta(false)
    }
  }

  const handleDispensar = async (id: number) => {
    setAccionLoading(true)
    try {
      await api.patch(`/api/clinica/recetas/${id}/dispensar/`)
      await cargarDatos()
      setRecetaSeleccionada(null)
      setExito('Receta dispensada exitosamente')
      setTimeout(() => setExito(''), 3000)
    } catch {
      setError('Error al dispensar la receta')
    } finally {
      setAccionLoading(false)
    }
  }

  const handleAnular = async (id: number) => {
    if (!window.confirm('¿Estás seguro de anular esta receta?')) return
    setAccionLoading(true)
    try {
      await api.patch(`/api/clinica/recetas/${id}/anular/`)
      await cargarDatos()
      setRecetaSeleccionada(null)
      setExito('Receta anulada')
      setTimeout(() => setExito(''), 3000)
    } catch {
      setError('Error al anular la receta')
    } finally {
      setAccionLoading(false)
    }
  }

  const inputStyle = {
    padding: '7px 10px', fontSize: '13px', border: '1px solid #B3D4FF',
    borderRadius: '6px', width: '100%', boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ padding: '32px' }}>
      <h1 style={{ fontSize: '22px', color: '#0003B8', fontWeight: 700, marginBottom: '24px' }}>
        Recetas Médicas
      </h1>

      {error && <p style={{ color: '#E53935', marginBottom: '12px', padding: '10px', background: '#FFF0F0', borderRadius: '8px' }}>{error}</p>}
      {exito && <p style={{ color: '#00A896', marginBottom: '12px', padding: '10px', background: '#F0FFF8', borderRadius: '8px' }}>{exito}</p>}

      {/* Panel médico - emisión de receta */}
      {esMedico && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,3,184,0.06)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0003B8', marginBottom: '20px' }}>
            Panel de Emisión de Receta
          </h2>

          {/* Selección de consulta */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '6px' }}>
              Consulta activa *
            </label>
            <select value={consultaId} onChange={e => setConsultaId(e.target.value)} style={inputStyle}>
              <option value="">Seleccionar consulta...</option>
              {consultas.map(c => (
                <option key={c.id} value={c.id}>
                  #{c.id} — {c.motivo_consulta?.substring(0, 50)} ({c.codigo_cie10_principal})
                </option>
              ))}
            </select>
          </div>

          {/* Medicamentos */}
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0003B8', marginBottom: '12px' }}>
            Medicamentos
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
              <thead>
                <tr style={{ background: '#F0F6FF' }}>
                  {['Medicamento *', 'Concentración', 'Forma Farm.', 'Vía *', 'Dosis *', 'Frecuencia *', 'Duración *', 'Cantidad', ''].map(h => (
                    <th key={h} style={{ padding: '8px 10px', fontSize: '12px', fontWeight: 600, color: '#0003B8', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detalles.map((d, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #F0F6FF' }}>
                    <td style={{ padding: '6px' }}>
                      <input value={d.medicamento} onChange={e => handleCambiarDetalle(i, 'medicamento', e.target.value)} placeholder="Ej: Amoxicilina" style={inputStyle}/>
                    </td>
                    <td style={{ padding: '6px' }}>
                      <input value={d.concentracion} onChange={e => handleCambiarDetalle(i, 'concentracion', e.target.value)} placeholder="500mg" style={inputStyle}/>
                    </td>
                    <td style={{ padding: '6px' }}>
                      <input value={d.forma_farmaceutica} onChange={e => handleCambiarDetalle(i, 'forma_farmaceutica', e.target.value)} placeholder="tableta" style={inputStyle}/>
                    </td>
                    <td style={{ padding: '6px' }}>
                      <select value={d.via_administracion} onChange={e => handleCambiarDetalle(i, 'via_administracion', e.target.value)} style={inputStyle}>
                        {VIA_OPCIONES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '6px' }}>
                      <input value={d.dosis} onChange={e => handleCambiarDetalle(i, 'dosis', e.target.value)} placeholder="1 tableta" style={inputStyle}/>
                    </td>
                    <td style={{ padding: '6px' }}>
                      <input value={d.frecuencia} onChange={e => handleCambiarDetalle(i, 'frecuencia', e.target.value)} placeholder="cada 8 horas" style={inputStyle}/>
                    </td>
                    <td style={{ padding: '6px' }}>
                      <input value={d.duracion} onChange={e => handleCambiarDetalle(i, 'duracion', e.target.value)} placeholder="7 días" style={inputStyle}/>
                    </td>
                    <td style={{ padding: '6px' }}>
                      <input value={d.cantidad_total} onChange={e => handleCambiarDetalle(i, 'cantidad_total', e.target.value)} placeholder="21 tabletas" style={inputStyle}/>
                    </td>
                    <td style={{ padding: '6px' }}>
                      {detalles.length > 1 && (
                        <button onClick={() => handleEliminarMedicamento(i)} style={{ background: '#E53935', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '13px' }}>✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={handleAgregarMedicamento} style={{ background: 'transparent', color: '#0003B8', border: '1.5px solid #B3D4FF', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer', marginBottom: '16px' }}>
            + Agregar medicamento
          </button>

          {/* Observaciones */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '6px' }}>Observaciones</label>
            <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} placeholder="Indicaciones adicionales..." rows={2} style={{ ...inputStyle, resize: 'vertical' }}/>
          </div>

          <button onClick={handleGuardarReceta} disabled={guardandoReceta} style={{ background: '#0003B8', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            {guardandoReceta ? 'Guardando...' : '💾 Guardar Receta como Emitida'}
          </button>
        </div>
      )}

      {/* Panel farmacia / lista de recetas */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,3,184,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F0F6FF' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0003B8', margin: 0 }}>
            {esFarmacia ? 'Recetas Emitidas del Día (Rol Farmacia)' : 'Recetas'}
          </h2>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#0003B8' }}>Cargando...</div>
        ) : recetas.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>No hay recetas disponibles</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F0F6FF' }}>
                {['N° Receta', 'Fecha emisión', 'Estado', 'Medicamentos', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#0003B8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recetas.map((r, i) => (
                <tr key={r.id} style={{ borderTop: '1px solid #F0F6FF', background: i % 2 === 0 ? 'white' : '#FAFCFF' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600 }}>{r.numero_receta}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                    {new Date(r.fecha_emision).toLocaleDateString('es-BO')}
                    <span style={{ fontSize: '12px', color: '#888', display: 'block' }}>
                      {new Date(r.fecha_emision).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: ESTADO_COLORES[r.estado] + '20', color: ESTADO_COLORES[r.estado], padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                      {r.estado}
                    </span>
                    {r.fecha_dispensacion && (
                      <span style={{ fontSize: '11px', color: '#888', display: 'block', marginTop: '2px' }}>
                        {new Date(r.fecha_dispensacion).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                    {r.detalles.length} medicamento{r.detalles.length !== 1 ? 's' : ''}
                  </td>
                  <td style={{ padding: '12px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => setRecetaSeleccionada(r)} style={{ padding: '5px 12px', fontSize: '12px', background: '#0003B8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                      Ver detalle
                    </button>
                    {esFarmacia && r.estado === 'EMITIDA' && (
                      <button onClick={() => handleDispensar(r.id)} disabled={accionLoading} style={{ padding: '5px 12px', fontSize: '12px', background: '#00A896', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                        Registrar dispensación
                      </button>
                    )}
                    {(esMedico || user.is_superuser) && r.estado !== 'DISPENSADA' && (
                      <button onClick={() => handleAnular(r.id)} disabled={accionLoading} style={{ padding: '5px 12px', fontSize: '12px', background: '#E53935', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                        Anular
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal detalle receta */}
      {recetaSeleccionada && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '620px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', color: '#0003B8', fontWeight: 700 }}>{recetaSeleccionada.numero_receta}</h2>
              <button onClick={() => setRecetaSeleccionada(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: '#888' }}>Emisión: {new Date(recetaSeleccionada.fecha_emision).toLocaleString('es-BO')}</span>
              <span style={{ background: ESTADO_COLORES[recetaSeleccionada.estado] + '20', color: ESTADO_COLORES[recetaSeleccionada.estado], padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                {recetaSeleccionada.estado}
              </span>
            </div>

            {recetaSeleccionada.observaciones && (
              <p style={{ fontSize: '13px', color: '#555', marginBottom: '16px', padding: '10px', background: '#F0F6FF', borderRadius: '8px' }}>
                {recetaSeleccionada.observaciones}
              </p>
            )}

            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0003B8', marginBottom: '12px' }}>Medicamentos</h3>

            {recetaSeleccionada.detalles.map((d, i) => (
              <div key={i} style={{ background: '#F8FAFF', borderRadius: '8px', padding: '14px', marginBottom: '10px', borderLeft: '3px solid #0003B8' }}>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
                  {i + 1}. {d.medicamento} {d.concentracion}
                </div>
                <div style={{ fontSize: '13px', color: '#555', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  <span>Forma: {d.forma_farmaceutica}</span>
                  <span>Vía: {VIA_OPCIONES.find(v => v.value === d.via_administracion)?.label ?? d.via_administracion}</span>
                  <span>Dosis: {d.dosis}</span>
                  <span>Frecuencia: {d.frecuencia}</span>
                  <span>Duración: {d.duracion}</span>
                  <span>Cantidad: {d.cantidad_total}</span>
                </div>
                {d.instrucciones && <p style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>{d.instrucciones}</p>}
              </div>
            ))}

            {recetaSeleccionada.fecha_dispensacion && (
              <p style={{ fontSize: '12px', color: '#00A896', marginTop: '12px' }}>
                Dispensada el {new Date(recetaSeleccionada.fecha_dispensacion).toLocaleString('es-BO')}
              </p>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              {esFarmacia && recetaSeleccionada.estado === 'EMITIDA' && (
                <button onClick={() => handleDispensar(recetaSeleccionada.id)} disabled={accionLoading} style={{ padding: '8px 20px', background: '#00A896', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                  Registrar dispensación
                </button>
              )}
              {(esMedico || user.is_superuser) && recetaSeleccionada.estado !== 'DISPENSADA' && (
                <button onClick={() => handleAnular(recetaSeleccionada.id)} disabled={accionLoading} style={{ padding: '8px 20px', background: '#E53935', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                  Anular
                </button>
              )}
              <button onClick={() => setRecetaSeleccionada(null)} style={{ padding: '8px 20px', background: 'transparent', color: '#0003B8', border: '1.5px solid #B3D4FF', borderRadius: '8px', cursor: 'pointer' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}