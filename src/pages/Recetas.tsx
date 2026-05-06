import { useEffect, useState } from 'react'
import api from '../api/axios'

interface DetalleReceta {
  id: number
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

const ESTADO_COLORES: Record<string, string> = {
  EMITIDA: '#0080FF',
  DISPENSADA: '#00A896',
  ANULADA: '#E53935',
}

export default function Recetas() {
  const [recetas, setRecetas] = useState<Receta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [recetaSeleccionada, setRecetaSeleccionada] = useState<Receta | null>(null)
  const [accionLoading, setAccionLoading] = useState(false)

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const esFarmacia = user.groups?.some((g: string | { name: string }) =>
    typeof g === 'string' ? g === 'Farmacia' : g.name === 'Farmacia'
  )
  const esMedico = user.groups?.some((g: string | { name: string }) =>
    typeof g === 'string' ? g === 'Médico' : g.name === 'Médico'
  )

  const cargarRecetas = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/api/clinica/recetas/')
      setRecetas(res.data.results ?? res.data)
    } catch {
      setError('Error al cargar las recetas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarRecetas()
  }, [])

  const handleDispensar = async (id: number) => {
    setAccionLoading(true)
    try {
      await api.patch(`/api/clinica/recetas/${id}/dispensar/`)
      await cargarRecetas()
      setRecetaSeleccionada(null)
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
      await cargarRecetas()
      setRecetaSeleccionada(null)
    } catch {
      setError('Error al anular la receta')
    } finally {
      setAccionLoading(false)
    }
  }

  return (
    <div style={{ padding: '32px' }}>
      <h1 style={{ fontSize: '22px', color: '#0003B8', fontWeight: 700, marginBottom: '24px' }}>
        Recetas Médicas
      </h1>

      {error && <p style={{ color: '#E53935', marginBottom: '16px' }}>{error}</p>}

      {/* Tabla de recetas */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,3,184,0.06)', overflow: 'hidden', marginBottom: '24px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#0003B8' }}>Cargando...</div>
        ) : recetas.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>No hay recetas disponibles</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F0F6FF' }}>
                {['N° Receta', 'Fecha', 'Estado', 'Medicamentos', 'Acciones'].map(h => (
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
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      background: ESTADO_COLORES[r.estado] + '20',
                      color: ESTADO_COLORES[r.estado],
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 600
                    }}>
                      {r.estado}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                    {r.detalles.length} medicamento{r.detalles.length !== 1 ? 's' : ''}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => setRecetaSeleccionada(r)}
                      style={{ padding: '5px 12px', fontSize: '12px', marginRight: '8px', background: '#0003B8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Ver detalle
                    </button>
                    {esFarmacia && r.estado === 'EMITIDA' && (
                      <button
                        onClick={() => handleDispensar(r.id)}
                        disabled={accionLoading}
                        style={{ padding: '5px 12px', fontSize: '12px', marginRight: '8px', background: '#00A896', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Dispensar
                      </button>
                    )}
                    {(esMedico || user.is_superuser) && r.estado !== 'DISPENSADA' && (
                      <button
                        onClick={() => handleAnular(r.id)}
                        disabled={accionLoading}
                        style={{ padding: '5px 12px', fontSize: '12px', background: '#E53935', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                      >
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
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '600px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', color: '#0003B8', fontWeight: 700 }}>
                {recetaSeleccionada.numero_receta}
              </h2>
              <button onClick={() => setRecetaSeleccionada(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>

            <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
              <span style={{ fontSize: '13px', color: '#888' }}>
                Fecha: {new Date(recetaSeleccionada.fecha_emision).toLocaleDateString('es-BO')}
              </span>
              <span style={{
                background: ESTADO_COLORES[recetaSeleccionada.estado] + '20',
                color: ESTADO_COLORES[recetaSeleccionada.estado],
                padding: '2px 10px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600
              }}>
                {recetaSeleccionada.estado}
              </span>
            </div>

            {recetaSeleccionada.observaciones && (
              <p style={{ fontSize: '13px', color: '#555', marginBottom: '16px', padding: '10px', background: '#F0F6FF', borderRadius: '8px' }}>
                {recetaSeleccionada.observaciones}
              </p>
            )}

            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0003B8', marginBottom: '12px' }}>
              Medicamentos
            </h3>

            {recetaSeleccionada.detalles.map((d, i) => (
              <div key={d.id} style={{ background: '#F8FAFF', borderRadius: '8px', padding: '14px', marginBottom: '10px', borderLeft: '3px solid #0003B8' }}>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
                  {i + 1}. {d.medicamento} {d.concentracion}
                </div>
                <div style={{ fontSize: '13px', color: '#555', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  <span>Forma: {d.forma_farmaceutica}</span>
                  <span>Vía: {d.via_administracion}</span>
                  <span>Dosis: {d.dosis}</span>
                  <span>Frecuencia: {d.frecuencia}</span>
                  <span>Duración: {d.duracion}</span>
                  <span>Cantidad: {d.cantidad_total}</span>
                </div>
                {d.instrucciones && (
                  <p style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
                    {d.instrucciones}
                  </p>
                )}
              </div>
            ))}

            {recetaSeleccionada.fecha_dispensacion && (
              <p style={{ fontSize: '12px', color: '#00A896', marginTop: '12px' }}>
                Dispensada el {new Date(recetaSeleccionada.fecha_dispensacion).toLocaleDateString('es-BO')}
              </p>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              {esFarmacia && recetaSeleccionada.estado === 'EMITIDA' && (
                <button
                  onClick={() => handleDispensar(recetaSeleccionada.id)}
                  disabled={accionLoading}
                  style={{ padding: '8px 20px', background: '#00A896', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Dispensar
                </button>
              )}
              {(esMedico || user.is_superuser) && recetaSeleccionada.estado !== 'DISPENSADA' && (
                <button
                  onClick={() => handleAnular(recetaSeleccionada.id)}
                  disabled={accionLoading}
                  style={{ padding: '8px 20px', background: '#E53935', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Anular
                </button>
              )}
              <button
                onClick={() => setRecetaSeleccionada(null)}
                style={{ padding: '8px 20px', background: 'transparent', color: '#0003B8', border: '1.5px solid #B3D4FF', borderRadius: '8px', cursor: 'pointer' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}