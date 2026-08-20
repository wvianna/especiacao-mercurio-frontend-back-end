import { useTelemetry } from '../store/telemetry';
import type { Telemetry } from '../types';
import {
  ACTUATOR_ROWS,
  STAGE_MATRIX,
  STAGE_META,
  STAGE_ORDER,
  type StageId,
} from '../lib/stages';
import { phaseLabel } from '../lib/phases';

const W = 1040;
const H = 372;
const LABEL_W = 156;
const HEADER_H = 58;
const ROW_H = 28;
const PLOT_X = LABEL_W;
const PLOT_W = W - LABEL_W - 6;

function fmtTime(s: number): string {
  if (s < 0) return '0s';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : `${sec.toFixed(0)}s`;
}

interface StageSlice {
  id: StageId;
  duration: number;
  x: number;
  width: number;
}

function buildSlices(t: Telemetry | null): StageSlice[] {
  const durations: Record<string, number> = {};
  if (t?.stages?.length === STAGE_ORDER.length) {
    for (const s of t.stages) durations[s.id] = s.duration;
  }
  // O ciclo total só é > 0 durante a execução; no SAFE usamos a soma dos
  // set-points (durações planejadas) para manter o diagrama estável.
  const sum = STAGE_ORDER.reduce((acc, id) => acc + (durations[id] ?? 0), 0);
  const total = sum > 0 ? sum : t?.cycle?.total ?? 0;

  if (total <= 0) {
    // sem dados ainda: ciclo nominal provisório
    const w = PLOT_W / STAGE_ORDER.length;
    return STAGE_ORDER.map((id, i) => ({ id, duration: 60, x: i * w, width: w }));
  }

  let acc = 0;
  return STAGE_ORDER.map((id) => {
    const duration = durations[id] ?? total / STAGE_ORDER.length;
    const slice = {
      id,
      duration,
      x: acc,
      width: Math.max(4, (duration / total) * PLOT_W),
    };
    acc += slice.width;
    return slice;
  });
}

function matrixValue(key: string, stage: StageId): 0 | 1 {
  const row = STAGE_MATRIX[stage];
  if (!row) return 0;
  return (row as Record<string, 0 | 1>)[key] ?? 0;
}

/** Estado ATUAL (telemetria) de um dispositivo: true = ligado. */
function deviceOn(t: Telemetry | null, key: string): boolean {
  if (!t) return false;
  if (key === 'pump') return Boolean(t.pump);
  if (key === 'heatU') return (t.pwm?.u ?? 0) > 0;
  if (key === 'heatF2') return (t.pwm?.f2 ?? 0) > 0;
  return Boolean(t.valves?.[key]);
}

/**
 * Diagrama de Tempos (Gantt): faixas T0–T3 (set-points), linhas de atuadores
 * e cursor de progresso real ("actual") com rótulo da etapa vigente.
 */
export function TimingDiagram() {
  const t = useTelemetry((s) => s.latest);
  const slices = buildSlices(t);
  // Eixo de tempo baseado nos set-points (estável em qualquer estado).
  const total = slices.reduce((a, s) => a + s.duration, 0);
  const cursorX = PLOT_X + (t?.cycle.progress ?? 0) * PLOT_W;
  const curStage = t ? STAGE_ORDER.findIndex((id) => id === t.state) : -1;

  const rowBottom = HEADER_H + ACTUATOR_ROWS.length * ROW_H;
  const ticks = Array.from({ length: 6 }, (_, i) => (i / 5) * PLOT_W);

  return (
    <div className="panel timing-panel">
      <div className="panel-head">
        <h2>Diagrama de Tempos</h2>
        <div className="timing-legend">
          <span className="tl-key tl-key-set">set-point · planejado</span>
          <span className="tl-key tl-key-act">actual · progresso real</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="timing-svg" role="img" aria-label="Diagrama de tempos do ciclo">
        {/* coluna de rótulos + LED de status (vermelho = ligado, cinza = desligado) */}
        {ACTUATOR_ROWS.map((r, i) => {
          const y = HEADER_H + i * ROW_H;
          const ledOn = deviceOn(t, r.key);
          return (
            <g key={r.key}>
              <text x={LABEL_W - 16} y={y + ROW_H / 2 + 4} textAnchor="end" className={`tl-rowlabel tl-${r.kind}`}>
                {r.label}
              </text>
              <rect
                x={LABEL_W - 12}
                y={y + ROW_H / 2 - 4}
                width={8}
                height={8}
                rx={2}
                className={`tl-led${ledOn ? ' is-on' : ''}`}
              />
              <rect x={4} y={y + 4} width={4} height={ROW_H - 8} className={`tl-sw-${r.kind}`} />
            </g>
          );
        })}

        {/* faixas de etapa (set-points de duração) */}
        {slices.map((s, i) => (
          <g key={s.id}>
            <rect
              x={PLOT_X + s.x}
              y={4}
              width={s.width - 1}
              height={HEADER_H - 10}
              className={`tl-band${i === curStage ? ' is-cur' : ''}`}
            />
            <text x={PLOT_X + s.x + s.width / 2} y={HEADER_H / 2 - 8} textAnchor="middle" className="tl-band-short">
              {STAGE_META[s.id].short}
            </text>
            <text x={PLOT_X + s.x + s.width / 2} y={HEADER_H / 2 + 8} textAnchor="middle" className="tl-band-name">
              {STAGE_META[s.id].name}
            </text>
            <text x={PLOT_X + s.x + s.width / 2} y={HEADER_H / 2 + 22} textAnchor="middle" className="tl-band-dur">
              {fmtTime(s.duration)}
            </text>
          </g>
        ))}

        {/* linhas de atuadores (matriz de acionamento) */}
        {ACTUATOR_ROWS.map((r, i) => {
          const y = HEADER_H + i * ROW_H;
          return (
            <g key={r.key}>
              <line x1={PLOT_X} y1={y} x2={PLOT_X + PLOT_W} y2={y} className="tl-rowline" />
              {slices.map((s) => (
                <rect
                  key={`${r.key}-${s.id}`}
                  x={PLOT_X + s.x + 2}
                  y={y + 4}
                  width={Math.max(0, s.width - 4)}
                  height={ROW_H - 8}
                  rx={4}
                  className={`tl-cell${matrixValue(r.key, s.id) ? ` is-on tl-${r.kind}` : ''}`}
                />
              ))}
            </g>
          );
        })}

        {/* eixo de tempo */}
        <line x1={PLOT_X} y1={rowBottom} x2={PLOT_X + PLOT_W} y2={rowBottom} className="tl-axis" />
        {ticks.map((tx, i) => (
          <g key={i}>
            <line x1={PLOT_X + tx} y1={rowBottom} x2={PLOT_X + tx} y2={rowBottom + 6} className="tl-axis" />
            <text x={PLOT_X + tx} y={rowBottom + 18} textAnchor="middle" className="tl-time">
              {fmtTime((i / 5) * total)}
            </text>
          </g>
        ))}

        {/* cursor "actual" (progresso real) */}
        {t && t.cycle.progress > 0 && (
          <g className="tl-cursor">
            <line x1={cursorX} y1={4} x2={cursorX} y2={rowBottom} />
            <polygon points={`${cursorX - 5},4 ${cursorX + 5},4 ${cursorX},10`} />
            <text x={cursorX} y={rowBottom + 18} textAnchor="middle" className="tl-time tl-cursor-t">
              {t.stage.index >= 0 ? phaseLabel(t.state) : ''}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
