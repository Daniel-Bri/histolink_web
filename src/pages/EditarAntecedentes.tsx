import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'

interface AntecedenteForm {
  grupo_sanguineo: string
  alergias: string
  ant_patologicos: string
  ant_no_patologicos: string
  ant_quirurgicos: string
  ant_familiares: string
  ant_gineco_obstetricos: string
  medicacion_actual: string
  esquema_vacunacion: string
}

const GRUPOS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '?']

const CAMPOS: { key: keyof AntecedenteForm; label: string; tipo: 'select' | 'textarea'; desc?: string }[] = [
  { key: 'alergias',               label: 'Alergias',                    tipo: 'textarea', desc: 'Ej: Penicilina, látex, maní (una por línea)' },
  { key: 'ant_patologicos',        label: 'Antecedentes Patológicos',     tipo: 'textarea', desc: 'Enfermedades crónicas actuales. Ej: Diabetes tipo 2, HTA' },
  { key: 'ant_no_patologicos',     label: 'Antecedentes No Patológicos',  tipo: 'textarea', desc: 'Hábitos y estilo de vida. Ej: tabaquismo, alcohol' },
  { key: 'ant_quirurgicos',        label: 'Antecedentes Quirúrgicos',     tipo: 'textarea', desc: 'Cirugías previas con fecha. Ej: Apendicectomía 2018' },
  { key: 'ant_familiares',         label: 'Antecedentes Familiares',      tipo: 'textarea', desc: 'Enfermedades hereditarias o de alta incidencia familiar' },
  { key: 'ant_gineco_obstetricos', label: 'Gineco-Obstétricos',           tipo: 'textarea', desc: 'Solo para pacientes femeninas. Formato G:P:A:C' },
  { key: 'medicacion_actual',      label: 'Medicación Actual',            tipo: 'textarea', desc: 'Medicamentos crónicos que toma el paciente' },
  { key: 'esquema_vacunacion',     label: 'Esquema de Vacunación',        tipo: 'textarea', desc: 'Vacunas aplicadas y fechas. Ej: Hepatitis B (2020)' },
]

const VACIO: AntecedenteForm = {
  grupo_sanguineo: '?', alergias: '', ant_patologicos: '',
  ant_no_patologicos: '', ant_quirurgicos: '', ant_familiares: '',
  ant_gineco_obstetricos: '', medicacion_actual: '', esquema_vacunacion: '',
}

