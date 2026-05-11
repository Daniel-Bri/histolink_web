import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  consultaService
} from '../../services/consultaService';
import type {
  ConsultaMedica,
  DiagnosticoCIE10,
  FichaQueue
} from '../../services/consultaService';
import { api } from '../../api/axiosConfig'; // Usar configuración global
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Shield, Save, FileCheck, Info } from 'lucide-react';

import EstadoBadge from '../../components/consulta/EstadoBadge';
import FirmaModal from '../../components/consulta/FirmaModal';
import HashAuditoriaSection from '../../components/consulta/HashAuditoriaSection';

// --- Estilos de la Imagen (HU013) ---
const sectionBox = (color: string): React.CSSProperties => ({
  background: 'white',
  borderRadius: '12px',
  padding: '18px',
  border: `1px solid ${color}33`,
  borderTop: `4px solid ${color}`,
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.2s ease'
});

const labelStyle = (color: string): React.CSSProperties => ({
  fontSize: '16px',
  fontWeight: 700,
  color: color,
  marginBottom: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  paddingBottom: '4px',
  width: 'fit-content'
});

const triajeGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '10px',
  background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
  padding: '14px',
  borderRadius: '10px',
  marginBottom: '14px',
  fontSize: '13px',
  color: '#1E40AF',
  border: '1px solid #BFDBFE',
  boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)'
};

const headerBox: React.CSSProperties = {
  background: 'linear-gradient(90deg, #1E40AF 0%, #3B82F6 100%)',
  padding: '20px 24px',
  borderRadius: '12px',
  marginBottom: '24px',
  color: 'white',
  boxShadow: '0 4px 12px rgba(30, 64, 175, 0.2)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  height: '100px',
  border: '1.5px solid #E2E8F0',
  borderRadius: '8px',
  padding: '12px',
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#334155',
  outline: 'none',
  transition: 'border-color 0.2s',
  backgroundColor: '#FCFDFF'
};

const actionBtn = (bg: string): React.CSSProperties => ({
  background: bg,
  color: 'white',
  padding: '10px 24px',
  borderRadius: '6px',
  fontWeight: 600,
  fontSize: '14px',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
});

const btnToggle = (active: boolean, color: string, bg: string): React.CSSProperties => ({
  background: active ? color : bg,
  color: active ? 'white' : color,
  padding: '10px 18px',
  borderRadius: '8px',
  border: `1.5px solid ${color}`,
  fontWeight: 600,
  fontSize: '13px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'all 0.2s',
});

const inputInline: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: '1.5px solid #E2E8F0',
  borderRadius: '6px',
  fontSize: '13px',
  color: '#334155',
  background: '#FCFDFF',
  outline: 'none',
};

interface DetalleReceta {
  medicamento: string;
  concentracion: string;
  forma_farmaceutica: string;
  via_administracion: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
  cantidad_total: string;
  instrucciones: string;
  orden: number;
}

const TIPOS_ESTUDIO = [
  { value: 'LAB', label: 'Laboratorio' },
  { value: 'RX', label: 'Radiografía' },
  { value: 'ECO', label: 'Ecografía' },
  { value: 'TC', label: 'Tomografía Computarizada' },
  { value: 'RMN', label: 'Resonancia Magnética' },
  { value: 'ECG', label: 'Electrocardiograma' },
  { value: 'END', label: 'Endoscopia' },
  { value: 'OTRO', label: 'Otro' },
];

const recetaVacio = (): DetalleReceta => ({
  medicamento: '', concentracion: '', forma_farmaceutica: '',
  via_administracion: '', dosis: '', frecuencia: '', duracion: '',
  cantidad_total: '', instrucciones: '', orden: 0,
});

