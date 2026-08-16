import { useEffect, useState } from 'react';
import { api } from '../api/client';

const VALVES = [
  { key: 'sv1', label: 'SV1 · Hélio' },
  { key: 'sv2', label: 'SV2 · Agita/Purga' },
  { key: 'sv3', label: 'SV3 · Vapor' },
  { key: 'sv4', label: 'SV4 · Purga2' },
  { key: 'sv5', label: 'SV5 · Pistão' },
] as const;

/** Matriz de controles manuais: SV1-SV5, bomba e sliders de VM. */
export function ManualPanel() {
  const [valves, setValves] = useState<Record<string, number>>({
    sv1: 0,
    sv2: 0,
    sv3: 0,
    sv4: 0,
    sv5: 0,
  });
  const [pump, setPump] = useState(0);
  const [pwm, setPwm] = useState({ u: 0, f2: 0 });
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!sent) return;
    const t = setTimeout(() => setSent(false), 1200);
    return () => clearTimeout(t);
  }, [sent]);

  const push = (next: { valves?: Record<string, number>; pump?: number; pwm?: { u: number; f2: number } }) => {
    const state = {
      valves: next.valves ?? valves,
      pump: next.pump ?? pump,
      pwm: next.pwm ?? pwm,
    };
    api.manual(state)
      .then(() => setSent(true))
      .catch((e) => console.error('manual:', e));
  };

  const toggleValve = (key: string) => {
    const next = { ...valves, [key]: valves[key] ? 0 : 1 };
    setValves(next);
    push({ valves: next });
  };

  const togglePump = () => {
    const next = pump ? 0 : 1;
    setPump(next);
    push({ pump: next });
  };

  const setSlider = (which: 'u' | 'f2', value: number) => {
    const next = { ...pwm, [which]: value };
    setPwm(next);
    push({ pwm: next });
  };

  return (
    <div className="panel manual-panel">
      <div className="panel-head">
        <h2>Controles Manuais</h2>
        {sent && <span className="sent-ok">✓ enviado</span>}
      </div>
      <div className="btn-grid">
        {VALVES.map((v) => (
          <button
            key={v.key}
            className={`act-btn${valves[v.key] ? ' is-on' : ''}`}
            onClick={() => toggleValve(v.key)}
          >
            {v.label}
          </button>
        ))}
        <button className={`act-btn pump${pump ? ' is-on' : ''}`} onClick={togglePump}>
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
            onChange={(e) => setSlider('u', Number(e.target.value))}
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
            onChange={(e) => setSlider('f2', Number(e.target.value))}
          />
          <em>{pwm.f2}</em>
        </label>
      </div>
    </div>
  );
}
