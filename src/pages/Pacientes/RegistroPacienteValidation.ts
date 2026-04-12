import type {
  PacienteCreatePayload,
  RegistroPacienteFormValues,
  SexoPaciente,
} from '../../types/paciente.types'

/** Mensaje requerido por T017 para CI numérico / longitud */
export const CI_DIGITS_ERROR = 'El CI debe tener entre 4 y 10 dígitos numéricos'

const LETTERS_SPACES_RE = /^[\p{L}\s]+$/u
const MAX_NAME = 100
const MAX_DIR = 200

function trim(v: string) {
  return v.trim()
}

export function validateCi(ci: string): string | undefined {
  const c = trim(ci)
  if (!c) return 'El CI es obligatorio'
  if (!/^\d+$/.test(c)) return CI_DIGITS_ERROR
  if (c.length < 4 || c.length > 10) return CI_DIGITS_ERROR
  return undefined
}

export function validateCiComplemento(v: string): string | undefined {
  const c = trim(v).toUpperCase()
  if (!c) return undefined
  if (c.length > 2) return 'Máximo 2 caracteres'
  if (!/^[A-Z0-9]+$/.test(c)) return 'Solo letras mayúsculas o números'
  return undefined
}

export function validateNombres(v: string): string | undefined {
  const c = trim(v)
  if (!c) return 'Los nombres son obligatorios'
  if (c.length > MAX_NAME) return `Máximo ${MAX_NAME} caracteres`
  if (!LETTERS_SPACES_RE.test(c)) return 'Solo letras y espacios'
  return undefined
}

export function validateApellidoPaterno(v: string): string | undefined {
  const c = trim(v)
  if (!c) return 'El apellido paterno es obligatorio'
  if (c.length > MAX_NAME) return `Máximo ${MAX_NAME} caracteres`
  if (!LETTERS_SPACES_RE.test(c)) return 'Solo letras y espacios'
  return undefined
}

export function validateApellidoMaterno(v: string): string | undefined {
  const c = trim(v)
  if (!c) return undefined
  if (c.length > MAX_NAME) return `Máximo ${MAX_NAME} caracteres`
  if (!LETTERS_SPACES_RE.test(c)) return 'Solo letras y espacios'
  return undefined
}

export function validateFechaNacimiento(isoDate: string): string | undefined {
  const c = trim(isoDate)
  if (!c) return 'La fecha de nacimiento es obligatoria'
  const d = new Date(c + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return 'Fecha no válida'
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  if (d > today) return 'La fecha no puede ser futura'
  return undefined
}

export function validateSexo(v: string): string | undefined {
  if (!v || !['M', 'F', 'O'].includes(v)) return 'Seleccione el sexo'
  return undefined
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(v: string): string | undefined {
  const c = trim(v)
  if (!c) return undefined
  if (!EMAIL_RE.test(c)) return 'Correo electrónico no válido'
  return undefined
}

export function validateTelefono(v: string): string | undefined {
  const c = trim(v)
  if (!c) return undefined
  if (!/^\d+$/.test(c)) return 'Solo números'
  if (c.length < 7 || c.length > 15) return 'Entre 7 y 15 dígitos'
  return undefined
}

export function validateDireccion(v: string): string | undefined {
  const c = trim(v)
  if (!c) return undefined
  if (c.length > MAX_DIR) return `Máximo ${MAX_DIR} caracteres`
  return undefined
}

type FieldKey = keyof RegistroPacienteFormValues

const validators: Record<FieldKey, (v: string) => string | undefined> = {
  ci: validateCi,
  ci_complemento: validateCiComplemento,
  nombres: validateNombres,
  apellido_paterno: validateApellidoPaterno,
  apellido_materno: validateApellidoMaterno,
  fecha_nacimiento: validateFechaNacimiento,
  sexo: validateSexo,
  email: validateEmail,
  telefono: validateTelefono,
  direccion: validateDireccion,
}

export function validateRegistroPacienteField(
  field: FieldKey,
  values: RegistroPacienteFormValues,
): string | undefined {
  return validators[field](values[field])
}

export function validateRegistroPacienteAll(
  values: RegistroPacienteFormValues,
): Partial<Record<FieldKey, string>> {
  const out: Partial<Record<FieldKey, string>> = {}
  ;(Object.keys(validators) as FieldKey[]).forEach((k) => {
    const err = validators[k](values[k])
    if (err) out[k] = err
  })
  return out
}

export function registroPacienteIsValid(values: RegistroPacienteFormValues): boolean {
  return Object.keys(validateRegistroPacienteAll(values)).length === 0
}

export function toCreatePayload(values: RegistroPacienteFormValues): PacienteCreatePayload {
  const ci_comp = trim(values.ci_complemento).toUpperCase()
  const payload: PacienteCreatePayload = {
    ci: trim(values.ci),
    nombres: trim(values.nombres),
    apellido_paterno: trim(values.apellido_paterno),
    fecha_nacimiento: values.fecha_nacimiento,
    sexo: values.sexo as SexoPaciente,
  }
  if (ci_comp) payload.ci_complemento = ci_comp
  const am = trim(values.apellido_materno)
  if (am) payload.apellido_materno = am
  const em = trim(values.email)
  if (em) payload.email = em
  const tel = trim(values.telefono)
  if (tel) payload.telefono = tel
  const dir = trim(values.direccion)
  if (dir) payload.direccion = dir
  return payload
}
