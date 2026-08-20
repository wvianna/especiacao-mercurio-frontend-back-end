import { useTelemetry } from '../store/telemetry';
import { ACTUATOR_ROWS } from '../lib/stages';

function isOn(t: { valves?: Record<string, number>; pump?: number; pwm?: { u: number; f2: number } } | null, key: string): boolean {
  if (!t) return false;
  if (key === 'pump') return Boolean(t.pump);
  if (key === 'heatU') return (t.pwm?.u ?? 0) > 0;
  if (key === 'heatF2') return (t.pwm?.f2 ?? 0) > 0;
  return Boolean(t.valves?.[key]);
}

/** Painel de status dinâmico dos atuadores (verde = ON, cinza = OFF). */
export function ValvePanel() {
  const t = useTelemetry((s) => s.latest);

  return (
    <div className="panel valve-panel">
      <div className="panel-head">
        <h2>Status dos Atuadores</h2>
        <span className="panel-sub">{t ? 'estado real (DAQ)' : 'sem telemetria'}</span>
      </div>
      <div className="valve-grid">
        {ACTUATOR_ROWS.map((r) => {
          const on = isOn(t, r.key);
          return (
            <div key={r.key} className={`valve-ind ${r.kind}${on ? ' is-on' : ''}`} title={r.label}>
              <span className="valve-led" />
              <span className="valve-short">{r.short}</span>
              <span className="valve-state">{on ? 'ON' : 'OFF'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
