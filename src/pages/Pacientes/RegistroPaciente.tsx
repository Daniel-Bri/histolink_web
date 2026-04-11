import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RegistroPacienteForm from './RegistroPacienteForm'

export default function RegistroPaciente() {
  const navigate = useNavigate()
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 5000)
    return () => window.clearTimeout(id)
  }, [toast])

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
          <RegistroPacienteForm
            onSuccess={() => setToast('Paciente registrado correctamente.')}
            onCancel={() => navigate('/pacientes')}
          />
        </div>
      </div>

      {toast ? (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
            padding: '14px 22px',
            borderRadius: '10px',
            background: '#00A896',
            color: 'white',
            fontWeight: 600,
            fontSize: '14px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            maxWidth: '90vw',
            textAlign: 'center',
          }}
        >
          {toast}
        </div>
      ) : null}
    </div>
  )
}
