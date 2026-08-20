import { useEffect, useState } from 'react';
import { StatusBar } from './components/StatusBar';
import { TrendChart } from './components/TrendChart';
import { ManualPanel } from './components/ManualPanel';
import { ConfigPanel } from './components/ConfigPanel';
import { StopButton } from './components/StopButton';
import { TimingDiagram } from './components/TimingDiagram';
import { StageProgress } from './components/StageProgress';
import { ValvePanel } from './components/ValvePanel';
import { useTelemetry } from './store/telemetry';
import { connectTelemetry } from './ws/connection';
import { api } from './api/client';
import { isManualMode } from './lib/phases';

type ViewMode = 'MONITOR' | 'CONFIG';

export function App() {
  const apply = useTelemetry((s) => s.apply);
  const latest = useTelemetry((s) => s.latest);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('MONITOR');

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
            <p>IHM de supervisão e controle · ciclo temporal T₀ → T₃</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="view-toggle" aria-label="Modo de exibição">
            <button
              className={`view-btn${view === 'MONITOR' ? ' active' : ''}`}
              onClick={() => setView('MONITOR')}
              title="Execution Monitor Mode — acompanhar o processo"
            >
              MONITOR
            </button>
            <button
              className={`view-btn${view === 'CONFIG' ? ' active' : ''}`}
              onClick={() => setView('CONFIG')}
              title="Set-Point Configuration Mode — ajustar tempos"
            >
              CONFIG
            </button>
          </div>

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

      {view === 'MONITOR' ? (
        <MonitorView manualMode={manualMode} />
      ) : (
        <ConfigView />
      )}
    </div>
  );
}

/** Execution Monitor Mode: painel completo de acompanhamento do processo. */
function MonitorView({ manualMode }: { manualMode: boolean }) {
  return (
    <main className="monitor">
      <section className="timing-wrap">
        <TimingDiagram />
      </section>

      <section className="widget-strip">
        <StageProgress />
        <ValvePanel enabled={manualMode} />
      </section>

      <section className="grid">
        <div className="col-main">
          <TrendChart />
        </div>
        <aside className="col-side">
          <ManualPanel enabled={manualMode} />
        </aside>
      </section>
    </main>
  );
}

/** Set-Point Configuration Mode: foco na parametrização persistente. */
function ConfigView() {
  return (
    <main className="config-view">
      <section className="config-form-wrap">
        <ConfigPanel />
      </section>
      <section className="config-preview">
        <TimingDiagram />
        <div className="panel config-note">
          <h3>Persistência atômica</h3>
          <p>
            Os set-points das etapas (T₀–T₃) são gravados em <code>params.json</code> com
            backup rotativo. No <b>power-on</b> o sistema restaura o <i>Last Known Good State</i>.
          </p>
        </div>
      </section>
    </main>
  );
}
