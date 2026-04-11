import { useState } from 'react'
import { api } from '../api/axiosConfig'
import { useNavigate } from 'react-router-dom'

export default function CambiarPassword() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleCambiar = async () => {
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden')
      return
    }
    try {
      await api.put('auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: confirmPassword,
      })
      setError('')
      setMensaje('¡Contraseña actualizada exitosamente!')
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch {
      setError('Contraseña actual incorrecta o la nueva no cumple los requisitos')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0F6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '40px', width: '380px', boxShadow: '0 4px 24px rgba(0,3,184,0.08)' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
          <div style={{ background: '#00A896', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '14px' }}>
            HL
          </div>
          <span style={{ fontWeight: 700, fontSize: '20px', color: '#0003B8' }}>HistoLink</span>
        </div>

        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px', color: '#0003B8' }}>Cambiar contraseña</h2>
        <p style={{ fontSize: '13px', color: '#888', marginBottom: '24px' }}>Ingresa tu contraseña actual y la nueva</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            placeholder="Contraseña actual"
            type="password"
            value={oldPassword}
            onChange={e => setOldPassword(e.target.value)}
          />
          <input
            placeholder="Nueva contraseña"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
          />
          <input
            placeholder="Confirmar nueva contraseña"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />

          {error && <p style={{ color: '#E53935', fontSize: '13px' }}>{error}</p>}
          {mensaje && <p style={{ color: '#00A896', fontSize: '13px' }}>{mensaje}</p>}

          <button onClick={handleCambiar} style={{ marginTop: '4px' }}>
            Actualizar contraseña
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ background: 'transparent', color: '#0003B8', border: '1.5px solid #B3D4FF' }}
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    </div>
  )
}