import { api } from '../api/axiosConfig'

export type RolPersonal = 'medico' | 'enfermera' | 'admin'

export interface PersonalUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
}

export interface EspecialidadRef {
  id: number
  nombre: string
}

export interface PersonalSalud {
  id: number
  user: PersonalUser
  item_min_salud: string
  rol: RolPersonal
  especialidad: EspecialidadRef | null
  telefono: string | null
  is_active: boolean
}

export interface PersonalCreatePayload {
  username: string
  first_name: string
  last_name: string
  email?: string
  password: string
  item_min_salud: string
  rol: RolPersonal
  especialidad?: number | null
  telefono?: string | null
}

export interface PersonalUpdatePayload {
  item_min_salud: string
  rol: RolPersonal
  especialidad?: number | null
  telefono?: string | null
}

export const ITEM_MIN_SALUD_PATTERN = /^[A-Z]{3}-\d{3}$/

export async function fetchPersonal(incluirInactivos = true) {
  const { data } = await api.get<PersonalSalud[]>('personal/', {
    params: incluirInactivos ? { incluir_inactivos: 'true' } : {},
  })
  return data
}

export async function fetchPersonalById(id: number) {
  const { data } = await api.get<PersonalSalud>(`personal/${id}/`)
  return data
}

export async function createPersonal(payload: PersonalCreatePayload) {
  const { data } = await api.post<PersonalSalud>('personal/', payload)
  return data
}

export async function updatePersonal(id: number, payload: PersonalUpdatePayload) {
  const { data } = await api.put<PersonalSalud>(`personal/${id}/`, payload)
  return data
}

export async function deactivatePersonal(id: number) {
  await api.delete(`personal/${id}/`)
}

export async function reactivatePersonal(id: number) {
  await api.post(`personal/${id}/reactivar/`)
}
