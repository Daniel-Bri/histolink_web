import api from '../api/axios'

export interface Especialidad {
  id: number
  nombre: string
}

export async function fetchEspecialidades() {
  const { data } = await api.get<Especialidad[]>('/api/especialidades/')
  return data
}
