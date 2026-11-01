'use client';

/**
 * /2fa-setup — Étape 1 : Configuration initiale du 2FA
 * Affiche le QR code TOTP et la clé manuelle. Aucun champ OTP sur cette page.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Smartphone,
  Copy,
  Check,
  ArrowRight,
  AlertCircle,
  Loader2,
  ArrowLeft,
  QrCode,
  KeyRound,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function TwoFactorSetupPage() {
  const router = useRouter();

  const [setupData, setSetupData] = useState<{
    qr_uri: string;
    qr_code_svg: string;
    manual_key: string;
  } | null>(null);

  const [copiedKey, setCopiedKey] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const data = apiClient.getTwoFactorSetupData();
    if (!data) {
      router.replace('/login');
      return;
    }
    setSetupData(data);
    // Précharger l'étape 2 dès que l'étape 1 est affichée
    router.prefetch('/2fa-setup/verify');
  }, [router]);

  const handleCopyManualKey = () => {
    if (setupData?.manual_key) {
      navigator.clipboard.writeText(setupData.manual_key).then(() => {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2500);
      }).catch(() => {});
    }
  };

  const handleNext = () => {
    setIsNavigating(true);
    router.push('/2fa-setup/verify');
  };

  if (!setupData) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-16">
        <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-center mb-3">
          <Loader2 className="w-5 h-5 text-[#26B997] animate-spin" />
        </div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#E8F8F5] flex items-center justify-center mb-5 shadow-sm">
        <ShieldCheck className="w-7 h-7 text-[#26B997]" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
        Sécurisez votre compte
      </h1>
      <p className="text-sm text-slate-500 mb-1 max-w-sm leading-relaxed">
        Configurez votre application d&apos;authentification pour protéger votre accès administrateur.
      </p>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-7">
        <span className="w-4 h-4 rounded-full bg-[#26B997] text-white flex items-center justify-center text-[9px] font-black">1</span>
        <span>Étape 1 sur 2</span>
      </div>

      {/* Instructions numérotées */}
      <div className="w-full max-w-sm mb-6 text-left space-y-3">
        {[
          { text: <><span className="font-semibold text-slate-800">Installez Google Authenticator</span>, <span className="font-semibold text-slate-800">Microsoft Authenticator</span> ou toute application TOTP compatible.</> },
          { text: <>Ouvrez votre application, appuyez sur <span className="font-semibold text-slate-800">« Ajouter un compte »</span> puis <span className="font-semibold text-slate-800">« Scanner un QR code »</span>.</> },
          { text: <>Scannez le QR code ci-dessous. Un code à 6 chiffres apparaîtra et se renouvelle toutes les <span className="font-semibold text-slate-800">30 secondes</span>.</> },
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#E8F8F5] flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[10px] font-black text-[#1F6F5C]">{i + 1}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{step.text}</p>
          </div>
        ))}
      </div>

      {/* QR code */}
      <div className="w-full max-w-xs mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(setupData.qr_code_svg)}`}
            alt="QR code de configuration 2FA"
            width={208}
            height={208}
            className="w-52 h-52 rounded-xl block"
            style={{ imageRendering: 'pixelated' }}
          />

          <div className="w-full border-t border-slate-100" />

          {/* Clé manuelle */}
          <div className="w-full">
            <div className="flex items-center gap-1.5 mb-1.5">
              <KeyRound className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Configuration manuelle
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2 text-left">
              Si vous ne pouvez pas scanner le QR code, entrez cette clé manuellement.
            </p>
            <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <span className="font-mono text-xs font-semibold text-slate-800 break-all select-all tracking-wider">
                {setupData.manual_key}
              </span>
              <button
                type="button"
                onClick={handleCopyManualKey}
                aria-label="Copier la clé secrète"
                className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer shrink-0"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-[#26B997]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            {copiedKey && (
              <p className="text-[10px] text-[#26B997] font-semibold mt-1.5 text-center">✓ Clé copiée</p>
            )}
          </div>
        </div>
      </div>

      {/* Avertissement */}
      <div className="w-full max-w-sm mb-6 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 text-left">
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-700 leading-relaxed">
          <span className="font-bold">Ne perdez pas votre accès.</span>{' '}
          Une fois la configuration terminée, des codes de secours vous seront fournis. Conservez-les.
        </p>
      </div>

      {/* Bouton Suivant */}
      <button
        type="button"
        onClick={handleNext}
        disabled={isNavigating}
        className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-[#26B997] hover:bg-[#1FA887] active:scale-[0.99] transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-[#26B997]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isNavigating ? (
          <><Loader2 className="w-4 h-4 animate-spin" /><span>Chargement…</span></>
        ) : (
          <><span>J&apos;ai scanné le QR code — Suivant</span><ArrowRight className="w-4 h-4" /></>
        )}
      </button>

      <div className="mt-5 pt-4 border-t border-slate-100 w-full text-center">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /><span>Retour à la connexion</span>
        </Link>
      </div>
    </div>
  );
}
