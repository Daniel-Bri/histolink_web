/** Rutas relativas a VITE_API_URL (sin barra inicial). */
export const AUTH = {
  LOGIN: 'auth/login/',
  LOGOUT: 'auth/logout/',
  /** SimpleJWT: POST { refresh } → { access } */
  TOKEN_REFRESH: 'auth/token/refresh/',
} as const
