export type NivelUrgencia = 'ROJO' | 'NARANJA' | 'AMARILLO' | 'VERDE' | 'AZUL'

export const NIVEL_LABELS: Record<NivelUrgencia, string> = {
  ROJO:     'Rojo — Inmediato',
  NARANJA:  'Naranja — Muy urgente',
  AMARILLO: 'Amarillo — Urgente',
  VERDE:    'Verde — Poco urgente',
  AZUL:     'Azul — No urgente',
}

export const NIVEL_COLORS: Record<NivelUrgencia, { bg: string; text: string; border: string }> = {
  ROJO:     { bg: '#FEE2E2', text: '#DC2626', border: '#DC2626' },
  NARANJA:  { bg: '#FFEDD5', text: '#EA580C', border: '#EA580C' },
  AMARILLO: { bg: '#FEF9C3', text: '#CA8A04', border: '#B45309' },
  VERDE:    { bg: '#DCFCE7', text: '#16A34A', border: '#16A34A' },
  AZUL:     { bg: '#DBEAFE', text: '#2563EB', border: '#2563EB' },
}

export interface PacienteBrief {
  id: number
  nombre_completo: string
  ci: string
}

export interface FichaBrief {
  id: number
  correlativo: string
  paciente: PacienteBrief
  estado: string
  fecha_apertura: string
}

export interface ClasificarInput {
  motivo_consulta_triaje?: string
  saturacion_oxigeno?: number | null
  presion_sistolica?: number | null
  frecuencia_cardiaca?: number | null
  escala_dolor?: number | null
  glasgow?: number | null
}

export interface ClasificarResult {
  nivel_sugerido: NivelUrgencia
  nivel_numerico: number
  reglas_duras_aplicadas: boolean
  confianza_pct: string
  ajuste_signos: string
  probabilidades: Record<string, number>
  ml_degradado?: boolean
  error?: string
}

export interface TriajePayload {
  ficha: number
  peso_kg?: number | null
  talla_cm?: number | null
  frecuencia_cardiaca?: number | null
  frecuencia_respiratoria?: number | null
  presion_sistolica?: number | null
  presion_diastolica?: number | null
  temperatura_celsius?: number | null
  saturacion_oxigeno?: number | null
  glucemia?: number | null
  escala_dolor?: number | null
  glasgow?: number | null
  motivo_consulta_triaje: string
  observaciones?: string
  nivel_sugerido_ia?: NivelUrgencia | null
  nivel_urgencia: NivelUrgencia
  fue_sobreescrito: boolean
  justificacion_override?: string
  reglas_duras_aplicadas: boolean
}
