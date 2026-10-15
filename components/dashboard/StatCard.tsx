'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';

interface StatCardProps {
  title: string;
  value?: string | number;
  numericValue?: number;
  prefix?: string;
  suffix?: string;
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
    pill: 'bg-blue-50 text-blue-700',
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-600',
    pill: 'bg-emerald-50 text-emerald-700',
  },
  yellow: {
    iconBg: 'bg-amber-50 text-amber-600',
    pill: 'bg-amber-50 text-amber-700',
  },
  purple: {
    iconBg: 'bg-indigo-50 text-indigo-600',
    pill: 'bg-indigo-50 text-indigo-700',
  },
};

function parseValue(val?: string | number): { num: number; suffix: string } {
  if (val === undefined || val === null) return { num: 0, suffix: '' };
  if (typeof val === 'number') return { num: val, suffix: '' };

  const clean = String(val).replace(/[\s\u00A0]/g, '');
  const match = clean.match(/^([0-9.,]+)(.*)$/);
  if (match) {
    const rawNum = match[1].replace(',', '.');
    const num = parseFloat(rawNum);
    if (!isNaN(num)) {
      return { num, suffix: match[2] ? ` ${match[2]}` : '' };
    }
  }
  return { num: 0, suffix: String(val) };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  numericValue,
  prefix = '',
  suffix,
  change,
  changeLabel = 'vs mois précédent',
  icon: Icon,
  variant = 'blue',
  subtext,
}) => {
  const config = colorConfig[variant] || colorConfig.blue;

  // Déterminer la valeur numérique et le suffixe
  const parsed = parseValue(value);
  const finalNum = numericValue !== undefined ? numericValue : parsed.num;
  const finalSuffix = suffix !== undefined ? suffix : parsed.suffix;

  return (
    <div className="relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="text-[11px] sm:text-[12px] font-bold uppercase tracking-wider text-slate-500 truncate">
          {title}
        </p>
        <span className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${config.iconBg}`}>
          <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
        </span>
      </div>

      <div>
        <p className="text-xl sm:text-2xl min-[1400px]:text-[26px] font-extrabold text-slate-900 tracking-tight leading-none whitespace-nowrap">
          {prefix}
          <AnimatedCounter value={finalNum} />
          {finalSuffix}
        </p>
      </div>
    </div>
  );
};
