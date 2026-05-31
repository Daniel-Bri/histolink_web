import { api } from '../api/axiosConfig';

export interface DiagnosticoCIE10 {
  codigo: string;
  descripcion: string;
}

export interface Paciente {
  id: number;
  nombre_completo: string;
  edad: number;
  genero: 'M' | 'F';
}

export interface Medico {
  id: number;
  nombre: string;
}

export interface ConsultaMedica {
  id: number;
  ficha: number;
  paciente_nombre: string;
  ficha_correlativo: string;
  paciente_edad: number | null;
  paciente_genero: string;
  medico: number;
  triaje: number | null;
  estado: 'BORRADOR' | 'COMPLETADA' | 'FIRMADA';
  // SOAP-S
  motivo_consulta: string;
  historia_enfermedad_actual: string;
  // SOAP-O
  examen_fisico: string;
  // SOAP-A
  impresion_diagnostica: string;
  codigo_cie10_principal: string;
  codigo_cie10_secundario: string;
  descripcion_cie10: string;
  // SOAP-P
  plan_tratamiento: string;
  indicaciones_alta: string;
  // Firma Digital (CU11)
  hash_documento?: string;
  firmada_por?: number;
  firmada_por_nombre?: string;
  firmada_en?: string;
  // Otros
  creado_en: string;
  actualizado_en: string;
}

export interface FichaQueue {
  id: number;
  correlativo: string;
  paciente: {
    id: number;
    nombre_completo: string;
    ci: string;
  };
  estado: string;
  fecha_apertura: string;
  triaje_resumen: {
    frecuencia_cardiaca: number | null;
    presion_sistolica: number | null;
    presion_diastolica: number | null;
    temperatura_celsius: number | null;
    saturacion_oxigeno: number | null;
    glasgow: number | null;
  } | null;
}

export type UpdateConsultaDTO = Partial<ConsultaMedica>;

export const consultaService = {
  getById: (id: number) => api.get<ConsultaMedica>(`consultas/consultas/${id}/`),
  getByFicha: (fichaId: number) => api.get<{ results: ConsultaMedica[] }>('consultas/consultas/', { params: { ficha: fichaId } }),
  create: (fichaId: number) => api.post<ConsultaMedica>('consultas/consultas/', { ficha: fichaId }),
  update: (id: number, data: UpdateConsultaDTO) => api.patch(`consultas/consultas/${id}/`, data),
  completar: (id: number) => api.patch<ConsultaMedica>(`consultas/consultas/${id}/completar/`),
  firmar: (id: number) => api.patch<ConsultaMedica>(`consultas/consultas/${id}/firmar/`),
  searchCIE10: (termino: string) => api.get<DiagnosticoCIE10[]>(`auditoria/cie10/search/?q=${termino}`),
  getAll: (params?: any) => api.get<{ results: ConsultaMedica[] }>('consultas/consultas/', { params }),
  eliminar: (id: number) => api.delete(`consultas/consultas/${id}/`),
  getQueue: () => api.get<{ results: FichaQueue[] }>('fichas/', { params: { en_curso: true } })
};
