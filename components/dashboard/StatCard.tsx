import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
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

const colorConfig = {
  blue: {
    iconBg: 'bg-blue-50 text-[#0B3C68]',
    stroke: '#0B3C68',
    pill: 'bg-blue-50 text-blue-700',
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-600',
    stroke: '#10B981',
    pill: 'bg-emerald-50 text-emerald-700',
  },
  yellow: {
    iconBg: 'bg-amber-50 text-amber-600',
    stroke: '#F59E0B',
    pill: 'bg-amber-50 text-amber-700',
  },
  purple: {
    iconBg: 'bg-indigo-50 text-indigo-600',
    stroke: '#6366F1',
    pill: 'bg-indigo-50 text-indigo-700',
  },
};

const DEFAULT_TREND = [4, 6, 5, 8, 6, 9, 7, 10];

function Sparkline({ values, stroke }: { values: number[]; stroke: string }) {
  const w = 72;
  const h = 36;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values.map((v, i) => ({
    x: (i / (values.length - 1)) * w,
    y: h - 4 - ((v - min) / range) * (h - 10),
  }));
  const last = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-[72px] h-[36px] shrink-0" aria-hidden="true">
      <path
        d={smoothPath(points)}
        fill="none"
        stroke={stroke}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <circle cx={last.x - 1} cy={last.y} r={3} fill={stroke} />
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
  const config = colorConfig[variant] || colorConfig.blue;
  const isPositive = change !== undefined ? change >= 0 : true;

  return (
    <div className="relative bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500 truncate">
          {title}
        </p>
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${config.iconBg}`}>
          <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
        </span>
      </div>

      <div className="flex items-end justify-between gap-2 mb-2">
        <p className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight">
          {value}
        </p>
        <Sparkline
          values={trend.length > 1 ? trend : DEFAULT_TREND}
          stroke={config.stroke}
        />
      </div>

      <div className="flex items-center gap-2 text-xs">
        {change !== undefined ? (
          <>
            <span
              className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md ${
                isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {isPositive ? '+' : ''}
              {change}%
            </span>
            <span className="text-slate-400 font-medium truncate">{changeLabel}</span>
          </>
        ) : subtext ? (
          <span className="text-slate-500 font-medium truncate">{subtext}</span>
        ) : null}
      </div>
    </div>
  );
};
