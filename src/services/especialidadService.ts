import { api } from '../api/axiosConfig'

export interface Especialidad {
  id: number
  nombre: string
}

export async function fetchEspecialidades() {
  const { data } = await api.get<Especialidad[]>('especialidades/')
  return data
}
