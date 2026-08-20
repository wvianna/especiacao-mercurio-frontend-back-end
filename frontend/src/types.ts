/** Tipos compartilhados com o backend (contratos do TDD). */

/** Progresso da etapa atual dentro do ciclo (T0→T3). */
export interface StageProgress {
  id: string;
  index: number; // 0..3 dentro do ciclo; -1 fora dele
  elapsed: number;
  total: number;
  progress: number; // 0..1
}

/** Progresso geral do ciclo (soma das etapas). */
export interface CycleProgress {
  elapsed: number;
  total: number;
  progress: number; // 0..1
}

/** Duração planejada (set-point) de uma etapa, do backend. */
export interface StageDuration {
  id: string;
  duration: number;
}

export interface Telemetry {
  ts: number;
  temp: { t1: number; t2: number };
  sp: { u: number; f2: number };
  pwm: { u: number; f2: number };
  rate_c_per_s: number;
  state: string;
  valves: Record<string, number>;
  pump: number;
  error_code: number;
  stage: StageProgress;
  cycle: CycleProgress;
  stages: StageDuration[];
}

export interface PIDGains {
  kp: number;
  ti: number;
  td: number;
}

export interface RampConfig {
  time_s: number;
  nitrogen_temp_c: number;
  target_temp_c: number;
}

export interface Config {
  version: number;
  updated_at: string;
  pid_u: PIDGains;
  pid_f2: PIDGains;
  times_s: { t1: number; t2: number; t3: number };
  ramp: RampConfig;
  setpoints: { f2_c: number };
}

export interface ManualState {
  valves: Record<string, number>;
  pump: number;
  pwm: { u: number; f2: number };
}
