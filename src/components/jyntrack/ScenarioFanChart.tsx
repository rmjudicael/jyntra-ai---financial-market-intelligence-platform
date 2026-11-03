import React, { useMemo, useState } from 'react';
import type { JyntrackScenario, JyntrackScenarioId } from '../../types/jyntrack';

export const SCENARIO_COLORS: Record<JyntrackScenarioId, { stroke: string; fill: string; text: string; chip: string }> = {
  continuation: { stroke: '#22d3ee', fill: 'rgba(34,211,238,0.18)', text: 'text-cyan-500', chip: 'bg-cyan-500/10 border-cyan-500/30' },
  reversal: { stroke: '#fb7185', fill: 'rgba(251,113,133,0.16)', text: 'text-rose-400', chip: 'bg-rose-500/10 border-rose-500/30' },
  consolidation: { stroke: '#94a3b8', fill: 'rgba(148,163,184,0.14)', text: 'text-slate-400', chip: 'bg-slate-500/10 border-slate-500/30' },
  vol_shock: { stroke: '#f59e0b', fill: 'rgba(245,158,11,0.16)', text: 'text-amber-500', chip: 'bg-amber-500/10 border-amber-500/30' },
  correlation_break: { stroke: '#a78bfa', fill: 'rgba(167,139,250,0.16)', text: 'text-violet-400', chip: 'bg-violet-500/10 border-violet-500/30' },
  event_reaction: { stroke: '#34d399', fill: 'rgba(52,211,153,0.16)', text: 'text-emerald-400', chip: 'bg-emerald-500/10 border-emerald-500/30' },
};

function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  const digits = abs >= 1000 ? 2 : abs >= 10 ? 2 : abs >= 1 ? 4 : 6;
  return value.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: Math.min(digits, abs >= 1000 ? 0 : 2) });
}

interface ScenarioFanChartProps {
  scenarios: JyntrackScenario[];
  selected: JyntrackScenarioId;
  horizon: number;
  labels: Record<JyntrackScenarioId, string>;
  baselinePrice: number;
}

