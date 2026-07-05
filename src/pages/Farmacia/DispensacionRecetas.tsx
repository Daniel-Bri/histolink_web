import { useEffect, useState } from 'react'
import { recetaService } from '../../services/recetaService'
import type { Receta, BlockchainRecetaResponse } from '../../types/receta.types'

const ESTADO_COLORS = {
  EMITIDA:    { bg: '#FEF9C3', text: '#92400E', border: '#FDE68A' },
  DISPENSADA: { bg: '#DCFCE7', text: '#166534', border: '#BBF7D0' },
  ANULADA:    { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' },
}

function EstadoBadge({ estado }: { estado: string }) {
  const c = ESTADO_COLORS[estado as keyof typeof ESTADO_COLORS] ?? ESTADO_COLORS.ANULADA
  return (
    <span style={{
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700,
    }}>
      {estado}
    </span>
  )
}

export default function DispensacionRecetas() {
  const [recetas, setRecetas] = useState<Receta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dispensandoId, setDispensandoId] = useState<number | null>(null)
  const [blockchainData, setBlockchainData] = useState<Record<number, BlockchainRecetaResponse>>({})
  const [cargandoBlockchainId, setCargandoBlockchainId] = useState<number | null>(null)
  const [busqueda, setBusqueda] = useState('')

  const cargarRecetas = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await recetaService.listar()
      setRecetas(res.data)
    } catch {
      setError('No se pudieron cargar las recetas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void cargarRecetas() }, [])

  const dispensar = async (receta: Receta) => {
    setDispensandoId(receta.id)
    setError('')
    try {
      await recetaService.dispensar(receta.id)
      await cargarRecetas()
    } catch {
      setError('No se pudo dispensar la receta. Verifica el estado e intenta de nuevo.')
    } finally {
      setDispensandoId(null)
    }
  }

  const verBlockchain = async (receta: Receta) => {
    if (blockchainData[receta.id]) {
      setBlockchainData(prev => {
        const next = { ...prev }
        delete next[receta.id]
        return next
      })
      return
    }
    setCargandoBlockchainId(receta.id)
    try {
      const res = await recetaService.consultarBlockchain(receta.id)
      setBlockchainData(prev => ({ ...prev, [receta.id]: res.data }))
    } catch {
      setError('Esta receta no tiene evento blockchain registrado todavía.')
    } finally {
      setCargandoBlockchainId(null)
    }
  }

  const recetasFiltradas = recetas.filter(r => {
    if (!busqueda.trim()) return true
    return r.numero_receta.toLowerCase().includes(busqueda.toLowerCase())
  })

  const pendientes = recetasFiltradas.filter(r => r.estado === 'EMITIDA')
  const dispensadas = recetasFiltradas.filter(r => r.estado === 'DISPENSADA')

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', color: '#0003B8', fontWeight: 700, margin: 0 }}>
          Dispensación de Recetas
        </h1>
        <p style={{ color: '#888', fontSize: '13px', margin: '4px 0 0 0' }}>
          Gestiona las recetas médicas pendientes de dispensación con trazabilidad blockchain
        </p>
      </div>

      {error && (
        <div style={{
          background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA',
          borderRadius: '8px', padding: '10px 16px', marginBottom: '20px', fontSize: '13px',
        }}>
          {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontWeight: 700 }}>×</button>
        </div>
      )}

      <div style={{
        background: 'white', borderRadius: '12px', padding: '16px 20px',
        marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,3,184,0.06)',
        display: 'flex', gap: '8px', alignItems: 'center',
      }}>
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por número de receta..."
          style={{
            flex: 1, padding: '10px 14px', fontSize: '14px', borderRadius: '8px',
            border: '1.5px solid #B3D4FF', outline: 'none', color: '#333',
          }}
        />
        <button
          type="button"
          onClick={() => void cargarRecetas()}
          style={{
            background: 'transparent', color: '#0003B8', border: '1.5px solid #B3D4FF',
            borderRadius: '8px', padding: '10px 18px', fontWeight: 600,
            fontSize: '13px', cursor: 'pointer',
          }}
        >
          ↻ Recargar
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#0003B8', fontWeight: 600 }}>
          Cargando recetas...
        </div>
      ) : (
        <>
          <div style={{
            background: 'white', borderRadius: '12px', padding: '16px 20px',
            marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,3,184,0.06)',
          }}>
            <h2 style={{ fontSize: '15px', color: '#0003B8', fontWeight: 700, margin: '0 0 12px' }}>
              Pendientes de dispensar ({pendientes.length})
            </h2>
            {pendientes.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#888' }}>No hay recetas pendientes de dispensar.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F0F6FF' }}>
                    {['N° Receta', 'Medicamentos', 'Estado', 'Fecha emisión', ''].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px', textAlign: h === '' ? 'right' : 'left',
                        fontSize: '12px', fontWeight: 700, color: '#0003B8', textTransform: 'uppercase',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendientes.map(r => (
                    <tr key={r.id} style={{ borderTop: '1px solid #F0F6FF' }}>
                      <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: 600, color: '#0003B8' }}>
                        {r.numero_receta}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '13px', color: '#333' }}>
                        {r.detalles.map(d => `${d.medicamento} ${d.concentracion}`).join(', ')}
                      </td>
                      <td style={{ padding: '10px 14px' }}><EstadoBadge estado={r.estado} /></td>
                      <td style={{ padding: '10px 14px', fontSize: '12px', color: '#888' }}>
                        {r.fecha_emision.slice(0, 10)}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <button
                          onClick={() => void dispensar(r)}
                          disabled={dispensandoId === r.id}
                          style={{
                            background: dispensandoId === r.id ? '#B3D4FF' : '#00A896',
                            color: 'white', border: 'none', borderRadius: '6px',
                            padding: '6px 16px', cursor: dispensandoId === r.id ? 'not-allowed' : 'pointer',
                            fontSize: '12px', fontWeight: 600,
                          }}
                        >
                          {dispensandoId === r.id ? 'Dispensando...' : 'Dispensar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{
            background: 'white', borderRadius: '12px', padding: '16px 20px',
            boxShadow: '0 2px 8px rgba(0,3,184,0.06)',
          }}>
            <h2 style={{ fontSize: '15px', color: '#0003B8', fontWeight: 700, margin: '0 0 12px' }}>
              Recetas dispensadas ({dispensadas.length})
            </h2>
            {dispensadas.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#888' }}>No hay recetas dispensadas todavía.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F0F6FF' }}>
                    {['N° Receta', 'Medicamentos', 'Estado', 'Fecha dispensación', ''].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px', textAlign: h === '' ? 'right' : 'left',
                        fontSize: '12px', fontWeight: 700, color: '#0003B8', textTransform: 'uppercase',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dispensadas.map(r => (
                    <>
                      <tr key={r.id} style={{ borderTop: '1px solid #F0F6FF' }}>
                        <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: 600, color: '#0003B8' }}>
                          {r.numero_receta}
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: '13px', color: '#333' }}>
                          {r.detalles.map(d => `${d.medicamento} ${d.concentracion}`).join(', ')}
                        </td>
                        <td style={{ padding: '10px 14px' }}><EstadoBadge estado={r.estado} /></td>
                        <td style={{ padding: '10px 14px', fontSize: '12px', color: '#888' }}>
                          {r.fecha_dispensacion?.slice(0, 10) ?? '—'}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <button
                            onClick={() => void verBlockchain(r)}
                            disabled={cargandoBlockchainId === r.id}
                            style={{
                              background: blockchainData[r.id] ? '#F0F6FF' : 'transparent',
                              color: '#0003B8', border: '1.5px solid #B3D4FF',
                              borderRadius: '6px', padding: '6px 14px',
                              cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                            }}
                          >
                            {cargandoBlockchainId === r.id ? 'Cargando...' : blockchainData[r.id] ? '▲ Ocultar blockchain' : '⛓ Ver blockchain'}
                          </button>
                        </td>
                      </tr>
                      {blockchainData[r.id] && (
                        <tr key={`bc-${r.id}`} style={{ background: '#F0F6FF' }}>
                          <td colSpan={5} style={{ padding: '12px 20px' }}>
                            <div style={{ fontSize: '12px', color: '#333' }}>
                              <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#0003B8' }}>
                                ⛓ Evento Blockchain — Bloque #{blockchainData[r.id].evento_blockchain.numero_bloque}
                              </p>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                                <span><strong>Tipo:</strong> {blockchainData[r.id].evento_blockchain.tipo_evento}</span>
                                <span><strong>Firmado por:</strong> {blockchainData[r.id].evento_blockchain.firmado_por}</span>
                                <span><strong>Timestamp:</strong> {new Date(blockchainData[r.id].evento_blockchain.timestamp).toLocaleString('es-BO', { timeZone: 'America/La_Paz' })}</span>
                                <span><strong>Hash doc:</strong> <code style={{ fontSize: '11px' }}>{blockchainData[r.id].evento_blockchain.hash_documento.slice(0, 20)}...</code></span>
                                <span style={{ gridColumn: '1 / -1' }}><strong>Hash bloque:</strong> <code style={{ fontSize: '11px' }}>{blockchainData[r.id].evento_blockchain.bloque_hash}</code></span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}