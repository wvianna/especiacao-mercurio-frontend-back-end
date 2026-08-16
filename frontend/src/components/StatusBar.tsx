import { useTelemetry } from '../store/telemetry';

const PHASE_LABEL: Record<string, string> = {
  SAFE: 'SAFE STATE',
  T0_DERIV: 'T₀ · Derivação / Criofocalização',
  T1_STAB: 'T₁ · Estabilização Térmica',
  T2_RAMPA: 'T₂ · Rampa de Aquecimento',
  T3_PURGA: 'T₃ · Purga Total',
  MANUAL: 'MANUAL',
};

/** Barra de status com indicadores de fase, temperaturas, taxa e alertas. */
export function StatusBar({ connected }: { connected: boolean }) {
  const latest = useTelemetry((s) => s.latest);

  if (!latest) {
    return (
      <header className="status-bar">
        <span className="state-badge state-safe">aguardando telemetria</span>
        <span className={`link-dot ${connected ? 'ok' : 'down'}`}>
          {connected ? 'WS conectado' : 'WS desconectado'}
        </span>
      </header>
    );
  }

  const stateLabel = PHASE_LABEL[latest.state] ?? latest.state;
  const isSafe = latest.state === 'SAFE';
  const hasError = latest.error_code !== 0;
  const disconnected = !connected;

  return (
    <header className="status-bar">
      <span className={`state-badge ${isSafe ? 'state-safe' : 'state-run'}`}>
        {stateLabel}
      </span>
      <span className="stat">
        T1 <b>{latest.temp.t1.toFixed(1)} °C</b>
      </span>
      <span className="stat">
        T2 <b>{latest.temp.t2.toFixed(1)} °C</b>
      </span>
      <span className="stat">
        SP U <b>{latest.sp.u.toFixed(1)} °C</b>
      </span>
      <span className="stat">
        SP F2 <b>{latest.sp.f2.toFixed(0)} °C</b>
      </span>
      <span className="stat">
        Taxa <b>{latest.rate_c_per_s.toFixed(3)} °C/s</b>
      </span>
      <span className="stat">
        PWM <b>{latest.pwm.u} / {latest.pwm.f2}</b>
      </span>
      <span className={`link-dot ${connected ? 'ok' : 'down'}`}>
        {connected ? 'WS ok' : 'WS ↓'}
      </span>
      {(hasError || disconnected) && (
        <span className="alert-banner">
          {disconnected ? '⚠ comunicação perdida' : `⚠ erro DAQ (${latest.error_code})`}
        </span>
      )}
    </header>
  );
}
