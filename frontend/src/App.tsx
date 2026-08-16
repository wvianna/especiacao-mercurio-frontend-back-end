import { useEffect, useState } from 'react';
import { StatusBar } from './components/StatusBar';
import { Synoptic } from './components/Synoptic';
import { TrendChart } from './components/TrendChart';
import { ManualPanel } from './components/ManualPanel';
import { ConfigPanel } from './components/ConfigPanel';
import { StopButton } from './components/StopButton';
import { useTelemetry } from './store/telemetry';
import { connectTelemetry } from './ws/connection';
import { api } from './api/client';
import { isManualMode } from './lib/phases';

export function App() {
  const apply = useTelemetry((s) => s.apply);
  const latest = useTelemetry((s) => s.latest);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const dispose = connectTelemetry(apply, setConnected);
    return dispose;
  }, [apply]);

  const manualMode = latest ? isManualMode(latest.state) : false;

  const run = (fn: () => Promise<unknown>, label: string) => {
    setBusy(label);
    fn()
      .catch((e) => console.error(label, e))
      .finally(() => setBusy(null));
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">Hg</span>
          <div>
            <h1>ESPECIAÇÃO DE MERCÚRIO</h1>
            <p>IHM de supervisão e controle · rampa tubo U −50 → 230 °C</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="mode-toggle" aria-label="Modo de operação">
            <button
              className={`mode-btn${!manualMode ? ' active' : ''}`}
              disabled={!!busy}
              onClick={() => run(() => api.setMode('auto'), 'mode')}
            >
              AUTO
            </button>
            <button
              className={`mode-btn${manualMode ? ' active' : ''}`}
              disabled={!!busy}
              onClick={() => run(() => api.setMode('manual'), 'mode')}
            >
              MANUAL
            </button>
          </div>
          <button
            className="run-btn"
            disabled={!!busy || manualMode}
            onClick={() => run(api.start, 'start')}
          >
            INICIAR
          </button>
          <button className="run-btn" disabled={!!busy} onClick={() => run(api.stop, 'stop')}>
            PARAR
          </button>
          <StopButton />
        </div>
      </header>

      <StatusBar connected={connected} />

      <main className="grid">
        <div className="col-main">
          <Synoptic />
          <TrendChart />
        </div>
        <aside className="col-side">
          <ManualPanel enabled={manualMode} />
          <ConfigPanel />
        </aside>
      </main>
    </div>
  );
}
