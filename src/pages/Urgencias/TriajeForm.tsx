import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fichaService } from '../../services/fichaService'
import { triajeService } from '../../services/triajeService'
import type { FichaBrief, ClasificarResult, NivelUrgencia, TriajePayload } from '../../types/triaje.types'
import { NIVEL_LABELS, NIVEL_COLORS } from '../../types/triaje.types'

// ── Shared styles ────────────────────────────────────────────────────────────

const INPUT: React.CSSProperties = {
  width: '100%', padding: '8px 12px', boxSizing: 'border-box',
  border: '1px solid #B3D4FF', borderRadius: '8px',
  fontSize: '14px', color: '#1E293B', background: '#fff', outline: 'none',
}

const LABEL: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 600,
  color: '#475569', marginBottom: '5px',
}

const CARD: React.CSSProperties = {
  background: '#fff', borderRadius: '12px',
  border: '1px solid #E2E8F0', padding: '20px 24px',
  marginBottom: '16px',
}

const SECTION_TITLE: React.CSSProperties = {
  fontSize: '13px', fontWeight: 700, color: '#1E293B',
  marginBottom: '16px', paddingBottom: '10px',
  borderBottom: '1px solid #F1F5F9', margin: '0 0 16px',
}

const NIVELES: NivelUrgencia[] = ['ROJO', 'NARANJA', 'AMARILLO', 'VERDE', 'AZUL']

// ── Field component ──────────────────────────────────────────────────────────

function NumField({
  label, unit, value, onChange, min, max, step, required, hint,
}: {
  label: string; unit: string; value: string; onChange: (v: string) => void
  min?: number; max?: number; step?: number; required?: boolean; hint?: string
}) {
  return (
    <div>
      <label style={LABEL}>
        {label} {unit && <span style={{ color: '#94A3B8', fontWeight: 400 }}>({unit})</span>}
        {required && <span style={{ color: '#DC2626' }}> *</span>}
      </label>
      <input
        type="number"
        style={INPUT}
        value={value}
        onChange={e => onChange(e.target.value)}
        min={min}
        max={max}
        step={step ?? 1}
        placeholder="—"
      />
      {hint && <p style={{ fontSize: '10px', color: '#94A3B8', margin: '3px 0 0' }}>{hint}</p>}
    </div>
  )
}

// ── AI Result panel ──────────────────────────────────────────────────────────

