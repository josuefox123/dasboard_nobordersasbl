'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Package,
  HeartHandshake,
  Users,
  ArrowRight,
  Bike,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
} from 'lucide-react';
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

const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function OverviewPage() {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customersCount, setCustomersCount] = useState(0);

  // Onglet actif pour la section fusionnée
  const [activeTab, setActiveTab] = useState<'orders' | 'stocks'>('orders');

  // Date de référence pour le calendrier hebdomadaire (départ : date actuelle)
  const [currentWeekDate, setCurrentWeekDate] = useState(() => new Date());

  // État d'affichage de la bannière d'activité
  const [showBanner, setShowBanner] = useState(true);

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

  // Helpers pour le calendrier hebdomadaire (7 jours)
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const monday = getMonday(currentWeekDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return day;
  });

  const prevWeek = () => {
    const prev = new Date(currentWeekDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekDate(prev);
  };

  const nextWeek = () => {
    const next = new Date(currentWeekDate);
    next.setDate(next.getDate() + 7);
    setCurrentWeekDate(next);
  };

  const isToday = (d: Date) => {
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  if (!metrics) {
    return (
      <div className="space-y-6 animate-fade-in pt-2">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Skeleton className="h-48 lg:col-span-3 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  const lowStock = products.filter((p) => p.stock <= 2);
  const sortedOrders = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const weekMonthYear = monday.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 animate-fade-in pt-2">
      {/* ─── GRILLE PRINCIPALE (3/4 GAUCHE & 1/4 DROITE) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Colonne 3/4 gauche : Carte de bienvenue + Les 4 cartes en 2x2 en dessous */}
        <div className="lg:col-span-3 space-y-5">
          {/* Carte de salutation / bienvenue */}
          <div className="relative overflow-hidden bg-gradient-to-br from-white via-white to-[#E8F8F5]/50 rounded-xl border border-slate-200/50 p-6 sm:p-7 shadow-xs">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="max-w-xl space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E8F8F5] text-[#1F6F5C]">
                  <Sparkles className="w-3.5 h-3.5 text-[#26B997]" />
                  Tableau de bord solidaire
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Bienvenue, Josué
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Votre espace d&apos;administration No Borders est à jour. Consultez les dernières commandes ou explorez les actions solidaires.
                </p>
                <div className="pt-1 flex items-center gap-3">
                  <Link
                    href="/dashboard/orders"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#26B997] hover:bg-[#1FA887] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all"
                  >
                    Voir les commandes <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Illustration visuelle inspirée de la référence */}
              <div className="hidden md:flex shrink-0 items-center justify-center">
                <svg
                  width="180"
                  height="140"
                  viewBox="0 0 200 160"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-44 h-auto drop-shadow-sm"
                >
                  {/* Horloge murale */}
                  <circle cx="165" cy="35" r="14" stroke="#CBD5E1" strokeWidth="2" fill="#F8FAFC" />
                  <line x1="165" y1="35" x2="165" y2="27" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
                  <line x1="165" y1="35" x2="171" y2="35" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="165" cy="35" r="1.5" fill="#64748B" />

                  {/* Plante de bureau */}
                  <rect x="172" y="118" width="16" height="22" rx="3" fill="#E2E8F0" />
                  <path d="M180 118 C176 100, 166 102, 172 90 C178 98, 180 112, 180 118 Z" fill="#26B997" />
                  <path d="M180 118 C184 100, 194 102, 188 90 C182 98, 180 112, 180 118 Z" fill="#1F6F5C" />

                  {/* Personnage sur ordinateur */}
                  {/* Cheveux */}
                  <path
                    d="M95 48 C95 32, 125 32, 125 48 C128 52, 126 58, 122 58 C120 48, 100 48, 98 58 C94 58, 92 52, 95 48 Z"
                    fill="#334155"
                  />
                  {/* Visage & Cou */}
                  <circle cx="110" cy="52" r="11" fill="#FCD34D" />
                  <rect x="107" y="62" width="6" height="6" fill="#FCD34D" />
                  {/* Lunettes */}
                  <circle cx="106" cy="51" r="3.5" stroke="#334155" strokeWidth="1.2" fill="none" />
                  <circle cx="114" cy="51" r="3.5" stroke="#334155" strokeWidth="1.2" fill="none" />
                  <line x1="109.5" y1="51" x2="110.5" y2="51" stroke="#334155" strokeWidth="1.2" />
                  {/* Sourire & barbe */}
                  <path d="M106 57 Q110 61 114 57" stroke="#334155" strokeWidth="1.5" fill="none" strokeLinecap="round" />

                  {/* Buste / T-shirt */}
                  <path
                    d="M90 70 C90 68, 130 68, 130 70 L136 110 C136 112, 84 112, 84 110 Z"
                    fill="#26B997"
                  />
                  {/* Motifs légers t-shirt */}
                  <circle cx="102" cy="80" r="1.5" fill="#E8F8F5" opacity="0.6" />
                  <circle cx="118" cy="85" r="1.5" fill="#E8F8F5" opacity="0.6" />
                  <circle cx="108" cy="94" r="1.5" fill="#E8F8F5" opacity="0.6" />

                  {/* Ordinateur portable */}
                  {/* Écran */}
                  <path d="M72 108 L114 108 L110 82 L76 82 Z" fill="#CBD5E1" />
                  <path d="M74 106 L112 106 L108 84 L78 84 Z" fill="#F8FAFC" />
                  <circle cx="93" cy="95" r="3" fill="#26B997" />
                  {/* Base clavier */}
                  <rect x="64" y="108" width="56" height="4" rx="2" fill="#94A3B8" />

                  {/* Table de bureau */}
                  <line x1="20" y1="140" x2="190" y2="140" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Bannière d'activité du jour dismissible (placée juste après la carte de salutation) */}
          {showBanner && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#E8F8F5] border border-[#26B997]/20 rounded-xl text-xs text-slate-700 shadow-xs">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-white text-[#26B997] shadow-2xs shrink-0">
                  <CalendarCheck className="w-4 h-4" />
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900">Aujourd&apos;hui</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-[#1F6F5C] font-bold border border-[#26B997]/20">
                    En cours
                  </span>
                  <span className="text-slate-600">
                    2 commandes programmées &amp; 1 atelier vélo.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBanner(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors shrink-0"
                aria-label="Fermer la bannière"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Les 4 cartes ramenées juste en bas du bloc des 3/4 (2 par ligne) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Carte 1 : Boutique & Ventes */}
            <div className="panel hover:shadow-md transition-all p-5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#26B997] flex items-center justify-center shrink-0">
                <Bike className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Boutique & Vélos</p>
                  <Link href="/dashboard/products" className="text-slate-400 hover:text-[#26B997]">
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  {metrics.totalSales.toLocaleString('fr-BE')} €
                </p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  28 commandes enregistrées. Gestion du parc de vélos reconditionnés et accessoires.
                </p>
              </div>
            </div>

            {/* Carte 2 : Dons & Solidarité */}
            <div className="panel hover:shadow-md transition-all p-5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Dons & Solidarité</p>
                  <Link href="/dashboard/donations" className="text-slate-400 hover:text-amber-600">
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  {metrics.totalDonations.toLocaleString('fr-BE')} €
                </p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  Fonds collectés pour financer la mobilité solidaire et l&apos;accès universel au vélo.
                </p>
              </div>
            </div>

            {/* Carte 3 : Usagers & Communauté */}
            <div className="panel hover:shadow-md transition-all p-5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Clients & Usagers</p>
                  <Link href="/dashboard/customers" className="text-slate-400 hover:text-blue-600">
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  {customersCount} actifs
                </p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  Membres et bénéficiaires accompagnés lors des formations et réparations en atelier.
                </p>
              </div>
            </div>

            {/* Carte 4 : Activités & Parcours */}
            <div className="panel hover:shadow-md transition-all p-5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Activités & Parcours</p>
                  <Link href="/dashboard/activities" className="text-slate-400 hover:text-purple-600">
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  Programmes
                </p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  Ateliers mécaniques participatifs, balades citoyennes et parcours d&apos;inclusion.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne 1/4 droite : Calendrier hebdomadaire + Section Tabs (Commandes & Stocks) */}
        <div className="lg:col-span-1 space-y-5">
          {/* Calendrier hebdomadaire (7 jours) avec défilement */}
          <div className="panel p-4 sm:p-5 bg-white space-y-4">
            {/* Header du calendrier : Mois et navigation précédente / suivante */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Calendrier</p>
                <h3 className="text-sm font-bold text-slate-900 capitalize">{weekMonthYear}</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={prevWeek}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title="Semaine précédente"
                  aria-label="Semaine précédente"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextWeek}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title="Semaine suivante"
                  aria-label="Semaine suivante"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Affichage des 7 jours de la semaine */}
            <div className="grid grid-cols-7 gap-1 pt-1">
              {weekDays.map((day, idx) => {
                const today = isToday(day);
                return (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-medium text-slate-400">
                      {dayNames[idx]}
                    </span>
                    <button
                      type="button"
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                        today
                          ? 'bg-[#26B997] text-white shadow-sm shadow-emerald-700/30 ring-2 ring-[#26B997]/20'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {day.getDate()}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section fusionnée en onglets (Tabs) logée dans la colonne 1/4 */}
          <div className="panel p-4 bg-white overflow-hidden space-y-3">
            {/* Header des onglets */}
            <div className="flex items-center justify-between gap-1 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    activeTab === 'orders'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Commandes ({sortedOrders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('stocks')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    activeTab === 'stocks'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Stocks ({lowStock.length})
                </button>
              </div>

              {activeTab === 'orders' ? (
                <Link
                  href="/dashboard/orders"
                  className="text-[11px] font-bold text-[#1F6F5C] hover:text-[#26B997] transition-colors"
                >
                  Voir tout
                </Link>
              ) : (
                <Link
                  href="/dashboard/products"
                  className="text-[11px] font-bold text-[#1F6F5C] hover:text-[#26B997] transition-colors"
                >
                  Gérer
                </Link>
              )}
            </div>

            {/* Contenu Tab 1 : Commandes récentes (3 colonnes max : Commande/Client, Montant, Paiement) */}
            {activeTab === 'orders' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] uppercase tracking-wider text-slate-400 bg-slate-50/70 border-b border-slate-100">
                    <tr>
                      <th className="py-1.5 px-2 font-bold">Commande</th>
                      <th className="py-1.5 px-2 font-bold text-right">Montant</th>
                      <th className="py-1.5 px-2 font-bold text-right">État</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {sortedOrders.slice(0, 5).map((o) => {
                      const pay = paymentLabel[o.paymentStatus];
                      return (
                        <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-2">
                            <span className="font-semibold text-slate-900 block leading-tight">{o.orderNumber}</span>
                            <span className="text-[10px] text-slate-400 block leading-tight mt-0.5 truncate max-w-[90px]">
                              {o.customerName}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right font-bold text-slate-900 whitespace-nowrap">
                            {o.totalAmount.toLocaleString('fr-BE')} €
                          </td>
                          <td className="py-2.5 px-2 text-right whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                o.paymentStatus === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : o.paymentStatus === 'pending'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {pay.text}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Contenu Tab 2 : Stocks à surveiller */}
            {activeTab === 'stocks' && (
              <div>
                {lowStock.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">Tous les stocks sont suffisants.</p>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="text-[10px] uppercase tracking-wider text-slate-400 bg-slate-50/70 border-b border-slate-100">
                      <tr>
                        <th className="py-1.5 px-2 font-bold">Produit</th>
                        <th className="py-1.5 px-2 font-bold text-right">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lowStock.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-2">
                            <p className="font-medium text-slate-900 truncate max-w-[120px]">{p.name}</p>
                            <p className="text-[10px] text-slate-400">{p.categoryLabel}</p>
                          </td>
                          <td className="py-2.5 px-2 text-right whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.stock === 0 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                              }`}
                            >
                              {p.stock === 0 ? 'Épuisé' : `${p.stock}`}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── GRAPHES REVENUS ET STATUT DES COMMANDES ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={metrics.recentSalesData} />
        </div>
        <OrderStatus orders={orders} />
      </div>
    </div>
  );
}

