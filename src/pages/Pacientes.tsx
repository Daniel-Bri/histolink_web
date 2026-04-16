import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/axiosConfig'
import { hasRole } from '../utils/auth'
import type { Paciente } from '../types/paciente.types'

const PUEDE_REGISTRAR_PACIENTE = () => hasRole('Médico', 'Enfermera', 'Administrativo')

interface PaginatedResponse {
  count: number
  next: string | null
  previous: string | null
  results: Paciente[]
}

const SEXO: Record<string, string> = { M: 'Masculino', F: 'Femenino', O: 'Otro' }

export default function Pacientes() {
  const navigate = useNavigate()
  const [pacientes, setPacientes]       = useState<Paciente[]>([])
  const [busqueda, setBusqueda]         = useState('')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [pagina, setPagina]             = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [total, setTotal]               = useState(0)
  const POR_PAGINA = 10

  const buscarPacientes = async (pag = 1, search = busqueda) => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string | number> = { page: pag, page_size: POR_PAGINA }
      if (search) params.search = search
      const res = await api.get<PaginatedResponse>('pacientes/pacientes/', { params })
      setPacientes(res.data.results)
      setTotal(res.data.count)
      setTotalPaginas(Math.ceil(res.data.count / POR_PAGINA))
      setPagina(pag)
    } catch {
      setError('Error al cargar los pacientes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { buscarPacientes(1, '') }, [])

  return (
    <div style={{ padding: '32px' }}>

      {/* Encabezado */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        justifyContent: 'space-between', gap: '16px', marginBottom: '24px',
      }}>
        <div>
          <h1 style={{ fontSize: '22px', color: '#0003B8', fontWeight: 700, margin: 0 }}>Pacientes</h1>
          <p style={{ color: '#888', fontSize: '13px', margin: '4px 0 0 0' }}>
            {total > 0 ? `${total} paciente${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}` : 'Busca o lista todos los pacientes'}
          </p>
        </div>
        {PUEDE_REGISTRAR_PACIENTE() && (
          <button type="button" onClick={() => navigate('/pacientes/registro')}>
            Registrar nuevo paciente
          </button>
        )}
      </div>

      {/* Buscador */}
      <div style={{
        background: 'white', borderRadius: '12px', padding: '16px 20px',
        marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,3,184,0.06)',
        display: 'flex', gap: '10px', flexWrap: 'wrap',
      }}>
        <input
          placeholder="Buscar por CI o apellido..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && buscarPacientes(1, busqueda)}
          style={{ flex: 1, minWidth: '200px' }}
        />
        <button onClick={() => buscarPacientes(1, busqueda)} style={{ padding: '8px 20px' }}>
          Buscar
        </button>
        <button
          onClick={() => { setBusqueda(''); buscarPacientes(1, '') }}
          style={{ padding: '8px 20px', background: 'transparent', color: '#0003B8', border: '1.5px solid #B3D4FF' }}
        >
          Limpiar
        </button>
      </div>

      {error && <p style={{ color: '#E53935', marginBottom: '16px' }}>{error}</p>}

      {/* Tabla */}
      <div style={{
        background: 'white', borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,3,184,0.06)', overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#0003B8', fontWeight: 600 }}>
            Cargando pacientes...
          </div>
        ) : pacientes.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#888' }}>
            No se encontraron pacientes.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F0F6FF' }}>
                {['CI', 'Nombres', 'Ap. Paterno', 'Ap. Materno', 'Nacimiento', 'Sexo', 'Teléfono', ''].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: h === '' ? 'right' : 'left',
                    fontSize: '12px', fontWeight: 700, color: '#0003B8',
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pacientes.map((p, i) => (
                <tr
                  key={p.id}
                  style={{
                    borderTop: '1px solid #F0F6FF',
                    background: i % 2 === 0 ? 'white' : '#FAFCFF',
                  }}
                >
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: '#0003B8' }}>
                    {p.ci}{p.ci_complemento ? `-${p.ci_complemento}` : ''}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{p.nombre}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{p.apellido}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{p.apellido_materno || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#555' }}>{p.fecha_nacimiento}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{SEXO[p.genero] ?? p.genero}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#555' }}>{p.telefono || '—'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => navigate(`/pacientes/${p.id}/expediente`)}
                        style={{
                          background: '#0003B8', color: 'white',
                          border: 'none', borderRadius: '6px',
                          padding: '6px 14px', cursor: 'pointer',
                          fontSize: '12px', fontWeight: 600,
                        }}
                      >
                        Ver expediente
                      </button>
                      <button
                        onClick={() => navigate(`/pacientes/${p.id}/editar`)}
                        style={{
                          background: 'transparent', color: '#0003B8',
                          border: '1.5px solid #B3D4FF', borderRadius: '6px',
                          padding: '6px 14px', cursor: 'pointer',
                          fontSize: '12px', fontWeight: 600,
                        }}
                      >
                        Editar
                      </button>
                    </div>
                  </td>
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
            style={{
              padding: '7px 18px',
              background: pagina === 1 ? '#F0F6FF' : '#0003B8',
              color: pagina === 1 ? 'rgba(0,3,184,0.3)' : 'white',
              border: `1px solid ${pagina === 1 ? 'rgba(0,3,184,0.1)' : '#0003B8'}`,
              borderRadius: '7px',
              cursor: pagina === 1 ? 'not-allowed' : 'pointer', fontWeight: 600,
            }}
          >
            ← Anterior
          </button>
          <span style={{ fontSize: '14px', color: '#0003B8' }}>
            Página {pagina} de {totalPaginas}
          </span>
          <button
            onClick={() => buscarPacientes(pagina + 1)}
            disabled={pagina === totalPaginas}
            style={{
              padding: '7px 18px',
              background: pagina === totalPaginas ? '#F0F6FF' : '#0003B8',
              color: pagina === totalPaginas ? 'rgba(0,3,184,0.3)' : 'white',
              border: `1px solid ${pagina === totalPaginas ? 'rgba(0,3,184,0.1)' : '#0003B8'}`,
              borderRadius: '7px',
              cursor: pagina === totalPaginas ? 'not-allowed' : 'pointer', fontWeight: 600,
            }}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  )
}
