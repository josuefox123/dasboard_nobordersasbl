import React from 'react';
import { LucideIcon } from 'lucide-react';
import { smoothPath } from '@/lib/chart';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'yellow' | 'emerald' | 'purple';
  subtext?: string;
  trend?: number[];
}

const gradients = {
  blue: 'from-[#0B3C68] to-[#2563EB] shadow-blue-800/30',
  purple: 'from-[#1E40AF] to-[#38BDF8] shadow-blue-500/30',
  emerald: 'from-[#0284C7] to-[#22D3EE] shadow-sky-500/30',
  yellow: 'from-[#F59E0B] to-[#FCD34D] shadow-amber-500/30',
};

const DEFAULT_TREND = [4, 6, 5, 8, 6, 9, 7, 10];

function Sparkline({ values }: { values: number[] }) {
  const w = 72;
  const h = 44;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values.map((v, i) => ({
    x: (i / (values.length - 1)) * w,
    y: h - 6 - ((v - min) / range) * (h - 14),
  }));
  const last = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-[72px] h-[44px] shrink-0" aria-hidden="true">
      {points.map((p, i) => (
        <line key={i} x1={p.x} y1={0} x2={p.x} y2={h} stroke="white" strokeOpacity={0.15} />
      ))}
      <path d={smoothPath(points)} fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={last.x - 2} cy={last.y} r={3} fill="white" />
    </svg>
  );
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeLabel = 'vs mois précédent',
  icon: Icon,
  variant = 'blue',
  subtext,
  trend = DEFAULT_TREND,
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradients[variant]} p-5 text-white shadow-xl transition-transform hover:-translate-y-0.5`}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/10" />
      <Icon className="absolute right-4 top-4 w-4 h-4 text-white/70" />

      <div className="relative flex items-center gap-4">
        <Sparkline values={trend.length > 1 ? trend : DEFAULT_TREND} />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/80 truncate">
            {title}
          </p>
          <p className="text-2xl font-extrabold tracking-tight">{value}</p>
          {change !== undefined && (
            <p className="text-[11px] font-semibold text-white/90">
              {change >= 0 ? '+' : ''}
              {change}% {changeLabel}
            </p>
          )}
          {subtext && <p className="text-[11px] text-white/80 truncate">{subtext}</p>}
        </div>
      </div>
    </div>
  );
};