export const ScenarioFanChart: React.FC<ScenarioFanChartProps> = ({
  scenarios,
  selected,
  horizon,
  labels,
  baselinePrice,
}) => {
  const [hoverStep, setHoverStep] = useState<number | null>(null);
  const available = scenarios.filter((scenario) => scenario.available && scenario.bands.length > 1 && scenario.terminal);
  const active = available.find((scenario) => scenario.id === selected) || available[0];

  const domain = useMemo(() => {
    const values: number[] = [baselinePrice];
    for (const scenario of available) {
      for (const band of scenario.bands) {
        values.push(band.p05, band.p95);
      }
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = Math.max((max - min) * 0.08, baselinePrice * 0.002);
    return { min: min - pad, max: max + pad };
  }, [available, baselinePrice]);

  if (!active) {
    return (
      <div className="h-64 rounded-xl border border-dashed border-slate-700/80 flex items-center justify-center text-xs text-slate-500">
        —
      </div>
    );
  }

  const activeBands = active.bands;
  const maxStep = Math.max(1, activeBands.length - 1);
  const toX = (step: number) => (step / maxStep) * 100;
  const toY = (price: number) => 100 - ((price - domain.min) / Math.max(1e-9, domain.max - domain.min)) * 100;
  const areaPath = (upper: number[], lower: number[]) => {
    const top = upper.map((price, step) => `${toX(step).toFixed(3)},${toY(price).toFixed(3)}`).join(' L ');
    const bottom = lower
      .map((price, step) => `${toX(lower.length - 1 - step).toFixed(3)},${toY(lower[lower.length - 1 - step]).toFixed(3)}`)
      .join(' L ');
    return `M ${top} L ${bottom} Z`;
  };
  const linePath = (prices: number[]) =>
    prices.map((price, step) => `${step === 0 ? 'M' : 'L'} ${toX(step).toFixed(3)} ${toY(price).toFixed(3)}`).join(' ');

  const activeColor = SCENARIO_COLORS[active.id];
  const hoverBand = hoverStep == null ? null : activeBands[Math.min(hoverStep, activeBands.length - 1)];
  const hoverDate = hoverBand ? new Date(hoverBand.timestamp) : null;

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    setHoverStep(Math.round(ratio * maxStep));
  };

  const yTicks = [domain.max, domain.max - (domain.max - domain.min) / 2, domain.min];

  return (
    <div className="space-y-3">
      <div
        className="relative h-64 sm:h-80 w-full select-none cursor-crosshair"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverStep(null)}
        onTouchStart={(event) => {
          const touch = event.touches[0];
          if (!touch) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const ratio = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
          setHoverStep(Math.round(ratio * maxStep));
        }}
        onTouchMove={(event) => {
          const touch = event.touches[0];
          if (!touch) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const ratio = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
          setHoverStep(Math.round(ratio * maxStep));
        }}
      >
        <div className="absolute inset-y-0 left-0 right-10 sm:right-14">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={labels[active.id]}>
            {[0, 25, 50, 75, 100].map((y) => (
              <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="currentColor" className="text-slate-700/50" strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
            ))}

            {available
              .filter((scenario) => scenario.id !== active.id)
              .map((scenario) => (
                <path
                  key={`median-${scenario.id}`}
                  d={linePath(scenario.bands.map((band) => band.p50))}
                  fill="none"
                  stroke={SCENARIO_COLORS[scenario.id].stroke}
                  strokeWidth="1"
                  strokeOpacity="0.35"
                  vectorEffect="non-scaling-stroke"
                />
              ))}

            <path d={areaPath(activeBands.map((band) => band.p95), activeBands.map((band) => band.p05))} fill={activeColor.fill} opacity="0.55" />
            <path d={areaPath(activeBands.map((band) => band.p75), activeBands.map((band) => band.p25))} fill={activeColor.fill} opacity="0.75" />
            <path d={linePath(activeBands.map((band) => band.p50))} fill="none" stroke={activeColor.stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" />

            <line
              x1="0"
              y1={toY(baselinePrice)}
              x2="100"
              y2={toY(baselinePrice)}
              stroke="currentColor"
              className="text-slate-500"
              strokeWidth="0.6"
              strokeDasharray="2 2"
              vectorEffect="non-scaling-stroke"
            />

            {hoverStep != null && (
              <>
                <line x1={toX(hoverStep)} y1="0" x2={toX(hoverStep)} y2="100" stroke="currentColor" className="text-slate-400" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
                <circle cx={toX(hoverStep)} cy={toY(activeBands[Math.min(hoverStep, activeBands.length - 1)].p50)} r="1.2" fill={activeColor.stroke} vectorEffect="non-scaling-stroke" />
              </>
            )}
          </svg>
        </div>

        {/* Fixed-size price labels, never stretched by the responsive SVG */}
        <div className="absolute inset-y-0 right-0 w-10 sm:w-14 flex flex-col justify-between py-0 text-[10px] font-mono text-slate-500 text-right">
          {yTicks.map((tick, index) => (
            <span key={index} className="leading-none">{formatPrice(tick)}</span>
          ))}
        </div>

        {hoverBand && (
          <div
            className="pointer-events-none absolute top-2 z-10 rounded-lg border border-slate-700 bg-slate-950/95 px-2.5 py-2 text-[10px] font-mono text-slate-200 shadow-xl"
            style={{
              left: `${Math.min(78, Math.max(2, toX(hoverBand.step)))}%`,
            }}
          >
            <div className="text-slate-400">{labels[active.id]} · T+{hoverBand.step}</div>
            {hoverDate && <div className="text-slate-500">{hoverDate.toLocaleDateString()}</div>}
            <div className="mt-1 text-cyan-400">P50 {formatPrice(hoverBand.p50)}</div>
            <div className="text-slate-400">P05 {formatPrice(hoverBand.p05)}</div>
            <div className="text-slate-400">P95 {formatPrice(hoverBand.p95)}</div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pr-10 sm:pr-14">
        <span>T+0</span>
        <span>T+{Math.round(horizon / 2)}</span>
        <span>T+{horizon}</span>
      </div>
    </div>
  );
};
