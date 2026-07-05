import { api } from '../api/axiosConfig'
import type { Receta, BlockchainRecetaResponse } from '../types/receta.types'

export const recetaService = {
  listar: (params?: { estado?: string }) =>
    api.get<Receta[]>('clinica/recetas/', { params }),

  dispensar: (recetaId: number) =>
    api.patch<Receta>(`clinica/recetas/${recetaId}/dispensar/`),

  consultarBlockchain: (recetaId: number) =>
    api.get<BlockchainRecetaResponse>(`clinica/recetas/${recetaId}/blockchain/`),
}