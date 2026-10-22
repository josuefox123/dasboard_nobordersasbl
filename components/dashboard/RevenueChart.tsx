'use client';

import React, { useState } from 'react';
import { smoothPath, XY } from '@/lib/chart';

interface ChartPoint {
  month: string;
  sales: number;
  donations: number;
}

const W = 640;
const H = 280;
const PL = 44;
const PR = 16;
const PT = 34;
const PB = 30;

const formatK = (v: number) =>
  v >= 1000 ? `${(v / 1000).toLocaleString('fr-BE', { maximumFractionDigits: 1 })}K` : `${v}`;

export const RevenueChart: React.FC<{ data: ChartPoint[] }> = ({ data }) => {
  const [showSales, setShowSales] = useState(true);
  const [showDonations, setShowDonations] = useState(true);
  const [hover, setHover] = useState<number | null>(null);

  const rawMax = Math.max(...data.flatMap((d) => [d.sales, d.donations]), 1);
  const step = Math.ceil(rawMax / 4 / 1000) * 1000 || 1;
  const max = step * 4;
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;
  const baseY = PT + innerH;
  const colW = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const x = (i: number) => (data.length > 1 ? PL + i * colW : PL + innerW / 2);
  const y = (v: number) => baseY - (v / max) * innerH;

  const salesPts: XY[] = data.map((d, i) => ({ x: x(i), y: y(d.sales) }));
  const donPts: XY[] = data.map((d, i) => ({ x: x(i), y: y(d.donations) }));

  const area = (pts: XY[]) =>
    `${smoothPath(pts)} L ${pts[pts.length - 1].x} ${baseY} L ${pts[0].x} ${baseY} Z`;

  const ticks = [0, 1, 2, 3, 4].map((k) => k * step);

  const label = (px: number, py: number, text: string, color: string) => (
    <g>
      <rect x={px - 26} y={py - 32} width={52} height={20} rx={10} fill={color} />
      <text x={px} y={py - 18} textAnchor="middle" fontSize={11} fontWeight={700} fill="white">
        {text}
      </text>
      <circle cx={px} cy={py} r={5} fill="white" stroke={color} strokeWidth={3} />
    </g>
  );

  return (
    <div className="panel h-full flex flex-col justify-between">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Revenus</h3>
          <p className="text-xs text-slate-400">Évolution des ventes et des dons</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setShowSales(!showSales)}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all ${
              showSales
                ? 'bg-[#E8F8F5] border-[#26B997]/30 text-[#1F6F5C]'
                : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#26B997]" />
            Ventes
          </button>
          <button
            type="button"
            onClick={() => setShowDonations(!showDonations)}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all ${
              showDonations
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Dons
          </button>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto mt-4" onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#26B997" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#26B997" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="donFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} stroke="#EEF2F7" />
            <text x={PL - 10} y={y(t) + 4} textAnchor="end" fontSize={10} fill="#94A3B8">
              {formatK(t)}
            </text>
          </g>
        ))}

        {data.map((d, i) => (
          <text key={d.month} x={x(i)} y={H - 8} textAnchor="middle" fontSize={11} fill="#94A3B8">
            {d.month}
          </text>
        ))}

        {showDonations && (
          <>
            <path d={area(donPts)} fill="url(#donFill)" />
            <path d={smoothPath(donPts)} fill="none" stroke="#F59E0B" strokeWidth={2.5} />
          </>
        )}
        {showSales && (
          <>
            <path d={area(salesPts)} fill="url(#salesFill)" />
            <path d={smoothPath(salesPts)} fill="none" stroke="#26B997" strokeWidth={2.5} />
          </>
        )}

        {hover !== null && (
          <g>
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PT - 10}
              y2={baseY}
              stroke="#94A3B8"
              strokeDasharray="4 4"
            />
            {showDonations && label(x(hover), donPts[hover].y, formatK(data[hover].donations), '#F59E0B')}
            {showSales && label(x(hover), salesPts[hover].y, formatK(data[hover].sales), '#26B997')}
          </g>
        )}

        {data.map((d, i) => (
          <rect
            key={`hit-${d.month}`}
            x={x(i) - colW / 2}
            y={PT - 20}
            width={colW}
            height={innerH + 20}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
      </svg>
    </div>
  );
};
