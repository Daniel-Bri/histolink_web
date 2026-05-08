import { api } from '../api/axiosConfig'

const BASE_TENANT    = 'tenants/mi-tenant/'
const BASE_CONFIG    = 'tenants/mi-tenant/configuracion/'
const BASE_BACKUP    = 'admin/backup/'
const BASE_GESTIONES = 'admin/backup/gestiones/'
const BASE_TENANTS   = 'tenants/'

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface ModuloSistema {
  codigo: string
  nombre: string
  habilitado: boolean
}

export interface ConfiguracionTenant {
  id: number
  tenant: number
  tenant_nombre: string
  email_contacto: string
  sitio_web: string
  idioma: string
  moneda: string
  zona_horaria: string
  modulos_habilitados: string[]
  campos_extra_paciente: CampoExtra[]
  modulos_disponibles: ModuloSistema[]
}

export interface CampoExtra {
  nombre: string
  tipo: 'texto' | 'numero' | 'booleano' | 'fecha'
  requerido: boolean
}

export interface TenantConConfig {
  id: number
  nombre: string
  slug: string
  nit: string
  direccion: string
  telefono: string
  activo: boolean
  configuracion: ConfiguracionTenant
}

export interface GestionAnual {
  id: number
  tenant: number
  tenant_nombre: string
  año: number
  congelada: boolean
  fecha_congelamiento: string | null
  descripcion: string
  creado_en: string
  actualizado_en: string
}

// ── API calls ────────────────────────────────────────────────────────────────

export async function getMiTenant(): Promise<TenantConConfig> {
  const { data } = await api.get<TenantConConfig>(BASE_TENANT)
  return data
}

export async function getConfiguracion(): Promise<ConfiguracionTenant> {
  const { data } = await api.get<ConfiguracionTenant>(BASE_CONFIG)
  return data
}

export async function patchConfiguracion(
  payload: Partial<Omit<ConfiguracionTenant, 'id' | 'tenant' | 'tenant_nombre' | 'modulos_disponibles'>>,
): Promise<ConfiguracionTenant> {
  const { data } = await api.patch<ConfiguracionTenant>(BASE_CONFIG, payload)
  return data
}

// ── Backup ───────────────────────────────────────────────────────────────────

export async function exportarTenant(): Promise<void> {
  const res = await api.post(`${BASE_BACKUP}exportar-tenant/`, {}, { responseType: 'blob' })
  const url  = URL.createObjectURL(res.data as Blob)
  const disp = res.headers['content-disposition'] as string | undefined
  const name = disp?.match(/filename="([^"]+)"/)?.[1] ?? 'export_tenant.json'
  const a    = document.createElement('a')
  a.href     = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export async function backupCompleto(): Promise<void> {
  const res = await api.post(`${BASE_BACKUP}completo/`, {}, { responseType: 'blob' })
  const url  = URL.createObjectURL(res.data as Blob)
  const disp = res.headers['content-disposition'] as string | undefined
  const name = disp?.match(/filename="([^"]+)"/)?.[1] ?? 'backup_completo.json'
  const a    = document.createElement('a')
  a.href     = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export async function restoreBackup(archivo: File): Promise<{ mensaje: string }> {
  const fd = new FormData()
  fd.append('archivo', archivo)
  const { data } = await api.post<{ mensaje: string }>(`${BASE_BACKUP}restore/`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

// ── Gestiones anuales ────────────────────────────────────────────────────────

export async function getGestiones(): Promise<GestionAnual[]> {
  const { data } = await api.get<GestionAnual[]>(BASE_GESTIONES)
  return data
}

export async function crearGestion(año: number, descripcion?: string): Promise<GestionAnual> {
  const { data } = await api.post<GestionAnual>(BASE_GESTIONES, { año, descripcion: descripcion ?? '' })
  return data
}

export async function congelarGestion(id: number): Promise<GestionAnual> {
  const { data } = await api.post<GestionAnual>(`${BASE_GESTIONES}${id}/congelar/`)
  return data
}

export async function descongelarGestion(id: number): Promise<GestionAnual> {
  const { data } = await api.post<GestionAnual>(`${BASE_GESTIONES}${id}/descongelar/`)
  return data
}

// ── Admin SaaS — gestión de tenants (solo superadmin) ────────────────────────

export interface TenantResumen {
  id: number
  nombre: string
  slug: string
  nit: string
  direccion: string
  telefono: string
  activo: boolean
  creado_en: string
}

export async function listarTenants(): Promise<TenantResumen[]> {
  const { data } = await api.get<TenantResumen[]>(BASE_TENANTS)
  return data
}

export async function crearTenant(payload: Omit<TenantResumen, 'id' | 'creado_en' | 'activo'>): Promise<TenantResumen> {
  const { data } = await api.post<TenantResumen>(BASE_TENANTS, payload)
  return data
}

export async function getTenant(id: number): Promise<TenantResumen> {
  const { data } = await api.get<TenantResumen>(`${BASE_TENANTS}${id}/`)
  return data
}

export async function patchTenant(id: number, payload: Partial<TenantResumen>): Promise<TenantResumen> {
  const { data } = await api.patch<TenantResumen>(`${BASE_TENANTS}${id}/`, payload)
  return data
}

export async function toggleActivoTenant(id: number): Promise<TenantResumen> {
  const { data } = await api.post<TenantResumen>(`${BASE_TENANTS}${id}/toggle-activo/`)
  return data
}

export async function getConfigTenant(id: number): Promise<ConfiguracionTenant> {
  const { data } = await api.get<ConfiguracionTenant>(`${BASE_TENANTS}${id}/configuracion/`)
  return data
}

export async function patchConfigTenant(
  id: number,
  payload: Partial<Omit<ConfiguracionTenant, 'id' | 'tenant' | 'tenant_nombre' | 'modulos_disponibles'>>,
): Promise<ConfiguracionTenant> {
  const { data } = await api.patch<ConfiguracionTenant>(`${BASE_TENANTS}${id}/configuracion/`, payload)
  return data
}
