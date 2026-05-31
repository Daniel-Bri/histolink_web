import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { hasRole } from '../utils/auth';
import { fichaService } from '../services/fichaService';
import { fetchEspecialidades } from '../services/especialidadService';
import type { Especialidad } from '../services/especialidadService';
import type { FichaBrief, NivelUrgencia } from '../types/triaje.types';
import AlertError from '../components/AlertError';
import ConfirmModal from '../components/ConfirmModal';

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);

const BOLIVIA_TZ = 'America/La_Paz';

const ESTADO_META: Record<string, { label: string; bg: string; text: string }> = {
  PENDIENTE:      { label: 'Pendiente',    bg: '#FEF3C7', text: '#B45309' },
  EN_ATENCION:    { label: 'En atención',  bg: '#DBEAFE', text: '#1D4ED8' },
  EN_ENFERMERIA:  { label: 'Enfermería',   bg: '#CFFAFE', text: '#0E7490' },
  EN_LABORATORIO: { label: 'Laboratorio',  bg: '#EDE9FE', text: '#6D28D9' },
  FINALIZADO:     { label: 'Finalizado',   bg: '#DCFCE7', text: '#15803D' },
  CANCELADO:      { label: 'Cancelado',    bg: '#F1F5F9', text: '#64748B' },
  DERIVADO:       { label: 'Derivado',     bg: '#FFEDD5', text: '#C2410C' },
  ABIERTA:        { label: 'Abierta',      bg: '#DBEAFE', text: '#1D4ED8' },
  EN_TRIAJE:      { label: 'En triaje',    bg: '#FEF3C7', text: '#B45309' },
  CERRADA:        { label: 'Cerrada',      bg: '#F1F5F9', text: '#64748B' },
};

const URGENCIA_BAR: Record<string, string> = {
  ALTA:    '#EF4444',
  MEDIA:   '#F97316',
  BAJA:    '#22C55E',
  NINGUNA: '#CBD5E1',
};

function mapNivelToUrgencia(nivel?: NivelUrgencia): 'ALTA' | 'MEDIA' | 'BAJA' | 'NINGUNA' {
  if (!nivel) return 'NINGUNA';
  if (nivel === 'ROJO' || nivel === 'NARANJA') return 'ALTA';
  if (nivel === 'AMARILLO') return 'MEDIA';
  return 'BAJA';
}

