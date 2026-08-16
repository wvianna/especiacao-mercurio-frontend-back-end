import { create } from 'zustand';
import type { Telemetry } from '../types';

/** Amostra normalizada para os gráficos de tendência. */
export interface Sample {
  ts: number;
  t1: number;
  t2: number;
  spU: number;
  spF2: number;
  pwmU: number;
  pwmF2: number;
  rate: number;
}

/** Buffer de 15 min a 4 Hz = 3600 amostras. */
export const MAX_SAMPLES = 3600;

interface TelemetryState {
  latest: Telemetry | null;
  buffer: Sample[];
  apply: (t: Telemetry) => void;
}

export function toSample(t: Telemetry): Sample {
  return {
    ts: t.ts,
    t1: t.temp.t1,
    t2: t.temp.t2,
    spU: t.sp.u,
    spF2: t.sp.f2,
    pwmU: t.pwm.u,
    pwmF2: t.pwm.f2,
    rate: t.rate_c_per_s,
  };
}

export const useTelemetry = create<TelemetryState>((set) => ({
  latest: null,
  buffer: [],
  apply: (t) =>
    set((state) => {
      const buffer = [...state.buffer, toSample(t)];
      if (buffer.length > MAX_SAMPLES) buffer.splice(0, buffer.length - MAX_SAMPLES);
      return { latest: t, buffer };
    }),
}));
