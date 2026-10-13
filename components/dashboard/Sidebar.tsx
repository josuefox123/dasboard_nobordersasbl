'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
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
  LucideIcon,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
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

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
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

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Bande latérale */}
        <div className="w-16 bg-[#072542] flex flex-col items-center py-6 gap-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-300 text-[#072542] font-black text-sm flex items-center justify-center shadow-lg shadow-amber-500/30">
            NB
          </div>
          <span className="text-white font-extrabold tracking-[0.3em] text-sm [writing-mode:vertical-rl] rotate-180">
            NO BORDERS
          </span>
        </div>

        {/* Panneau principal */}
        <div className="relative flex-1 flex flex-col bg-gradient-to-b from-[#0B3C68] via-[#0F4C8A] to-[#1D4ED8] rounded-r-[2.5rem] overflow-hidden py-8">
          <div className="pointer-events-none absolute -left-10 bottom-24 w-40 h-40 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute right-6 bottom-16 w-10 h-10 rounded-full bg-white/10" />

          <div className="px-6 flex items-center justify-between">
            <div className="px-3 py-1.5 rounded-full bg-white/10 text-[11px] font-bold uppercase tracking-wider text-white">
              No Borders ASBL
            </div>
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-full bg-white/10 text-white"
              aria-label="Fermer le menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="relative mt-12 flex-1 pl-5 space-y-1">
            {mainNav.map(renderLink)}
          </nav>

          <nav className="relative pl-5 space-y-1">{bottomNav.map(renderLink)}</nav>
        </div>
      </aside>
    </>
  );
};
