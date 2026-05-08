import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  listarTenants,
  crearTenant,
  toggleActivoTenant,
  type TenantResumen,
} from '../../services/configuracionService'
import { getStoredUser } from '../../utils/auth'

// ── Estilos ───────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: '12px',
  border: '1px solid #E2E8F0',
  padding: '20px 24px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
}

const input: React.CSSProperties = {
  border: '1px solid #D1D5DB',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '14px',
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
}

const btnPrimary: React.CSSProperties = {
  background: '#00A896',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '9px 20px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
}

const btnSecondary: React.CSSProperties = {
  background: '#F1F5F9',
  color: '#334155',
  border: '1px solid #CBD5E1',
  borderRadius: '8px',
  padding: '7px 14px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function AdminTenants() {
  const navigate = useNavigate()
  const user     = getStoredUser()

  // Guardia: solo superadmin
  if (!user?.is_staff) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>
        Acceso restringido — solo superadmin.
      </div>
    )
  }

  const [tenants, setTenants]   = useState<TenantResumen[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [showForm, setShowForm] = useState(false)
  const [msg, setMsg]           = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)

  // Nuevo tenant
  const [nombre,    setNombre]    = useState('')
  const [slug,      setSlug]      = useState('')
  const [nit,       setNit]       = useState('')
  const [direccion, setDireccion] = useState('')
  const [telefono,  setTelefono]  = useState('')
  const [creating,  setCreating]  = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        setTenants(await listarTenants())
      } catch {
        flash('err', 'No se pudo cargar la lista de establecimientos.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Auto-generar slug desde nombre
  useEffect(() => {
    setSlug(
      nombre.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    )
  }, [nombre])

  function flash(tipo: 'ok' | 'err', texto: string) {
    setMsg({ tipo, texto })
    setTimeout(() => setMsg(null), 3500)
  }

  async function handleCrear() {
    if (!nombre.trim() || !slug.trim()) { flash('err', 'Nombre y slug son obligatorios.'); return }
    setCreating(true)
    try {
      const nuevo = await crearTenant({ nombre, slug, nit, direccion, telefono })
      setTenants(prev => [nuevo, ...prev])
      setShowForm(false)
      setNombre(''); setSlug(''); setNit(''); setDireccion(''); setTelefono('')
      flash('ok', `Establecimiento "${nuevo.nombre}" creado.`)
    } catch {
      flash('err', 'No se pudo crear el establecimiento (¿slug duplicado?).')
    } finally {
      setCreating(false)
    }
  }

  async function handleToggle(id: number) {
    try {
      const updated = await toggleActivoTenant(id)
      setTenants(prev => prev.map(t => t.id === id ? updated : t))
      flash('ok', `Estado actualizado.`)
    } catch {
      flash('err', 'Error al cambiar el estado.')
    }
  }

  const filtered = tenants.filter(t =>
    t.nombre.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase()),
  )

  const activos   = tenants.filter(t => t.activo).length
  const inactivos = tenants.length - activos

  return (
    <div style={{ padding: '28px 32px', fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>
            Panel SaaS — Establecimientos
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
            Gestión centralizada de todas las clínicas registradas en el sistema.
          </p>
        </div>
        <button style={btnPrimary} onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancelar' : '+ Nuevo establecimiento'}
        </button>
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

      {/* Estadísticas rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: 'Total',     value: tenants.length, color: '#3B82F6', bg: '#EFF6FF' },
          { label: 'Activos',   value: activos,        color: '#10B981', bg: '#ECFDF5' },
          { label: 'Inactivos', value: inactivos,      color: '#EF4444', bg: '#FEF2F2' },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: '16px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: '28px', fontWeight: 800, color: s.color, margin: '0 0 2px' }}>{s.value}</p>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Formulario nuevo tenant */}
      {showForm && (
        <div style={{ ...card, marginBottom: '20px', border: '1px solid #A7F3D0', background: '#F0FDF4' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#065F46', margin: '0 0 16px' }}>
            Nuevo establecimiento
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Nombre *</label>
              <input style={input} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Hospital San Juan de Dios" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Slug * (auto)</label>
              <input style={input} value={slug} onChange={e => setSlug(e.target.value)} placeholder="hospital-san-juan-de-dios" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>NIT</label>
              <input style={input} value={nit} onChange={e => setNit(e.target.value)} placeholder="1234567890" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Teléfono</label>
              <input style={input} value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="2-2345678" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Dirección</label>
              <input style={input} value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Av. Ejemplo 123, La Paz" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={btnPrimary} onClick={() => void handleCrear()} disabled={creating}>
              {creating ? 'Creando…' : 'Crear establecimiento'}
            </button>
            <button style={btnSecondary} onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Buscador */}
      <div style={{ marginBottom: '16px' }}>
        <input
          style={{ ...input, maxWidth: '360px' }}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o slug…"
        />
      </div>

      {/* Lista de tenants */}
      {loading ? (
        <p style={{ color: '#64748B', textAlign: 'center', padding: '40px' }}>Cargando establecimientos…</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: '#94A3B8', textAlign: 'center', padding: '40px' }}>No hay establecimientos que coincidan.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(t => (
            <div
              key={t.id}
              style={{
                ...card,
                padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: '16px',
                opacity: t.activo ? 1 : 0.65,
                borderLeft: `4px solid ${t.activo ? '#10B981' : '#E2E8F0'}`,
              }}
            >
              {/* Avatar inicial */}
              <div style={{
                width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
                background: t.activo ? 'rgba(0,168,150,0.12)' : '#F1F5F9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', fontWeight: 800,
                color: t.activo ? '#00A896' : '#94A3B8',
              }}>
                {t.nombre.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>{t.nombre}</span>
                  <span style={{
                    fontSize: '11px', fontWeight: 600,
                    padding: '2px 8px', borderRadius: '20px',
                    background: t.activo ? '#DCFCE7' : '#F1F5F9',
                    color:      t.activo ? '#15803D' : '#64748B',
                  }}>
                    {t.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <p style={{ color: '#64748B', fontSize: '12px', margin: '2px 0 0' }}>
                  slug: <code style={{ background: '#F1F5F9', padding: '1px 6px', borderRadius: '4px' }}>{t.slug}</code>
                  {t.nit && <> · NIT: {t.nit}</>}
                  {t.telefono && <> · {t.telefono}</>}
                </p>
              </div>

              {/* Acciones */}
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  style={btnPrimary}
                  onClick={() => navigate(`/admin/tenants/${t.id}`)}
                >
                  Configurar
                </button>
                <button
                  style={{
                    ...btnSecondary,
                    color:      t.activo ? '#DC2626' : '#15803D',
                    background: t.activo ? '#FEF2F2' : '#F0FDF4',
                    border:     `1px solid ${t.activo ? '#FECACA' : '#BBF7D0'}`,
                  }}
                  onClick={() => void handleToggle(t.id)}
                >
                  {t.activo ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
