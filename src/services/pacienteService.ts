import type { AxiosResponse } from 'axios'
import { api } from '../api/axiosConfig'
import type { Paciente, PacienteCreatePayload } from '../types/paciente.types'

/** Misma convención que el listado en `Pacientes.tsx` (DRF bajo `pacientes/pacientes/`). */
const PACIENTES_PATH = 'pacientes/pacientes/'

export async function crearPaciente(
  payload: PacienteCreatePayload,
): Promise<AxiosResponse<Paciente>> {
  return api.post<Paciente>(PACIENTES_PATH, payload)
}

/** Errores 400 típicos de Django REST Framework. */
export function parseDrfErrorResponse(data: unknown): {
  fields: Record<string, string>
  general: string[]
} {
  const fields: Record<string, string> = {}
  const general: string[] = []
  if (!data || typeof data !== 'object') return { fields, general }
  const o = data as Record<string, unknown>
  for (const [key, raw] of Object.entries(o)) {
    if (key === 'non_field_errors' || key === 'detail') {
      const arr = Array.isArray(raw) ? raw : raw != null ? [raw] : []
      general.push(...arr.map(String))
      continue
    }
    if (Array.isArray(raw) && raw.length > 0) {
      fields[key] = String(raw[0])
    } else if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
      const first = Object.values(raw)[0]
      if (Array.isArray(first) && first[0] != null) fields[key] = String(first[0])
    } else if (typeof raw === 'string' && raw) {
      fields[key] = raw
    }
  }
  return { fields, general }
}
