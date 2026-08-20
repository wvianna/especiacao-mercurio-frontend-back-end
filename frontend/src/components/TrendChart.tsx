import { useEffect, useRef } from 'react';
import { useTelemetry } from '../store/telemetry';
import type { Sample } from '../store/telemetry';

const COLORS = {
  temp1: '#2fd6e8', // T1 (Forno 1)
  temp2: '#ff8c42', // T2 (Forno 2)
  setpoint: 'rgba(220, 232, 242, 0.65)',
  pwm: '#ff5c5c',
  grid: 'rgba(120, 150, 180, 0.12)',
  axis: 'rgba(160, 190, 215, 0.55)',
  label: '#7d98b2',
};

interface ChartOpts {
  title: string;
  tempColor: string;
  spColor: string;
  pwmColor: string;
  temp: (s: Sample) => number; // °C
  setpoint: (s: Sample) => number; // °C
  pwm: (s: Sample) => number; // % (0–100)
  tempMin: number;
  tempMax: number;
  labels: { temp: string; setpoint: string; pwm: string };
}

/**
 * Desenha um gráfico com eixo esquerdo (°C — temperatura/setpoint) e
 * eixo direito (% — PWM), com legenda das três curvas.
 */
function drawChart(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opts: ChartOpts,
  samples: Sample[],
) {
  const pad = { top: 18, bottom: 22, left: 52, right: 52 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  ctx.clearRect(0, 0, w, h);

  // título
  ctx.fillStyle = COLORS.label;
  ctx.font = '600 11px "JetBrains Mono", monospace';
  ctx.textBaseline = 'top';
  ctx.fillText(opts.title.toUpperCase(), pad.left, 2);

  // fundo
  ctx.fillStyle = 'rgba(8, 12, 18, 0.6)';
  ctx.fillRect(pad.left, pad.top, plotW, plotH);

  const yTemp = (v: number) =>
    pad.top + ((opts.tempMax - v) / (opts.tempMax - opts.tempMin)) * plotH;
  const yPct = (p: number) => pad.top + ((100 - p) / 100) * plotH;

  // grade + eixo esquerdo (temperatura °C)
  ctx.font = '400 9px "JetBrains Mono", monospace';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (plotH / 4) * i;
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + plotW, y);
    ctx.stroke();
    const val = opts.tempMax - ((opts.tempMax - opts.tempMin) * i) / 4;
    ctx.fillStyle = COLORS.axis;
    ctx.textAlign = 'right';
    ctx.fillText(`${val.toFixed(0)} °C`, pad.left - 6, y);
  }

  // eixo direito (PWM %)
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (plotH / 4) * i;
    const p = 100 - (100 * i) / 4;
    ctx.fillStyle = COLORS.axis;
    ctx.textAlign = 'left';
    ctx.fillText(`${p.toFixed(0)} %`, pad.left + plotW + 6, y);
  }

  const n = samples.length;
  if (n < 2) return;
  const x = (i: number) => pad.left + (i / (n - 1)) * plotW;

  const plot = (
    values: (s: Sample) => number,
    yFn: (v: number) => number,
    color: string,
    dash: number[] = [],
    width = 1.5,
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < n; i++) {
      const v = values(samples[i]);
      if (!Number.isFinite(v)) continue;
      if (!started) {
        ctx.moveTo(x(i), yFn(v));
        started = true;
      } else {
        ctx.lineTo(x(i), yFn(v));
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // setpoint (°C, tracejado) → temperatura (°C) → pwm (%, eixo direito)
  plot(opts.setpoint, yTemp, opts.spColor, [4, 3], 1.2);
  plot(opts.temp, yTemp, opts.tempColor, [], 1.6);
  plot(opts.pwm, yPct, opts.pwmColor, [], 1.6);

  // legenda
  let lx = pad.left;
  ctx.font = '400 9px "JetBrains Mono", monospace';
  ctx.textBaseline = 'middle';
  const legend = [
    { color: opts.tempColor, label: opts.labels.temp, dash: false },
    { color: opts.spColor, label: opts.labels.setpoint, dash: true },
    { color: opts.pwmColor, label: opts.labels.pwm, dash: false },
  ];
  for (const it of legend) {
    ctx.strokeStyle = it.color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash(it.dash ? [4, 3] : []);
    ctx.beginPath();
    ctx.moveTo(lx, h - 10);
    ctx.lineTo(lx + 14, h - 10);
    ctx.stroke();
    ctx.setLineDash([]);
    lx += 18;
    ctx.fillStyle = it.color;
    const tw = ctx.measureText(it.label).width;
    ctx.fillText(it.label, lx, h - 10);
    lx += tw + 16;
  }
}

/** Gráficos de tendência por forno (temperatura/setpoint °C × PWM %). */
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

      const gap = 16;
      const chartH = (h - gap) / 2;

      drawChart(
        ctx,
        w,
        chartH,
        {
          title: 'Forno 1 · Tubo U',
          tempColor: COLORS.temp1,
          spColor: COLORS.setpoint,
          pwmColor: COLORS.pwm,
          temp: (s) => s.t1,
          setpoint: (s) => s.spU,
          pwm: (s) => (s.pwmU / 255) * 100,
          tempMin: -80,
          tempMax: 280,
          labels: { temp: 'T1 °C', setpoint: 'SP °C', pwm: 'PWM %' },
        },
        samples,
      );

      ctx.save();
      ctx.translate(0, chartH + gap);
      drawChart(
        ctx,
        w,
        chartH,
        {
          title: 'Forno 2 · Atomizador',
          tempColor: COLORS.temp2,
          spColor: COLORS.setpoint,
          pwmColor: COLORS.pwm,
          temp: (s) => s.t2,
          setpoint: (s) => s.spF2,
          pwm: (s) => (s.pwmF2 / 255) * 100,
          tempMin: -20,
          tempMax: 820,
          labels: { temp: 'T2 °C', setpoint: 'SP °C', pwm: 'PWM %' },
        },
        samples,
      );
      ctx.restore();

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [samples]);

  return (
    <div className="panel trend-panel">
      <div className="panel-head">
        <h2>Gráficos de Tendência — Fornos</h2>
        <span className="panel-sub">
          {samples.length} amostras · eixo esq. °C · eixo dir. %
        </span>
      </div>
      <canvas ref={ref} className="trend-canvas" />
    </div>
  );
}
