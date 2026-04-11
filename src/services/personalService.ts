import api from '../api/axios'

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

export interface PersonalWritePayload {
  user_id: number
  item_min_salud: string
  rol: RolPersonal
  especialidad: number | null
  telefono?: string | null
}

export const ITEM_MIN_SALUD_PATTERN = /^[A-Z]{3}-\d{3}$/

export async function fetchPersonal(incluirInactivos = true) {
  const { data } = await api.get<PersonalSalud[]>('/api/personal/', {
    params: incluirInactivos ? { incluir_inactivos: 'true' } : {},
  })
  return data
}

export async function fetchPersonalById(id: number) {
  const { data } = await api.get<PersonalSalud>(`/api/personal/${id}/`)
  return data
}

export async function createPersonal(payload: PersonalWritePayload) {
  const { data } = await api.post<PersonalSalud>('/api/personal/', payload)
  return data
}

export async function updatePersonal(id: number, payload: PersonalWritePayload) {
  const { data } = await api.put<PersonalSalud>(`/api/personal/${id}/`, payload)
  return data
}

export async function deactivatePersonal(id: number) {
  await api.delete(`/api/personal/${id}/`)
}
