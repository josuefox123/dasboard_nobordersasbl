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
    <div className="panel h-full flex flex-col">
      <h3 className="text-xl font-bold text-slate-900">Statut des commandes</h3>

      <div className="flex-1 flex items-center justify-center py-6">
        <svg viewBox="0 0 180 180" className="w-48 h-48">
          <defs>
            <linearGradient id="trackGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="100%" stopColor="#BFDBFE" />
            </linearGradient>
            <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0B3C68" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>
          </defs>
          <circle cx={90} cy={90} r={r} fill="none" stroke="url(#trackGrad)" strokeWidth={10} />
          <circle
            cx={90}
            cy={90}
            r={r}
            fill="none"
            stroke="url(#arcGrad)"
            strokeWidth={18}
            strokeLinecap="round"
            strokeDasharray={`${(c * pct) / 100} ${c}`}
            transform="rotate(-90 90 90)"
          />
          <text x={90} y={92} textAnchor="middle" fontSize={30} fontWeight={800} fill="#0B3C68">
            {pct}
            <tspan fontSize={14}>%</tspan>
          </text>
          <text x={90} y={112} textAnchor="middle" fontSize={9} letterSpacing={2} fill="#94A3B8">
            LIVRÉES
          </text>
        </svg>
      </div>

      <div className="grid grid-cols-3 divide-x divide-slate-100 text-center">
        <div>
          <p className="text-xl font-bold text-slate-900">{delivered}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Livrées</p>
        </div>
        <div>
          <p className="text-xl font-bold text-slate-900">{inProgress}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">En cours</p>
        </div>
        <div>
          <p className="text-xl font-bold text-slate-900">{refunded}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Remboursées</p>
        </div>
      </div>
    </div>
  );
};
