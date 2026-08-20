import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { useTelemetry } from './telemetry';

/**
 * Controles manuais guiados pela telemetria.
 *
 * O estado real (telemetria do backend/DAQ) é a fonte de verdade para os
 * botões — evita a dessincronização que ocorria com estado local zerado.
 * Cada ação envia o estado completo derivado do estado REAL, preservando os
 * demais atuadores (nenhum dispositivo é "resetado" por um clique isolado).
 */
export function useManualActuation(enabled: boolean) {
  const latest = useTelemetry((s) => s.latest);
  const latestRef = useRef(latest);
  useEffect(() => {
    latestRef.current = latest;
  }, [latest]);

  // Rascunho local dos sliders de VM (evita "pulo" durante o arrasto).
  const [pwmDraft, setPwmDraft] = useState({ u: 0, f2: 0 });
  const [sent, setSent] = useState(false);

  // Ao entrar em manual, sincroniza o rascunho dos sliders com o estado real.
  useEffect(() => {
    if (enabled && latestRef.current) {
      setPwmDraft({
        u: latestRef.current.pwm.u,
        f2: latestRef.current.pwm.f2,
      });
    }
  }, [enabled]);

  // O indicador "✓ enviado" some após 1,2 s.
  useEffect(() => {
    if (!sent) return;
    const t = setTimeout(() => setSent(false), 1200);
    return () => clearTimeout(t);
  }, [sent]);

  const valves: Record<string, number> = latest?.valves ?? {};
  const pump = latest?.pump ?? 0;

  const send = (next: {
    valves?: Record<string, number>;
    pump?: number;
    pwm?: { u: number; f2: number };
  }) => {
    if (!enabled) return;
    setSent(true);
    api
      .manual({
        valves: next.valves ?? valves,
        pump: next.pump ?? pump,
        pwm: next.pwm ?? pwmDraft,
      })
      .catch((e) => console.error('manual:', e));
  };

  const toggleValve = (key: string) => {
    send({ valves: { ...valves, [key]: valves[key] ? 0 : 1 } });
  };

  const togglePump = () => {
    send({ pump: pump ? 0 : 1 });
  };

  const setPwm = (which: 'u' | 'f2', value: number) => {
    const next = { ...pwmDraft, [which]: value };
    setPwmDraft(next);
    send({ pwm: next });
  };

  return {
    enabled,
    valves,
    pump,
    pwm: pwmDraft,
    sent,
    toggleValve,
    togglePump,
    setPwm,
  };
}
