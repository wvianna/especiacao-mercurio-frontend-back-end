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
 * Painel mesclado de atuadores: status (verde = ON, cinza = OFF) + controle
 * manual (clique para alternar válvulas/bomba e sliders de VM dos fornos).
 * No modo AUTO vira apenas um painel de status (somente leitura).
 */
export function ActuatorPanel({ enabled }: { enabled: boolean }) {
  const t = useTelemetry((s) => s.latest);
  const { pwm, sent, toggleValve, togglePump, setPwm } =
    useManualActuation(enabled);

  const toggle = (key: string) => (key === 'pump' ? togglePump() : toggleValve(key));

  return (
    <div className={`panel actuator-panel${enabled ? '' : ' is-locked'}`}>
      <div className="panel-head">
        <h2>Controles e Atuadores</h2>
        {sent && <span className="sent-ok">✓ enviado</span>}
        {!enabled && <span className="lock-hint">🔒 ative o modo manual</span>}
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
              data-tip={
                clickable
                  ? `${r.label} — clique para alternar (modo manual)`
                  : `${r.label} — status somente leitura (modo AUTO)`
              }
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

      <div className="act-sliders">
        <label data-tip="Ajusta a potência do Forno 1 (Tubo U), 0–255 — somente no modo manual">
          <span>VM Forno 1 (Tubo U)</span>
          <input
            type="range"
            min={0}
            max={255}
            value={pwm.u}
            disabled={!enabled}
            onChange={(e) => setPwm('u', Number(e.target.value))}
          />
          <em>{pwm.u}</em>
        </label>
        <label data-tip="Ajusta a potência do Forno 2 (Atomizador), 0–255 — somente no modo manual">
          <span>VM Forno 2 (Atomizador)</span>
          <input
            type="range"
            min={0}
            max={255}
            value={pwm.f2}
            disabled={!enabled}
            onChange={(e) => setPwm('f2', Number(e.target.value))}
          />
          <em>{pwm.f2}</em>
        </label>
      </div>
    </div>
  );
}
