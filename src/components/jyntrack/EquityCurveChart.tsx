import React, { useMemo } from 'react';

interface EquityCurveChartProps {
  points: { timestamp: number; balance: number }[];
  initialBalance: number;
  height?: number;
}

function formatMoney(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export const EquityCurveChart: React.FC<EquityCurveChartProps> = ({ points, initialBalance, height = 180 }) => {
  const domain = useMemo(() => {
    if (!points.length) return { min: initialBalance, max: initialBalance, isUp: true };
    const values = points.map((point) => point.balance).concat(initialBalance);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = Math.max((max - min) * 0.12, initialBalance * 0.005);
    return { min: min - pad, max: max + pad, isUp: points[points.length - 1].balance >= initialBalance };
  }, [points, initialBalance]);

  if (points.length < 2) {
    return <div className="h-44 flex items-center justify-center text-xs text-slate-500">—</div>;
  }

  const maxStep = points.length - 1;
  const toX = (step: number) => (step / maxStep) * 100;
  const toY = (value: number) => 100 - ((value - domain.min) / Math.max(1e-9, domain.max - domain.min)) * 100;
  const line = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${toX(index).toFixed(3)} ${toY(point.balance).toFixed(3)}`)
    .join(' ');
  const area = `${line} L 100 100 L 0 100 Z`;
  const color = domain.isUp ? '#10b981' : '#fb7185';

  return (
    <div className="space-y-2">
      <div className="relative w-full" style={{ height }}>
        <div className="absolute inset-y-0 left-0 right-12">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Equity curve">
            {[0, 50, 100].map((y) => (
              <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="currentColor" className="text-slate-700/50" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
            ))}
            <line
              x1="0"
              y1={toY(initialBalance)}
              x2="100"
              y2={toY(initialBalance)}
              stroke="currentColor"
              className="text-slate-500"
              strokeWidth="0.6"
              strokeDasharray="2 2"
              vectorEffect="non-scaling-stroke"
            />
            <path d={area} fill={color} opacity="0.12" />
            <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
        <div className="absolute inset-y-0 right-0 w-12 flex flex-col justify-between text-[10px] font-mono text-slate-500 text-right">
          <span>{formatMoney(domain.max)}</span>
          <span>{formatMoney((domain.max + domain.min) / 2)}</span>
          <span>{formatMoney(domain.min)}</span>
        </div>
      </div>
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pr-12">
        <span>{new Date(points[0].timestamp).toLocaleDateString()}</span>
        <span>{new Date(points[points.length - 1].timestamp).toLocaleDateString()}</span>
      </div>
    </div>
  );
};
