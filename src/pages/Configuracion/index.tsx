import { useState, useEffect, useRef } from 'react'
import { getStoredUser } from '../../utils/auth'
import {
  exportarTenant,
  backupCompleto,
  restoreBackup,
} from '../../services/configuracionService'

// ── localStorage keys ─────────────────────────────────────────────────────────
const LS_ENABLED   = 'histolink_auto_backup_enabled'
const LS_HOUR      = 'histolink_auto_backup_hour'
const LS_LAST_DATE = 'histolink_auto_backup_last_date'

// ── Estilos ───────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: '12px',
  border: '1px solid #E2E8F0',
  padding: '24px',
  marginBottom: '20px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
}

const sectionTitle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: '#1E293B',
  margin: '0 0 4px',
}

const sectionDesc: React.CSSProperties = {
  fontSize: '13px',
  color: '#64748B',
  margin: '0 0 20px',
}

const lbl: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#374151',
  display: 'block',
  marginBottom: '4px',
}

const inp: React.CSSProperties = {
  border: '1px solid #D1D5DB',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box' as const,
}

const btnPrimary: React.CSSProperties = {
  background: '#00A896',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '9px 22px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
}

const btnDanger: React.CSSProperties = {
  background: '#FEF2F2',
  color: '#DC2626',
  border: '1px solid #FECACA',
  borderRadius: '8px',
  padding: '9px 22px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
}

const btnSecondary: React.CSSProperties = {
  background: '#F1F5F9',
  color: '#334155',
  border: '1px solid #CBD5E1',
  borderRadius: '8px',
  padding: '9px 22px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function formatHour(h: number) {
  return `${String(h).padStart(2, '0')}:00`
}

