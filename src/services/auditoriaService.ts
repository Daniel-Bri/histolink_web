import { api, API_BASE_URL } from '../api/axiosConfig';
import type { BitacoraFilters, BitacoraResponse } from '../types/auditoria.types';

export const auditoriaService = {
  getBitacora: async (filters: BitacoraFilters): Promise<BitacoraResponse> => {
    // We remove undefined values to avoid sending empty params
    const params: Record<string, any> = {};
    if (filters.fecha_desde) params.fecha_desde = filters.fecha_desde;
    if (filters.fecha_hasta) params.fecha_hasta = filters.fecha_hasta;
    if (filters.usuario) params.usuario = filters.usuario;
    if (filters.accion) params.accion = filters.accion;
    if (filters.modulo) params.modulo = filters.modulo;
    if (filters.page) params.page = filters.page;
    if (filters.ordering) params.ordering = filters.ordering;

    const { data } = await api.get<BitacoraResponse>('auditoria/', { params });
    return data;
  },

  getExportUrl: (filters: BitacoraFilters): string => {
    const params = new URLSearchParams();
    if (filters.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
    if (filters.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
    if (filters.usuario) params.append('usuario', filters.usuario);
    if (filters.accion) params.append('accion', filters.accion);
    if (filters.modulo) params.append('modulo', filters.modulo);
    
    // We need to pass the token because it's a direct download
    const token = localStorage.getItem('access_token');
    if (token) {
        params.append('token', token);
    }

    return `${API_BASE_URL}/auditoria/exportar/?${params.toString()}`;
  },

  // Alternatively, fetch the blob directly to handle auth via headers
  exportBitacora: async (filters: BitacoraFilters): Promise<Blob> => {
    const params: Record<string, any> = {};
    if (filters.fecha_desde) params.fecha_desde = filters.fecha_desde;
    if (filters.fecha_hasta) params.fecha_hasta = filters.fecha_hasta;
    if (filters.usuario) params.usuario = filters.usuario;
    if (filters.accion) params.accion = filters.accion;
    if (filters.modulo) params.modulo = filters.modulo;

    const { data } = await api.get('auditoria/exportar/', {
      params,
      responseType: 'blob'
    });
    return data;
  }
};
