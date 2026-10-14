import React from 'react';
import { Order } from '@/types/dashboard';

export const OrderStatus: React.FC<{ orders: Order[] }> = ({ orders }) => {
  const refunded = orders.filter((o) => o.paymentStatus === 'refunded').length;
  const delivered = orders.filter(
    (o) => o.paymentStatus !== 'refunded' && o.shippingStatus === 'delivered'
  ).length;
  const inProgress = orders.length - refunded - delivered;
  const pct = orders.length ? Math.round((delivered / orders.length) * 100) : 0;

  const r = 62;
  const c = 2 * Math.PI * r;

  return (
    <div className="panel h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-slate-900">Statut des commandes</h3>
        <span className="text-xs font-semibold text-slate-400">{orders.length} total</span>
      </div>

      <div className="flex-1 flex items-center justify-center py-4">
        <svg viewBox="0 0 180 180" className="w-44 h-44">
          <defs>
            <linearGradient id="orderArcGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          {/* Background track */}
          <circle cx={90} cy={90} r={r} fill="none" stroke="#F1F5F9" strokeWidth={12} />
          {/* Active arc */}
          <circle
            cx={90}
            cy={90}
            r={r}
            fill="none"
            stroke="url(#orderArcGrad)"
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={`${(c * pct) / 100} ${c}`}
            transform="rotate(-90 90 90)"
            className="transition-all duration-700 ease-out"
          />
          <text x={90} y={88} textAnchor="middle" fontSize={30} fontWeight={800} fill="#0F172A">
            {pct}
            <tspan fontSize={16} fontWeight={700} fill="#10B981">%</tspan>
          </text>
          <text x={90} y={110} textAnchor="middle" fontSize={10} fontWeight={700} letterSpacing={1.5} fill="#94A3B8">
            LIVRÉES
          </text>
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
        <div className="p-2 rounded-xl bg-slate-50">
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <p className="text-base font-bold text-slate-900">{delivered}</p>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Livrées</p>
        </div>
        <div className="p-2 rounded-xl bg-slate-50">
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <p className="text-base font-bold text-slate-900">{inProgress}</p>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">En cours</p>
        </div>
        <div className="p-2 rounded-xl bg-slate-50">
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <p className="text-base font-bold text-slate-900">{refunded}</p>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Remboursées</p>
        </div>
      </div>
    </div>
  );
};
