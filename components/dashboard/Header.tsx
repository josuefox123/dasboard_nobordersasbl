'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Menu, Search, Bell, AlertTriangle, FileCheck2, X } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface HeaderProps {
  onToggleSidebar: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface AlertItem {
  id: string;
  type: 'stock' | 'receipt';
  title: string;
  detail: string;
  href: string;
}

const scopes = [
  { value: '/dashboard/products', label: 'Produits' },
  { value: '/dashboard/categories', label: 'Catégories' },
  { value: '/dashboard/orders', label: 'Commandes' },
  { value: '/dashboard/payments', label: 'Paiements' },
  { value: '/dashboard/customers', label: 'Clients' },
  { value: '/dashboard/donations', label: 'Dons' },
  { value: '/dashboard/contents', label: 'Contenus' },
  { value: '/dashboard/activities', label: 'Activités' },
  { value: '/dashboard/news', label: 'Actualités' },
  { value: '/dashboard/press', label: 'Presse' },
  { value: '/dashboard/partners', label: 'Partenaires' },
  { value: '/dashboard/parcours', label: 'Parcours' },
  { value: '/dashboard/contacts', label: 'Messages' },
  { value: '/dashboard/faqs', label: 'FAQ' },
];

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isCollapsed = false, onToggleCollapse }) => {
  const router = useRouter();
  const [scope, setScope] = useState(scopes[0].value);
  const [query, setQuery] = useState('');
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [open, setOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadAlerts = useCallback(async () => {
    const [products, donations] = await Promise.all([
      apiClient.getProducts(),
      apiClient.getDonations(),
    ]);
    setAlerts([
      ...products
        .filter((p) => p.stock <= 2)
        .map<AlertItem>((p) => ({
          id: p.id,
          type: 'stock',
          title: p.stock === 0 ? `Rupture : ${p.name}` : `Stock faible : ${p.name}`,
          detail: `${p.stock} unité(s) restante(s)`,
          href: '/dashboard/products',
        })),
      ...donations
        .filter((d) => d.taxReceiptRequested && !d.taxReceiptSent)
        .map<AlertItem>((d) => ({
          id: d.id,
          type: 'receipt',
          title: 'Attestation fiscale à émettre',
          detail: `${d.donorName} · ${d.amount.toLocaleString('fr-BE')} €`,
          href: '/dashboard/donations',
        })),
    ]);
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`${scope}?q=${encodeURIComponent(query.trim())}`);
  };

  const toggleNotifs = () => {
    if (!open) loadAlerts();
    setOpen(!open);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors shrink-0"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <form
            onSubmit={handleSearch}
            className="flex items-center w-full max-w-lg bg-slate-50 hover:bg-slate-100/70 focus-within:bg-white rounded-xl border border-slate-200 shadow-xs pl-3.5 pr-1.5 py-1 focus-within:border-[#26B997] focus-within:ring-2 focus-within:ring-[#26B997]/15 transition-all"
          >
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none pr-2 border-r border-slate-200 cursor-pointer"
              aria-label="Rubrique de recherche"
            >
              {scopes.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher..."
              className="flex-1 min-w-0 bg-transparent px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors mr-1"
                aria-label="Effacer la recherche"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-bold text-slate-400 bg-white rounded-md border border-slate-200 mr-1 select-none pointer-events-none">
                Ctrl K
              </kbd>
            )}
            <button
              type="submit"
              className="p-2 rounded-full text-slate-400 hover:text-[#26B997] hover:bg-slate-200/60 transition-colors"
              aria-label="Rechercher"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={toggleNotifs}
              className="relative p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {alerts.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-[10px] font-bold text-slate-900 flex items-center justify-center shadow-xs">
                  {alerts.length}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-fade-in text-slate-900">
                <div className="px-4 py-3 border-b border-slate-100 text-sm font-bold text-slate-900">
                  Alertes
                </div>
                {alerts.length === 0 ? (
                  <p className="px-4 py-6 text-xs text-slate-500 text-center">Aucune alerte en cours.</p>
                ) : (
                  <ul className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {alerts.map((a) => (
                      <li key={`${a.type}-${a.id}`}>
                        <Link
                          href={a.href}
                          onClick={() => setOpen(false)}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 text-left"
                        >
                          <span
                            className={`mt-0.5 p-1.5 rounded-lg ${
                              a.type === 'stock' ? 'bg-amber-50 text-amber-600' : 'bg-[#E8F8F5] text-[#1F6F5C]'
                            }`}
                          >
                            {a.type === 'stock' ? (
                              <AlertTriangle className="w-3.5 h-3.5" />
                            ) : (
                              <FileCheck2 className="w-3.5 h-3.5" />
                            )}
                          </span>
                          <span>
                            <span className="block text-xs font-semibold text-slate-800">{a.title}</span>
                            <span className="block text-[11px] text-slate-500">{a.detail}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <Link
            href="/dashboard/profile"
            className="flex items-center gap-3 p-1.5 -mr-1.5 rounded-xl hover:bg-slate-100 transition-colors group cursor-pointer"
            title="Mon Profil"
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200 shadow-xs shrink-0 bg-slate-100 ring-2 ring-white group-hover:ring-[#26B997]/20 transition-all">
              <Image
                src="/default-avatar.svg"
                alt="Photo de profil"
                width={40}
                height={40}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div className="hidden sm:block leading-tight text-left">
              <p className="text-sm font-bold text-slate-900 group-hover:text-[#26B997] transition-colors">
                Josué
              </p>
              <p className="text-[11px] text-slate-500">Administrateur</p>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};
