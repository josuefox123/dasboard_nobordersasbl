'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Menu, Search, Bell, AlertTriangle, FileCheck2, X, LogOut, Loader2, ShieldAlert } from 'lucide-react';
import { apiClient, getMediaUrl } from '@/lib/api-client';

interface HeaderProps {
  onToggleSidebar: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  user?: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role: string;
    role_label?: string;
    roleLabel?: string;
    role_item?: {
      id: string;
      name: string;
      label: string;
      description?: string | null;
    } | null;
    roleItem?: {
      id: string;
      name: string;
      label: string;
      description?: string | null;
    } | null;
    profile_photo_url?: string | null;
  } | null;
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
  { value: '/dashboard/press', label: 'Presse' },
  { value: '/dashboard/partners', label: 'Partenaires' },
  { value: '/dashboard/parcours', label: 'Parcours' },
  { value: '/dashboard/contacts', label: 'Messages' },
  { value: '/dashboard/faqs', label: 'FAQ' },
];

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  isCollapsed = false,
  onToggleCollapse,
  user,
}) => {
  const router = useRouter();
  const [scope, setScope] = useState(scopes[0].value);
  const [query, setQuery] = useState('');
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Utilisé uniquement pour s'assurer que createPortal ne tourne pas côté SSR
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const displayName = user
    ? [user.prenom, user.nom].filter(Boolean).join(' ') || user.email
    : 'Utilisateur';

  const displayRole =
    user?.role_item?.label ||
    user?.roleItem?.label ||
    user?.role_label ||
    user?.roleLabel ||
    (user?.role === 'SUPER_ADMIN'
      ? 'Super Administrateur'
      : user?.role === 'ADMIN'
        ? 'Administrateur'
        : user?.role) ||
    'Sans rôle';

  const avatarSrc = getMediaUrl(user?.profile_photo_url);

  const handleLogout = async () => {
    if (isLoggingOut || isLoggingOutAll) return;
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      await apiClient.logout();
      router.replace('/login');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Impossible de joindre le serveur pour se déconnecter.';
      setLogoutError(message);
      setIsLoggingOut(false);
    }
  };

  const handleLogoutAll = async () => {
    if (isLoggingOut || isLoggingOutAll) return;
    setIsLoggingOutAll(true);
    setLogoutError(null);
    try {
      await apiClient.logoutAll();
      setShowLogoutAllConfirm(false);
      router.replace('/login');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Impossible de joindre le serveur pour déconnecter tous les appareils.';
      setLogoutError(message);
      setIsLoggingOutAll(false);
      setShowLogoutAllConfirm(false);
    }
  };

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

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

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

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Header principal ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">

          {/* Gauche : burger + recherche */}
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
                  <option key={s.value} value={s.value}>{s.label}</option>
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

          {/* Droite : notifs + profil + déconnexion */}
          <div className="flex items-center gap-4">

            {/* Notifications */}
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
                            <span className={`mt-0.5 p-1.5 rounded-lg ${
                              a.type === 'stock' ? 'bg-amber-50 text-amber-600' : 'bg-[#E8F8F5] text-[#1F6F5C]'
                            }`}>
                              {a.type === 'stock'
                                ? <AlertTriangle className="w-3.5 h-3.5" />
                                : <FileCheck2 className="w-3.5 h-3.5" />}
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

            {/* Profil */}
            {user ? (
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-3 p-1.5 cursor-pointer rounded-xl hover:bg-slate-50 transition-colors"
                title={`${displayName} — ${displayRole}`}
              >
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200 shadow-xs shrink-0 bg-slate-100">
                  <Image
                    src={avatarSrc}
                    alt={displayName}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                    priority
                    unoptimized={avatarSrc !== '/default-avatar.svg'}
                  />
                </div>
                <div className="hidden sm:block leading-tight text-left">
                  <p className="text-sm font-bold text-slate-900 truncate max-w-[170px]">
                    {displayName}
                  </p>
                  <p className="text-[11px] font-medium text-emerald-700 truncate max-w-[170px] mt-0.5">
                    {displayRole}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-2.5 p-1.5 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
                <div className="hidden sm:block space-y-1">
                  <div className="w-24 h-3 bg-slate-200 rounded" />
                  <div className="w-16 h-2 bg-slate-200 rounded" />
                </div>
              </div>
            )}

            {/* Boutons de déconnexion */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut || isLoggingOutAll}
                className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                title="Se déconnecter de cet appareil"
                aria-label="Se déconnecter de cet appareil"
              >
                {isLoggingOut
                  ? <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                  : <LogOut className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={() => setShowLogoutAllConfirm(true)}
                disabled={isLoggingOut || isLoggingOutAll}
                className="p-2.5 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                title="Déconnecter tous les appareils"
                aria-label="Déconnecter tous les appareils"
              >
                {isLoggingOutAll
                  ? <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                  : <ShieldAlert className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Bannière d'erreur de déconnexion — reste dans le header */}
        {logoutError && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-red-600 text-xs font-medium flex items-center justify-between">
            <span>{logoutError}</span>
            <button
              type="button"
              onClick={() => setLogoutError(null)}
              className="text-red-500 hover:text-red-700 underline text-[11px] cursor-pointer ml-4"
            >
              Fermer
            </button>
          </div>
        )}
      </header>

      {/* ── Modal de confirmation déconnexion globale ──────────────────────────
          Rendu via createPortal dans document.body pour échapper au stacking
          context créé par le header (sticky + z-30 + backdrop-filter).
          Sans portal, fixed inset-0 est confiné au header et l'overlay ne
          couvre que la barre de navigation.
      ─────────────────────────────────────────────────────────────────────── */}
      {mounted && showLogoutAllConfirm && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => { if (!isLoggingOutAll) setShowLogoutAllConfirm(false); }}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-extrabold text-slate-900 mb-2">
              Déconnecter tous les appareils ?
            </h3>

            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Cette action révoquera immédiatement{' '}
              <strong>toutes vos sessions actives</strong> sur tous vos
              téléphones, ordinateurs et navigateurs. Vous devrez vous
              reconnecter avec votre mot de passe et votre code 2FA.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutAllConfirm(false)}
                disabled={isLoggingOutAll}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-60"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleLogoutAll}
                disabled={isLoggingOutAll}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoggingOutAll ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Déconnexion...</span>
                  </>
                ) : (
                  <span>Tout déconnecter</span>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
};
