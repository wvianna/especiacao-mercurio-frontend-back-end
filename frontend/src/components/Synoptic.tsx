import { useTelemetry } from '../store/telemetry';
import type { Telemetry } from '../types';
import { phaseLabel } from '../lib/phases';

function useActives() {
  const latest = useTelemetry((s) => s.latest);
  const t = latest;
  const active = (key: keyof Telemetry['valves']) => Boolean(t?.valves[key]);
  const pump = Boolean(t?.pump);
  const heatU = (t?.pwm.u ?? 0) > 0;
  const heatF2 = (t?.pwm.f2 ?? 0) > 0;
  const cupUp = active('sv5'); // SV5 acionado = copo levantado
  return { t, active, pump, heatU, heatF2, cupUp };
}

function Node({
  x,
  y,
  w,
  h,
  label,
  sub,
  on,
  hot,
  kind,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub?: string;
  on?: boolean;
  hot?: boolean;
  kind: 'reactor' | 'dryer' | 'furnace' | 'detector' | 'valve' | 'pump';
}) {
  const cls = [
    'syn-node',
    `syn-${kind}`,
    on ? 'is-on' : '',
    hot ? 'is-hot' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <g className={cls}>
      <rect x={x} y={y} width={w} height={h} rx={kind === 'detector' ? 12 : 6} />
      <text x={x + w / 2} y={y + h / 2 - 4} textAnchor="middle" className="syn-label">
        {label}
      </text>
      {sub ? (
        <text x={x + w / 2} y={y + h / 2 + 10} textAnchor="middle" className="syn-sub">
          {sub}
        </text>
      ) : null}
    </g>
  );
}

function Pipe({ d, on }: { d: string; on?: boolean }) {
  return <path d={d} className={`syn-pipe${on ? ' is-flow' : ''}`} fill="none" />;
}

function Valve({
  x,
  y,
  label,
  on,
}: {
  x: number;
  y: number;
  label: string;
  on?: boolean;
}) {
  return (
    <g className={`syn-valve${on ? ' is-on' : ''}`}>
      <path
        d={`M ${x - 10} ${y} L ${x + 10} ${y} L ${x} ${y - 12} Z`}
        fill="none"
        strokeWidth="2"
      />
      <circle cx={x} cy={y} r="4" />
      <text x={x} y={y + 26} textAnchor="middle" className="syn-tag">
        {label}
      </text>
    </g>
  );
}

/** Sinótico do processo: fluxograma animado (azul = fluxo, vermelho = resistência). */
export function Synoptic() {
  const { t, active, pump, heatU, heatF2, cupUp } = useActives();

  const flowHe = active('sv1'); // entrada de hélio
  const flowReactor = flowHe || pump; // agitação / TEBS
  const flowToTube = active('sv3') === false && flowReactor; // SV3 pass-through
  const purge1 = active('sv2');
  const purge2 = active('sv4');

  return (
    <div className="panel synoptic-panel">
      <div className="panel-head">
        <h2>Sinótico do Processo</h2>
        <span className="syn-readout">
          <span className={`phase-chip ${t?.state === 'SAFE' ? 'state-safe' : 'state-run'}`}>
            {t ? phaseLabel(t.state) : '—'}
          </span>
          <span className="stat">
            T1 <b>{t ? `${t.temp.t1.toFixed(1)} °C` : '—'}</b>
          </span>
          <span className="stat">
            T2 <b>{t ? `${t.temp.t2.toFixed(1)} °C` : '—'}</b>
          </span>
          <span className="stat">
            Taxa <b>{t ? `${t.rate_c_per_s.toFixed(3)} °C/s` : '—'}</b>
          </span>
          <span className={`cup-ind ${cupUp ? 'up' : 'down'}`}>
            Copo N₂ {cupUp ? 'LEVANTADO' : 'ABAIXADO'}
          </span>
        </span>
      </div>
      <svg viewBox="0 0 1040 300" className="synoptic-svg" role="img" aria-label="Fluxograma do processo">
        {/* tubulações principais */}
        <Pipe d="M 200 140 H 290" on={flowHe} />
        <Pipe d="M 320 140 H 400" on={flowToTube} />
        <Pipe d="M 500 140 H 640" on={heatU} />
        <Pipe d="M 730 140 H 850" on={heatF2} />
        <Pipe d="M 200 140 V 90" on={flowReactor} />
        <Pipe d="M 500 140 V 250" on={purge1} />
        <Pipe d="M 260 250 H 500" on={purge2} />

        {/* frasco de reação + TEBS */}
        <Node x={140} y={120} w={120} h={80} label="FRASCO" sub="reação" kind="reactor" on={flowReactor} />
        <Node x={150} y={40} w={100} h={40} label="BOMBA" sub="TEBS" kind="pump" on={pump} />

        {/* SV1 - hélio */}
        <Valve x={245} y={140} label="SV1 · He" on={active('sv1')} />

        {/* náfion */}
        <Node x={290} y={120} w={100} h={60} label="NÁFION" sub="dessecador" kind="dryer" />

        {/* SV3 */}
        <Valve x={390} y={140} label="SV3" on={!active('sv3')} />

        {/* tubo U + forno 1 + copo */}
        <Node x={450} y={110} w={120} h={60} label="TUBO U" sub="Forno 1" kind="furnace" hot={heatU} />
        <Node x={470} y={205} w={80} h={40} label="COPO N₂" kind="pump" on={cupUp} />

        {/* forno 2 */}
        <Node x={640} y={120} w={100} h={60} label="FORNO 2" sub="atomizador" kind="furnace" hot={heatF2} />

        {/* lumex */}
        <Node x={850} y={110} w={150} h={80} label="LUMEX" sub="detector" kind="detector" />

        {/* SV2 purga 1 / SV4 purga 2 */}
        <Valve x={500} y={250} label="SV2 · Purga1" on={purge1} />
        <Valve x={260} y={250} label="SV4 · Purga2" on={purge2} />

        {/* legenda */}
        <g className="syn-legend">
          <circle cx={60} cy={280} r={5} className="syn-legend-flow" />
          <text x={72} y={284} className="syn-tag">fluxo hélio/vapor</text>
          <circle cx={230} cy={280} r={5} className="syn-legend-hot" />
          <text x={242} y={284} className="syn-tag">resistência ativa</text>
        </g>
      </svg>
    </div>
  );
}
