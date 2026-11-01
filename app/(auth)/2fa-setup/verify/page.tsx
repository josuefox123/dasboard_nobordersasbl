'use client';

/**
 * /2fa-setup/verify — Étape 2 : Confirmation du premier code TOTP
 * Active définitivement le 2FA et affiche les codes de récupération.
 */

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Loader2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  Lock,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function TwoFactorVerifyPage() {
  const router = useRouter();

  const [hasSetupData, setHasSetupData] = useState<boolean | null>(null);
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [copiedAllCodes, setCopiedAllCodes] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const data = apiClient.getTwoFactorSetupData();
    if (!data) { setHasSetupData(false); return; }
    setHasSetupData(true);
    // Préchauffer CSRF et précharger /dashboard pendant que l'utilisateur saisit son code
    apiClient.warmupCsrf();
    router.prefetch('/dashboard');
  }, [router]);

  useEffect(() => {
    if (hasSetupData && !recoveryCodes) {
      inputRefs.current[0]?.focus();
    }
  }, [hasSetupData, recoveryCodes]);

  // ── Gestion OTP ──
  const handleChange = (index: number, value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) {
      const next = [...otp]; next[index] = ''; setOtp(next); return;
    }
    const next = [...otp];
    next[index] = numericValue.slice(-1);
    setOtp(next);
    setError(null);
    if (index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] || '';
    setOtp(next);
    setError(null);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // ── Soumission ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fullCode = otp.join('');
    if (fullCode.length < 6) {
      setError('Veuillez entrer les 6 chiffres du code TOTP.');
      return;
    }

    setIsLoading(true);
    const t0 = performance.now();

    try {
      const response = await apiClient.confirmTwoFactor(fullCode);
      console.debug(`[auth/2fa-setup/verify] API: ${Math.round(performance.now() - t0)}ms`);
      setRecoveryCodes(response.recovery_codes);
      // isLoading reste false ici — on affiche les codes de récupération
      setIsLoading(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Code TOTP invalide. Vérifiez l'heure de votre appareil et réessayez.";
      setError(message);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setIsLoading(false);
    }
  };

  const handleCopyAllRecoveryCodes = () => {
    if (recoveryCodes) {
      navigator.clipboard.writeText(recoveryCodes.join('\n')).then(() => {
        setCopiedAllCodes(true);
        setTimeout(() => setCopiedAllCodes(false), 2500);
      });
    }
  };

  const handleGoToDashboard = () => {
    setIsRedirecting(true);
    router.push('/dashboard');
  };

  // ── Données manquantes ──
  if (hasSetupData === false) {
    return (
      <div className="w-full flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-amber-500" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-2">
          Session de configuration expirée
        </h1>
        <p className="text-sm text-slate-500 mb-6 max-w-sm">
          Les données de configuration 2FA ne sont plus disponibles.
          Veuillez recommencer depuis le début.
        </p>
        <Link
          href="/login"
          className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-[#26B997] hover:bg-[#1FA887] transition-all shadow-sm text-center block"
        >
          Recommencer la connexion
        </Link>
      </div>
    );
  }

  // ── Chargement initial ──
  if (hasSetupData === null) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-16">
        <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-center mb-3">
          <Loader2 className="w-5 h-5 text-[#26B997] animate-spin" />
        </div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chargement…</p>
      </div>
    );
  }

  // ── Codes de récupération ──
  if (recoveryCodes) {
    return (
      <div className="w-full flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#E8F8F5] flex items-center justify-center mb-5 shadow-sm">
          <ShieldCheck className="w-7 h-7 text-[#26B997]" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-2">
          2FA activé avec succès !
        </h1>
        <p className="text-sm text-slate-500 mb-2 max-w-sm leading-relaxed">
          Votre compte est maintenant protégé. Conservez ces codes de secours dans un endroit sûr.
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-[11px] font-bold text-amber-700 mb-6">
          <AlertCircle className="w-3 h-3" />
          <span>Chaque code ne peut être utilisé qu&apos;une seule fois</span>
        </div>

        <div className="w-full max-w-sm mb-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-2 gap-2 font-mono text-xs font-semibold text-slate-800">
          {recoveryCodes.map((code, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-lg py-2 px-3 text-center select-all tracking-wider shadow-sm">
              {code}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleCopyAllRecoveryCodes}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-6 transition-colors cursor-pointer"
        >
          {copiedAllCodes ? (
            <><Check className="w-3.5 h-3.5 text-[#26B997]" /><span className="text-[#26B997]">Codes copiés !</span></>
          ) : (
            <><Copy className="w-3.5 h-3.5 text-slate-400" /><span>Copier tous les codes</span></>
          )}
        </button>

        <button
          type="button"
          onClick={handleGoToDashboard}
          disabled={isRedirecting}
          className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-[#26B997] hover:bg-[#1FA887] active:scale-[0.99] transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-[#26B997]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
        >
          {isRedirecting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /><span>Redirection…</span></>
          ) : (
            <><span>Accéder au tableau de bord</span><ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </div>
    );
  }

  // ── Saisie du code TOTP ──
  return (
    <div className="w-full flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#E8F8F5] flex items-center justify-center mb-5 shadow-sm">
        <Lock className="w-7 h-7 text-[#26B997]" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
        Vérification de votre authentification
      </h1>
      <p className="text-sm text-slate-500 mb-2 max-w-sm leading-relaxed">
        Saisissez le code à 6 chiffres affiché dans votre application d&apos;authentification
        pour terminer la configuration.
      </p>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-7">
        <span className="w-4 h-4 rounded-full bg-[#26B997] text-white flex items-center justify-center text-[9px] font-black">2</span>
        <span>Étape 2 sur 2</span>
      </div>

      {error && (
        <div className="w-full mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center gap-2 justify-center">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
        <div className="flex items-center justify-between gap-2 sm:gap-2.5 w-full mb-6">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => { inputRefs.current[idx] = el; }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              autoComplete="one-time-code"
              aria-label={`Chiffre ${idx + 1} du code TOTP`}
              className="w-11 h-13 sm:w-13 sm:h-14 text-center text-xl sm:text-2xl font-bold font-mono text-slate-900 bg-white border border-slate-200 rounded-xl focus:border-[#26B997] focus:ring-4 focus:ring-[#26B997]/15 transition-all outline-none shadow-sm hover:border-slate-300"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={isLoading || otp.join('').length < 6}
          className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-[#26B997] hover:bg-[#1FA887] active:scale-[0.99] transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-[#26B997]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /><span>Activation…</span></>
          ) : (
            <><ShieldCheck className="w-4 h-4" /><span>Confirmer et activer la protection</span></>
          )}
        </button>
      </form>

      <div className="mt-5 pt-4 border-t border-slate-100 w-full text-center">
        <Link href="/2fa-setup" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /><span>Retour au QR code</span>
        </Link>
      </div>
    </div>
  );
}
