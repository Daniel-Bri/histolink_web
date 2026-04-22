import type { AxiosResponse } from 'axios'
import {
  api,
  applyApiAuthHeader,
  clearApiAuthHeader,
  publicClient,
  refreshClient,
} from '../api/axiosConfig'
import { AUTH } from '../api/endpoints'

export const STORAGE_KEYS = {
  access: 'access_token',
  refresh: 'refresh_token',
  user: 'user',
} as const

export interface AuthTenant {
  id: number
  nombre: string
  slug: string
}

export interface AuthUser {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  groups: string[]
  tenant: AuthTenant | null
}

export interface LoginResponse {
  access: string
  refresh: string
  user: AuthUser
}

export function persistTokens(access: string, refresh: string) {
  localStorage.setItem(STORAGE_KEYS.access, access)
  localStorage.setItem(STORAGE_KEYS.refresh, refresh)
}

export function persistUser(user: AuthUser) {
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user))
}

export function clearAuthStorage() {
  localStorage.removeItem(STORAGE_KEYS.access)
  localStorage.removeItem(STORAGE_KEYS.refresh)
  localStorage.removeItem(STORAGE_KEYS.user)
  clearApiAuthHeader()
}

/**
 * POST /auth/token/refresh/ — persiste el nuevo access y actualiza el header por defecto de `api`.
 * El interceptor coordina una sola petición en vuelo (isRefreshing + cola).
 */
export async function requestNewAccessToken(): Promise<string> {
  const refresh = localStorage.getItem(STORAGE_KEYS.refresh)
  if (!refresh) {
    throw new Error('No refresh token')
  }
  const { data } = await refreshClient.post<{ access: string }>(AUTH.TOKEN_REFRESH, {
    refresh,
  })
  if (!data?.access) {
    throw new Error('Invalid refresh response')
  }
  localStorage.setItem(STORAGE_KEYS.access, data.access)
  applyApiAuthHeader(data.access)
  return data.access
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res: AxiosResponse<LoginResponse> = await publicClient.post(AUTH.LOGIN, {
    username,
    password,
  })
  const { access, refresh, user } = res.data
  persistTokens(access, refresh)
  persistUser(user)
  applyApiAuthHeader(access)
  return res.data
}

export async function logoutRequest(): Promise<void> {
  const refresh = localStorage.getItem(STORAGE_KEYS.refresh)
  if (refresh) {
    try {
      await api.post(AUTH.LOGOUT, { refresh })
    } catch {
      // Sesión ya inválida en servidor; limpiamos igual en cliente
    }
  }
}
