export type EstadoReceta = 'EMITIDA' | 'DISPENSADA' | 'ANULADA'

export interface DetalleReceta {
  id: number
  medicamento: string
  concentracion: string
  forma_farmaceutica: string
  via_administracion: string
  dosis: string
  frecuencia: string
  duracion: string
  cantidad_total: string
  instrucciones: string
  orden: number
}

export interface Receta {
  id: number
  consulta: number
  medico: number
  numero_receta: string
  fecha_emision: string
  estado: EstadoReceta
  dispensada_por: number | null
  fecha_dispensacion: string | null
  observaciones: string
  detalles: DetalleReceta[]
  paciente_nombre: string
  paciente_ci: string
  medico_nombre: string
}

export interface EventoBlockchainReceta {
  id: number
  numero_bloque: number
  tipo_evento: string
  documento_tipo: string
  documento_id: number
  hash_documento: string
  firma_rsa: string
  timestamp: string
  bloque_hash: string
  firmado_por: string
}

export interface BlockchainRecetaResponse {
  receta_id: number
  numero_receta: string
  estado_receta: EstadoReceta
  es_integro: boolean
  evento_blockchain: EventoBlockchainReceta
}