function nextBackupLabel(hour: number): string {
  const now = new Date()
  const target = new Date()
  target.setHours(hour, 0, 0, 0)
  if (now >= target) target.setDate(target.getDate() + 1)
  return target.toLocaleString('es-BO', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function Configuracion() {
  const user        = getStoredUser()
  const isSuperadmin = user?.is_staff === true

  // Auto-backup state (persisted in localStorage)
  const [autoEnabled, setAutoEnabled] = useState(() => localStorage.getItem(LS_ENABLED) === 'true')
  const [autoHour,    setAutoHour]    = useState(() => parseInt(localStorage.getItem(LS_HOUR) ?? '3', 10))
  const [autoSaved,   setAutoSaved]   = useState(false)
  const lastAutoDate = localStorage.getItem(LS_LAST_DATE) ?? '—'

  // Manual backup / restore state
  const [backupLoading,   setBackupLoading]   = useState(false)
  const [restoreFile,     setRestoreFile]     = useState<File | null>(null)
  const [restoreLoading,  setRestoreLoading]  = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Flash messages
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)

  function flash(tipo: 'ok' | 'err', texto: string) {
    setMsg({ tipo, texto })
    setTimeout(() => setMsg(null), 4000)
  }

  // ── Auto-backup scheduler ──────────────────────────────────────────────────
  useEffect(() => {
    const runIfNeeded = async () => {
      if (!autoEnabled) return
      const now = new Date()
      const last = localStorage.getItem(LS_LAST_DATE)
      if (now.getHours() >= autoHour && last !== todayStr()) {
        localStorage.setItem(LS_LAST_DATE, todayStr())
        try {
          await exportarTenant()
          flash('ok', `Backup automático ejecutado a las ${formatHour(now.getHours())}.`)
        } catch {
          flash('err', 'El backup automático falló. Revisa tu conexión.')
        }
      }
    }
    void runIfNeeded()
    const id = setInterval(() => void runIfNeeded(), 60_000)
    return () => clearInterval(id)
  }, [autoEnabled, autoHour])

  // ── Guardar configuración de auto-backup ───────────────────────────────────
  function handleSaveAuto() {
    localStorage.setItem(LS_ENABLED, String(autoEnabled))
    localStorage.setItem(LS_HOUR,    String(autoHour))
    setAutoSaved(true)
    setTimeout(() => setAutoSaved(false), 2000)
  }

  // ── Backup manual ──────────────────────────────────────────────────────────
  async function handleExportarTenant() {
    setBackupLoading(true)
    try {
      await exportarTenant()
      flash('ok', 'Backup del establecimiento descargado correctamente.')
    } catch {
      flash('err', 'Error al generar el backup. Intenta de nuevo.')
    } finally {
      setBackupLoading(false)
    }
  }

  async function handleBackupCompleto() {
    setBackupLoading(true)
    try {
      await backupCompleto()
      flash('ok', 'Backup completo del sistema descargado.')
    } catch {
      flash('err', 'Error al generar el backup completo.')
    } finally {
      setBackupLoading(false)
    }
  }

  // ── Restore ────────────────────────────────────────────────────────────────
  async function handleRestore() {
    if (!restoreFile) return
    if (!window.confirm(`¿Restaurar desde "${restoreFile.name}"?\n\nEsta operación sobreescribirá datos existentes. No se puede deshacer.`)) return
    setRestoreLoading(true)
    try {
      const res = await restoreBackup(restoreFile)
      flash('ok', res.mensaje)
      setRestoreFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch {
      flash('err', 'Error al restaurar el backup. Verifica que el archivo sea válido.')
    } finally {
      setRestoreLoading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '28px 32px', maxWidth: '820px', margin: '0 auto', fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>
          Backup y Restauración
        </h1>
        <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
          Gestiona las copias de seguridad de los datos clínicos del establecimiento.
        </p>
      </div>

      {/* Flash */}
      {msg && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '20px',
          fontSize: '13px', fontWeight: 500,
          background: msg.tipo === 'ok' ? '#ECFDF5' : '#FEF2F2',
          color:      msg.tipo === 'ok' ? '#065F46' : '#991B1B',
          border:     `1px solid ${msg.tipo === 'ok' ? '#A7F3D0' : '#FECACA'}`,
        }}>
          {msg.tipo === 'ok' ? '✓ ' : '✕ '}{msg.texto}
        </div>
      )}

      {/* ── Sección 1: Backup Automático ── */}
      <div style={card}>
        <h2 style={sectionTitle}>Backup Automático</h2>
        <p style={sectionDesc}>
          Configura una hora diaria para generar el backup automáticamente mientras la aplicación esté abierta.
        </p>

        {/* Toggle */}
        <label style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          marginBottom: '20px', cursor: 'pointer',
          padding: '12px 16px', borderRadius: '10px',
          background: autoEnabled ? '#ECFDF5' : '#F8FAFC',
          border: `1px solid ${autoEnabled ? '#A7F3D0' : '#E2E8F0'}`,
          userSelect: 'none',
        }}>
          <div
            onClick={() => setAutoEnabled(prev => !prev)}
            style={{
              width: '44px', height: '24px', borderRadius: '12px', flexShrink: 0,
              background: autoEnabled ? '#00A896' : '#CBD5E1',
              position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
            }}
          >
            <div style={{
              position: 'absolute',
              top: '3px',
              left: autoEnabled ? '23px' : '3px',
              width: '18px', height: '18px',
              borderRadius: '50%', background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              transition: 'left 0.2s',
            }} />
          </div>
          <div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: autoEnabled ? '#065F46' : '#475569' }}>
              {autoEnabled ? 'Backup automático activado' : 'Backup automático desactivado'}
            </span>
            <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0' }}>
              Se ejecuta una vez al día en la hora configurada
            </p>
          </div>
        </label>

        {/* Hora */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <div>
            <label style={lbl}>Hora de ejecución</label>
            <select
              style={{ ...inp, width: '160px' }}
              value={autoHour}
              onChange={e => setAutoHour(parseInt(e.target.value, 10))}
              disabled={!autoEnabled}
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {formatHour(h)}{h === 3 ? ' (recomendado)' : h === 0 ? ' (medianoche)' : ''}
                </option>
              ))}
            </select>
          </div>
          <button
            style={{ ...btnPrimary, opacity: autoSaved ? 0.7 : 1 }}
            onClick={handleSaveAuto}
          >
            {autoSaved ? '✓ Guardado' : 'Guardar configuración'}
          </button>
        </div>

        {/* Estado */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
          background: '#F8FAFC', borderRadius: '8px', padding: '14px 18px',
          fontSize: '13px', color: '#475569',
        }}>
          <div>
            <span style={{ fontWeight: 600, display: 'block', marginBottom: '2px' }}>Último backup automático</span>
            <span style={{ color: lastAutoDate === '—' ? '#94A3B8' : '#059669' }}>{lastAutoDate}</span>
          </div>
          {autoEnabled && (
            <div>
              <span style={{ fontWeight: 600, display: 'block', marginBottom: '2px' }}>Próximo backup</span>
              <span style={{ color: '#0369A1' }}>{nextBackupLabel(autoHour)}</span>
            </div>
          )}
        </div>

        <p style={{ fontSize: '12px', color: '#94A3B8', margin: '12px 0 0', fontStyle: 'italic' }}>
          ⚠ El backup automático sólo se ejecuta mientras la aplicación está abierta en el navegador.
        </p>
      </div>

      {/* ── Sección 2: Backup Manual ── */}
      <div style={card}>
        <h2 style={sectionTitle}>Backup Manual</h2>
        <p style={sectionDesc}>
          Genera y descarga ahora una copia de seguridad con todos los datos clínicos de este establecimiento.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            style={btnPrimary}
            onClick={() => void handleExportarTenant()}
            disabled={backupLoading}
          >
            {backupLoading ? 'Generando…' : '⬇ Descargar backup del establecimiento'}
          </button>

          {isSuperadmin && (
            <button
              style={btnSecondary}
              onClick={() => void handleBackupCompleto()}
              disabled={backupLoading}
            >
              {backupLoading ? 'Generando…' : '⬇ Backup completo del sistema'}
            </button>
          )}
        </div>

        {isSuperadmin && (
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: '12px 0 0' }}>
            "Backup completo" genera un dumpdata de toda la base de datos (solo superadmin).
          </p>
        )}
      </div>

      {/* ── Sección 3: Restaurar ── */}
      <div style={{ ...card, borderColor: '#FECACA', borderTop: '4px solid #DC2626' }}>
        <h2 style={{ ...sectionTitle, color: '#DC2626' }}>Restaurar desde Backup</h2>
        <p style={sectionDesc}>
          Sube un archivo JSON generado previamente con "Descargar backup del establecimiento".{' '}
          <strong style={{ color: '#DC2626' }}>Esta operación sobreescribirá los datos existentes y no se puede deshacer.</strong>
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{
            border: '1.5px dashed #FECACA', borderRadius: '8px',
            padding: '10px 16px', background: '#FFF5F5',
          }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={e => setRestoreFile(e.target.files?.[0] ?? null)}
              style={{ fontSize: '13px', cursor: 'pointer' }}
            />
          </div>

          {restoreFile && (
            <button
              style={btnDanger}
              onClick={() => void handleRestore()}
              disabled={restoreLoading}
            >
              {restoreLoading ? 'Restaurando…' : '↩ Restaurar ahora'}
            </button>
          )}
        </div>

        {restoreFile && (
          <p style={{ fontSize: '12px', color: '#DC2626', margin: '10px 0 0', fontWeight: 600 }}>
            Archivo seleccionado: {restoreFile.name} ({(restoreFile.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

    </div>
  )
}