function AIResultPanel({
  result, reglaDura, onAceptar, onOverride, overrideActive, nivelFinal, onNivelChange, justificacion, onJustChange,
}: {
  result: ClasificarResult
  reglaDura: boolean
  onAceptar: () => void
  onOverride: () => void
  overrideActive: boolean
  nivelFinal: NivelUrgencia
  onNivelChange: (n: NivelUrgencia) => void
  justificacion: string
  onJustChange: (v: string) => void
}) {
  const colors = NIVEL_COLORS[result.nivel_sugerido]
  return (
    <div style={{ ...CARD, border: `2px solid ${colors.border}` }}>
      <p style={{ ...SECTION_TITLE, borderColor: colors.border }}>
        🤖 Resultado de la IA
        {(result.ml_degradado || result.error) && (
          <span style={{ color: '#EA580C', fontWeight: 400, fontSize: '11px', marginLeft: '8px' }}>
            (clasificación por signos vitales)
          </span>
        )}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <div style={{
          background: colors.bg, border: `2px solid ${colors.border}`,
          borderRadius: '12px', padding: '14px 20px', textAlign: 'center', minWidth: '140px',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: colors.text, margin: '0 0 4px', letterSpacing: '0.06em' }}>
            NIVEL SUGERIDO
          </p>
          <p style={{ fontSize: '22px', fontWeight: 900, color: colors.text, margin: 0 }}>
            {result.nivel_sugerido}
          </p>
          <p style={{ fontSize: '11px', color: colors.text, margin: '4px 0 0', opacity: 0.8 }}>
            {NIVEL_LABELS[result.nivel_sugerido]}
          </p>
        </div>

        <div style={{ flex: 1 }}>
          {result.confianza_pct && result.confianza_pct !== '—' && (
            <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 4px' }}>
              Confianza: <strong>{result.confianza_pct}</strong>
            </p>
          )}
          {reglaDura && (
            <div style={{
              background: '#FEF9C3', border: '1px solid #CA8A04',
              borderRadius: '8px', padding: '8px 12px', marginTop: '8px',
            }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#92400E', margin: 0 }}>
                ⚠ Regla clínica aplicada
              </p>
              <p style={{ fontSize: '11px', color: '#92400E', margin: '2px 0 0' }}>
                Un signo vital crítico forzó este nivel. No puede ser reducido.
              </p>
            </div>
          )}
          {result.ajuste_signos && (
            <p style={{ fontSize: '12px', color: '#64748B', margin: '8px 0 0' }}>
              {result.ajuste_signos}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          type="button"
          onClick={onAceptar}
          style={{
            flex: 1, padding: '9px', border: `2px solid ${colors.border}`,
            borderRadius: '8px', background: overrideActive ? '#F8FAFC' : colors.bg,
            color: colors.text, fontSize: '13px', fontWeight: 700, cursor: 'pointer',
          }}
        >
          ✓ Aceptar nivel {result.nivel_sugerido}
        </button>
        <button
          type="button"
          onClick={onOverride}
          disabled={reglaDura}
          style={{
            flex: 1, padding: '9px',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            background: overrideActive ? '#FFF7ED' : '#F8FAFC',
            color: overrideActive ? '#EA580C' : '#64748B',
            fontSize: '13px', fontWeight: 600,
            cursor: reglaDura ? 'not-allowed' : 'pointer',
            opacity: reglaDura ? 0.5 : 1,
          }}
        >
          ✎ Cambiar nivel manualmente
        </button>
      </div>

      {/* Override form */}
      {overrideActive && (
        <div style={{
          marginTop: '14px', padding: '14px',
          background: '#FFF7ED', border: '1px solid #FED7AA',
          borderRadius: '8px',
        }}>
          <label style={{ ...LABEL, color: '#C2410C' }}>
            Nivel de urgencia final <span style={{ color: '#DC2626' }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {NIVELES.map(n => {
              const c = NIVEL_COLORS[n]
              const active = nivelFinal === n
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => onNivelChange(n)}
                  style={{
                    padding: '5px 12px', border: `2px solid ${active ? c.border : '#E2E8F0'}`,
                    borderRadius: '8px', background: active ? c.bg : '#fff',
                    color: active ? c.text : '#64748B',
                    fontSize: '12px', fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {n}
                </button>
              )
            })}
          </div>

          <label style={{ ...LABEL, color: '#C2410C' }}>
            Justificación del cambio <span style={{ color: '#DC2626' }}>*</span>
          </label>
          <textarea
            style={{ ...INPUT, height: '72px', resize: 'vertical' }}
            value={justificacion}
            onChange={e => onJustChange(e.target.value)}
            placeholder="Explique el motivo del cambio de nivel respecto a la sugerencia de la IA..."
          />
        </div>
      )}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function TriajeForm() {
  const { fichaId } = useParams<{ fichaId: string }>()
  const navigate = useNavigate()

  const [ficha, setFicha]     = useState<FichaBrief | null>(null)
  const [loadingFicha, setLoadingFicha] = useState(true)
  const [fichaError, setFichaError]     = useState('')

  // Vital signs form
  const [motivo, setMotivo]           = useState('')
  const [peso, setPeso]               = useState('')
  const [talla, setTalla]             = useState('')
  const [fc, setFc]                   = useState('')
  const [fr, setFr]                   = useState('')
  const [pas, setPas]                 = useState('')
  const [pad, setPad]                 = useState('')
  const [temp, setTemp]               = useState('')
  const [spo2, setSpo2]               = useState('')
  const [glucemia, setGlucemia]       = useState('')
  const [dolor, setDolor]             = useState('')
  const [glasgow, setGlasgow]         = useState('')
  const [observaciones, setObs]       = useState('')

  // AI step
  const [aiLoading, setAiLoading]     = useState(false)
  const [aiResult, setAiResult]       = useState<ClasificarResult | null>(null)
  const [aiError, setAiError]         = useState('')

  // Override / confirmation
  const [overrideActive, setOverrideActive] = useState(false)
  const [nivelFinal, setNivelFinal]         = useState<NivelUrgencia>('AMARILLO')
  const [justificacion, setJust]            = useState('')

  // Save step
  const [saving, setSaving]   = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (!fichaId) return
    setLoadingFicha(true)
    fichaService.obtener(Number(fichaId))
      .then(res => setFicha(res.data))
      .catch(() => setFichaError('No se pudo cargar la ficha.'))
      .finally(() => setLoadingFicha(false))
  }, [fichaId])

  const toNum = (s: string) => s.trim() !== '' ? Number(s) : null

  const handleClasificar = async () => {
    setAiLoading(true)
    setAiError('')
    setAiResult(null)
    setOverrideActive(false)
    try {
      const res = await triajeService.clasificar({
        motivo_consulta_triaje: motivo || undefined,
        saturacion_oxigeno:  toNum(spo2)    ?? undefined,
        presion_sistolica:   toNum(pas)     ?? undefined,
        frecuencia_cardiaca: toNum(fc)      ?? undefined,
        escala_dolor:        toNum(dolor)   ?? undefined,
        glasgow:             toNum(glasgow) ?? undefined,
      })
      setAiResult(res.data)
      setNivelFinal(res.data.nivel_sugerido)
    } catch {
      setAiError('Error al consultar la IA. Puedes asignar el nivel manualmente.')
      setAiResult({
        nivel_sugerido: 'AMARILLO', nivel_numerico: 3,
        reglas_duras_aplicadas: false,
        confianza_pct: '', ajuste_signos: '', probabilidades: {},
        error: 'Sin servicio IA',
      })
      setNivelFinal('AMARILLO')
    } finally {
      setAiLoading(false)
    }
  }

  const handleAceptar = () => {
    if (!aiResult) return
    setNivelFinal(aiResult.nivel_sugerido)
    setOverrideActive(false)
    setJust('')
  }

  const handleGuardar = async () => {
    if (!aiResult) { setSaveError('Primero consulta la IA.'); return }
    if (!motivo.trim()) { setSaveError('El motivo de consulta es obligatorio.'); return }
    if (overrideActive && !justificacion.trim()) {
      setSaveError('La justificación del cambio de nivel es obligatoria.'); return
    }

    setSaving(true)
    setSaveError('')

    const fueOverride = overrideActive && nivelFinal !== aiResult.nivel_sugerido

    const payload: TriajePayload = {
      ficha: Number(fichaId),
      peso_kg:              toNum(peso),
      talla_cm:             toNum(talla),
      frecuencia_cardiaca:  toNum(fc),
      frecuencia_respiratoria: toNum(fr),
      presion_sistolica:    toNum(pas),
      presion_diastolica:   toNum(pad),
      temperatura_celsius:  toNum(temp),
      saturacion_oxigeno:   toNum(spo2),
      glucemia:             toNum(glucemia),
      escala_dolor:         toNum(dolor),
      glasgow:              toNum(glasgow),
      motivo_consulta_triaje: motivo.trim(),
      observaciones:        observaciones.trim() || undefined,
      nivel_sugerido_ia:    aiResult.nivel_sugerido,
      nivel_urgencia:       nivelFinal,
      fue_sobreescrito:     fueOverride,
      justificacion_override: fueOverride ? justificacion.trim() : '',
      reglas_duras_aplicadas: aiResult.reglas_duras_aplicadas,
    }

    try {
      await triajeService.crear(payload)
      // Transicionar ficha a EN_TRIAJE
      try {
        await fichaService.cambiarEstado(Number(fichaId), 'EN_TRIAJE')
      } catch { /* no crítico */ }

      navigate('/urgencias', { state: { success: true } })
    } catch (err: unknown) {
      const data = (err as { response?: { data?: unknown } })?.response?.data
      if (data && typeof data === 'object') {
        const msgs = Object.values(data as Record<string, unknown>)
          .flat()
          .map(String)
          .join(' ')
        setSaveError(msgs || 'Error al guardar el triaje.')
      } else {
        setSaveError('Error de conexión.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loadingFicha) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontFamily: "'Segoe UI', sans-serif" }}>
        Cargando ficha...
      </div>
    )
  }

  if (fichaError || !ficha) {
    return (
      <div style={{ padding: '40px', fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ background: '#FEE2E2', borderRadius: '8px', padding: '16px', color: '#991B1B' }}>
          {fichaError || 'Ficha no encontrada.'}
        </div>
        <button onClick={() => navigate('/urgencias')} style={{ marginTop: '12px', color: '#0080FF', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
          ← Volver a Urgencias
        </button>
      </div>
    )
  }

  const reglaDura = aiResult?.reglas_duras_aplicadas ?? false

  return (
    <div style={{ padding: '24px 32px', fontFamily: "'Segoe UI', sans-serif", maxWidth: '900px' }}>

      {/* Back + title */}
      <button
        onClick={() => navigate('/urgencias')}
        style={{ background: 'none', border: 'none', color: '#0080FF', cursor: 'pointer', fontSize: '13px', marginBottom: '12px', padding: 0 }}
      >
        ← Volver a Urgencias
      </button>

      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B', margin: '0 0 4px' }}>
          Registro de Triaje
        </h1>
        <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>
          Flujo: Signos vitales → Consultar IA → Confirmar nivel → Guardar
        </p>
      </div>

      {/* Patient banner */}
      <div style={{
        background: '#122268', borderRadius: '12px',
        padding: '16px 24px', marginBottom: '20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '11px', margin: '0 0 4px', letterSpacing: '0.06em' }}>
            PACIENTE
          </p>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: '17px', margin: 0 }}>
            {ficha.paciente.nombre_completo}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: '2px 0 0' }}>
            CI: {ficha.paciente.ci}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '11px', margin: '0 0 4px', letterSpacing: '0.06em' }}>
            FICHA
          </p>
          <p style={{ color: '#00A896', fontWeight: 700, fontSize: '16px', margin: 0 }}>
            {ficha.correlativo}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: '2px 0 0' }}>
            {new Date(ficha.fecha_apertura).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
        </div>
      </div>

      {/* Motivo */}
      <div style={CARD}>
        <p style={SECTION_TITLE}>Motivo de consulta</p>
        <textarea
          style={{ ...INPUT, height: '80px', resize: 'vertical' }}
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          placeholder="Describa el motivo principal de la consulta tal como lo refiere el paciente..."
        />
      </div>

      {/* Signos vitales */}
      <div style={CARD}>
        <p style={SECTION_TITLE}>Signos vitales</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          <NumField label="Peso"                  unit="kg"    value={peso}      onChange={setPeso}     min={0.5}  max={500}  step={0.1} hint="0.5 – 500 kg" />
          <NumField label="Talla"                 unit="cm"    value={talla}     onChange={setTalla}    min={20}   max={250}  step={0.1} hint="20 – 250 cm" />
          <NumField label="Frec. cardíaca"        unit="lpm"   value={fc}        onChange={setFc}       min={20}   max={300}  hint="20 – 300 lpm" />
          <NumField label="Frec. respiratoria"    unit="rpm"   value={fr}        onChange={setFr}       min={5}    max={80}   hint="5 – 80 rpm" />
          <NumField label="Presión sistólica"     unit="mmHg"  value={pas}       onChange={setPas}      min={40}   max={300}  hint="40 – 300 mmHg" />
          <NumField label="Presión diastólica"    unit="mmHg"  value={pad}       onChange={setPad}      min={20}   max={200}  hint="20 – 200 mmHg" />
          <NumField label="Temperatura"           unit="°C"    value={temp}      onChange={setTemp}     min={25}   max={45}   step={0.1} hint="25 – 45 °C" />
          <NumField label="Saturación O₂ (SpO₂)"  unit="%"     value={spo2}      onChange={setSpo2}     min={50}   max={100}  hint="50 – 100 %" />
          <NumField label="Glucemia capilar"      unit="mg/dL" value={glucemia}  onChange={setGlucemia} hint="Opcional" />
          <NumField label="Escala de dolor (EVA)" unit="0–10"  value={dolor}     onChange={setDolor}    min={0}    max={10}   hint="0 = sin dolor, 10 = máximo" />
          <NumField label="Glasgow"               unit="3–15"  value={glasgow}   onChange={setGlasgow}  min={3}    max={15}   hint="3 = coma profundo, 15 = normal" />
        </div>
      </div>

      {/* Step 1: Consultar IA */}
      <div style={{ marginBottom: '16px' }}>
        {aiError && (
          <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '8px', padding: '10px 14px', marginBottom: '10px', color: '#C2410C', fontSize: '13px' }}>
            {aiError}
          </div>
        )}
        <button
          type="button"
          onClick={() => void handleClasificar()}
          disabled={aiLoading}
          style={{
            width: '100%', padding: '12px',
            background: aiLoading ? '#9CA3AF' : '#0003B8',
            border: 'none', borderRadius: '10px',
            color: '#fff', fontSize: '15px', fontWeight: 700,
            cursor: aiLoading ? 'not-allowed' : 'pointer',
            letterSpacing: '0.02em',
          }}
        >
          {aiLoading ? '🤖 Consultando IA...' : '🤖 Consultar IA — Clasificar Urgencia'}
        </button>
        {!aiResult && (
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#94A3B8', margin: '6px 0 0' }}>
            Completa los signos vitales y el motivo antes de consultar
          </p>
        )}
      </div>

      {/* Step 2: AI Result + override */}
      {aiResult && (
        <AIResultPanel
          result={aiResult}
          reglaDura={reglaDura}
          onAceptar={handleAceptar}
          onOverride={() => setOverrideActive(true)}
          overrideActive={overrideActive}
          nivelFinal={nivelFinal}
          onNivelChange={n => { setNivelFinal(n); }}
          justificacion={justificacion}
          onJustChange={setJust}
        />
      )}

      {/* Observaciones */}
      <div style={CARD}>
        <p style={SECTION_TITLE}>Observaciones adicionales</p>
        <textarea
          style={{ ...INPUT, height: '72px', resize: 'vertical' }}
          value={observaciones}
          onChange={e => setObs(e.target.value)}
          placeholder="Observaciones de enfermería (opcional)..."
        />
      </div>

      {/* Save */}
      {saveError && (
        <div style={{
          background: '#FEE2E2', border: '1px solid #FECACA',
          borderRadius: '8px', padding: '12px 16px',
          color: '#991B1B', fontSize: '13px', marginBottom: '12px',
        }}>
          {saveError}
        </div>
      )}

      <button
        type="button"
        onClick={() => void handleGuardar()}
        disabled={saving || !aiResult}
        style={{
          width: '100%', padding: '14px',
          background: saving || !aiResult ? '#9CA3AF' : '#00A896',
          border: 'none', borderRadius: '10px',
          color: '#fff', fontSize: '15px', fontWeight: 800,
          cursor: saving || !aiResult ? 'not-allowed' : 'pointer',
          letterSpacing: '0.02em', marginBottom: '32px',
        }}
      >
        {saving
          ? 'Guardando triaje...'
          : aiResult
            ? `✓ Confirmar y Guardar Triaje — Nivel ${nivelFinal}`
            : 'Consulta la IA primero para guardar'}
      </button>
    </div>
  )
}
