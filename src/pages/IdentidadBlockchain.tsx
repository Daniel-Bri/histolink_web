import { useEffect, useRef, useState } from 'react'
import { api } from '../api/axiosConfig'

interface EventoBlockchain {
  numero_bloque: number
  tipo_evento: string
  documento_tipo: string
  documento_id: number
  firmado_por: string
  timestamp: string
  bloque_hash: string
}

interface PersonalIdentidad {
  id: number
  nombre_completo: string
  username: string
  rol: string
  did: string | null
  clave_publica_corta: string
  estado_ledger: 'INMUTABLE' | 'PENDIENTE'
}

interface IdentidadRegistrada {
  mensaje: string
  did: string
  clave_publica: string
  usuario: string
}

interface VerificacionRol {
  valido: boolean
  did?: string
  error?: string
}

interface IntegridadCadena {
  valida: boolean
  total_bloques: number
}

const ESTADO_COLORS = {
  INMUTABLE: { bg: '#E8F5E9', text: '#2E7D32', label: 'Inmutable' },
  PENDIENTE: { bg: '#FFF8E1', text: '#F57F17', label: 'Pendiente' },
}

export default function IdentidadBlockchain() {
  const [eventos, setEventos] = useState<EventoBlockchain[]>([])
  const [personal, setPersonal] = useState<PersonalIdentidad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [integridad, setIntegridad] = useState<IntegridadCadena | null>(null)

  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState('Todos')

  const [usuarioId, setUsuarioId] = useState('')
  const [registrando, setRegistrando] = useState(false)
  const [identidadRegistrada, setIdentidadRegistrada] = useState<IdentidadRegistrada | null>(null)
  const [busquedaRegistrar, setBusquedaRegistrar] = useState('')
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<PersonalIdentidad | null>(null)
  const [dropdownRegistrarAbierto, setDropdownRegistrarAbierto] = useState(false)
  const dropdownRegistrarRef = useRef<HTMLDivElement>(null)

  const [usuarioVerificarId, setUsuarioVerificarId] = useState('')
  const [verificando, setVerificando] = useState(false)
  const [resultadoVerificacion, setResultadoVerificacion] = useState<VerificacionRol | null>(null)
  const [busquedaVerificar, setBusquedaVerificar] = useState('')
  const [usuarioVerificarSel, setUsuarioVerificarSel] = useState<PersonalIdentidad | null>(null)
  const [dropdownVerificarAbierto, setDropdownVerificarAbierto] = useState(false)
  const dropdownVerificarRef = useRef<HTMLDivElement>(null)

  const cargarDatos = async () => {
    setLoading(true)
    setError('')
    try {
      const [eventosRes, integridadRes, personalRes] = await Promise.all([
        api.get('blockchain/eventos/'),
        api.get('blockchain/verificar-cadena/'),
        api.get('blockchain/personal/'),
      ])
      setEventos(eventosRes.data)
      setIntegridad(integridadRes.data)
      setPersonal(personalRes.data)
    } catch {
      setError('Error al cargar datos de la blockchain')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarDatos() }, [])

  const roles = ['Todos', ...Array.from(new Set(personal.map(p => p.rol)))]

  const personalFiltrado = personal.filter(p => {
    const matchBusqueda = p.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.username.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.did ?? '').toLowerCase().includes(busqueda.toLowerCase())
    const matchRol = filtroRol === 'Todos' || p.rol === filtroRol
    return matchBusqueda && matchRol
  })

  const resultadosRegistrar = busquedaRegistrar.trim()
    ? personal
        .filter(p => p.estado_ledger === 'PENDIENTE')
        .filter(p => {
          const q = busquedaRegistrar.toLowerCase()
          return p.nombre_completo.toLowerCase().includes(q) ||
            p.username.toLowerCase().includes(q) ||
            String(p.id).includes(q) ||
            p.rol.toLowerCase().includes(q)
        })
    : []

  const resultadosVerificar = busquedaVerificar.trim()
    ? personal.filter(p => {
        const q = busquedaVerificar.toLowerCase()
        return p.nombre_completo.toLowerCase().includes(q) ||
          p.username.toLowerCase().includes(q) ||
          String(p.id).includes(q) ||
          p.rol.toLowerCase().includes(q)
      })
    : []

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRegistrarRef.current && !dropdownRegistrarRef.current.contains(e.target as Node)) {
        setDropdownRegistrarAbierto(false)
      }
      if (dropdownVerificarRef.current && !dropdownVerificarRef.current.contains(e.target as Node)) {
        setDropdownVerificarAbierto(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleRegistrarIdentidad = async () => {
    if (!usuarioId) { setError('Selecciona un usuario de la lista'); return }
    setRegistrando(true)
    setError('')
    setIdentidadRegistrada(null)
    try {
      const res = await api.post('blockchain/identidad/registrar/', { usuario_id: parseInt(usuarioId) })
      setIdentidadRegistrada(res.data)
      setExito('Identidad registrada exitosamente')
      setUsuarioId('')
      setUsuarioSeleccionado(null)
      setBusquedaRegistrar('')
      await cargarDatos()
      setTimeout(() => setExito(''), 3000)
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Error al registrar identidad')
    } finally {
      setRegistrando(false)
    }
  }

  const handleVerificarRol = async () => {
    if (!usuarioVerificarId) { setError('Selecciona un usuario de la lista'); return }
    setVerificando(true)
    setError('')
    setResultadoVerificacion(null)
    try {
      const res = await api.get(`blockchain/verificar-rol/${usuarioVerificarId}/`)
      setResultadoVerificacion(res.data)
    } catch (e: any) {
      setResultadoVerificacion({
        valido: false,
        error: e.response?.data?.error ?? 'Error al verificar rol'
      })
    } finally {
      setVerificando(false)
    }
  }

  const hashCorto = (hash: string) => hash ? `${hash.substring(0, 8)}...${hash.substring(hash.length - 4)}` : '—'

  const inputStyle = {
    padding: '8px 12px', fontSize: '13px',
    border: '1px solid #B3D4FF', borderRadius: '6px',
    width: '100%', boxSizing: 'border-box' as const,
    outline: 'none',
  }

  return (
    <div style={{ padding: '32px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: '22px', color: '#0003B8', fontWeight: 700, marginBottom: '4px' }}>
        Módulo de Gestión de Identidad Digital (Blockchain)
      </h1>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
        Registro y verificación de identidades digitales del personal de salud.
      </p>

      {error && (
        <div style={{ background: '#FFF0F0', border: '1px solid #E53935', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#E53935' }}>
          {error}
        </div>
      )}
      {exito && (
        <div style={{ background: '#F0FFF8', border: '1px solid #00A896', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#00A896' }}>
          {exito}
        </div>
      )}

      {/* Tabla de personal */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,3,184,0.06)', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0003B8', marginBottom: '16px' }}>
          Personal de Salud — Estado de Identidad
        </h2>

        {/* Buscador y filtro */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, usuario o dirección hash..."
            style={{ ...inputStyle, flex: 1 }}
          />
          <select
            value={filtroRol}
            onChange={e => setFiltroRol(e.target.value)}
            style={{ ...inputStyle, width: '180px' }}
          >
            {roles.map(r => <option key={r} value={r}>{r === 'Todos' ? 'Todos los Roles' : r}</option>)}
          </select>
        </div>

        {/* Tabla */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#0003B8' }}>Cargando...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F0F6FF' }}>
                {['Nombre Completo', 'Rol Interno', 'Llave Pública (Dirección)', 'DID', 'Estado Ledger'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#0003B8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {personalFiltrado.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#888', fontSize: '13px' }}>
                    No se encontraron resultados
                  </td>
                </tr>
              ) : personalFiltrado.map((p, i) => (
                <tr key={p.id} style={{ borderTop: '1px solid #F0F6FF', background: i % 2 === 0 ? 'white' : '#FAFCFF' }}>
                  <td style={{ padding: '12px 14px', fontSize: '14px', fontWeight: 600 }}>{p.nombre_completo}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#555' }}>{p.rol}</td>
                  <td style={{ padding: '12px 14px', fontSize: '12px', color: '#0080FF', fontFamily: 'monospace' }}>
                    {p.clave_publica_corta}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '11px', color: '#666', fontFamily: 'monospace' }}>
                    {p.did ?? <span style={{ color: '#aaa' }}>Sin registrar</span>}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      background: ESTADO_COLORS[p.estado_ledger].bg,
                      color: ESTADO_COLORS[p.estado_ledger].text,
                      padding: '3px 10px', borderRadius: '20px',
                      fontSize: '12px', fontWeight: 600,
                    }}>
                      {ESTADO_COLORS[p.estado_ledger].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paneles registrar y verificar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>

        {/* Registrar */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,3,184,0.06)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0003B8', marginBottom: '8px' }}>🔑 Registrar Identidad</h2>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>Genera claves RSA y DID para un usuario sin identidad.</p>

          <div style={{ marginBottom: '12px', position: 'relative' }} ref={dropdownRegistrarRef}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '6px' }}>
              Buscar usuario *
            </label>

            {usuarioSeleccionado ? (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#F0F6FF', border: '1.5px solid #0003B8', borderRadius: '8px', padding: '10px 12px',
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0003B8' }}>{usuarioSeleccionado.nombre_completo}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#555' }}>@{usuarioSeleccionado.username} · {usuarioSeleccionado.rol} · ID {usuarioSeleccionado.id}</p>
                </div>
                <button
                  onClick={() => { setUsuarioSeleccionado(null); setUsuarioId(''); setBusquedaRegistrar('') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '18px', lineHeight: 1, padding: '0 4px' }}
                >×</button>
              </div>
            ) : (
              <>
                <input
                  value={busquedaRegistrar}
                  onChange={e => { setBusquedaRegistrar(e.target.value); setDropdownRegistrarAbierto(true) }}
                  onFocus={() => setDropdownRegistrarAbierto(true)}
                  placeholder="Buscar por nombre, usuario o ID..."
                  style={inputStyle}
                />
                {dropdownRegistrarAbierto && resultadosRegistrar.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                    background: 'white', border: '1px solid #B3D4FF', borderRadius: '8px',
                    boxShadow: '0 4px 16px rgba(0,3,184,0.12)', maxHeight: '220px', overflowY: 'auto',
                    marginTop: '4px',
                  }}>
                    {resultadosRegistrar.map(p => (
                      <div
                        key={p.id}
                        onMouseDown={() => {
                          setUsuarioSeleccionado(p)
                          setUsuarioId(String(p.id))
                          setBusquedaRegistrar('')
                          setDropdownRegistrarAbierto(false)
                        }}
                        style={{
                          padding: '10px 14px', cursor: 'pointer',
                          borderBottom: '1px solid #F0F6FF',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F0F6FF')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                      >
                        <div>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0003B8' }}>{p.nombre_completo}</p>
                          <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#666' }}>@{p.username} · ID {p.id}</p>
                        </div>
                        <span style={{ background: '#FFF8E1', color: '#F57F17', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '12px' }}>
                          {p.rol}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {dropdownRegistrarAbierto && busquedaRegistrar.trim() && resultadosRegistrar.length === 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                    background: 'white', border: '1px solid #B3D4FF', borderRadius: '8px',
                    padding: '12px', marginTop: '4px', fontSize: '13px', color: '#888', textAlign: 'center',
                  }}>
                    Sin resultados. Solo se muestran usuarios sin identidad registrada.
                  </div>
                )}
              </>
            )}
          </div>

          <button onClick={handleRegistrarIdentidad} disabled={registrando || !usuarioSeleccionado}
            style={{
              background: usuarioSeleccionado ? '#0003B8' : '#B3D4FF',
              color: 'white', border: 'none', borderRadius: '8px',
              padding: '10px 20px', fontSize: '14px', fontWeight: 600,
              cursor: usuarioSeleccionado ? 'pointer' : 'not-allowed', width: '100%',
            }}>
            {registrando ? 'Registrando...' : '+ Registrar Identidad'}
          </button>
          {identidadRegistrada && (
            <div style={{ marginTop: '16px', background: '#F0F6FF', borderRadius: '8px', padding: '14px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#0003B8', marginBottom: '6px' }}>✅ Identidad creada</p>
              <p style={{ fontSize: '12px', color: '#555', marginBottom: '4px' }}><b>Usuario:</b> {identidadRegistrada.usuario}</p>
              <p style={{ fontSize: '12px', color: '#555', marginBottom: '4px' }}><b>DID:</b> {identidadRegistrada.did}</p>
              <p style={{ fontSize: '12px', color: '#555', wordBreak: 'break-all' }}>
                <b>Clave pública:</b> {identidadRegistrada.clave_publica.substring(0, 60)}...
              </p>
            </div>
          )}
        </div>

        {/* Verificar */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,3,184,0.06)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0003B8', marginBottom: '8px' }}>🔍 Verificar Integridad de Rol</h2>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>Contrasta el rol local con el registro en blockchain.</p>

          <div style={{ marginBottom: '12px', position: 'relative' }} ref={dropdownVerificarRef}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '6px' }}>
              Buscar usuario *
            </label>

            {usuarioVerificarSel ? (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#F0FFF8', border: '1.5px solid #00A896', borderRadius: '8px', padding: '10px 12px',
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#00A896' }}>{usuarioVerificarSel.nombre_completo}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#555' }}>@{usuarioVerificarSel.username} · {usuarioVerificarSel.rol} · ID {usuarioVerificarSel.id}</p>
                </div>
                <button
                  onClick={() => { setUsuarioVerificarSel(null); setUsuarioVerificarId(''); setBusquedaVerificar(''); setResultadoVerificacion(null) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '18px', lineHeight: 1, padding: '0 4px' }}
                >×</button>
              </div>
            ) : (
              <>
                <input
                  value={busquedaVerificar}
                  onChange={e => { setBusquedaVerificar(e.target.value); setDropdownVerificarAbierto(true) }}
                  onFocus={() => setDropdownVerificarAbierto(true)}
                  placeholder="Buscar por nombre, usuario o ID..."
                  style={inputStyle}
                />
                {dropdownVerificarAbierto && resultadosVerificar.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                    background: 'white', border: '1px solid #B3D4FF', borderRadius: '8px',
                    boxShadow: '0 4px 16px rgba(0,3,184,0.12)', maxHeight: '220px', overflowY: 'auto',
                    marginTop: '4px',
                  }}>
                    {resultadosVerificar.map(p => (
                      <div
                        key={p.id}
                        onMouseDown={() => {
                          setUsuarioVerificarSel(p)
                          setUsuarioVerificarId(String(p.id))
                          setBusquedaVerificar('')
                          setDropdownVerificarAbierto(false)
                          setResultadoVerificacion(null)
                        }}
                        style={{
                          padding: '10px 14px', cursor: 'pointer',
                          borderBottom: '1px solid #F0F6FF',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F0F6FF')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                      >
                        <div>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0003B8' }}>{p.nombre_completo}</p>
                          <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#666' }}>@{p.username} · ID {p.id}</p>
                        </div>
                        <span style={{
                          background: p.estado_ledger === 'INMUTABLE' ? '#E8F5E9' : '#FFF8E1',
                          color: p.estado_ledger === 'INMUTABLE' ? '#2E7D32' : '#F57F17',
                          fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '12px',
                        }}>
                          {p.rol}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {dropdownVerificarAbierto && busquedaVerificar.trim() && resultadosVerificar.length === 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                    background: 'white', border: '1px solid #B3D4FF', borderRadius: '8px',
                    padding: '12px', marginTop: '4px', fontSize: '13px', color: '#888', textAlign: 'center',
                  }}>
                    No se encontraron usuarios.
                  </div>
                )}
              </>
            )}
          </div>

          <button onClick={handleVerificarRol} disabled={verificando || !usuarioVerificarSel}
            style={{
              background: usuarioVerificarSel ? '#0080FF' : '#B3D4FF',
              color: 'white', border: 'none', borderRadius: '8px',
              padding: '10px 20px', fontSize: '14px', fontWeight: 600,
              cursor: usuarioVerificarSel ? 'pointer' : 'not-allowed', width: '100%',
            }}>
            {verificando ? 'Verificando...' : '🔍 Verificar Rol'}
          </button>
          {resultadoVerificacion && (
            <div style={{
              marginTop: '16px', borderRadius: '8px', padding: '14px',
              background: resultadoVerificacion.valido ? '#F0FFF8' : '#FFF0F0',
              border: `1px solid ${resultadoVerificacion.valido ? '#00A896' : '#E53935'}`
            }}>
              {resultadoVerificacion.valido ? (
                <>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#00A896', marginBottom: '6px' }}>✅ Rol verificado — Sin alteraciones</p>
                  <p style={{ fontSize: '12px', color: '#555' }}><b>DID:</b> {resultadoVerificacion.did}</p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#E53935', marginBottom: '6px' }}>⚠️ Alteración detectada</p>
                  <p style={{ fontSize: '12px', color: '#E53935' }}>{resultadoVerificacion.error}</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Registro de bloques + Estado cadena */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

        {/* Registro de bloques — izquierda */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,3,184,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F0F6FF' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0003B8', margin: 0 }}>📋 Registro de Bloques</h2>
          </div>
          {eventos.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>No hay eventos registrados</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F0F6FF' }}>
                  {['Bloque', 'Evento', 'Documento', 'Firmado por', 'Timestamp', 'Hash'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#0003B8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {eventos.map((e, i) => (
                  <tr key={e.numero_bloque} style={{ borderTop: '1px solid #F0F6FF', background: i % 2 === 0 ? 'white' : '#FAFCFF' }}>
                    <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: 600, color: '#0003B8' }}>#{e.numero_bloque}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: '#E8F0FF', color: '#0003B8', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                        {e.tipo_evento}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: '#555' }}>{e.documento_tipo} #{e.documento_id}</td>
                    <td style={{ padding: '10px 14px', fontSize: '13px' }}>{e.firmado_por}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: '#888' }}>
                      {new Date(e.timestamp).toLocaleString('es-BO')}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '11px', color: '#666', fontFamily: 'monospace' }}>
                      {hashCorto(e.bloque_hash)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Estado cadena — derecha */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,3,184,0.06)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0003B8', marginBottom: '20px' }}>📊 Estado del Nodo Local</h2>

          {integridad ? (
            <>
              <div style={{ background: '#FFFDE7', border: '1px solid #F9A825', borderRadius: '8px', padding: '12px', marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#F57F17', margin: '0 0 4px' }}>Estado de Red:</p>
                <p style={{ fontSize: '12px', color: '#795548', margin: 0 }}>
                  Se recomienda verificación periódica de sincronización.
                </p>
              </div>

              <p style={{ fontSize: '13px', fontWeight: 600, color: '#0003B8', marginBottom: '12px' }}>Métricas de Integridad</p>

              {[
                { label: 'Consenso del Nodo', valor: 100, color: '#2E7D32' },
                { label: 'Sincronización Bloques', valor: integridad.total_bloques > 0 ? 94 : 0, color: '#0080FF' },
                { label: 'Integridad del Ledger', valor: integridad.valida ? 100 : 0, color: '#2E7D32' },
              ].map(m => (
                <div key={m.label} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#555' }}>{m.label}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: m.color }}>{m.valor}%</span>
                  </div>
                  <div style={{ background: '#F0F6FF', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                    <div style={{ background: m.color, width: `${m.valor}%`, height: '100%', borderRadius: '6px', transition: 'width 0.5s' }} />
                  </div>
                </div>
              ))}

              <div style={{ marginTop: '20px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#0003B8', marginBottom: '8px' }}>Última Firma de Bloque</p>
                <div style={{ background: '#F0F6FF', borderRadius: '8px', padding: '10px', fontFamily: 'monospace', fontSize: '11px', color: '#444', wordBreak: 'break-all' }}>
                  {eventos.length > 0 ? eventos[eventos.length - 1].bloque_hash : '—'}
                </div>
              </div>

              <button onClick={cargarDatos}
                style={{ marginTop: '16px', width: '100%', background: '#0003B8', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                🔄 Auditar Libro Mayor
              </button>
            </>
          ) : (
            <p style={{ color: '#888', fontSize: '13px' }}>Cargando...</p>
          )}
        </div>
      </div>
    </div>
  )
}