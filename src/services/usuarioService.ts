import { api } from '../api/axiosConfig'

export interface UsuarioSinPerfil {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
}

export async function fetchUsuariosSinPerfil() {
  const { data } = await api.get<UsuarioSinPerfil[]>('usuarios-sin-perfil/')
  return data
}
