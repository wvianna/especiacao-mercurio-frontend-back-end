import { describe, it, expect } from 'vitest';
import { MAX_SAMPLES, toSample, useTelemetry } from './telemetry';
import type { Telemetry } from '../types';

function sample(n: number): Telemetry {
  return {
    ts: n,
    temp: { t1: -40 + n, t2: 699 },
    sp: { u: -40, f2: 700 },
    pwm: { u: 100, f2: 255 },
    rate_c_per_s: 0.5,
    state: 'T2_RAMPA',
    valves: { sv1: 1, sv2: 0, sv3: 0, sv4: 0, sv5: 0 },
    pump: 0,
    error_code: 0,
  };
}

describe('telemetry store', () => {
  it('aplica telemetria e atualiza o último valor', () => {
    const store = useTelemetry.getState();
    store.apply(sample(1));
    store.apply(sample(2));
    const { latest, buffer } = useTelemetry.getState();
    expect(latest?.ts).toBe(2);
    expect(buffer).toHaveLength(2);
  });

  it('limita o buffer ao máximo (15 min a 4 Hz)', () => {
    const store = useTelemetry.getState();
    for (let i = 0; i < MAX_SAMPLES + 50; i++) {
      store.apply(sample(i));
    }
    const { buffer } = useTelemetry.getState();
    expect(buffer.length).toBe(MAX_SAMPLES);
  });

  it('normaliza corretamente uma amostra', () => {
    const t = sample(5);
    const s = toSample(t);
    expect(s.t1).toBe(-40 + 5);
    expect(s.spF2).toBe(700);
    expect(s.pwmU).toBe(100);
    expect(s.rate).toBe(0.5);
  });
});
