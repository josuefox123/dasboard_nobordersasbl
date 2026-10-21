'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Bike,
  FolderTree,
  ShoppingBag,
  CreditCard,
  Users,
  HeartHandshake,
  FileText,
  CalendarCheck,
  Newspaper,
  Radio,
  Handshake,
  Milestone,
  Mail,
  HelpCircle,
  ShieldCheck,
  Settings,
  X,
  LucideIcon,
  User,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

const mainNav: NavItem[] = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Produits', href: '/dashboard/products', icon: Bike },
  { name: 'Catégories', href: '/dashboard/categories', icon: FolderTree },
  { name: 'Commandes', href: '/dashboard/orders', icon: ShoppingBag },
  { name: 'Paiements', href: '/dashboard/payments', icon: CreditCard },
  { name: 'Clients', href: '/dashboard/customers', icon: Users },
  { name: 'Dons', href: '/dashboard/donations', icon: HeartHandshake },
  { name: 'Contenus', href: '/dashboard/contents', icon: FileText },
  { name: 'Activités', href: '/dashboard/activities', icon: CalendarCheck },
  { name: 'Actualités', href: '/dashboard/news', icon: Newspaper },
  { name: 'Presse', href: '/dashboard/press', icon: Radio },
  { name: 'Partenaires', href: '/dashboard/partners', icon: Handshake },
  { name: 'Parcours', href: '/dashboard/parcours', icon: Milestone },
  { name: 'Messages', href: '/dashboard/contacts', icon: Mail },
  { name: 'FAQ', href: '/dashboard/faqs', icon: HelpCircle },
  { name: 'Utilisateurs', href: '/dashboard/users', icon: ShieldCheck },
];

const bottomNav: NavItem[] = [
  { name: 'Mon Profil', href: '/dashboard/profile', icon: User },
  { name: 'Paramètres', href: '/dashboard/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const pathname = usePathname();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onCloseMobile();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCloseMobile]);

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  const renderLink = (item: NavItem) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onCloseMobile}
        aria-current={active ? 'page' : undefined}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 ${
          active
            ? 'bg-[#EFF6FF] text-[#0B3C68]'
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        <span
          className={`w-8 h-8 flex items-center justify-center rounded-lg shrink-0 transition-all ${
            active
              ? 'bg-[#0B3C68] text-white shadow-sm shadow-blue-900/20'
              : 'bg-transparent text-slate-400'
          }`}
        >
          <Icon className="w-4 h-4" />
        </span>
        <span>{item.name}</span>
      </Link>
    );
  };

  const renderCollapsedLink = (item: NavItem) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onCloseMobile}
        aria-current={active ? 'page' : undefined}
        title={item.name}
        className={`relative group flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all ${
          active
            ? 'bg-[#0B3C68] text-white shadow-sm shadow-blue-900/20'
            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
        }`}
      >
        <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
        <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl">
          {item.name}
        </span>
      </Link>
    );
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:w-[70px]' : 'lg:w-64'
        } ${
          isOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mode Réduit Desktop */}
        {isCollapsed && (
          <div className="hidden lg:flex flex-col w-[70px] h-full bg-white border-r border-slate-100 py-5 items-center gap-4 shadow-sm">
            {/* Logo fixe */}
            <div className="shrink-0 flex flex-col items-center gap-4">
              <Link
                href="/dashboard"
                className="relative w-10 flex flex-col items-center justify-center group overflow-hidden py-1 rounded-xl"
                title="No Borders ASBL"
              >
                <div className="relative">
                  <Image
                    src="/logoFichier 3logo_2_blanc.png"
                    alt="No Borders ASBL"
                    width={40}
                    height={40}
                    className="w-9 h-auto object-contain logo-reveal-bike relative z-10 transition-transform group-hover:scale-105"
                    priority
                    style={{ filter: 'invert(1) sepia(1) saturate(0) brightness(0.3)' }}
                  />
                </div>
                <div className="relative w-9 h-3 overflow-hidden pointer-events-none flex items-center mt-0.5">
                  <div className="absolute inset-x-0 bottom-1 h-[1px] bg-gradient-to-r from-transparent via-slate-300/60 to-transparent" />
                  <div className="bike-bottom-runner-collapsed flex items-center absolute bottom-0">
                    <div className="h-[1.5px] w-5 bg-gradient-to-r from-transparent via-[#0B3C68] to-amber-400 opacity-80" />
                    <div className="text-amber-400 -ml-0.5">
                      <Bike className="w-2.5 h-2.5" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Menus scrollables uniquement */}
            <div className="flex-1 w-full min-h-0 overflow-y-auto overflow-x-hidden flex flex-col gap-1 px-2 sidebar-scrollbar">
              <nav className="w-full flex flex-col gap-1">
                {mainNav.map(renderCollapsedLink)}
              </nav>

              <div className="w-8 mx-auto my-2 border-t border-slate-100 shrink-0" />

              <nav className="w-full flex flex-col gap-1 pb-2">
                {bottomNav.map(renderCollapsedLink)}
              </nav>
            </div>
          </div>
        )}

        {/* Mode Complet (Mobile ou Desktop non-réduit) */}
        <div
          className={`flex-col w-64 h-full bg-white border-r border-slate-100 py-5 shadow-sm ${
            isCollapsed ? 'lg:hidden' : 'flex'
          }`}
        >
          {/* Header avec logo fixe */}
          <div className="px-4 flex items-center justify-between gap-2 mb-4 shrink-0">
            <Link
              href="/dashboard"
              className="relative flex-1 flex flex-col items-start justify-center group overflow-hidden py-0.5"
              title="No Borders ASBL"
            >
              <div className="relative">
                <Image
                  src="/logoFichier 2logo_2.png"
                  alt="No Borders ASBL"
                  width={160}
                  height={54}
                  className="h-9 w-auto object-contain relative z-10 transition-transform group-hover:scale-[1.02]"
                  priority
                />
              </div>
              <div className="relative w-full max-w-[160px] h-3.5 overflow-hidden pointer-events-none flex items-center mt-0.5">
                <div className="absolute inset-x-0 bottom-1.5 h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                <div className="bike-bottom-runner flex items-center absolute bottom-0.5">
                  <div className="h-[1.5px] w-12 bg-gradient-to-r from-transparent via-[#0B3C68] to-amber-400 opacity-80" />
                  <div className="text-amber-400 -ml-1">
                    <Bike className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </Link>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded-lg bg-slate-100 text-slate-500"
                aria-label="Fermer le menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Zone contenant uniquement les menus, avec scroll vertical dédié */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col px-3 sidebar-scrollbar">
            {/* Section label */}
            <div className="px-1 mb-2 shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Menu</p>
            </div>

            <nav className="flex flex-col gap-0.5">
              {mainNav.map(renderLink)}
            </nav>

            <div className="px-1 my-2.5 shrink-0">
              <div className="border-t border-slate-100" />
            </div>

            <nav className="flex flex-col gap-0.5 pb-2">
              {bottomNav.map(renderLink)}
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
};
