export type SexoPaciente = 'M' | 'F' | 'O'

export interface Paciente {
  id: number
  ci: string
  ci_complemento: string
  nombres: string
  apellido_paterno: string
  apellido_materno: string
  fecha_nacimiento: string
  sexo: SexoPaciente | string
  email?: string
  telefono: string
  direccion: string
}

export interface PacienteCreatePayload {
  ci: string
  ci_complemento?: string
  nombres: string
  apellido_paterno: string
  apellido_materno?: string
  fecha_nacimiento: string
  sexo: SexoPaciente
  email?: string
  telefono?: string
  direccion?: string
}

export interface RegistroPacienteFormValues {
  ci: string
  ci_complemento: string
  nombres: string
  apellido_paterno: string
  apellido_materno: string
  fecha_nacimiento: string
  sexo: string
  email: string
  telefono: string
  direccion: string
  [key: string]: string
}

export const REGISTRO_PACIENTE_INITIAL: RegistroPacienteFormValues = {
  ci: '',
  ci_complemento: '',
  nombres: '',
  apellido_paterno: '',
  apellido_materno: '',
  fecha_nacimiento: '',
  sexo: '',
  email: '',
  telefono: '',
  direccion: '',
}
