/** Rótulos e utilitários das fases/estados do processo. */
export const PHASE_LABEL: Record<string, string> = {
  SAFE: 'SAFE STATE',
  T0_DERIV: 'T₀ · Derivação / Criofocalização',
  T1_STAB: 'T₁ · Estabilização Térmica',
  T2_RAMPA: 'T₂ · Rampa de Aquecimento',
  T3_PURGA: 'T₃ · Purga Total',
  MANUAL: 'MANUAL',
};

export function phaseLabel(state: string): string {
  return PHASE_LABEL[state] ?? state;
}

export function isManualMode(state: string): boolean {
  return state === 'MANUAL';
}