export default function ConsultaSOAP() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [consulta, setConsulta] = useState<ConsultaMedica | null>(null);
  const [triajeData, setTriajeData] = useState<any>(null);
  const [queue, setQueue] = useState<FichaQueue[]>([]);
  const [historial, setHistorial] = useState<ConsultaMedica[]>([]);
  // Nuevo estado para persistencia local de demos
  const [demoHistorial, setDemoHistorial] = useState<ConsultaMedica[]>(() => {
    const saved = localStorage.getItem('histolink_demo_history');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const saveRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const [searchTerm, setSearchTerm] = useState('');
  const [cieResults, setCieResults] = useState<DiagnosticoCIE10[]>([]);
  const [, setSearchingCie] = useState(false);

  // Estados para Firma Digital
  const [isFirmaModalOpen, setIsFirmaModalOpen] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  // Acciones clínicas inline
  const [activePanel, setActivePanel] = useState<'receta' | 'estudio' | null>(null);
  const [recetaDetalles, setRecetaDetalles] = useState<DetalleReceta[]>([recetaVacio()]);
  const [recetaObs, setRecetaObs] = useState('');
  const [guardandoReceta, setGuardandoReceta] = useState(false);
  const [recetaMsg, setRecetaMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [tipoEstudio, setTipoEstudio] = useState('LAB');
  const [descEstudio, setDescEstudio] = useState('');
  const [indicEstudio, setIndicEstudio] = useState('');
  const [urgenteEstudio, setUrgenteEstudio] = useState(false);
  const [motivoUrgEstudio, setMotivoUrgEstudio] = useState('');
  const [guardandoEstudio, setGuardandoEstudio] = useState(false);
  const [estudioMsg, setEstudioMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const isEditable = consulta?.estado === 'BORRADOR';
  const isCompletada = consulta?.estado === 'COMPLETADA';
  const isFirmada = consulta?.estado === 'FIRMADA';
  const isReadOnly = isCompletada || isFirmada;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!id) {
        if (!isAuthenticated) {
          setQueue([]);
          setHistorial([]);
          setLoading(false);
          return;
        }
        const [queueRes, historyRes] = await Promise.all([
          consultaService.getQueue().catch(() => ({ data: { results: [] } })),
          consultaService.getAll().catch(() => ({ data: { results: [] } }))
        ]);
        setQueue(queueRes.data.results || []);
        setHistorial(historyRes.data.results || []);
      } else {
        // MODO DEMO PARA IDS 101, 102, 103 (Los del botón generar)
        if (['101', '102', '103'].includes(id)) {
          // Verificar si ya está en el historial local
          const consultaGuardada = demoHistorial.find(c => c.id === Number(id));
          if (consultaGuardada) {
            setConsulta(consultaGuardada);
            setLoading(false);
            return;
          }

          const names: any = { '101': 'Juan Pérez Test', '102': 'María García López', '103': 'Ricardo Suárez' };
          setConsulta({
            id: Number(id),
            ficha: Number(id),
            paciente_nombre: names[id],
            ficha_correlativo: `FIC-2026-00${id.slice(-1)}`,
            medico: 1,
            triaje: Number(id),
            estado: 'BORRADOR',
            motivo_consulta: '',
            historia_enfermedad_actual: '',
            examen_fisico: '',
            impresion_diagnostica: '',
            codigo_cie10_principal: '',
            codigo_cie10_secundario: '',
            descripcion_cie10: '',
            plan_tratamiento: '',
            indicaciones_alta: '',
            creado_en: new Date().toISOString(),
            actualizado_en: new Date().toISOString()
          });
          
          // Datos de triaje simulados para el demo
          setTriajeData({
            paciente_edad: id === '101' ? 34 : id === '102' ? 28 : 45,
            paciente_genero: id === '102' ? 'F' : 'M',
            frecuencia_cardiaca: 80,
            presion_arterial_sistolica: 120,
            presion_arterial_diastolica: 80,
            temperatura: 36.8,
            saturacion_oxigeno: 98,
            frecuencia_respiratoria: 18,
            glasgow: 15
          });
          setLoading(false);
          return;
        }

        let consultaData: ConsultaMedica | null = null;
        try {
          const res = await consultaService.getById(Number(id));
          consultaData = res.data;
        } catch (err: any) {
          if (err.response?.status === 404) {
            // ID puede ser un ID de ficha — buscar consulta existente o crear una nueva
            const existing = await consultaService.getByFicha(Number(id));
            const results = existing.data.results ?? [];
            if (results.length > 0) {
              consultaData = results.find(c => c.estado === 'BORRADOR') ?? results[0];
            } else {
              const created = await consultaService.create(Number(id));
              consultaData = created.data;
            }
          } else {
            throw err;
          }
        }
        setConsulta(consultaData);

        // Cargar datos de triaje si existe
        if (consultaData?.triaje) {
          try {
            const tRes = await api.get(`triaje/${consultaData.triaje}/`);
            setTriajeData(tRes.data);
          } catch (e) { console.error("No triaje found"); }
        }
      }
    } catch (err: any) {
      console.error(err);
      setError('Error al cargar datos del servidor.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length > 0) {
        setSearchingCie(true);
        try {
          const res = await consultaService.searchCIE10(searchTerm);
          setCieResults(res.data);
        } catch (err) {
          // Si el backend da 404 o error, usamos el mock local sin mostrar error en consola
          const mockResults: DiagnosticoCIE10[] = [
            { codigo: 'A00', descripcion: 'Cólera' },
            { codigo: 'E11.9', descripcion: 'Diabetes Mellitus tipo 2' },
            { codigo: 'I10', descripcion: 'Hipertensión esencial' },
            { codigo: 'J18.9', descripcion: 'Neumonía' },
            { codigo: 'K29.0', descripcion: 'Gastritis aguda' },
            { codigo: 'N39.0', descripcion: 'Infección urinaria' },
          ].filter(x => 
            x.codigo.includes(searchTerm.toUpperCase()) || 
            x.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
          );
          setCieResults(mockResults);
        } finally {
          setSearchingCie(false);
        }
      } else { setCieResults([]); }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleUpdateField = (field: keyof ConsultaMedica, value: any) => {
    if (!consulta || isReadOnly) return;
    setConsulta(prev => prev ? { ...prev, [field]: value } : null);
    setIsDirty(true);
  };

  const handleSave = async (silent = false) => {
    if (!consulta || saving || isReadOnly) return;
    
    // MODO DEMO: No llamar al backend si es un ID de prueba
    if ([101, 102, 103].includes(consulta.id)) {
      if (!silent) alert('MODO PRUEBA: Borrador guardado exitosamente (Simulado).');
      return;
    }

    try {
      if (!silent) setSaving(true);
      await consultaService.update(consulta.id, consulta);
      setIsDirty(false);
      if (!silent) alert('Borrador guardado exitosamente.');
    } catch (err) { if (!silent) alert('Error al guardar.'); } finally { if (!silent) setSaving(false); }
  };

  // Mantener ref actualizada para el atajo de teclado
  useEffect(() => { saveRef.current = handleSave });

  // Ctrl+S → guardar borrador
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isEditable && !saving) void saveRef.current();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isEditable, saving]);

  // Advertir al salir si hay cambios sin guardar
  useEffect(() => {
    if (!isDirty || !isEditable) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty, isEditable]);

  const handleFirmar = async () => {
    if (!consulta || isSigning || isFirmada) return;
    
    // MODO DEMO: No llamar al backend si es un ID de prueba
    if ([101, 102, 103].includes(consulta.id)) {
      setIsSigning(true);
      setTimeout(() => {
        const ahora = new Date().toISOString();
        const nuevaConsulta: ConsultaMedica = { 
          ...consulta, 
          estado: 'FIRMADA',
          hash_documento: 'd2a6e3f8b1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0',
          firmada_por: 999,
          firmada_por_nombre: 'Médico de Prueba',
          firmada_en: ahora
        };
        setConsulta(nuevaConsulta);
        
        // Guardar en el historial demo local
        const nuevoHistorial = [nuevaConsulta, ...demoHistorial.filter(c => c.id !== consulta.id)];
        setDemoHistorial(nuevoHistorial);
        localStorage.setItem('histolink_demo_history', JSON.stringify(nuevoHistorial));

        alert('MODO PRUEBA: Consulta firmada digitalmente con éxito (Simulado).');
        setIsSigning(false);
        setIsFirmaModalOpen(false);
      }, 1500);
      return;
    }

    try {
      setIsSigning(true);
      const res = await consultaService.firmar(consulta.id);
      setConsulta(res.data);
      alert('Consulta firmada digitalmente con éxito.');
      setIsFirmaModalOpen(false);
    } catch (err) { 
      alert('Error al firmar la consulta.'); 
    } finally { 
      setIsSigning(false); 
    }
  };

  const handleCompletar = async (nuevoEstado: 'COMPLETADA' | 'FIRMADA' = 'COMPLETADA') => {
    if (!consulta || isReadOnly) return;
    
    // Si se intenta firmar desde aquí, redirigir a handleFirmar
    if (nuevoEstado === 'FIRMADA') {
      handleFirmar();
      return;
    }
    if (!consulta.motivo_consulta || !consulta.codigo_cie10_principal) {
      alert('El diagnóstico CIE-10 es obligatorio.');
      return;
    }
    if (!window.confirm(`¿Marcar como ${nuevoEstado}?`)) return;

    // MODO DEMO: No llamar al backend si es un ID de prueba
    if ([101, 102, 103].includes(consulta.id)) {
      setSaving(true);
      setTimeout(() => {
        const nuevaConsulta = { ...consulta, estado: nuevoEstado };
        setConsulta(nuevaConsulta);
        
        // Guardar en el historial demo local
        const nuevoHistorial = [nuevaConsulta, ...demoHistorial.filter(c => c.id !== consulta.id)];
        setDemoHistorial(nuevoHistorial);
        localStorage.setItem('histolink_demo_history', JSON.stringify(nuevoHistorial));

        alert(`MODO PRUEBA: Consulta ${nuevoEstado.toLowerCase()} con éxito (Simulado).`);
        setSaving(false);
        navigate('/consulta'); // Redirigir al panel para ver el cambio
      }, 800);
      return;
    }

    try {
      setSaving(true);
      await consultaService.update(consulta.id, { ...consulta, estado: nuevoEstado });
      alert(`Consulta ${nuevoEstado.toLowerCase()} con éxito.`);
      navigate('/consulta'); // Redirigir al panel para ver el cambio (HU013)
    } catch (err) { alert('Error al actualizar estado.'); } finally { setSaving(false); }
  };

  const handleGuardarReceta = async () => {
    if (!consulta) return;
    const detallesValidos = recetaDetalles.filter(d => d.medicamento.trim());
    if (!detallesValidos.length) {
      setRecetaMsg({ ok: false, text: 'Ingrese al menos un medicamento.' });
      return;
    }
    try {
      setGuardandoReceta(true);
      setRecetaMsg(null);
      await api.post('clinica/recetas/', {
        consulta: consulta.id,
        observaciones: recetaObs,
        detalles: detallesValidos.map((d, i) => ({ ...d, orden: i + 1 })),
      });
      setRecetaMsg({ ok: true, text: 'Receta emitida correctamente.' });
      setRecetaDetalles([recetaVacio()]);
      setRecetaObs('');
    } catch {
      setRecetaMsg({ ok: false, text: 'Error al emitir la receta. Verifique que la consulta esté completada.' });
    } finally {
      setGuardandoReceta(false);
    }
  };

  const handleGuardarEstudio = async () => {
    if (!consulta) return;
    if (!descEstudio.trim()) {
      setEstudioMsg({ ok: false, text: 'Ingrese la descripción del estudio.' });
      return;
    }
    try {
      setGuardandoEstudio(true);
      setEstudioMsg(null);
      const payload: Record<string, unknown> = {
        consulta_id: consulta.id,
        tipo: tipoEstudio,
        descripcion: descEstudio,
        indicacion_clinica: indicEstudio,
        urgente: urgenteEstudio,
      };
      if (urgenteEstudio && motivoUrgEstudio) payload.motivo_urgencia = motivoUrgEstudio;
      await api.post('ordenes-estudio/', payload);
      setEstudioMsg({ ok: true, text: 'Orden de estudio creada correctamente.' });
      setDescEstudio('');
      setIndicEstudio('');
      setUrgenteEstudio(false);
      setMotivoUrgEstudio('');
    } catch {
      setEstudioMsg({ ok: false, text: 'Error al crear la orden de estudio.' });
    } finally {
      setGuardandoEstudio(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!id) {
    return (
      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: '#0F172A', fontSize: '28px', fontWeight: 800, marginBottom: '24px' }}>Gestión de Consultas — HOAP</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          {/* Columna: Cola de Atención */}
          <div style={sectionBox('#3B82F6')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={labelStyle('#1D4ED8')}>
                🕒 Pacientes en Espera
              </h2>
              <button 
                onClick={() => {
                  const demoQueue: FichaQueue[] = [
                    { id: 101, correlativo: 'FIC-2026-001', paciente_nombre: 'Juan Pérez Test', paciente_edad: 34, paciente_genero: 'M', estado: 'EN_TRIAJE', fecha_apertura: '' },
                    { id: 102, correlativo: 'FIC-2026-002', paciente_nombre: 'María García López', paciente_edad: 28, paciente_genero: 'F', estado: 'EN_TRIAJE', fecha_apertura: '' },
                    { id: 103, correlativo: 'FIC-2026-003', paciente_nombre: 'Ricardo Suárez', paciente_edad: 45, paciente_genero: 'M', estado: 'EN_TRIAJE', fecha_apertura: '' }
                  ];
                  setQueue(demoQueue);
                }}
                style={{ background: '#F0F6FF', color: '#0003B8', border: '1px dashed #0003B8', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
              >
                🧪 Generar Pacientes (Demo)
              </button>
            </div>
            
            {queue.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', fontStyle: 'italic' }}>
                No hay pacientes en espera.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {queue.map(f => (
                  <div key={f.id} style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1E293B' }}>{f.paciente_nombre}</div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>Ficha: {f.correlativo} | {f.paciente_edad} años</div>
                    </div>
                    <button onClick={() => navigate(`/consulta/${f.id}`)} style={actionBtn('#0EA5E9')}>Atender</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Columna: Historial Reciente */}
          <div style={sectionBox('#10B981')}>
            <h2 style={labelStyle('#047857')}>
              📁 Panel de Consultas
            </h2>
            {historial.length === 0 && demoHistorial.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', fontStyle: 'italic' }}>
                No hay consultas registradas.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {[...demoHistorial, ...historial].map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => navigate(`/consulta/${c.id}`)} 
                    style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ fontWeight: 700, color: '#1E293B' }}>{c.paciente_nombre}</div>
                      <EstadoBadge 
                        estado={c.estado} 
                        firmadoPor={c.firmada_por_nombre} 
                        fechaFirma={c.firmada_en} 
                      />
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>{c.codigo_cie10_principal || 'Sin Dx'} | {new Date(c.creado_en).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!consulta) return null;

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', background: '#F0F9FF', minHeight: '100vh' }}>
      
      {/* HEADER CON DEGRADADO AZUL */}
      <div style={headerBox}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => navigate('/consulta')}
            style={{ 
              background: 'rgba(255,255,255,0.15)', 
              border: 'none', 
              color: 'white', 
              width: '36px', 
              height: '36px', 
              borderRadius: '50%', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}
            title="Volver al panel"
          >
            ←
          </button>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'white', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              Consulta Médica SOAP — {consulta.paciente_nombre}
            </h1>
            <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '14px', fontWeight: 500 }}>
              Ficha: #{consulta.ficha_correlativo} | Fecha: {new Date(consulta.creado_en).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '11px', display: 'block', textTransform: 'uppercase', opacity: 0.8 }}>Edad</span>
              <strong style={{ fontSize: '18px' }}>{triajeData?.paciente_edad || '--'}</strong>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '11px', display: 'block', textTransform: 'uppercase', opacity: 0.8 }}>Sexo</span>
              <strong style={{ fontSize: '18px' }}>{triajeData?.paciente_genero || '--'}</strong>
            </div>
          </div>
          <EstadoBadge 
            estado={consulta.estado} 
            firmadoPor={consulta.firmada_por_nombre} 
            fechaFirma={consulta.firmada_en} 
          />
        </div>
      </div>

      {/* AVISO DE CONSULTA COMPLETADA (PENDIENTE FIRMA) */}
      {isCompletada && (
        <div style={{ 
          background: '#EFF6FF', 
          border: '1px solid #BFDBFE', 
          borderRadius: '12px', 
          padding: '16px 24px', 
          marginBottom: '20px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#DBEAFE', padding: '10px', borderRadius: '50%' }}>
              <Info style={{ color: '#2563EB', width: '20px', height: '20px' }} />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#1E40AF', fontSize: '14px' }}>Consulta Lista para Firma Digital</p>
              <p style={{ margin: 0, color: '#3B82F6', fontSize: '12px' }}>El registro ha sido finalizado. Proceda a firmar para sellar el documento permanentemente.</p>
            </div>
          </div>
          <button 
            onClick={() => setIsFirmaModalOpen(true)}
            style={{ ...actionBtn('#2563EB'), padding: '12px 24px' }}
          >
            <Shield style={{ width: '20px', height: '20px' }} />
            Firmar Consulta Digitalmente
          </button>
        </div>
      )}

      {/* GRID PRINCIPAL 2 COLUMNAS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        
        {/* COLUMNA IZQUIERDA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={sectionBox('#3B82F6')}>
            <h3 style={labelStyle('#1D4ED8')}>
              <span>📝</span> Subjetivo (S)
            </h3>
            <textarea 
              style={textareaStyle}
              value={consulta.motivo_consulta}
              onChange={e => handleUpdateField('motivo_consulta', e.target.value)}
              disabled={isReadOnly}
              placeholder="Motivo de consulta y síntomas..."
            />
          </div>

          <div style={sectionBox('#10B981')}>
            <h3 style={labelStyle('#047857')}>
              <span>📊</span> Objetivo (O)
            </h3>
            {triajeData && (
              <div style={triajeGrid}>
                <div>FC: <strong style={{ color: '#111827' }}>{triajeData.frecuencia_cardiaca} lpm</strong></div>
                <div>PA: <strong style={{ color: '#111827' }}>{triajeData.presion_arterial_sistolica}/{triajeData.presion_arterial_diastolica} mmHg</strong></div>
                <div>T°: <strong style={{ color: '#111827' }}>{triajeData.temperatura} °C</strong></div>
                <div>SpO2: <strong style={{ color: '#111827' }}>{triajeData.saturacion_oxigeno} %</strong></div>
                <div>Resp: <strong style={{ color: '#111827' }}>{triajeData.frecuencia_respiratoria} rpm</strong></div>
                <div>Glasgow: <strong style={{ color: '#111827' }}>{triajeData.glasgow}/15</strong></div>
              </div>
            )}
            <textarea 
              style={{ ...textareaStyle, height: triajeData ? '120px' : '200px' }}
              value={consulta.examen_fisico}
              onChange={e => handleUpdateField('examen_fisico', e.target.value)}
              disabled={isReadOnly}
              placeholder="[Examen Físico - Notas Médicas]"
            />
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={sectionBox('#8B5CF6')}>
            <h3 style={labelStyle('#6D28D9')}>
              <span>🔬</span> Análisis/Diagnóstico (A)
            </h3>
            <textarea 
              style={{ ...textareaStyle, height: '80px', marginBottom: '15px' }}
              value={consulta.impresion_diagnostica}
              onChange={e => handleUpdateField('impresion_diagnostica', e.target.value)}
              disabled={isReadOnly}
              placeholder="Notas de evaluación inicial..."
            />
            
            <div style={{ position: 'relative' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '5px' }}>
                Buscador CIE-10 (Búsqueda por Texto o Código)
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  style={{ flex: 1, padding: '10px', border: '1.5px solid #8B5CF6', borderRadius: '6px' }}
                  placeholder="Ej: E11.9 o Diabetes"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  disabled={isReadOnly}
                />
                {consulta.codigo_cie10_principal && (
                  <span style={{ color: '#059669', fontSize: '13px', fontWeight: 700 }}>✓ Válido</span>
                )}
              </div>
              
              {cieResults.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', zIndex: 100, border: '1px solid #E2E8F0', borderRadius: '6px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                  {cieResults.map(r => (
                    <div key={r.codigo} onClick={() => {
                      handleUpdateField('codigo_cie10_principal', r.codigo);
                      handleUpdateField('descripcion_cie10', r.descripcion);
                      setSearchTerm('');
                      setCieResults([]);
                    }} style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9' }}>
                      <strong>{r.codigo}</strong> - {r.descripcion}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {consulta.codigo_cie10_principal && (
              <div style={{ marginTop: '10px', padding: '10px', background: '#F5F3FF', border: '1px solid #C4B5FD', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#5B21B6' }}><strong>{consulta.codigo_cie10_principal}</strong> - {consulta.descripcion_cie10}</span>
                {!isReadOnly && <span style={{ cursor: 'pointer', color: '#94A3B8' }} onClick={() => handleUpdateField('codigo_cie10_principal', '')}>✕</span>}
              </div>
            )}
          </div>
          
          <div style={sectionBox('#64748B')}>
            <h3 style={labelStyle('#334155')}><span>⚕️</span> Acciones Clínicas</h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => { setActivePanel(activePanel === 'receta' ? null : 'receta'); setRecetaMsg(null); }}
                style={btnToggle(activePanel === 'receta', '#065F46', '#ECFDF5')}
              >
                <span>💊</span> {activePanel === 'receta' ? 'Cerrar' : 'Emitir Receta'}
              </button>
              <button
                onClick={() => { setActivePanel(activePanel === 'estudio' ? null : 'estudio'); setEstudioMsg(null); }}
                style={btnToggle(activePanel === 'estudio', '#1E40AF', '#EFF6FF')}
              >
                <span>🔬</span> {activePanel === 'estudio' ? 'Cerrar' : 'Solicitar Estudios'}
              </button>
            </div>
            <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#94A3B8' }}>
              {isEditable ? 'Finaliza la consulta antes de emitir recetas.' : 'Puedes emitir recetas y órdenes de estudio desde aquí.'}
            </p>
          </div>
        </div>
      </div>

      {/* PANEL EXPANDIBLE: RECETA / ESTUDIOS */}
      {activePanel === 'receta' && (
        <div style={{ ...sectionBox('#065F46'), marginBottom: '20px' }}>
          <h3 style={labelStyle('#065F46')}><span>💊</span> Emitir Receta Médica</h3>

          {isEditable && (
            <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#92400E' }}>
              La consulta debe estar <strong>Finalizada</strong> para emitir una receta válida.
            </div>
          )}

          {recetaDetalles.map((det, idx) => (
            <div key={idx} style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '14px', marginBottom: '12px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: 700, fontSize: '13px', color: '#166534' }}>Medicamento {idx + 1}</span>
                {recetaDetalles.length > 1 && (
                  <button
                    onClick={() => setRecetaDetalles(prev => prev.filter((_, i) => i !== idx))}
                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}
                  >✕</button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Medicamento *</label>
                  <input
                    style={inputInline}
                    placeholder="Ej: Amoxicilina"
                    value={det.medicamento}
                    onChange={e => setRecetaDetalles(prev => prev.map((d, i) => i === idx ? { ...d, medicamento: e.target.value } : d))}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Concentración</label>
                  <input
                    style={inputInline}
                    placeholder="Ej: 500mg"
                    value={det.concentracion}
                    onChange={e => setRecetaDetalles(prev => prev.map((d, i) => i === idx ? { ...d, concentracion: e.target.value } : d))}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Dosis</label>
                  <input
                    style={inputInline}
                    placeholder="Ej: 1 comprimido"
                    value={det.dosis}
                    onChange={e => setRecetaDetalles(prev => prev.map((d, i) => i === idx ? { ...d, dosis: e.target.value } : d))}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Frecuencia</label>
                  <input
                    style={inputInline}
                    placeholder="Ej: Cada 8 horas"
                    value={det.frecuencia}
                    onChange={e => setRecetaDetalles(prev => prev.map((d, i) => i === idx ? { ...d, frecuencia: e.target.value } : d))}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Duración</label>
                  <input
                    style={inputInline}
                    placeholder="Ej: 7 días"
                    value={det.duracion}
                    onChange={e => setRecetaDetalles(prev => prev.map((d, i) => i === idx ? { ...d, duracion: e.target.value } : d))}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Instrucciones</label>
                  <input
                    style={inputInline}
                    placeholder="Ej: Tomar con alimentos"
                    value={det.instrucciones}
                    onChange={e => setRecetaDetalles(prev => prev.map((d, i) => i === idx ? { ...d, instrucciones: e.target.value } : d))}
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={() => setRecetaDetalles(prev => [...prev, recetaVacio()])}
            style={{ background: 'none', border: '1.5px dashed #6EE7B7', color: '#047857', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, width: '100%', marginBottom: '14px' }}
          >
            + Agregar Medicamento
          </button>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Observaciones generales</label>
            <textarea
              style={{ ...textareaStyle, height: '60px' }}
              placeholder="Indicaciones adicionales para el paciente..."
              value={recetaObs}
              onChange={e => setRecetaObs(e.target.value)}
            />
          </div>

          {recetaMsg && (
            <div style={{ padding: '10px 14px', borderRadius: '6px', marginBottom: '12px', background: recetaMsg.ok ? '#ECFDF5' : '#FEF2F2', color: recetaMsg.ok ? '#065F46' : '#991B1B', border: `1px solid ${recetaMsg.ok ? '#6EE7B7' : '#FECACA'}`, fontSize: '13px', fontWeight: 600 }}>
              {recetaMsg.ok ? '✓' : '✕'} {recetaMsg.text}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleGuardarReceta} disabled={guardandoReceta} style={actionBtn('#065F46')}>
              {guardandoReceta ? 'Emitiendo...' : '💊 Emitir Receta'}
            </button>
          </div>
        </div>
      )}

      {activePanel === 'estudio' && (
        <div style={{ ...sectionBox('#1E40AF'), marginBottom: '20px' }}>
          <h3 style={labelStyle('#1E40AF')}><span>🔬</span> Solicitar Orden de Estudio</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Tipo de Estudio *</label>
              <select
                style={{ ...inputInline, height: '38px' }}
                value={tipoEstudio}
                onChange={e => setTipoEstudio(e.target.value)}
              >
                {TIPOS_ESTUDIO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Descripción *</label>
              <input
                style={inputInline}
                placeholder="Ej: Hemograma completo, glucosa, creatinina..."
                value={descEstudio}
                onChange={e => setDescEstudio(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Indicación Clínica</label>
            <input
              style={inputInline}
              placeholder="Ej: Control de diabetes, seguimiento post-consulta..."
              value={indicEstudio}
              onChange={e => setIndicEstudio(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: urgenteEstudio ? '10px' : '14px' }}>
            <input
              type="checkbox"
              id="urgente"
              checked={urgenteEstudio}
              onChange={e => setUrgenteEstudio(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="urgente" style={{ fontSize: '13px', fontWeight: 600, color: '#DC2626', cursor: 'pointer' }}>
              🚨 Marcar como urgente
            </label>
          </div>

          {urgenteEstudio && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Motivo de urgencia</label>
              <input
                style={{ ...inputInline, borderColor: '#FCA5A5' }}
                placeholder="Explique por qué es urgente..."
                value={motivoUrgEstudio}
                onChange={e => setMotivoUrgEstudio(e.target.value)}
              />
            </div>
          )}

          {estudioMsg && (
            <div style={{ padding: '10px 14px', borderRadius: '6px', marginBottom: '12px', background: estudioMsg.ok ? '#EFF6FF' : '#FEF2F2', color: estudioMsg.ok ? '#1E40AF' : '#991B1B', border: `1px solid ${estudioMsg.ok ? '#BFDBFE' : '#FECACA'}`, fontSize: '13px', fontWeight: 600 }}>
              {estudioMsg.ok ? '✓' : '✕'} {estudioMsg.text}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleGuardarEstudio} disabled={guardandoEstudio} style={actionBtn('#1E40AF')}>
              {guardandoEstudio ? 'Enviando...' : '🔬 Crear Orden de Estudio'}
            </button>
          </div>
        </div>
      )}

      {/* SECCIÓN PLAN (P) - ANCHO COMPLETO */}
      <div style={sectionBox('#F59E0B')}>
        <h3 style={labelStyle('#B45309')}>
          <span>💊</span> Plan (P)
        </h3>
        <textarea 
          style={textareaStyle}
          value={consulta.plan_tratamiento}
          onChange={e => handleUpdateField('plan_tratamiento', e.target.value)}
          disabled={isReadOnly}
          placeholder="Indicaciones terapéuticas, medicación y plan de seguimiento..."
        />
      </div>

      {/* SECCIÓN DE HASH Y AUDITORÍA (Solo para FIRMADA) */}
      <HashAuditoriaSection 
        hash={consulta.hash_documento} 
        fechaFirma={consulta.firmada_en} 
      />

      <div style={{ height: '30px' }}></div>

      {/* BOTONES DE ACCIÓN - IDÉNTICOS A LA IMAGEN */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '30px', paddingBottom: '40px' }}>
        {isEditable && (
          <>
            <button onClick={() => handleSave()} disabled={saving} style={actionBtn('#334155')}>
              <Save style={{ width: '18px', height: '18px' }} /> Guardar Borrador
            </button>
            <button onClick={() => handleCompletar('COMPLETADA')} disabled={saving} style={actionBtn('#F59E0B')}>
               <FileCheck style={{ width: '18px', height: '18px' }} /> Finalizar Consulta
             </button>
          </>
        )}
        
        {isCompletada && (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'white', padding: '8px 16px', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
            <span style={{ color: '#64748B', fontWeight: 600, fontSize: '14px' }}>Estado: Finalizada</span>
            <button 
              onClick={() => setIsFirmaModalOpen(true)} 
              disabled={isSigning} 
              style={actionBtn('#059669')}
            >
              <Shield style={{ width: '18px', height: '18px' }} /> Firmar Consulta Digitalmente
            </button>
          </div>
        )}

        {isFirmada && (
          <div style={{ background: '#DBEAFE', padding: '12px 40px', borderRadius: '8px', fontWeight: 700, color: '#1E40AF', border: '1px solid #93C5FD', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield style={{ width: '20px', height: '20px' }} />
            <span>🔒 REGISTRO CLINICO SELLADO (Inmutable)</span>
          </div>
        )}
      </div>

      {/* MODAL DE FIRMA DIGITAL */}
      <FirmaModal 
        isOpen={isFirmaModalOpen} 
        onClose={() => setIsFirmaModalOpen(false)} 
        onConfirm={handleFirmar} 
        isSigning={isSigning} 
      />

    </div>
  );
}
