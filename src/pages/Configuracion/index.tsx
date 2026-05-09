import { useState, useEffect, useRef } from 'react'
import { getStoredUser } from '../../utils/auth'
import {
  getConfiguracion,
  patchConfiguracion,
  exportarTenant,
  backupCompleto,
  restoreBackup,
  getGestiones,
  crearGestion,
  congelarGestion,
  descongelarGestion,
  type ConfiguracionTenant,
  type GestionAnual,
} from '../../services/configuracionService'

// ── Helpers ──────────────────────────────────────────────────────────────────

type Tab = 'establecimiento' | 'modulos' | 'backup' | 'gestiones'

const MONEDAS = [
  { value: 'BOB', label: 'Boliviano (BOB)' },
  { value: 'USD', label: 'Dólar (USD)' },
  { value: 'PEN', label: 'Sol (PEN)' },
  { value: 'ARS', label: 'Peso AR (ARS)' },
  { value: 'CLP', label: 'Peso CL (CLP)' },
]

// ── Estilos base ─────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: '12px',
  border: '1px solid #E2E8F0',
  padding: '24px',
  marginBottom: '16px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
}

const fieldRow: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  marginBottom: '16px',
}

const label: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#374151',
}

const input: React.CSSProperties = {
  border: '1px solid #D1D5DB',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '14px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const btnPrimary: React.CSSProperties = {
  background: '#00A896',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '8px 20px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
}

const btnSecondary: React.CSSProperties = {
  background: '#F1F5F9',
  color: '#334155',
  border: '1px solid #CBD5E1',
  borderRadius: '8px',
  padding: '8px 20px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
}

