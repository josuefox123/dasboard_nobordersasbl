'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Settings,
  Truck,
  CreditCard,
  Bell,
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
  Building2,
  Mail,
  ShieldCheck,
  LayoutTemplate,
  Image as ImageIcon,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { SettingsState, WebsiteSettings } from '@/types/dashboard';
import { Skeleton } from '@/components/ui/Skeleton';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'website' | 'shipping' | 'payments' | 'notifications' | 'languages'>('website');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await apiClient.getSettings();
      setSettings(data);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    await apiClient.saveSettings(settings);
    setFeedback('Paramètres enregistrés avec succès dans le système.');
    setTimeout(() => setFeedback(null), 3000);
  };

  if (loading || !settings) {
    return (
      <div className="space-y-6 animate-fade-in max-w-5xl">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-36 rounded-2xl" />
          <Skeleton className="h-10 w-36 rounded-2xl" />
          <Skeleton className="h-10 w-36 rounded-2xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  const website: WebsiteSettings = settings.website || {
    tagline: 'Mobilité douce, vélos solidaires et inclusion active.',
    logoUrl: '/logoFichier 2logo_2.png',
    heroTitle: 'Pédalez pour un monde sans frontières',
    heroSubtitle: 'Découvrez nos vélos artisanaux en bambou, nos tandems adaptés Hase Bikes et soutenez notre projet d’inclusion par le cyclisme solidaire.',
    heroImageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=80',
    aboutImageUrl: 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=1000&q=80',
    aboutTitle: 'Une association engagée pour l’accessibilité et l’artisanat durable',
    aboutText: 'No Borders ASBL rassemble passionnés, mécaniciens et bénévoles pour promouvoir la mobilité durable à Bruxelles et au-delà.',
    announcementBarText: '🚴 Portes ouvertes de notre atelier solidaire ce samedi à Bruxelles !',
    announcementBarEnabled: true,
    socialFacebook: 'https://facebook.com/nobordersasbl',
    socialInstagram: 'https://instagram.com/nobordersasbl',
    socialYoutube: 'https://youtube.com/@nobordersasbl',
    footerText: '© 2025 No Borders ASBL · Numéro d’entreprise : 0789.123.456 · Tous droits réservés.',
  };

  const updateWebsite = (field: keyof WebsiteSettings, val: any) => {
    setSettings({
      ...settings,
      website: {
        ...website,
        [field]: val,
      },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Configuration & Paramètres Généraux
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Livraisons, passerelles de paiement solidaire, notifications et multilingue FR/NL/EN.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="btn-primary-gradient inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>Enregistrer les modifications</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 pb-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('website')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'website'
              ? 'bg-[#0B3C68] text-white shadow-sm shadow-blue-900/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <LayoutTemplate className="w-4 h-4" />
          <span>Site Web & Médias</span>
        </button>

        <button
          onClick={() => setActiveTab('shipping')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'shipping'
              ? 'bg-[#0B3C68] text-white shadow-sm shadow-blue-900/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Livraison & Retrait Atelier</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'payments'
              ? 'bg-[#0B3C68] text-white shadow-sm shadow-blue-900/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Passerelles de Paiement</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'notifications'
              ? 'bg-[#0B3C68] text-white shadow-sm shadow-blue-900/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications & Alertes</span>
        </button>

        <button
          onClick={() => setActiveTab('languages')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'languages'
              ? 'bg-[#0B3C68] text-white shadow-sm shadow-blue-900/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Multilingue (FR / NL / EN)</span>
        </button>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="panel space-y-6">
        {/* 0. WEBSITE TAB */}
        {activeTab === 'website' && (
          <div className="space-y-7 animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Médias, Images & Visuels du Site Web
              </h3>
              <p className="text-xs text-slate-500">
                Personnalisez le logo, les bannières d’accueil (Hero), les images des sections et les textes clés de votre site public.
              </p>
            </div>

            {/* 1. Logo du site web */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#0B3C68]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Logo du site public</h4>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                {/* Aperçus */}
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center min-w-[120px] h-16">
                    <Image
                      src={website.logoUrl || '/logoFichier 2logo_2.png'}
                      alt="Aperçu logo clair"
                      width={110}
                      height={40}
                      className="max-h-12 w-auto object-contain"
                    />
                  </div>
                  <div className="p-3 rounded-xl bg-[#0B3C68] shadow-xs flex items-center justify-center min-w-[120px] h-16">
                    <Image
                      src="/logoFichier 3logo_2_blanc.png"
                      alt="Aperçu logo blanc"
                      width={110}
                      height={40}
                      className="max-h-12 w-auto object-contain"
                    />
                  </div>
                </div>

                {/* Sélecteurs */}
                <div className="flex-1 w-full space-y-2">
                  <label className="label-premium">Source du logo</label>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateWebsite('logoUrl', '/logoFichier 2logo_2.png')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        website.logoUrl === '/logoFichier 2logo_2.png'
                          ? 'bg-[#0B3C68] text-white border-[#0B3C68]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Logo Couleur (Officiel)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateWebsite('logoUrl', '/logoFichier 3logo_2_blanc.png')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        website.logoUrl === '/logoFichier 3logo_2_blanc.png'
                          ? 'bg-[#0B3C68] text-white border-[#0B3C68]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Logo Blanc (Transparent)
                    </button>
                  </div>
                  <input
                    type="text"
                    value={website.logoUrl}
                    onChange={(e) => updateWebsite('logoUrl', e.target.value)}
                    placeholder="URL d'un logo personnalisé (ex: /mon-logo.png ou https://...)"
                    className="input-premium text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="label-premium">Slogan / Sous-titre du logo</label>
                <input
                  type="text"
                  value={website.tagline}
                  onChange={(e) => updateWebsite('tagline', e.target.value)}
                  placeholder="Ex : Mobilité douce, vélos solidaires et inclusion active."
                  className="input-premium"
                />
              </div>
            </div>

            {/* 2. Bannière Hero d'accueil */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Image & Bannière Hero (Page d&apos;accueil)</h4>
                </div>
              </div>

              {/* Prévisualisation Bannière */}
              <div className="relative rounded-2xl overflow-hidden h-44 sm:h-52 w-full border border-slate-200 bg-slate-900 group">
                <Image
                  src={website.heroImageUrl || 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=80'}
                  alt="Aperçu Bannière Hero"
                  fill
                  className="object-cover opacity-70 group-hover:scale-102 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent p-5 flex flex-col justify-end text-white">
                  <p className="text-lg sm:text-2xl font-black drop-shadow-md">{website.heroTitle}</p>
                  <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 max-w-xl drop-shadow-sm">{website.heroSubtitle}</p>
                </div>
              </div>

              {/* Suggestions rapides d'images */}
              <div className="space-y-1.5">
                <label className="label-premium">Suggestions rapides de visuels No Borders</label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateWebsite('heroImageUrl', 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=80')}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
                  >
                    🚴 Atelier & Vélo Gravel
                  </button>
                  <button
                    type="button"
                    onClick={() => updateWebsite('heroImageUrl', 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=1200&q=80')}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
                  >
                    🎋 Cadres Bambou Artisanaux
                  </button>
                  <button
                    type="button"
                    onClick={() => updateWebsite('heroImageUrl', 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=1200&q=80')}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
                  >
                    🤝 Tandem Solidaire & Inclusif
                  </button>
                </div>
              </div>

              <div>
                <label className="label-premium">URL de l’image de fond du Hero</label>
                <input
                  type="text"
                  value={website.heroImageUrl}
                  onChange={(e) => updateWebsite('heroImageUrl', e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="input-premium font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-premium">Titre d’accroche Hero</label>
                  <input
                    type="text"
                    value={website.heroTitle}
                    onChange={(e) => updateWebsite('heroTitle', e.target.value)}
                    placeholder="Ex : Pédalez pour un monde sans frontières"
                    className="input-premium"
                  />
                </div>
                <div>
                  <label className="label-premium">Sous-titre descriptif</label>
                  <input
                    type="text"
                    value={website.heroSubtitle}
                    onChange={(e) => updateWebsite('heroSubtitle', e.target.value)}
                    placeholder="Ex : Découvrez nos vélos en bambou..."
                    className="input-premium"
                  />
                </div>
              </div>
            </div>

            {/* 3. Section À Propos & Présentation */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Image & Contenu Section &quot;À Propos&quot;</h4>

              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="relative w-full sm:w-48 h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                  <Image
                    src={website.aboutImageUrl || 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=600&q=80'}
                    alt="Aperçu À Propos"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 w-full space-y-3">
                  <div>
                    <label className="label-premium">URL de l’image &quot;À Propos&quot;</label>
                    <input
                      type="text"
                      value={website.aboutImageUrl}
                      onChange={(e) => updateWebsite('aboutImageUrl', e.target.value)}
                      placeholder="https://..."
                      className="input-premium font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="label-premium">Titre de la section</label>
                    <input
                      type="text"
                      value={website.aboutTitle}
                      onChange={(e) => updateWebsite('aboutTitle', e.target.value)}
                      placeholder="Ex : Une association engagée..."
                      className="input-premium"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="label-premium">Texte de présentation</label>
                <textarea
                  value={website.aboutText}
                  onChange={(e) => updateWebsite('aboutText', e.target.value)}
                  rows={2}
                  className="input-premium resize-none"
                  placeholder="Présentez la mission solidaire de No Borders ASBL..."
                />
              </div>
            </div>

            {/* 4. Bandeau d'Annonce Top Bar */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Bandeau d’Annonce (Haut de page)</h4>
                  <p className="text-[11px] text-slate-400">Message défilant ou alerte visible au sommet du site public.</p>
                </div>
                <input
                  type="checkbox"
                  checked={website.announcementBarEnabled}
                  onChange={(e) => updateWebsite('announcementBarEnabled', e.target.checked)}
                  className="checkbox checkbox-primary"
                />
              </div>
              {website.announcementBarEnabled && (
                <div>
                  <label className="label-premium">Texte du bandeau</label>
                  <input
                    type="text"
                    value={website.announcementBarText}
                    onChange={(e) => updateWebsite('announcementBarText', e.target.value)}
                    placeholder="Ex : 🚴 Portes ouvertes de notre atelier solidaire ce samedi !"
                    className="input-premium"
                  />
                </div>
              )}
            </div>

            {/* 5. Réseaux Sociaux & Copyright */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Réseaux Sociaux & Pied de Page</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label-premium">Lien Facebook</label>
                  <input
                    type="text"
                    value={website.socialFacebook}
                    onChange={(e) => updateWebsite('socialFacebook', e.target.value)}
                    placeholder="https://facebook.com/..."
                    className="input-premium text-xs"
                  />
                </div>
                <div>
                  <label className="label-premium">Lien Instagram</label>
                  <input
                    type="text"
                    value={website.socialInstagram}
                    onChange={(e) => updateWebsite('socialInstagram', e.target.value)}
                    placeholder="https://instagram.com/..."
                    className="input-premium text-xs"
                  />
                </div>
                <div>
                  <label className="label-premium">Lien YouTube</label>
                  <input
                    type="text"
                    value={website.socialYoutube}
                    onChange={(e) => updateWebsite('socialYoutube', e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="input-premium text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="label-premium">Texte de copyright (Pied de page)</label>
                <input
                  type="text"
                  value={website.footerText}
                  onChange={(e) => updateWebsite('footerText', e.target.value)}
                  placeholder="© 2025 No Borders ASBL..."
                  className="input-premium"
                />
              </div>
            </div>
          </div>
        )}

        {/* 1. SHIPPING TAB */}
        {activeTab === 'shipping' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Modes de Livraison & Logistique
              </h3>
              <p className="text-xs text-slate-500">
                Configurez les envois postaux et les retraits en atelier solidaire.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-900">Envoi par colis bpost (Belgique & UE)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Activer la livraison standard avec numéro de suivi.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.shipping.enableBpost}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      shipping: { ...settings.shipping, enableBpost: e.target.checked },
                    })
                  }
                  className="checkbox checkbox-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tarif standard bpost (€)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={settings.shipping.bpostStandardRate}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        shipping: {
                          ...settings.shipping,
                          bpostStandardRate: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Seuil de gratuité des frais de port (€)
                  </label>
                  <input
                    type="number"
                    value={settings.shipping.freeShippingThreshold}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        shipping: {
                          ...settings.shipping,
                          freeShippingThreshold: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-900">Retrait gratuit à l’atelier de l’ASBL</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Permet au client de venir chercher son vélo ou ses accessoires directement sur place.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.shipping.enableWorkshopPickup}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      shipping: {
                        ...settings.shipping,
                        enableWorkshopPickup: e.target.checked,
                      },
                    })
                  }
                  className="checkbox checkbox-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instructions pour le retrait atelier
                </label>
                <textarea
                  rows={2}
                  value={settings.shipping.pickupInstructions}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      shipping: {
                        ...settings.shipping,
                        pickupInstructions: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Passerelles de Paiement Sécurisé
              </h3>
              <p className="text-xs text-slate-500">
                Paiements de la boutique et réception des dons déductibles.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                <div>
                  <p className="font-bold">Mode test</p>
                  <p className="text-[11px] text-amber-700">
                    Aucun paiement réel n’est encaissé tant que ce mode est actif.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.payments.testMode}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payments: { ...settings.payments, testMode: e.target.checked },
                    })
                  }
                  className="toggle toggle-warning"
                />
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Bancontact & Payconiq (via Mollie)</p>
                  <p className="text-[11px] text-slate-500">Méthode favorite en Belgique pour boutique et dons rapides.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.payments.enableMollieBancontact}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payments: {
                        ...settings.payments,
                        enableMollieBancontact: e.target.checked,
                      },
                    })
                  }
                  className="checkbox checkbox-primary"
                />
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Cartes Bancaires Visa & MasterCard (Stripe)</p>
                  <p className="text-[11px] text-slate-500">Paiement international sécurisé 3D-Secure.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.payments.enableStripe}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payments: { ...settings.payments, enableStripe: e.target.checked },
                    })
                  }
                  className="checkbox checkbox-primary"
                />
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Virement Bancaire Manuel (SEPA)</p>
                  <p className="text-[11px] text-slate-500">Idéal pour les dons d’entreprises ou gros montants de vélos adaptés.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.payments.enableBankTransfer}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payments: {
                        ...settings.payments,
                        enableBankTransfer: e.target.checked,
                      },
                    })
                  }
                  className="checkbox checkbox-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Numéro IBAN de l’ASBL
                  </label>
                  <input
                    type="text"
                    value={settings.payments.iban}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payments: { ...settings.payments, iban: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Code BIC / SWIFT
                  </label>
                  <input
                    type="text"
                    value={settings.payments.bic}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payments: { ...settings.payments, bic: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Notifications & Alertes de Gestion
              </h3>
              <p className="text-xs text-slate-500">
                Paramétrez les alertes automatiques envoyées par email aux administrateurs.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email de réception des alertes administrateur
                </label>
                <input
                  type="email"
                  value={settings.notifications.adminNotificationEmail}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        adminNotificationEmail: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Alerte nouvelle commande validée</p>
                  <p className="text-[11px] text-slate-500">Envoi immédiat lors d’un achat de vélo ou équipement.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.notifyAdminNewOrder}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        notifyAdminNewOrder: e.target.checked,
                      },
                    })
                  }
                  className="checkbox checkbox-primary"
                />
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Alerte nouveau don reçu</p>
                  <p className="text-[11px] text-slate-500">Permet au trésorier de préparer l’attestation fiscale sans délai.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.notifyAdminNewDonation}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        notifyAdminNewDonation: e.target.checked,
                      },
                    })
                  }
                  className="checkbox checkbox-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seuil d’alerte pour stock critique (unités restantes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={settings.notifications.notifyLowStockThreshold}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        notifyLowStockThreshold: parseInt(e.target.value, 10) || 1,
                      },
                    })
                  }
                  className="w-48 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. LANGUAGES TAB */}
        {activeTab === 'languages' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Configuration Multilingue (FR / NL / EN)
              </h3>
              <p className="text-xs text-slate-500">
                Support bilingue belge et international pour le site et la boutique No Borders ASBL.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Langue principale par défaut
                </label>
                <select
                  value={settings.general.defaultLocale}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: {
                        ...settings.general,
                        defaultLocale: e.target.value as any,
                      },
                    })
                  }
                  className="w-full sm:w-64 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-semibold"
                >
                  <option value="fr">Français (FR)</option>
                  <option value="nl">Nederlands (NL)</option>
                  <option value="en">English (EN)</option>
                </select>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <p className="text-xs font-bold text-slate-900">Langues actives sur la boutique :</p>
                <div className="flex flex-col sm:flex-row gap-4 text-xs font-medium">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked disabled className="checkbox checkbox-primary" />
                    <span>Français (Obligatoire)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked disabled className="checkbox checkbox-primary" />
                    <span>Nederlands (Flandre & Bruxelles)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked disabled className="checkbox checkbox-primary" />
                    <span>English (International)</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dénomination de l’association
                  </label>
                  <input
                    type="text"
                    value={settings.general.siteName}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, siteName: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email de contact public
                  </label>
                  <input
                    type="email"
                    value={settings.general.contactEmail}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, contactEmail: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Bar */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="submit"
            className="btn-primary-gradient inline-flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer la configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