export default function FichasDelDia() {
  const navigate = useNavigate();
  const [fichas, setFichas] = useState<FichaBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fecha, setFecha] = useState(dayjs().format('YYYY-MM-DD'));
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);

  const [confirmCancel, setConfirmCancel] = useState<{ id: number; open: boolean }>({ id: 0, open: false });
  const [derivarModal, setDerivarModal] = useState<{ id: number; open: boolean }>({ id: 0, open: false });
  const [selectedEspecialidad, setSelectedEspecialidad] = useState<number>(0);

  const fetchFichas = useCallback(async (silently = false) => {
    if (!silently) setLoading(true);
    try {
      const res = await fichaService.listar({ fecha_desde: fecha, fecha_hasta: fecha, page_size: 100 });
      setFichas(res.data.results || []);
      setError(null);
    } catch {
      if (!silently) setError('Error al cargar las fichas del día.');
    } finally {
      if (!silently) setLoading(false);
    }
  }, [fecha]);

  useEffect(() => {
    fetchFichas();
    const interval = setInterval(() => fetchFichas(true), 30000);
    return () => clearInterval(interval);
  }, [fetchFichas]);

  useEffect(() => {
    fetchEspecialidades().then(setEspecialidades).catch(console.error);
  }, []);

  const handleEstadoChange = async (fichaId: number, nuevoEstado: string) => {
    try {
      await fichaService.cambiarEstado(fichaId, nuevoEstado);
      await fetchFichas(true);
    } catch {
      alert('Error al cambiar el estado de la ficha.');
    }
  };

  const handleDerivar = async () => {
    if (!selectedEspecialidad) return;
    try {
      await fichaService.derivar(derivarModal.id, selectedEspecialidad);
      setDerivarModal({ id: 0, open: false });
      await fetchFichas(true);
    } catch {
      alert('Error al derivar la ficha.');
    }
  };

  const handleCancelFicha = async () => {
    try {
      await fichaService.cambiarEstado(confirmCancel.id, 'CANCELADA');
      setConfirmCancel({ id: 0, open: false });
      await fetchFichas(true);
    } catch {
      alert('Error al cancelar la ficha.');
    }
  };

  const getWaitTime = (apertura: string) => {
    const diff = dayjs().utc().diff(dayjs.utc(apertura), 'minute');
    return diff > 0 ? diff : 0;
  };

  return (
    <div style={{ padding: '32px' }}>

      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', color: '#0003B8', fontWeight: 700, margin: 0 }}>Fichas del día</h1>
          <p style={{ color: '#888', fontSize: '13px', margin: '4px 0 0 0' }}>
            {fichas.length > 0
              ? `${fichas.length} ficha${fichas.length !== 1 ? 's' : ''} registrada${fichas.length !== 1 ? 's' : ''}`
              : 'Seguimiento de la cola de atención diaria'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            style={{
              padding: '8px 12px', fontSize: '13px', border: '1.5px solid #B3D4FF',
              borderRadius: '8px', color: '#0003B8', background: 'white', outline: 'none',
            }}
          />
          <button
            onClick={() => fetchFichas()}
            style={{
              background: '#0003B8', color: 'white', border: 'none',
              borderRadius: '8px', padding: '8px 18px', fontSize: '13px',
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {error && <AlertError message={error} onDismiss={() => setError(null)} />}

      {loading ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '48px', textAlign: 'center', color: '#0003B8', fontWeight: 600, boxShadow: '0 2px 8px rgba(0,3,184,0.06)' }}>
          Cargando fichas...
        </div>
      ) : fichas.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '60px', textAlign: 'center', color: '#888', boxShadow: '0 2px 8px rgba(0,3,184,0.06)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
          <p style={{ fontWeight: 600, margin: 0 }}>No hay fichas para el día seleccionado.</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,3,184,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F0F6FF' }}>
                {['Ficha', 'Paciente', 'CI', 'Hora apertura', 'Espera', 'Triaje', 'Estado', ''].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px',
                    textAlign: h === '' ? 'right' : 'left',
                    fontSize: '12px', fontWeight: 700, color: '#0003B8',
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fichas.map((ficha, i) => {
                const meta = ESTADO_META[ficha.estado] ?? { label: ficha.estado, bg: '#F1F5F9', text: '#333' };
                const urgencia = mapNivelToUrgencia(ficha.triaje_resumen?.nivel_urgencia);
                const barColor = URGENCIA_BAR[urgencia];

                return (
                  <tr
                    key={ficha.id}
                    style={{
                      borderTop: '1px solid #F0F6FF',
                      background: i % 2 === 0 ? 'white' : '#FAFCFF',
                    }}
                  >
                    {/* Barra de urgencia + correlativo */}
                    <td style={{ padding: '0', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'stretch', height: '100%' }}>
                        <div style={{ width: '4px', background: barColor, borderRadius: '2px 0 0 2px', flexShrink: 0 }} />
                        <span style={{ padding: '12px 12px', fontSize: '13px', fontWeight: 700, color: '#0003B8' }}>
                          {ficha.correlativo}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600 }}>
                      {ficha.paciente.nombre_completo}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#555' }}>
                      {ficha.paciente.ci}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#555' }}>
                      {dayjs.utc(ficha.fecha_apertura).tz(BOLIVIA_TZ).format('HH:mm')}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1D4ED8', fontWeight: 600 }}>
                      {getWaitTime(ficha.fecha_apertura)} min
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {ficha.triaje_resumen ? (
                        <span style={{ fontSize: '12px', fontWeight: 700, color: barColor }}>
                          {ficha.triaje_resumen.nivel_urgencia ?? '—'}
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#aaa' }}>Sin triaje</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: meta.bg, color: meta.text,
                        padding: '4px 10px', borderRadius: '20px',
                        fontSize: '12px', fontWeight: 600,
                      }}>
                        {meta.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {/* ABIERTA: debe hacer triaje primero */}
                        {ficha.estado === 'ABIERTA' && hasRole('Médico', 'Enfermera', 'Administrativo', 'Director') && (
                          <button
                            onClick={() => navigate(`/urgencias/${ficha.id}/triaje`)}
                            style={{ background: '#0080FF', color: 'white', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Ir a triaje →
                          </button>
                        )}
                        {/* EN_TRIAJE: puede pasar a atención y abrir consulta */}
                        {ficha.estado === 'EN_TRIAJE' && hasRole('Médico', 'Administrativo', 'Director') && (
                          <button
                            onClick={async () => {
                              await handleEstadoChange(ficha.id, 'EN_ATENCION');
                              navigate(`/consulta/ficha/${ficha.id}`);
                            }}
                            style={{ background: '#0003B8', color: 'white', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Atender →
                          </button>
                        )}
                        {/* EN_ATENCION: ir directamente a la consulta en curso */}
                        {ficha.estado === 'EN_ATENCION' && hasRole('Médico', 'Administrativo', 'Director') && (
                          <button
                            onClick={() => navigate(`/consulta/ficha/${ficha.id}`)}
                            style={{ background: '#059669', color: 'white', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Ver consulta →
                          </button>
                        )}
                        {(ficha.estado === 'ABIERTA' || ficha.estado === 'EN_TRIAJE' || ficha.estado === 'EN_ATENCION') && (
                          <button
                            onClick={() => setDerivarModal({ id: ficha.id, open: true })}
                            style={{ background: 'transparent', color: '#F97316', border: '1.5px solid #FED7AA', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Derivar
                          </button>
                        )}
                        {ficha.estado !== 'CANCELADA' && ficha.estado !== 'CERRADA' && (
                          <button
                            onClick={() => setConfirmCancel({ id: ficha.id, open: true })}
                            style={{ background: 'transparent', color: '#EF4444', border: '1.5px solid #FECACA', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal cancelar */}
      <ConfirmModal
        open={confirmCancel.open}
        title="Cancelar Ficha"
        message="¿Estás seguro de que deseas cancelar esta ficha?"
        confirmLabel="Sí, cancelar"
        onConfirm={handleCancelFicha}
        onCancel={() => setConfirmCancel({ id: 0, open: false })}
      />

      {/* Modal derivar */}
      {derivarModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '420px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0003B8', marginBottom: '8px' }}>Derivar ficha</h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>Selecciona la especialidad destino:</p>
            <select
              value={selectedEspecialidad}
              onChange={e => setSelectedEspecialidad(Number(e.target.value))}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #B3D4FF', marginBottom: '20px', fontSize: '14px' }}
            >
              <option value={0}>Seleccionar especialidad...</option>
              {especialidades.map(esp => (
                <option key={esp.id} value={esp.id}>{esp.nombre}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDerivarModal({ id: 0, open: false })}
                style={{ padding: '8px 18px', background: '#F1F5F9', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDerivar}
                disabled={!selectedEspecialidad}
                style={{ padding: '8px 18px', background: selectedEspecialidad ? '#0003B8' : '#B3D4FF', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: selectedEspecialidad ? 'pointer' : 'not-allowed' }}
              >
                Derivar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
