import axios from 'axios'

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

const DEFAULT_TIMEOUT_MS = 30_000

const clientConfig = {
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
}

/** Cliente con interceptores (registrados en `main.tsx`). */
export const api = axios.create(clientConfig)

/** Sin interceptores: evita bucles al llamar al refresh. */
export const refreshClient = axios.create(clientConfig)

/** Login y rutas públicas sin Bearer. */
export const publicClient = axios.create(clientConfig)

export function applyApiAuthHeader(accessToken: string) {
  api.defaults.headers.common.Authorization = `Bearer ${accessToken}`
}

export function clearApiAuthHeader() {
  delete api.defaults.headers.common.Authorization
}
