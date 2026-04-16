import { useNavigate } from 'react-router-dom'
import { hasRole } from '../../utils/auth'
import RegistroPacienteForm from './RegistroPacienteForm'

const PUEDE_REGISTRAR = () => hasRole('Médico', 'Enfermera', 'Administrativo')

export default function RegistroPaciente() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: '#F0F6FF' }}>
      <div
        style={{
          background: '#0003B8',
          padding: '10px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              background: '#00A896',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: '13px',
            }}
          >
            HL
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '18px' }}>HistoLink</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/pacientes')}
          style={{
            background: 'transparent',
            border: '1.5px solid #B3D4FF',
            color: 'white',
            padding: '5px 14px',
            fontSize: '13px',
          }}
        >
          ← Volver a pacientes
        </button>
      </div>

      <div style={{ padding: '32px', maxWidth: '960px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '22px', color: '#0003B8', fontWeight: 700, marginBottom: '20px' }}>
          Registrar nuevo paciente
        </h1>

        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,3,184,0.06)',
          }}
        >
          {PUEDE_REGISTRAR() ? (
            <RegistroPacienteForm
              onSuccess={() => navigate('/pacientes')}
              onCancel={() => navigate('/pacientes')}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 24px', color: '#555' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔒</div>
              <p style={{ fontWeight: 600, color: '#B71C1C', fontSize: '15px', marginBottom: '8px' }}>
                Sin permiso
              </p>
              <p style={{ fontSize: '14px', marginBottom: '20px' }}>
                Solo <strong>Médicos</strong>, <strong>Enfermeras</strong> y personal{' '}
                <strong>Administrativo</strong> pueden registrar nuevos pacientes.
              </p>
              <button type="button" onClick={() => navigate('/pacientes')}>
                Volver a pacientes
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
