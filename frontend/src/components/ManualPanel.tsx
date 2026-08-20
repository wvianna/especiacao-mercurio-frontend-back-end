import { useManualActuation } from '../store/manual';

const VALVES = [
  { key: 'sv1', label: 'SV1 · Hélio' },
  { key: 'sv2', label: 'SV2 · Agita/Purga' },
  { key: 'sv3', label: 'SV3 · Vapor' },
  { key: 'sv4', label: 'SV4 · Purga2' },
  { key: 'sv5', label: 'SV5 · Pistão' },
] as const;

/**
 * Matriz de controles manuais: SV1-SV5, bomba e sliders de VM.
 * Guiado pela telemetria (estado real = fonte de verdade).
 */
export function ManualPanel({ enabled }: { enabled: boolean }) {
  const { valves, pump, pwm, sent, toggleValve, togglePump, setPwm } =
    useManualActuation(enabled);

  return (
    <div className={`panel manual-panel${enabled ? '' : ' is-locked'}`}>
      <div className="panel-head">
        <h2>Controles Manuais</h2>
        {sent && <span className="sent-ok">✓ enviado</span>}
        {!enabled && <span className="lock-hint">🔒 ative o modo manual</span>}
      </div>
      <div className="btn-grid">
        {VALVES.map((v) => (
          <button
            key={v.key}
            className={`act-btn${valves[v.key] ? ' is-on' : ''}`}
            onClick={() => toggleValve(v.key)}
            disabled={!enabled}
          >
            {v.label}
          </button>
        ))}
        <button
          className={`act-btn pump${pump ? ' is-on' : ''}`}
          onClick={togglePump}
          disabled={!enabled}
        >
          Bomba
        </button>
      </div>
      <div className="sliders">
        <label>
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
        <label>
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
