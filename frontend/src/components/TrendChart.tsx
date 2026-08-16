import { useEffect, useRef } from 'react';
import { useTelemetry } from '../store/telemetry';
import type { Sample } from '../store/telemetry';

const COLORS = {
  t1: '#35d0e0',
  t1Sp: 'rgba(53, 208, 224, 0.45)',
  t2: '#ff8c42',
  t2Sp: 'rgba(255, 140, 66, 0.45)',
  rate: '#c792ea',
  pwmU: '#ffd166',
  pwmF2: '#ff5c5c',
  grid: 'rgba(120, 150, 180, 0.12)',
  axis: 'rgba(160, 190, 215, 0.5)',
  label: '#7f9bb5',
};

interface SeriesOpts {
  label: string;
  color: string;
  values: (s: Sample) => number;
}

function drawChart(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  title: string,
  series: SeriesOpts[],
  samples: Sample[],
  yMin: number,
  yMax: number,
  pad = { top: 16, right: 8, bottom: 18, left: 42 },
) {
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  ctx.clearRect(0, 0, w, h);

  // título
  ctx.fillStyle = COLORS.label;
  ctx.font = '600 11px "JetBrains Mono", monospace';
  ctx.textBaseline = 'top';
  ctx.fillText(title.toUpperCase(), pad.left, 2);

  // fundo
  ctx.fillStyle = 'rgba(8, 12, 18, 0.6)';
  ctx.fillRect(pad.left, pad.top, plotW, plotH);

  // grade horizontal
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (plotH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + plotW, y);
    ctx.stroke();
    const val = yMax - ((yMax - yMin) * i) / 4;
    ctx.fillStyle = COLORS.axis;
    ctx.font = '400 9px "JetBrains Mono", monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    ctx.fillText(val.toFixed(yMax - yMin < 20 ? 1 : 0), pad.left - 4, y);
    ctx.textAlign = 'left';
  }

  const n = samples.length;
  if (n < 2) return;

  const x = (i: number) => pad.left + (i / (n - 1)) * plotW;
  const y = (v: number) => pad.top + ((yMax - v) / (yMax - yMin)) * plotH;

  for (const s of series) {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < n; i++) {
      const v = s.values(samples[i]);
      if (!Number.isFinite(v)) continue;
      if (!started) {
        ctx.moveTo(x(i), y(v));
        started = true;
      } else {
        ctx.lineTo(x(i), y(v));
      }
    }
    ctx.stroke();
  }

  // legenda
  let lx = pad.left + 4;
  ctx.font = '400 9px "JetBrains Mono", monospace';
  ctx.textBaseline = 'middle';
  for (const s of series) {
    const label = `${s.label}`;
    ctx.fillStyle = s.color;
    const tw = ctx.measureText(label).width;
    ctx.fillText(label, lx, h - 8);
    lx += tw + 12;
  }
}

export function TrendChart() {
  const ref = useRef<HTMLCanvasElement>(null);
  const samples = useTelemetry((s) => s.buffer);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const third = h / 3;

      drawChart(
        ctx,
        w,
        third,
        'Temperatura — VP × SP (°C)',
        [
          { label: 'T1 VP', color: COLORS.t1, values: (s) => s.t1 },
          { label: 'T1 SP', color: COLORS.t1Sp, values: (s) => s.spU },
          { label: 'T2 VP', color: COLORS.t2, values: (s) => s.t2 },
          { label: 'T2 SP', color: COLORS.t2Sp, values: (s) => s.spF2 },
        ],
        samples,
        -60,
        760,
      );

      drawChart(
        ctx,
        w,
        third,
        'Coeficiente de Aquecimento (°C/s)',
        [{ label: 'taxa', color: COLORS.rate, values: (s) => s.rate }],
        samples,
        0,
        1,
      );

      drawChart(
        ctx,
        w,
        third,
        'PWM — Resistências (0–255)',
        [
          { label: 'forno1', color: COLORS.pwmU, values: (s) => s.pwmU },
          { label: 'forno2', color: COLORS.pwmF2, values: (s) => s.pwmF2 },
        ],
        samples,
        0,
        255,
      );

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [samples]);

  return (
    <div className="panel trend-panel">
      <div className="panel-head">
        <h2>Gráficos de Tendência</h2>
        <span className="panel-sub">{samples.length} amostras</span>
      </div>
      <canvas ref={ref} className="trend-canvas" />
    </div>
  );
}
