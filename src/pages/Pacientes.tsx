import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/axiosConfig'

import type { Paciente } from '../types/paciente.types'

interface PaginatedResponse {
  count: number
  next: string | null
  previous: string | null
  results: Paciente[]
}

export default function Pacientes() {
  const navigate = useNavigate()
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [total, setTotal] = useState(0)
  const POR_PAGINA = 10

  const buscarPacientes = async (pag = 1, search = busqueda) => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string | number> = {
        page: pag,
        page_size: POR_PAGINA,
      }
      if (search) params.search = search

      const res = await api.get<PaginatedResponse>('pacientes/pacientes/', { params })
      setPacientes(res.data.results)
      setTotal(res.data.count)
      setTotalPaginas(Math.ceil(res.data.count / POR_PAGINA))
      setPagina(pag)
    } catch {
      setError('Error al cargar los pacientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    buscarPacientes(1, '')
  }, [])

  const handleBuscar = () => {
    buscarPacientes(1, busqueda)
  }

  const handleLimpiar = () => {
    setBusqueda('')
    buscarPacientes(1, '')
  }

  const sexoLabel = (s: string) => ({ M: 'Masculino', F: 'Femenino', O: 'Otro' }[s] ?? s)

  return (
    <div style={{ minHeight: '100vh', background: '#F0F6FF' }}>

      {/* Navbar */}
      <div style={{ background: '#0003B8', padding: '10px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#00A896', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '13px' }}>
            HL
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '18px' }}>HistoLink</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ background: 'transparent', border: '1.5px solid #B3D4FF', color: 'white', padding: '5px 14px', fontSize: '13px' }}
        >
          ← Volver
        </button>
      </div>

      {/* Contenido */}
      <div style={{ padding: '32px' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <h1 style={{ fontSize: '22px', color: '#0003B8', fontWeight: 700 }}>Pacientes</h1>
          <button type="button" onClick={() => navigate('/pacientes/registro')}>
            Registrar nuevo paciente
          </button>
        </div>

        {/* Buscador */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,3,184,0.06)' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              placeholder="Buscar por CI o apellido..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleBuscar()}
              style={{ flex: 1, minWidth: '200px' }}
            />
            <button onClick={handleBuscar} style={{ padding: '8px 20px' }}>
              Buscar
            </button>
            <button
              onClick={handleLimpiar}
              style={{ padding: '8px 20px', background: 'transparent', color: '#0003B8', border: '1.5px solid #B3D4FF' }}
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Error */}
        {error && <p style={{ color: '#E53935', marginBottom: '16px' }}>{error}</p>}

        {/* Tabla */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,3,184,0.06)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#0003B8', fontWeight: 600 }}>
              Cargando...
            </div>
          ) : pacientes.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
              No se encontraron pacientes
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F0F6FF' }}>
                  {['CI', 'Nombre', 'Apellido Paterno', 'Apellido Materno', 'Sexo', 'Teléfono'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#0003B8' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pacientes.map((p, i) => (
                  <tr key={p.id} style={{ borderTop: '1px solid #F0F6FF', background: i % 2 === 0 ? 'white' : '#FAFCFF' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{p.ci}{p.ci_complemento ? `-${p.ci_complemento}` : ''}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{p.nombres}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{p.apellido_paterno}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{p.apellido_materno}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{sexoLabel(p.sexo)}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{p.telefono || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
            <button
              onClick={() => buscarPacientes(pagina - 1)}
              disabled={pagina === 1}
              style={{ padding: '6px 16px', background: pagina === 1 ? '#eee' : '#0003B8', color: pagina === 1 ? '#aaa' : 'white', border: 'none', borderRadius: '6px', cursor: pagina === 1 ? 'not-allowed' : 'pointer' }}
            >
              ← Anterior
            </button>
            <span style={{ fontSize: '14px', color: '#0003B8' }}>
              Página {pagina} de {totalPaginas} — {total} pacientes
            </span>
            <button
              onClick={() => buscarPacientes(pagina + 1)}
              disabled={pagina === totalPaginas}
              style={{ padding: '6px 16px', background: pagina === totalPaginas ? '#eee' : '#0003B8', color: pagina === totalPaginas ? '#aaa' : 'white', border: 'none', borderRadius: '6px', cursor: pagina === totalPaginas ? 'not-allowed' : 'pointer' }}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}