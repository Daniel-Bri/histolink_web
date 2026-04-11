import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'

interface Antecedentes {
  grupo_sanguineo?: string
  alergias?: string
  ant_patologicos?: string
  ant_no_patologicos?: string
  ant_quirurgicos?: string
  ant_familiares?: string
  ant_gineco_obstetricos?: string
  medicacion_actual?: string
  esquema_vacunacion?: string
}

interface Triaje {
  id: number
  hora_triaje: string
  nivel_urgencia?: string
  nivel_urgencia_label?: string
  motivo_consulta_triaje?: string
  temperatura_celsius?: number
  saturacion_oxigeno?: number
  frecuencia_cardiaca?: number
  presion_arterial?: string
  imc?: number
}

interface Consulta {
  id: number
  creado_en: string
  estado?: string
  estado_label?: string
  motivo_consulta: string
  impresion_diagnostica: string
  codigo_cie10_principal?: string
  descripcion_cie10?: string
}

interface ExpedientePacienteData {
  id: number
  ci: string
  ci_complemento?: string
  nombres: string
  apellido_paterno: string
  apellido_materno?: string
  fecha_nacimiento: string
  sexo_label?: string
  autoidentificacion_label?: string
  telefono?: string
  direccion?: string
  tipo_seguro_label?: string
  numero_asegurado?: string
  antecedentes?: Antecedentes | null
  triajes?: Triaje[]
  consultas?: Consulta[]
}

const texto = (v?: string | null) => (v && String(v).trim() ? v : '—')
const fecha = (v?: string) => (v ? new Date(v).toLocaleString() : '—')

