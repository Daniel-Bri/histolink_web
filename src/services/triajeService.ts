import { api } from '../api/axiosConfig'
import type { ClasificarInput, ClasificarResult, TriajePayload } from '../types/triaje.types'

export const triajeService = {
  clasificar: (data: ClasificarInput) =>
    api.post<ClasificarResult>('triaje/clasificar/', data),

  crear: (data: TriajePayload) =>
    api.post('triaje/', data),
}
