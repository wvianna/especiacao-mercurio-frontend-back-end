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

/** Painel de configuração com persistência (LER / ESCREVER). */
export function ConfigPanel() {
  const [form, setForm] = useState<FormState | null>(null);
  const [msg, setMsg] = useState('');

  const set = (k: keyof FormState) => (v: string) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  const read = async () => {
    try {
      const cfg = await api.getConfig();
      setForm(toForm(cfg));
      setMsg('parâmetros lidos');
    } catch (e) {
      setMsg(`erro ao ler: ${(e as Error).message}`);
    }
  };

  const write = async () => {
    if (!form) return;
    try {
      await api.putConfig(toConfig(form));
      setMsg('parâmetros salvos (persistidos)');
    } catch (e) {
      setMsg(`erro ao salvar: ${(e as Error).message}`);
    }
  };

  useEffect(() => {
    void read();
  }, []);

  return (
    <div className="panel config-panel">
      <div className="panel-head">
        <h2>Configuração do Método</h2>
        <span className="panel-sub">parâmetros persistentes</span>
      </div>
      {form ? (
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
      ) : (
        <p className="cfg-loading">carregando…</p>
      )}
      <div className="cfg-actions">
        <button className="sec-btn" onClick={() => void read()}>
          LER
        </button>
        <button className="sec-btn" onClick={() => void write()}>
          ESCREVER
        </button>
      </div>
      {msg && <p className="cfg-msg">{msg}</p>}
    </div>
  );
}
