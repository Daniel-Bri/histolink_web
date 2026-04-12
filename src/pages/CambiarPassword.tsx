import { useState } from 'react'
import { api } from '../api/axiosConfig'
import { useNavigate } from 'react-router-dom'

export default function CambiarPassword() {
  const [oldPassword, setOldPassword]         = useState('')
  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mensaje, setMensaje]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const navigate = useNavigate()

  const handleCambiar = async () => {
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden.')
      return
    }
    setLoading(true)
    setError('')
    setMensaje('')
    try {
      await api.put('auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: confirmPassword,
      })
      setMensaje('¡Contraseña actualizada exitosamente!')
      setTimeout(() => navigate('/dashboard'), 1800)
    } catch {
      setError('Contraseña actual incorrecta o la nueva no cumple los requisitos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100%', padding: '48px 32px',
    }}>
      <div style={{
        background: 'white', borderRadius: '16px',
        padding: '40px', width: '380px',
        boxShadow: '0 4px 24px rgba(0,3,184,0.08)',
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px', color: '#0003B8' }}>
          Cambiar contraseña
        </h2>
        <p style={{ fontSize: '13px', color: '#888', marginBottom: '28px' }}>
          Ingresa tu contraseña actual y la nueva.
        </p>

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
            onKeyDown={e => e.key === 'Enter' && handleCambiar()}
          />

          {error   && <p style={{ color: '#E53935', fontSize: '13px', margin: 0 }}>{error}</p>}
          {mensaje && <p style={{ color: '#00A896', fontSize: '13px', margin: 0 }}>{mensaje}</p>}

          <button
            onClick={handleCambiar}
            disabled={loading}
            style={{ marginTop: '4px', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </div>
      </div>
    </div>
  )
}