const btnDanger: React.CSSProperties = {
  background: '#FEF2F2',
  color: '#DC2626',
  border: '1px solid #FECACA',
  borderRadius: '8px',
  padding: '8px 20px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function Configuracion() {
  const user = getStoredUser()
  const isSuperadmin = user?.is_staff === true

  const [tab, setTab] = useState<Tab>('establecimiento')
  const [config, setConfig] = useState<ConfiguracionTenant | null>(null)
  const [gestiones, setGestiones] = useState<GestionAnual[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)

  // Campos del establecimiento
  const [emailContacto, setEmailContacto] = useState('')
  const [sitioWeb, setSitioWeb]           = useState('')
  const [moneda, setMoneda]               = useState('BOB')
  const [zonaHoraria, setZonaHoraria]     = useState('America/La_Paz')
  const [dirty, setDirty]                 = useState(false)

  // Módulos
  const [modulosHabilitados, setModulosHabilitados] = useState<string[]>([])

  // Backup
  const [backupLoading, setBackupLoading] = useState(false)
  const [restoreFile, setRestoreFile]     = useState<File | null>(null)
  const [restoreLoading, setRestoreLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Gestiones
  const [nuevoAño, setNuevoAño]   = useState<string>('')
  const [nuevaDesc, setNuevaDesc] = useState('')
  const [gestionLoading, setGestionLoading] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const [cfg, gest] = await Promise.all([
          getConfiguracion(),
          getGestiones(),
        ])
        setConfig(cfg)
        setGestiones(gest)
        setEmailContacto(cfg.email_contacto)
        setSitioWeb(cfg.sitio_web)
        setMoneda(cfg.moneda)
        setZonaHoraria(cfg.zona_horaria)
        setModulosHabilitados(cfg.modulos_habilitados)
      } catch {
        setMsg({ tipo: 'err', texto: 'No se pudo cargar la configuración.' })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Ctrl+S global para guardar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (dirty && tab === 'establecimiento') void handleGuardar()
        if (tab === 'modulos') void handleGuardarModulos()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  const flash = (tipo: 'ok' | 'err', texto: string) => {
    setMsg({ tipo, texto })
    setTimeout(() => setMsg(null), 3500)
  }

  async function handleGuardar() {
    setSaving(true)
    try {
      const updated = await patchConfiguracion({ email_contacto: emailContacto, sitio_web: sitioWeb, moneda, zona_horaria: zonaHoraria })
      setConfig(updated)
      setDirty(false)
      flash('ok', 'Configuración guardada correctamente.')
    } catch {
      flash('err', 'Error al guardar la configuración.')
    } finally {
      setSaving(false)
    }
  }

  async function handleGuardarModulos() {
    setSaving(true)
    try {
      const updated = await patchConfiguracion({ modulos_habilitados: modulosHabilitados })
      setConfig(updated)
      flash('ok', 'Módulos actualizados.')
    } catch {
      flash('err', 'Error al guardar módulos.')
    } finally {
      setSaving(false)
    }
  }

  function toggleModulo(codigo: string) {
    setModulosHabilitados(prev =>
      prev.includes(codigo) ? prev.filter(c => c !== codigo) : [...prev, codigo],
    )
  }

  async function handleExportarTenant() {
    setBackupLoading(true)
    try {
      await exportarTenant()
      flash('ok', 'Exportación descargada.')
    } catch {
      flash('err', 'Error al exportar.')
    } finally {
      setBackupLoading(false)
    }
  }

  async function handleBackupCompleto() {
    setBackupLoading(true)
    try {
      await backupCompleto()
      flash('ok', 'Backup completo descargado.')
    } catch {
      flash('err', 'Error al generar backup completo.')
    } finally {
      setBackupLoading(false)
    }
  }

  async function handleRestore() {
    if (!restoreFile) return
    if (!window.confirm(`¿Restaurar desde "${restoreFile.name}"? Esto sobreescribirá datos existentes.`)) return
    setRestoreLoading(true)
    try {
      const res = await restoreBackup(restoreFile)
      flash('ok', res.mensaje)
      setRestoreFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch {
      flash('err', 'Error al restaurar el backup.')
    } finally {
      setRestoreLoading(false)
    }
  }

  async function handleCrearGestion() {
    const año = parseInt(nuevoAño, 10)
    if (!año || año < 2000 || año > 2100) { flash('err', 'Año inválido.'); return }
    setGestionLoading(true)
    try {
      const nueva = await crearGestion(año, nuevaDesc)
      setGestiones(prev => [nueva, ...prev])
      setNuevoAño('')
      setNuevaDesc('')
      flash('ok', `Gestión ${año} creada.`)
    } catch {
      flash('err', 'No se pudo crear la gestión (¿ya existe ese año?).')
    } finally {
      setGestionLoading(false)
    }
  }

  async function handleCongelar(id: number) {
    try {
      const updated = await congelarGestion(id)
      setGestiones(prev => prev.map(g => g.id === id ? updated : g))
      flash('ok', 'Gestión congelada.')
    } catch {
      flash('err', 'Error al congelar.')
    }
  }

  async function handleDescongelar(id: number) {
    try {
      const updated = await descongelarGestion(id)
      setGestiones(prev => prev.map(g => g.id === id ? updated : g))
      flash('ok', 'Gestión descongelada.')
    } catch {
      flash('err', 'Error al descongelar.')
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
        Cargando configuración…
      </div>
    )
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'establecimiento', label: 'Establecimiento' },
    { id: 'modulos',         label: 'Módulos' },
    { id: 'backup',          label: 'Backup / Restore' },
    { id: 'gestiones',       label: 'Gestiones Anuales' },
  ]

  return (
    <div style={{ padding: '28px 32px', maxWidth: '860px', margin: '0 auto', fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>
          Configuración
        </h1>
        <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
          Personaliza tu establecimiento, módulos habilitados y gestión de datos.
        </p>
      </div>

      {/* Flash */}
      {msg && (
        <div style={{
          padding: '10px 16px', borderRadius: '8px', marginBottom: '16px',
          fontSize: '13px', fontWeight: 500,
          background: msg.tipo === 'ok' ? '#ECFDF5' : '#FEF2F2',
          color:      msg.tipo === 'ok' ? '#065F46' : '#991B1B',
          border:     `1px solid ${msg.tipo === 'ok' ? '#A7F3D0' : '#FECACA'}`,
        }}>
          {msg.texto}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '20px', background: '#F1F5F9', borderRadius: '10px', padding: '4px' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '8px 12px', border: 'none', borderRadius: '7px',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              background: tab === t.id ? '#fff' : 'transparent',
              color:      tab === t.id ? '#0F172A' : '#64748B',
              boxShadow:  tab === t.id ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Establecimiento ── */}
      {tab === 'establecimiento' && (
        <div style={card}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', margin: '0 0 20px' }}>
            Datos del establecimiento
          </h2>
          <div style={fieldRow}>
            <label style={label}>Email de contacto</label>
            <input
              style={input} type="email" value={emailContacto}
              onChange={e => { setEmailContacto(e.target.value); setDirty(true) }}
              placeholder="contacto@establecimiento.com"
            />
          </div>
          <div style={fieldRow}>
            <label style={label}>Sitio web</label>
            <input
              style={input} type="text" value={sitioWeb}
              onChange={e => { setSitioWeb(e.target.value); setDirty(true) }}
              placeholder="https://www.ejemplo.com"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={fieldRow}>
              <label style={label}>Moneda</label>
              <select
                style={input} value={moneda}
                onChange={e => { setMoneda(e.target.value); setDirty(true) }}
              >
                {MONEDAS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div style={fieldRow}>
              <label style={label}>Zona horaria</label>
              <input
                style={input} type="text" value={zonaHoraria}
                onChange={e => { setZonaHoraria(e.target.value); setDirty(true) }}
                placeholder="America/La_Paz"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button style={btnPrimary} onClick={() => void handleGuardar()} disabled={saving || !dirty}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
            {dirty && (
              <button style={btnSecondary} onClick={() => {
                setEmailContacto(config?.email_contacto ?? '')
                setSitioWeb(config?.sitio_web ?? '')
                setMoneda(config?.moneda ?? 'BOB')
                setZonaHoraria(config?.zona_horaria ?? 'America/La_Paz')
                setDirty(false)
              }}>
                Descartar
              </button>
            )}
          </div>
          {dirty && (
            <p style={{ fontSize: '12px', color: '#92400E', marginTop: '10px', background: '#FFFBEB', padding: '6px 12px', borderRadius: '6px', border: '1px solid #FDE68A' }}>
              Tienes cambios sin guardar. Usa Ctrl+S para guardar rápidamente.
            </p>
          )}
        </div>
      )}

      {/* ── Tab: Módulos ── */}
      {tab === 'modulos' && (
        <div style={card}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', margin: '0 0 4px' }}>
            Módulos habilitados
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 20px' }}>
            Los módulos desmarcados quedarán ocultos para los usuarios de este establecimiento.
            Si no se selecciona ninguno, todos estarán habilitados.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            {(config?.modulos_disponibles ?? []).map(m => (
              <label
                key={m.codigo}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                  border: `1px solid ${modulosHabilitados.includes(m.codigo) ? '#A7F3D0' : '#E2E8F0'}`,
                  background: modulosHabilitados.includes(m.codigo) ? '#ECFDF5' : '#F8FAFC',
                }}
              >
                <input
                  type="checkbox"
                  checked={modulosHabilitados.includes(m.codigo)}
                  onChange={() => toggleModulo(m.codigo)}
                  style={{ accentColor: '#00A896', width: '16px', height: '16px' }}
                />
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#1E293B' }}>{m.nombre}</span>
                <span style={{ fontSize: '11px', color: '#94A3B8', marginLeft: 'auto' }}>{m.codigo}</span>
              </label>
            ))}
          </div>
          <button style={btnPrimary} onClick={() => void handleGuardarModulos()} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar módulos'}
          </button>
        </div>
      )}

      {/* ── Tab: Backup / Restore ── */}
      {tab === 'backup' && (
        <>
          <div style={card}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', margin: '0 0 4px' }}>
              Exportar datos del establecimiento
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px' }}>
              Descarga un archivo JSON con todos los datos clínicos de tu establecimiento: pacientes, fichas, triajes y consultas.
            </p>
            <button style={btnPrimary} onClick={() => void handleExportarTenant()} disabled={backupLoading}>
              {backupLoading ? 'Generando…' : 'Descargar exportación'}
            </button>
          </div>

          {isSuperadmin && (
            <>
              <div style={card}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', margin: '0 0 4px' }}>
                  Backup completo del sistema
                </h2>
                <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px' }}>
                  Solo superadmin. Genera un dumpdata completo de toda la base de datos.
                </p>
                <button style={btnPrimary} onClick={() => void handleBackupCompleto()} disabled={backupLoading}>
                  {backupLoading ? 'Generando…' : 'Backup completo'}
                </button>
              </div>

              <div style={card}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#DC2626', margin: '0 0 4px' }}>
                  Restaurar desde backup
                </h2>
                <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px' }}>
                  Solo superadmin. Sube un archivo JSON previamente exportado con Backup completo.
                  <strong style={{ color: '#DC2626' }}> Esta operación sobreescribe datos existentes.</strong>
                </p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={e => setRestoreFile(e.target.files?.[0] ?? null)}
                    style={{ fontSize: '13px' }}
                  />
                  {restoreFile && (
                    <button
                      style={btnDanger}
                      onClick={() => void handleRestore()}
                      disabled={restoreLoading}
                    >
                      {restoreLoading ? 'Restaurando…' : 'Restaurar ahora'}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ── Tab: Gestiones Anuales ── */}
      {tab === 'gestiones' && (
        <>
          <div style={card}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', margin: '0 0 4px' }}>
              Nueva gestión anual
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px' }}>
              Crea una gestión por año. Una vez congelada, los datos de ese año serán de solo lectura.
            </p>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ ...fieldRow, marginBottom: 0 }}>
                <label style={label}>Año</label>
                <input
                  style={{ ...input, width: '100px' }}
                  type="number" value={nuevoAño} min={2000} max={2100}
                  onChange={e => setNuevoAño(e.target.value)}
                  placeholder={String(new Date().getFullYear())}
                />
              </div>
              <div style={{ ...fieldRow, flex: 1, marginBottom: 0 }}>
                <label style={label}>Descripción (opcional)</label>
                <input
                  style={input} value={nuevaDesc}
                  onChange={e => setNuevaDesc(e.target.value)}
                  placeholder="Ej. Gestión fiscal 2025"
                />
              </div>
              <button style={btnPrimary} onClick={() => void handleCrearGestion()} disabled={gestionLoading || !nuevoAño}>
                {gestionLoading ? 'Creando…' : 'Crear gestión'}
              </button>
            </div>
          </div>

          <div style={card}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', margin: '0 0 16px' }}>
              Gestiones registradas
            </h2>
            {gestiones.length === 0 ? (
              <p style={{ color: '#94A3B8', fontSize: '14px' }}>No hay gestiones creadas aún.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {gestiones.map(g => (
                  <div
                    key={g.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 16px', borderRadius: '8px',
                      border: `1px solid ${g.congelada ? '#BFDBFE' : '#E2E8F0'}`,
                      background: g.congelada ? '#EFF6FF' : '#F8FAFC',
                    }}
                  >
                    <span style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', minWidth: '50px' }}>
                      {g.año}
                    </span>
                    <span style={{
                      fontSize: '11px', fontWeight: 700,
                      padding: '3px 10px', borderRadius: '20px',
                      background: g.congelada ? '#DBEAFE' : '#DCFCE7',
                      color:      g.congelada ? '#1D4ED8' : '#15803D',
                    }}>
                      {g.congelada ? 'CONGELADA' : 'ACTIVA'}
                    </span>
                    {g.descripcion && (
                      <span style={{ fontSize: '13px', color: '#64748B', flex: 1 }}>{g.descripcion}</span>
                    )}
                    {g.congelada && g.fecha_congelamiento && (
                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                        {new Date(g.fecha_congelamiento).toLocaleDateString('es-BO')}
                      </span>
                    )}
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                      {!g.congelada ? (
                        <button style={btnSecondary} onClick={() => void handleCongelar(g.id)}>
                          Congelar
                        </button>
                      ) : isSuperadmin ? (
                        <button style={btnDanger} onClick={() => void handleDescongelar(g.id)}>
                          Descongelar
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>Solo superadmin puede descongelar</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
