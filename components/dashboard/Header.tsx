'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, Search, Bell, AlertTriangle, FileCheck2, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
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
  { value: '/dashboard/orders', label: 'Commandes' },
  { value: '/dashboard/customers', label: 'Clients' },
  { value: '/dashboard/donations', label: 'Dons' },
  { value: '/dashboard/contents', label: 'Contenus' },
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
    <header className="sticky top-0 z-30 bg-[#F4F6FB]/90 backdrop-blur-md px-4 sm:px-8 py-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2.5 rounded-full bg-white text-slate-700 shadow-sm"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex p-2.5 rounded-full bg-white text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            title={isCollapsed ? 'Agrandir le menu latéral' : 'Réduire le menu latéral'}
            aria-label={isCollapsed ? 'Agrandir le menu latéral' : 'Réduire le menu latéral'}
          >
            {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        )}


        <form
          onSubmit={handleSearch}
          className="flex items-center w-full max-w-xl bg-white rounded-full shadow-[0_8px_30px_-12px_rgba(11,60,104,0.2)] pl-4 pr-2 py-1.5"
        >
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-600 focus:outline-none pr-2 border-r border-slate-200 cursor-pointer"
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
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors mr-1"
              aria-label="Effacer la recherche"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-bold text-slate-400 bg-slate-100 rounded-md border border-slate-200 mr-1 select-none pointer-events-none">
              Ctrl K
            </kbd>
          )}
          <button
            type="submit"
            className="p-2 rounded-full text-slate-400 hover:text-[#0B3C68] hover:bg-slate-100 transition-colors"
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
            className="relative p-2.5 rounded-full text-slate-600 hover:bg-white transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {alerts.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-[10px] font-bold text-white flex items-center justify-center">
                {alerts.length}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-fade-in">
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
                        className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50"
                      >
                        <span
                          className={`mt-0.5 p-1.5 rounded-lg ${
                            a.type === 'stock' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-[#0B3C68]'
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

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B3C68] to-[#2563EB] text-white text-xs font-bold flex items-center justify-center shadow-lg shadow-blue-700/30">
            JA
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-bold text-slate-900">Josué</p>
            <p className="text-[11px] text-slate-500">Administrateur</p>
          </div>
        </div>
      </div>
    </header>
  );
};
