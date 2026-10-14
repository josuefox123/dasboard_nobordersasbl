'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Bike,
  ShoppingBag,
  Users,
  HeartHandshake,
  FileText,
  ShieldCheck,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  LucideIcon,
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
  { name: 'Commandes', href: '/dashboard/orders', icon: ShoppingBag },
  { name: 'Clients', href: '/dashboard/customers', icon: Users },
  { name: 'Dons', href: '/dashboard/donations', icon: HeartHandshake },
  { name: 'Contenus', href: '/dashboard/contents', icon: FileText },
  { name: 'Utilisateurs', href: '/dashboard/users', icon: ShieldCheck },
];

const bottomNav: NavItem[] = [
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
        className={`flex items-center gap-3 pl-5 pr-4 py-3 rounded-l-full text-[12px] font-bold uppercase tracking-wider transition-colors ${
          active
            ? 'bg-[#F4F6FB] text-[#0B3C68]'
            : 'text-blue-100/80 hover:text-white hover:bg-white/10'
        }`}
      >
        <Icon className={`w-[18px] h-[18px] ${active ? 'text-amber-500' : ''}`} />
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
        className={`relative group flex items-center justify-center w-11 h-11 mx-auto rounded-2xl transition-all ${
          active
            ? 'bg-[#F4F6FB] text-[#0B3C68] shadow-md shadow-blue-950/20'
            : 'text-blue-100/80 hover:text-white hover:bg-white/10'
        }`}
      >
        <Icon className={`w-5 h-5 ${active ? 'text-amber-500' : ''}`} />
        <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl border border-slate-700">
          {item.name}
        </span>
      </Link>
    );
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:w-20' : 'lg:w-72'
        } ${
          isOpen ? 'w-72 translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mode Réduit Desktop */}
        {isCollapsed && (
          <div className="hidden lg:flex flex-col w-20 bg-gradient-to-b from-[#072542] via-[#0B3C68] to-[#1D4ED8] rounded-r-3xl overflow-visible py-6 items-center shadow-xl">
            <Link
              href="/dashboard"
              className="w-14 h-14 rounded-2xl bg-white p-2 flex items-center justify-center shadow-lg shadow-blue-950/25 group transition-transform hover:scale-105"
              title="No Borders ASBL"
            >
              <Image
                src="/logoFichier 2logo_2.png"
                alt="No Borders ASBL"
                width={56}
                height={56}
                className="w-full h-auto object-contain"
                priority
              />
            </Link>
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="mt-3 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Agrandir le menu"
                aria-label="Agrandir le menu"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            <nav className="mt-8 flex-1 w-full space-y-2 px-2.5">
              {mainNav.map(renderCollapsedLink)}
            </nav>

            <nav className="w-full space-y-2 px-2.5 mt-auto">
              {bottomNav.map(renderCollapsedLink)}
            </nav>
          </div>
        )}

        {/* Mode Complet (Mobile ou Desktop non-réduit) */}
        <div
          className={`flex w-72 h-full ${
            isCollapsed ? 'lg:hidden' : 'flex'
          }`}
        >
          {/* Bande latérale */}
          <div className="w-16 bg-[#072542] flex flex-col items-center py-6 gap-8 shrink-0">
            <Link
              href="/dashboard"
              className="w-12 h-12 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-md shadow-black/20 group transition-transform hover:scale-105"
              title="No Borders ASBL"
            >
              <Image
                src="/logoFichier 2logo_2.png"
                alt="No Borders ASBL"
                width={48}
                height={48}
                className="w-full h-auto object-contain"
                priority
              />
            </Link>
            <span className="text-white font-extrabold tracking-[0.3em] text-sm [writing-mode:vertical-rl] rotate-180">
              NO BORDERS
            </span>
          </div>

          {/* Panneau principal */}
          <div className="relative flex-1 flex flex-col bg-gradient-to-b from-[#0B3C68] via-[#0F4C8A] to-[#1D4ED8] rounded-r-[2.5rem] overflow-hidden py-8">
            <div className="pointer-events-none absolute -left-10 bottom-24 w-40 h-40 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute right-6 bottom-16 w-10 h-10 rounded-full bg-white/10" />

            <div className="px-5 flex items-center justify-between gap-2">
              <Link
                href="/dashboard"
                className="flex-1 bg-white rounded-2xl px-3.5 py-2 shadow-md shadow-blue-950/25 hover:shadow-lg transition-all flex items-center justify-center group"
                title="No Borders ASBL"
              >
                <Image
                  src="/logoFichier 2logo_2.png"
                  alt="No Borders ASBL"
                  width={200}
                  height={66}
                  className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
                  priority
                />
              </Link>
              <div className="flex items-center gap-1">
                {onToggleCollapse && (
                  <button
                    type="button"
                    onClick={onToggleCollapse}
                    className="hidden lg:flex p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Réduire le menu"
                    aria-label="Réduire le menu"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="lg:hidden p-1.5 rounded-full bg-white/10 text-white"
                  aria-label="Fermer le menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <nav className="relative mt-12 flex-1 pl-5 space-y-1">
              {mainNav.map(renderLink)}
            </nav>

            <nav className="relative pl-5 space-y-1">{bottomNav.map(renderLink)}</nav>
          </div>
        </div>
      </aside>
    </>
  );
};
