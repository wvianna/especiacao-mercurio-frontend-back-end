import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Config } from '../types';

interface FormState {
  t1: string;
  t2: string;
  t3: string;
  rampTime: string;
  nitrogen: string;
  target: string;
  kpU: string;
  tiU: string;
  kpF2: string;
  tiF2: string;
  setpointF2: string;
}

function toForm(c: Config): FormState {
  return {
    t1: String(c.times_s.t1),
    t2: String(c.times_s.t2),
    t3: String(c.times_s.t3),
    rampTime: String(c.ramp.time_s),
    nitrogen: String(c.ramp.nitrogen_temp_c),
    target: String(c.ramp.target_temp_c),
    kpU: String(c.pid_u.kp),
    tiU: String(c.pid_u.ti),
    kpF2: String(c.pid_f2.kp),
    tiF2: String(c.pid_f2.ti),
    setpointF2: String(c.setpoints.f2_c),
  };
}

function toConfig(f: FormState): Config {
  const num = (s: string) => Number(s);
  return {
    version: 1,
    updated_at: '',
    pid_u: { kp: num(f.kpU), ti: num(f.tiU), td: 0 },
    pid_f2: { kp: num(f.kpF2), ti: num(f.tiF2), td: 0 },
    times_s: { t1: num(f.t1), t2: num(f.t2), t3: num(f.t3) },
    ramp: {
      time_s: num(f.rampTime),
      nitrogen_temp_c: num(f.nitrogen),
      target_temp_c: num(f.target),
    },
    setpoints: { f2_c: num(f.setpointF2) },
  };
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="cfg-field">
      <span>{label}</span>
      <input type="number" step="any" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

const STAGE_SUMMARY: { label: string; get: (f: FormState) => string }[] = [
  { label: 'T₀ · Derivação', get: (f) => f.t1 },
  { label: 'T₁ · Estabilização', get: (f) => f.t2 },
  { label: 'T₂ · Rampa', get: (f) => f.rampTime },
  { label: 'T₃ · Purga', get: (f) => f.t3 },
];

/** Painel de configuração (Set-Point Configuration Mode) com persistência. */
export function ConfigPanel() {
  const [form, setForm] = useState<FormState | null>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState(false);

  const set = (k: keyof FormState) => (v: string) => {
    setForm((f) => (f ? { ...f, [k]: v } : f));
    setErr(false);
  };

  const read = async () => {
    try {
      const cfg = await api.getConfig();
      setForm(toForm(cfg));
      setMsg('parâmetros lidos');
      setErr(false);
    } catch (e) {
      setMsg(`erro ao ler: ${(e as Error).message}`);
      setErr(true);
    }
  };

  const write = async () => {
    if (!form) return;
    try {
      await api.putConfig(toConfig(form));
      setMsg('parâmetros validados e persistidos (atomic)');
      setErr(false);
    } catch (e) {
      setMsg(`erro ao salvar: ${(e as Error).message}`);
      setErr(true);
    }
  };

  useEffect(() => {
    void read();
  }, []);

  return (
    <div className="panel config-panel">
      <div className="panel-head">
        <h2>Configuração do Método</h2>
        <span className="panel-sub">set-point configuration mode</span>
      </div>
      {form ? (
        <>
          <div className="cfg-summary" role="group" aria-label="Resumo das etapas">
            {STAGE_SUMMARY.map((s) => (
              <div key={s.label} className="cfg-sum-item">
                <span>{s.label}</span>
                <b>{s.get(form)}s</b>
              </div>
            ))}
          </div>
          <div className="cfg-grid">
            <fieldset>
              <legend>Tempos (s)</legend>
              <Field label="T₁" value={form.t1} onChange={set('t1')} />
              <Field label="T₂" value={form.t2} onChange={set('t2')} />
              <Field label="T₃" value={form.t3} onChange={set('t3')} />
            </fieldset>
            <fieldset>
              <legend>Rampa</legend>
              <Field label="Tempo (s)" value={form.rampTime} onChange={set('rampTime')} />
              <Field label="N₂ inicial (°C)" value={form.nitrogen} onChange={set('nitrogen')} />
              <Field label="Alvo (°C)" value={form.target} onChange={set('target')} />
            </fieldset>
            <fieldset>
              <legend>PID Tubo U</legend>
              <Field label="Kp" value={form.kpU} onChange={set('kpU')} />
              <Field label="Ti (min)" value={form.tiU} onChange={set('tiU')} />
            </fieldset>
            <fieldset>
              <legend>PID Forno 2</legend>
              <Field label="Kp" value={form.kpF2} onChange={set('kpF2')} />
              <Field label="Ti (min)" value={form.tiF2} onChange={set('tiF2')} />
              <Field label="Setpoint (°C)" value={form.setpointF2} onChange={set('setpointF2')} />
            </fieldset>
          </div>
        </>
      ) : (
        <p className="cfg-loading">carregando…</p>
      )}
      <div className="cfg-actions">
        <button className="sec-btn" onClick={() => void read()}>
          LER
        </button>
        <button className="sec-btn" onClick={() => void write()}>
          SALVAR CONFIGURAÇÕES
        </button>
      </div>
      {msg && <p className={`cfg-msg${err ? ' is-err' : ''}`}>{msg}</p>}
    </div>
  );
}
