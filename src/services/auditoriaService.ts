import { api } from '../api/axiosConfig';
import type { BitacoraFilters, BitacoraResponse, BitacoraEntry } from '../types/auditoria.types';

export const auditoriaService = {
  getBitacora: async (filters: BitacoraFilters): Promise<BitacoraResponse> => {
    const params = new URLSearchParams();
    if (filters.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
    if (filters.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
    if (filters.usuario)     params.append('usuario',     filters.usuario);
    if (filters.accion)      params.append('accion',      filters.accion);
    if (filters.modulo)      params.append('modulo',      filters.modulo);
    if (filters.page)        params.append('page',        filters.page.toString());
    if (filters.ordering)    params.append('ordering',    filters.ordering);

    const { data } = await api.get<BitacoraResponse>(`auditoria/?${params.toString()}`);
    return data;
  },

  exportCSV: (entries: BitacoraEntry[]): void => {
    const header = ['ID', 'Fecha/Hora', 'Usuario', 'Acción', 'Módulo', 'IP', 'Detalles'];
    const rows = entries.map(e => [
      e.id,
      e.timestamp,
      e.usuario_username,
      e.accion,
      e.modulo,
      e.ip_address ?? '',
      `"${(e.detalles ?? '').replace(/"/g, '""')}"`,
    ]);
    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    const now  = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.href     = url;
    a.download = `bitacora_${now}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
