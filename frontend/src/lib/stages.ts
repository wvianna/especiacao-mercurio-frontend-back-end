/**
 * Metadados das etapas do ciclo e matriz de atuadores.
 * Fonte única de verdade para o Diagrama de Tempos, o painel de válvulas
 * e a barra de progresso — espelha a FSM do backend (backend/app/fsm.py).
 */

export const STAGE_ORDER = ['T0_DERIV', 'T1_STAB', 'T2_RAMPA', 'T3_PURGA'] as const;
export type StageId = (typeof STAGE_ORDER)[number];

export interface StageMeta {
  id: StageId;
  short: string; // rótulo curto (T₀ … T₃)
  name: string; // nome de exibição
  description: string;
}

export const STAGE_META: Record<StageId, StageMeta> = {
  T0_DERIV: { id: 'T0_DERIV', short: 'T₀', name: 'T₀ · Derivação', description: 'Derivação / Criofocalização' },
  T1_STAB: { id: 'T1_STAB', short: 'T₁', name: 'T₁ · Estabilização', description: 'Estabilização térmica' },
  T2_RAMPA: { id: 'T2_RAMPA', short: 'T₂', name: 'T₂ · Rampa', description: 'Rampa de aquecimento' },
  T3_PURGA: { id: 'T3_PURGA', short: 'T₃', name: 'T₃ · Purga', description: 'Purga total' },
};

/** Linhas do Diagrama de Tempos (atuadores). */
export type ActuatorKey = 'sv1' | 'sv2' | 'sv3' | 'sv4' | 'sv5' | 'pump' | 'heatU' | 'heatF2';

export interface ActuatorRow {
  key: ActuatorKey;
  label: string;
  short: string;
  kind: 'valve' | 'pump' | 'heat';
  bit?: number; // bitmask DAC: 0=SV1 … 4=SV5, 5=Bomba
}

export const ACTUATOR_ROWS: ActuatorRow[] = [
  { key: 'sv1', label: 'SV1 · Hélio', short: 'SV1', kind: 'valve', bit: 0 },
  { key: 'sv2', label: 'SV2 · Agita / Purga 1', short: 'SV2', kind: 'valve', bit: 1 },
  { key: 'sv3', label: 'SV3 · Vapor', short: 'SV3', kind: 'valve', bit: 2 },
  { key: 'sv4', label: 'SV4 · Purga 2', short: 'SV4', kind: 'valve', bit: 3 },
  { key: 'sv5', label: 'SV5 · Pistão (N₂)', short: 'SV5', kind: 'valve', bit: 4 },
  { key: 'pump', label: 'Bomba Peristáltica', short: 'BOMBA', kind: 'pump', bit: 5 },
  { key: 'heatU', label: 'Forno 1 · Tubo U', short: 'FORNO 1', kind: 'heat' },
  { key: 'heatF2', label: 'Forno 2 · Atomizador', short: 'FORNO 2', kind: 'heat' },
];

/**
 * Matriz de acionamento por etapa (espelho da MATRIX do backend):
 * 1 = dispositivo explicitamente ON na etapa; 0 = OFF (interlock força LOW).
 */
export const STAGE_MATRIX: Record<StageId, Record<ActuatorKey, 0 | 1>> = {
  T0_DERIV: { sv1: 1, sv2: 0, sv3: 0, sv4: 0, sv5: 1, pump: 1, heatU: 0, heatF2: 1 },
  T1_STAB: { sv1: 1, sv2: 0, sv3: 0, sv4: 0, sv5: 1, pump: 0, heatU: 0, heatF2: 1 },
  T2_RAMPA: { sv1: 1, sv2: 0, sv3: 0, sv4: 0, sv5: 0, pump: 0, heatU: 1, heatF2: 1 },
  T3_PURGA: { sv1: 0, sv2: 1, sv3: 1, sv4: 1, sv5: 0, pump: 0, heatU: 0, heatF2: 0 },
};

/** Retorna o meta de uma etapa (ou null para estados fora de ciclo). */
export function stageMetaOf(state: string): StageMeta | null {
  return (STAGE_META as Record<string, StageMeta>)[state] ?? null;
}