export default function ExpedientePaciente() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<ExpedientePacienteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const cargar = async () => {
      if (!id) {
        setError('ID de paciente inválido.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')
      try {
        const res = await api.get<ExpedientePacienteData>(`/api/expediente/${id}/expediente/`)
        setData(res.data)
      } catch (e: any) {
        const msg = e?.response?.data?.error ?? 'No se pudo cargar el expediente.'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    cargar()
  }, [id])

  return (
    <div style={{ minHeight: '100vh', background: '#F0F6FF' }}>
      <div style={{ background: '#0003B8', padding: '10px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#00A896', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '13px' }}>
            HL
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '18px' }}>HistoLink</span>
        </div>
        <button
          onClick={() => navigate('/pacientes')}
          style={{ background: 'transparent', border: '1.5px solid #B3D4FF', color: 'white', padding: '5px 14px', fontSize: '13px' }}
        >
          ← Volver a pacientes
        </button>
      </div>

      <div style={{ padding: '32px' }}>
        <h1 style={{ fontSize: '22px', color: '#0003B8', fontWeight: 700, marginBottom: '20px' }}>
          Expediente del Paciente
        </h1>

        {loading && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,3,184,0.06)' }}>
            <p style={{ color: '#0003B8', fontWeight: 600 }}>Cargando expediente...</p>
          </div>
        )}

        {!loading && error && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,3,184,0.06)' }}>
            <p style={{ color: '#E53935', fontWeight: 600 }}>{error}</p>
          </div>
        )}

        {!loading && !error && data && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <section style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,3,184,0.06)' }}>
              <h2 style={{ color: '#0003B8', marginTop: 0 }}>Datos Generales</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                <p><strong>Nombre:</strong> {texto(`${data.nombres} ${data.apellido_paterno} ${data.apellido_materno ?? ''}`)}</p>
                <p><strong>CI:</strong> {texto(`${data.ci}${data.ci_complemento ? `-${data.ci_complemento}` : ''}`)}</p>
                <p><strong>Fecha Nacimiento:</strong> {texto(data.fecha_nacimiento)}</p>
                <p><strong>Sexo:</strong> {texto(data.sexo_label)}</p>
                <p><strong>Teléfono:</strong> {texto(data.telefono)}</p>
                <p><strong>Dirección:</strong> {texto(data.direccion)}</p>
                <p><strong>Seguro:</strong> {texto(data.tipo_seguro_label)}</p>
                <p><strong>Nro. Asegurado:</strong> {texto(data.numero_asegurado)}</p>
              </div>
            </section>

            <section style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,3,184,0.06)' }}>
              <h2 style={{ color: '#0003B8', marginTop: 0 }}>Antecedentes Médicos</h2>
              {!data.antecedentes ? (
                <p style={{ color: '#888' }}>Sin antecedentes registrados.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                  <p><strong>Grupo sanguíneo:</strong> {texto(data.antecedentes.grupo_sanguineo)}</p>
                  <p><strong>Alergias:</strong> {texto(data.antecedentes.alergias)}</p>
                  <p><strong>Patológicos:</strong> {texto(data.antecedentes.ant_patologicos)}</p>
                  <p><strong>No patológicos:</strong> {texto(data.antecedentes.ant_no_patologicos)}</p>
                  <p><strong>Quirúrgicos:</strong> {texto(data.antecedentes.ant_quirurgicos)}</p>
                  <p><strong>Familiares:</strong> {texto(data.antecedentes.ant_familiares)}</p>
                  <p><strong>Gineco-obstétricos:</strong> {texto(data.antecedentes.ant_gineco_obstetricos)}</p>
                  <p><strong>Medicación actual:</strong> {texto(data.antecedentes.medicacion_actual)}</p>
                  <p><strong>Vacunación:</strong> {texto(data.antecedentes.esquema_vacunacion)}</p>
                </div>
              )}
            </section>

            <section style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,3,184,0.06)' }}>
              <h2 style={{ color: '#0003B8', marginTop: 0 }}>Historial del Paciente</h2>

              <h3 style={{ color: '#0003B8', marginBottom: '8px' }}>Triajes</h3>
              {!data.triajes || data.triajes.length === 0 ? (
                <p style={{ color: '#888' }}>Sin registros de triaje.</p>
              ) : (
                <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
                  {data.triajes.map((t) => (
                    <div key={t.id} style={{ border: '1px solid #E7EEFF', borderRadius: '10px', padding: '12px' }}>
                      <p style={{ margin: '2px 0' }}><strong>Fecha:</strong> {fecha(t.hora_triaje)}</p>
                      <p style={{ margin: '2px 0' }}><strong>Urgencia:</strong> {texto(t.nivel_urgencia_label ?? t.nivel_urgencia)}</p>
                      <p style={{ margin: '2px 0' }}><strong>Motivo:</strong> {texto(t.motivo_consulta_triaje)}</p>
                      <p style={{ margin: '2px 0' }}><strong>Signos:</strong> FC {t.frecuencia_cardiaca ?? '—'} / SpO2 {t.saturacion_oxigeno ?? '—'} / Temp {t.temperatura_celsius ?? '—'} / PA {t.presion_arterial ?? '—'}</p>
                    </div>
                  ))}
                </div>
              )}

              <h3 style={{ color: '#0003B8', marginBottom: '8px' }}>Consultas</h3>
              {!data.consultas || data.consultas.length === 0 ? (
                <p style={{ color: '#888' }}>Sin consultas registradas.</p>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {data.consultas.map((c) => (
                    <div key={c.id} style={{ border: '1px solid #E7EEFF', borderRadius: '10px', padding: '12px' }}>
                      <p style={{ margin: '2px 0' }}><strong>Fecha:</strong> {fecha(c.creado_en)}</p>
                      <p style={{ margin: '2px 0' }}><strong>Estado:</strong> {texto(c.estado_label ?? c.estado)}</p>
                      <p style={{ margin: '2px 0' }}><strong>Motivo:</strong> {texto(c.motivo_consulta)}</p>
                      <p style={{ margin: '2px 0' }}><strong>Diagnóstico:</strong> {texto(c.impresion_diagnostica)}</p>
                      <p style={{ margin: '2px 0' }}><strong>CIE10:</strong> {texto(c.codigo_cie10_principal)} {c.descripcion_cie10 ? `- ${c.descripcion_cie10}` : ''}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

