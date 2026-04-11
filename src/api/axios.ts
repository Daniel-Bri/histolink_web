import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

const api = axios.create({
  baseURL: BASE_URL,
})

// Agrega el token automáticamente a cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Si el token expira, lo renueva automáticamente
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    // Si el error es 401 (token expirado) y no hemos reintentado ya
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        const res = await axios.post(`${BASE_URL}/api/auth/token/refresh/`, { refresh })
        localStorage.setItem('access_token', res.data.access)
        localStorage.setItem('refresh_token', res.data.refresh)
        original.headers.Authorization = `Bearer ${res.data.access}`
        return api(original)
      } catch {
        // Si el refresh también falló, manda al login
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api