export default function EditarAntecedentes() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [form, setForm]         = useState<AntecedenteForm>(VACIO)
  const [loading, setLoading]   = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError]       = useState('')
  const [exito, setExito]       = useState('')

  useEffect(() => {
    if (!id) { setError('ID inválido.'); setLoading(false); return }
    api.get(`/api/antecedentes/${id}/antecedentes/`)
      .then(r => {
        const d = r.data
        setForm({
          grupo_sanguineo:        d.grupo_sanguineo        ?? '?',
          alergias:               d.alergias               ?? '',
          ant_patologicos:        d.ant_patologicos        ?? '',
          ant_no_patologicos:     d.ant_no_patologicos     ?? '',
          ant_quirurgicos:        d.ant_quirurgicos        ?? '',
          ant_familiares:         d.ant_familiares         ?? '',
          ant_gineco_obstetricos: d.ant_gineco_obstetricos ?? '',
          medicacion_actual:      d.medicacion_actual      ?? '',
          esquema_vacunacion:     d.esquema_vacunacion     ?? '',
        })
      })
      .catch(e => setError(e?.response?.data?.error ?? 'No se pudieron cargar los antecedentes.'))
      .finally(() => setLoading(false))
  }, [id])

  const set = (key: keyof AntecedenteForm, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setExito('')
    setError('')
  }

  const guardar = async () => {
    if (!id) return
    setGuardando(true); setError(''); setExito('')
    try {
      await api.patch(`/api/antecedentes/${id}/antecedentes/`, form)
      setExito('Antecedentes actualizados correctamente.')
      setTimeout(() => navigate(`/pacientes/${id}/expediente`), 1200)
    } catch (e: any) {
      const data = e?.response?.data
      if (data && typeof data === 'object') {
        const msgs = Object.values(data).flat().join(' ')
        setError(msgs || 'Error al guardar.')
      } else {
        setError('Error al guardar los antecedentes.')
      }
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div style={{ padding: '32px' }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
        <button
          onClick={() => navigate(`/pacientes/${id}/expediente`)}
          style={{ background: 'transparent', border: 'none', color: '#0080FF', fontSize: '13px', cursor: 'pointer', padding: 0, fontWeight: 600 }}
        >
          ← Expediente
        </button>
        <span style={{ color: '#B3D4FF' }}>/</span>
        <span style={{ color: '#0003B8', fontSize: '13px', fontWeight: 600 }}>Editar Antecedentes</span>
      </div>

      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0003B8', margin: '0 0 6px 0' }}>
        Editar Antecedentes Médicos
      </h1>
      <p style={{ fontSize: '13px', color: '#888', margin: '0 0 28px 0' }}>
        Los campos vacíos se guardarán como "no registrado". Solo se modifican los campos que cambies.
      </p>

      {loading && (
        <div style={{ background: 'white', borderRadius: '14px', padding: '40px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,3,184,0.06)' }}>
          <p style={{ color: '#0003B8', fontWeight: 600 }}>Cargando...</p>
        </div>
      )}

      {!loading && error && !exito && (
        <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px' }}>
          <p style={{ color: '#E53935', margin: 0, fontWeight: 600 }}>{error}</p>
        </div>
      )}

      {exito && (
        <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px' }}>
          <p style={{ color: '#2E7D32', margin: 0, fontWeight: 600 }}>{exito}</p>
        </div>
      )}

      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Grupo sanguíneo */}
          <div style={{ background: 'white', borderRadius: '14px', padding: '22px 26px', boxShadow: '0 2px 8px rgba(0,3,184,0.06)' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0003B8', margin: '0 0 16px 0' }}>
              INFORMACIÓN BÁSICA
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '240px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#0003B8', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Grupo Sanguíneo
              </label>
              <select
                value={form.grupo_sanguineo}
                onChange={e => set('grupo_sanguineo', e.target.value)}
                style={{
                  padding: '10px 14px', borderRadius: '8px',
                  border: '1.5px solid #B3D4FF', fontSize: '15px',
                  color: '#0003B8', background: 'white', cursor: 'pointer', fontWeight: 600,
                }}
              >
                {GRUPOS.map(g => (
                  <option key={g} value={g}>{g === '?' ? '? — Desconocido' : g}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Campos de texto en 2 columnas */}
          <div style={{ background: 'white', borderRadius: '14px', padding: '22px 26px', boxShadow: '0 2px 8px rgba(0,3,184,0.06)' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0003B8', margin: '0 0 20px 0' }}>
              HISTORIAL MÉDICO
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '18px' }}>
              {CAMPOS.map(({ key, label, desc }) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#0003B8', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label}
                  </label>
                  {desc && (
                    <span style={{ fontSize: '11px', color: '#aaa', marginBottom: '2px' }}>{desc}</span>
                  )}
                  <textarea
                    value={form[key]}
                    onChange={e => set(key, e.target.value)}
                    rows={3}
                    placeholder="No registrado..."
                    style={{
                      padding: '10px 12px', borderRadius: '8px',
                      border: '1.5px solid #B3D4FF', fontSize: '13px',
                      color: '#333', resize: 'vertical',
                      fontFamily: "'Segoe UI', sans-serif", lineHeight: '1.5',
                      outline: 'none',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Acciones */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => navigate(`/pacientes/${id}/expediente`)}
              disabled={guardando}
              style={{
                padding: '11px 26px', borderRadius: '8px',
                border: '1.5px solid #B3D4FF', background: 'transparent',
                color: '#0003B8', fontWeight: 600, fontSize: '14px',
                cursor: guardando ? 'not-allowed' : 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={guardando}
              style={{
                padding: '11px 30px', borderRadius: '8px',
                background: guardando ? '#B3D4FF' : '#0003B8',
                color: 'white', fontWeight: 600, fontSize: '14px',
                border: 'none', cursor: guardando ? 'not-allowed' : 'pointer',
              }}
            >
              {guardando ? 'Guardando...' : '💾 Guardar cambios'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
