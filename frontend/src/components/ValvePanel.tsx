import { useTelemetry } from '../store/telemetry';
import { useManualActuation } from '../store/manual';
import { ACTUATOR_ROWS } from '../lib/stages';

function isOn(t: { valves?: Record<string, number>; pump?: number; pwm?: { u: number; f2: number } } | null, key: string): boolean {
  if (!t) return false;
  if (key === 'pump') return Boolean(t.pump);
  if (key === 'heatU') return (t.pwm?.u ?? 0) > 0;
  if (key === 'heatF2') return (t.pwm?.f2 ?? 0) > 0;
  return Boolean(t.valves?.[key]);
}

/** É acionável por clique (válvula/bomba — no modo manual). */
function isToggleable(kind: string): boolean {
  return kind === 'valve' || kind === 'pump';
}

/**
 * Painel de status dinâmico dos atuadores (verde = ON, cinza = OFF).
 * Em modo MANUAL, os indicadores de válvulas e da bomba viram botões
 * clicáveis que acionam/desligam o dispositivo em tempo real.
 */
export function ValvePanel({ enabled }: { enabled: boolean }) {
  const t = useTelemetry((s) => s.latest);
  const { toggleValve, togglePump } = useManualActuation(enabled);

  const toggle = (key: string) => (key === 'pump' ? togglePump() : toggleValve(key));

  return (
    <div className="panel valve-panel">
      <div className="panel-head">
        <h2>Status dos Atuadores</h2>
        <span className="panel-sub">
          {enabled ? 'clique para acionar (manual)' : t ? 'estado real (DAQ)' : 'sem telemetria'}
        </span>
      </div>
      <div className="valve-grid">
        {ACTUATOR_ROWS.map((r) => {
          const on = isOn(t, r.key);
          const clickable = enabled && isToggleable(r.kind);
          return (
            <button
              key={r.key}
              type="button"
              className={`valve-ind ${r.kind}${on ? ' is-on' : ''}${clickable ? ' is-btn' : ''}`}
              title={clickable ? `${r.label} — clique para alternar` : r.label}
              onClick={() => clickable && toggle(r.key)}
              disabled={!clickable}
            >
              <span className="valve-led" />
              <span className="valve-short">{r.short}</span>
              <span className="valve-state">{on ? 'ON' : 'OFF'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
