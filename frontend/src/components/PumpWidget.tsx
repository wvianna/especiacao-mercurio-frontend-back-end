import { useTelemetry } from '../store/telemetry';

/**
 * Widget crítico da Bomba Peristáltica (injeção de TEBS).
 * Destaque visual com animação de fluxo enquanto o motor está acionado.
 */
export function PumpWidget() {
  const t = useTelemetry((s) => s.latest);
  const on = Boolean(t?.pump);
  const inStage = t?.stage.index !== undefined && t.stage.index >= 0;

  return (
    <div className={`panel pump-widget${on ? ' is-running' : ''}`}>
      <div className="panel-head">
        <h2>Bomba Peristáltica</h2>
        <span className={`pump-badge${on ? ' on' : ''}`}>{on ? 'INJETANDO' : 'DESLIGADA'}</span>
      </div>
      <div className="pump-body">
        <div className="pump-rotor">
          <div className="pump-rotor-inner">
            <span className="pump-blade" />
            <span className="pump-blade" />
            <span className="pump-blade" />
          </div>
          <span className="pump-hub" />
        </div>
        <div className="pump-info">
          <div className="pump-line">
            <span>Injeção de TEBS</span>
            <b>{on ? 'ATIVA' : '—'}</b>
          </div>
          <div className="pump-line">
            <span>Fase de derivação</span>
            <b>{inStage && t?.stage.index === 0 ? 'T₀' : '—'}</b>
          </div>
          <div className="pump-line">
            <span>Vazão configurada</span>
            <b>const.</b>
          </div>
        </div>
      </div>
      <div className="pump-foot">
        <span className={`pump-led${on ? ' on' : ''}`} />
        {on
          ? 'Bomba em operação — TEBS sendo injetado no frasco de reação.'
          : 'Bomba parada. Aciona apenas na etapa T₀ (derivação).'}
      </div>
    </div>
  );
}
