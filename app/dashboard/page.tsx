'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Package, HeartHandshake, Users, ArrowRight } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { OrderStatus } from '@/components/dashboard/OrderStatus';
import { Skeleton } from '@/components/ui/Skeleton';
import { apiClient } from '@/lib/api-client';
import { Order, Product, OverviewMetrics, PaymentStatus } from '@/types/dashboard';

const paymentLabel: Record<PaymentStatus, { text: string; className: string; dot: string }> = {
  paid: { text: 'Payé', className: 'text-emerald-600', dot: 'bg-emerald-500' },
  pending: { text: 'En attente', className: 'text-amber-600', dot: 'bg-amber-500' },
  failed: { text: 'Échoué', className: 'text-rose-600', dot: 'bg-rose-500' },
  refunded: { text: 'Remboursé', className: 'text-rose-600', dot: 'bg-rose-500' },
};

export default function OverviewPage() {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customersCount, setCustomersCount] = useState(0);

  useEffect(() => {
    Promise.all([
      apiClient.getOverview(),
      apiClient.getOrders(),
      apiClient.getProducts(),
      apiClient.getCustomers(),
    ]).then(([m, o, p, c]) => {
      setMetrics(m);
      setOrders(o);
      setProducts(p);
      setCustomersCount(c.filter((cust) => cust.status === 'active').length);
    });
  }, []);

  if (!metrics) {
    return (
      <div className="space-y-8 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 min-[1440px]:grid-cols-4 gap-6">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2 rounded-3xl" />
          <Skeleton className="h-80 rounded-3xl" />
        </div>
      </div>
    );
  }

  const lowStock = products.filter((p) => p.stock <= 2);
  const sortedOrders = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-900">Vue d’ensemble</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 min-[1440px]:grid-cols-4 gap-6">
        <StatCard
          title="Ventes"
          value={`${metrics.totalSales.toLocaleString('fr-BE')} €`}
          change={metrics.salesGrowthPercent}
          icon={ShoppingBag}
          variant="blue"
          trend={metrics.recentSalesData.map((d) => d.sales)}
        />
        <StatCard
          title="Commandes"
          value={metrics.totalOrders}
          change={metrics.ordersGrowthPercent}
          icon={Package}
          variant="purple"
        />
        <StatCard
          title="Clients actifs"
          value={customersCount}
          icon={Users}
          variant="emerald"
          subtext={`${lowStock.length} produit(s) en stock faible`}
        />
        <StatCard
          title="Dons"
          value={`${metrics.totalDonations.toLocaleString('fr-BE')} €`}
          change={metrics.donationsGrowthPercent}
          icon={HeartHandshake}
          variant="yellow"
          trend={metrics.recentSalesData.map((d) => d.donations)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={metrics.recentSalesData} />
        </div>
        <OrderStatus orders={orders} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="panel lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-900">Commandes récentes</h3>
            <Link
              href="/dashboard/orders"
              className="flex items-center gap-1 text-xs font-bold text-[#0B3C68] hover:text-blue-700"
            >
              Tout voir <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-6 font-bold">Commande</th>
                  <th className="py-3 px-6 font-bold">Client</th>
                  <th className="py-3 px-6 font-bold">Date</th>
                  <th className="py-3 px-6 font-bold">Montant</th>
                  <th className="py-3 px-6 font-bold">Paiement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sortedOrders.slice(0, 5).map((o) => {
                  const pay = paymentLabel[o.paymentStatus];
                  return (
                    <tr key={o.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2 font-medium">
                          <span className={`w-1.5 h-1.5 rounded-full ${pay.dot}`} />
                          {o.orderNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 whitespace-nowrap">{o.customerName}</td>
                      <td className="py-3.5 px-6 whitespace-nowrap text-slate-500">
                        {new Date(o.createdAt).toLocaleDateString('fr-BE', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-6 whitespace-nowrap font-semibold">
                        {o.totalAmount.toLocaleString('fr-BE')} €
                      </td>
                      <td className={`py-3.5 px-6 whitespace-nowrap font-medium ${pay.className}`}>
                        {pay.text}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-900">Stocks à surveiller</h3>
            <Link
              href="/dashboard/products"
              className="flex items-center gap-1 text-xs font-bold text-[#0B3C68] hover:text-blue-700"
            >
              Gérer <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">Tous les stocks sont suffisants.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 font-bold">Produit</th>
                  <th className="py-3 font-bold text-right">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStock.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 pr-3">
                      <p className="font-medium text-slate-800 line-clamp-1">{p.name}</p>
                      <p className="text-[11px] text-slate-400">{p.categoryLabel}</p>
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          p.stock === 0 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        {p.stock === 0 ? 'Épuisé' : p.stock}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
