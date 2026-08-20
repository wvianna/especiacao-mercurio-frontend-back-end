import { useTelemetry } from '../store/telemetry';
import { STAGE_META, STAGE_ORDER } from '../lib/stages';

function fmtClock(s: number): string {
  const m = Math.floor(Math.max(0, s) / 60);
  const sec = Math.floor(Math.max(0, s) % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/** Barra de progresso da etapa com contagem regressiva para a próxima transição. */
export function StageProgress() {
  const t = useTelemetry((s) => s.latest);

  if (!t || t.stage.index < 0) {
    return (
      <div className="panel stage-panel is-idle">
        <div className="panel-head">
          <h2>Progresso da Etapa</h2>
          <span className="panel-sub">aguardando ciclo</span>
        </div>
        <div className="stage-idle">
          <span className="stage-empty-dot" />
          Em <b>SAFE STATE</b> — pressione <b>INICIAR</b> para executar o ciclo T₀ → T₃.
        </div>
      </div>
    );
  }

  const st = t.stage;
  const meta = STAGE_META[st.id as keyof typeof STAGE_META];
  const remaining = st.total - st.elapsed;
  const pct = Math.min(100, st.progress * 100);

  return (
    <div className="panel stage-panel">
      <div className="panel-head">
        <h2>Progresso da Etapa</h2>
        <span className="panel-sub">
          ciclo {fmtClock(t.cycle.elapsed)} / {fmtClock(t.cycle.total)}
        </span>
      </div>

      <div className="stage-segments" aria-hidden>
        {STAGE_ORDER.map((id, i) => (
          <span
            key={id}
            className={`stage-seg${i === st.index ? ' is-cur' : ''}${i < st.index ? ' is-done' : ''}`}
          />
        ))}
      </div>

      <div className="stage-row">
        <div className="stage-name">
          <span className="stage-short">{meta?.short ?? st.id}</span>
          <span className="stage-title">{meta?.name ?? st.id}</span>
        </div>
        <div className="stage-nums">
          <b>{fmtClock(st.elapsed)}</b>
          <span>/ {fmtClock(st.total)}</span>
        </div>
      </div>

      <div className="stage-track">
        <div className="stage-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="stage-count">
        <span>próxima transição em</span>
        <b className="stage-count-num">{fmtClock(remaining)}</b>
        <span className="stage-pct">{pct.toFixed(0)}%</span>
      </div>
    </div>
  );
}
