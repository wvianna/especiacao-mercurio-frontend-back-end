import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useManualActuation } from './manual';
import { api } from '../api/client';
import { useTelemetry } from './telemetry';
import type { Telemetry } from '../types';

vi.mock('../api/client', () => ({
  api: { manual: vi.fn().mockResolvedValue({ state: 'MANUAL' }) },
}));

function seed(overrides: Partial<Telemetry> = {}): Telemetry {
  const t: Telemetry = {
    ts: 1,
    temp: { t1: -45, t2: 699 },
    sp: { u: 0, f2: 0 },
    pwm: { u: 0, f2: 0 },
    rate_c_per_s: 0,
    state: 'MANUAL',
    valves: { sv1: 0, sv2: 0, sv3: 0, sv4: 0, sv5: 0 },
    pump: 0,
    error_code: 0,
    stage: { id: 'MANUAL', index: -1, elapsed: 0, total: 0, progress: 0 },
    cycle: { elapsed: 0, total: 0, progress: 0 },
    stages: [],
    ...overrides,
  };
  useTelemetry.getState().apply(t);
  return useTelemetry.getState().latest as Telemetry;
}

afterEach(() => {
  vi.clearAllMocks();
  useTelemetry.setState({ latest: null, buffer: [] });
});

describe('useManualActuation', () => {
  it('envia toggle de válvula baseado no estado real da telemetria', () => {
    seed();
    const { result } = renderHook(() => useManualActuation(true));
    act(() => result.current.toggleValve('sv1'));
    expect(api.manual).toHaveBeenCalledTimes(1);
    const [payload] = vi.mocked(api.manual).mock.calls[0];
    expect(payload.valves.sv1).toBe(1);
    expect(payload.valves.sv2).toBe(0);
  });

  it('não envia nada quando desabilitado (modo AUTO)', () => {
    seed();
    const { result } = renderHook(() => useManualActuation(false));
    act(() => result.current.toggleValve('sv1'));
    act(() => result.current.togglePump());
    act(() => result.current.setPwm('u', 128));
    expect(api.manual).not.toHaveBeenCalled();
  });

  it('preserva os demais atuadores ao alternar (sem reset por clique isolado)', () => {
    seed({
      valves: { sv1: 1, sv2: 0, sv3: 0, sv4: 0, sv5: 0 },
      pump: 1,
    });
    const { result } = renderHook(() => useManualActuation(true));
    // clica em SV2: SV1 e a bomba devem permanecer ligados no payload
    act(() => result.current.toggleValve('sv2'));
    const [payload] = vi.mocked(api.manual).mock.calls[0];
    expect(payload.valves.sv1).toBe(1);
    expect(payload.valves.sv2).toBe(1);
    expect(payload.pump).toBe(1);
  });

  it('sincroniza o rascunho dos sliders com o estado real ao entrar em manual', () => {
    seed({ pwm: { u: 128, f2: 255 } });
    const { result, rerender } = renderHook(
      ({ enabled }) => useManualActuation(enabled),
      { initialProps: { enabled: false } },
    );
    expect(result.current.pwm.u).toBe(0);
    act(() => rerender({ enabled: true }));
    expect(result.current.pwm).toEqual({ u: 128, f2: 255 });
  });
});
