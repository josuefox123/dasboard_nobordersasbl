'use client';

/**
 * /otp — Vérification du code TOTP lors de la connexion standard (2FA déjà activé)
 * ou vérification OTP pour réinitialisation du mot de passe (flow=reset).
 */

import React, { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  KeyRound,
  Loader2,
  AlertCircle,
  Check,
  ArrowLeft,
  Mail,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

/**
 * Masque partiellement l'adresse e-mail pour préserver la confidentialité (ex. ro****@gmail.com)
 */
function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes('@')) return email || '';
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;

  const visibleLength = localPart.length > 2 ? 2 : 1;
  const prefix = localPart.slice(0, visibleLength);
  return `${prefix}****@${domain}`;
}

function OtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isResetFlow = searchParams.get('flow') === 'reset';

  const [resetEmail] = useState<string | null>(() =>
    isResetFlow ? apiClient.getResetPasswordEmail() : null,
  );

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resendCountdown, setResendCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Préchauffer CSRF et précharger les pages suivantes
    apiClient.warmupCsrf();
    router.prefetch('/dashboard');
    router.prefetch('/reset-password');
  }, [router]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (!isResetFlow || resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isResetFlow, resendCountdown]);

  const isSubmittingRef = useRef(false);

  const executeSubmit = async (codeToVerify: string) => {
    if (isSubmittingRef.current || isLoading) return;

    if (codeToVerify.length < 6) {
      setError('Veuillez entrer les 6 chiffres du code.');
      return;
    }

    isSubmittingRef.current = true;
    setIsLoading(true);
    setError(null);
    setResendSuccess(null);
    const t0 = performance.now();

    try {
      if (isResetFlow) {
        // ── CAS B : Récupération de mot de passe ──
        if (!resetEmail) {
          setError('Adresse email introuvable. Veuillez recommencer la demande.');
          setIsLoading(false);
          isSubmittingRef.current = false;
          return;
        }
        await apiClient.verifyResetCode(resetEmail, codeToVerify);
        console.debug(`[auth/otp:reset] API: ${Math.round(performance.now() - t0)}ms`);
        router.push('/reset-password');
      } else {
        // ── CAS A : Vérification TOTP connexion classique ──
        await apiClient.verifyTwoFactor({ code: codeToVerify });
        console.debug(`[auth/otp:totp] API: ${Math.round(performance.now() - t0)}ms`);
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Code de vérification invalide ou expiré.';
      setError(message);
      setOtp(['', '', '', '', '', '']);
      setIsLoading(false);
      isSubmittingRef.current = false;
      inputRefs.current[0]?.focus();
    }
  };

  const handleChange = (index: number, value: string) => {
    const numericValue = value.replace(/\D/g, '');

    // 1. Champ effacé
    if (!numericValue) {
      const next = [...otp];
      next[index] = '';
      setOtp(next);
      return;
    }

    // 2. Gestion du remplissage multi-chiffres (ex: autofill navigateur ou paste direct)
    if (numericValue.length > 1) {
      const digits = numericValue.slice(0, 6).split('');
      const next = [...otp];
      for (let i = 0; i < 6; i++) {
        if (i >= index && digits.length > 0) {
          next[i] = digits.shift() || '';
        }
      }
      setOtp(next);
      setError(null);
      setResendSuccess(null);

      const fullCode = next.join('');
      if (fullCode.length === 6) {
        executeSubmit(fullCode);
      } else {
        const nextEmpty = next.findIndex((d) => d === '');
        inputRefs.current[nextEmpty !== -1 ? nextEmpty : 5]?.focus();
      }
      return;
    }

    // 3. Saisie d'un chiffre unique
    const next = [...otp];
    next[index] = numericValue;
    setOtp(next);
    setError(null);
    setResendSuccess(null);

    const fullCode = next.join('');
    if (fullCode.length === 6) {
      executeSubmit(fullCode);
    } else if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const next = [...otp];
        next[index - 1] = '';
        setOtp(next);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const next = [...otp];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || '';
    }
    setOtp(next);
    setError(null);
    setResendSuccess(null);

    if (pasted.length === 6) {
      executeSubmit(pasted);
    } else {
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleResendResetCode = async () => {
    if (resendCountdown > 0 || isResending || !resetEmail) return;
    setIsResending(true);
    setError(null);
    setResendSuccess(null);
    try {
      const response = await apiClient.forgotPassword(resetEmail);
      setResendSuccess(response.message || 'Un nouveau code a été envoyé.');
      setResendCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Impossible de renvoyer le code.');
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSubmit(otp.join(''));
  };

  // ── Écran : email manquant pour flow=reset ──
  if (isResetFlow && !resetEmail) {
    return (
      <div className="w-full flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-amber-500" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-2">
          Session de récupération introuvable
        </h1>
        <p className="text-sm text-slate-500 mb-6 max-w-sm">
          Aucune adresse email n&apos;est associée à cette demande.
          Veuillez recommencer la procédure depuis le début.
        </p>
        <Link
          href="/forgot-password"
          className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-[#26B997] hover:bg-[#1FA887] transition-all shadow-sm text-center block mb-4"
        >
          Recommencer la demande
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour à la connexion</span>
        </Link>
      </div>
    );
  }

  // ── Écran : Récupération de mot de passe ──
  if (isResetFlow) {
    return (
      <div className="w-full flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-[#E8F8F5] flex items-center justify-center mb-4">
          <KeyRound className="w-6 h-6 text-[#26B997]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
          Récupération du mot de passe
        </h1>
        <p className="text-sm text-slate-500 mb-2 max-w-sm">
          Saisissez le code à 6 chiffres envoyé à votre adresse email.
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-700 mb-6">
          <Mail className="w-3.5 h-3.5 text-slate-500" />
          <span>{maskEmail(resetEmail)}</span>
        </div>

        {error && (
          <div className="w-full mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center gap-2 justify-center">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {resendSuccess && (
          <div className="w-full mb-6 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2 justify-center">
            <Check className="w-4 h-4 shrink-0" />
            <span>{resendSuccess}</span>
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
                aria-label={`Chiffre ${idx + 1}`}
                className="w-11 h-13 sm:w-13 sm:h-14 text-center text-xl sm:text-2xl font-bold font-mono text-slate-900 bg-white border border-slate-200 rounded-xl focus:border-[#26B997] focus:ring-4 focus:ring-[#26B997]/15 transition-all outline-none shadow-sm hover:border-slate-300"
              />
            ))}
          </div>
          <button
            type="submit"
            disabled={isLoading || otp.join('').length < 6}
            className="w-full py-3 sm:py-3.5 px-4 rounded-xl font-semibold text-white bg-[#26B997] hover:bg-[#1FA887] active:scale-[0.99] transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-[#26B997]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span>Vérification...</span></>
            ) : (
              <span>Vérifier le code</span>
            )}
          </button>
          <div className="mt-6 flex flex-col items-center gap-1.5">
            <span className="text-xs text-slate-500">Vous n&apos;avez pas reçu le code ?</span>
            <button
              type="button"
              onClick={handleResendResetCode}
              disabled={resendCountdown > 0 || isResending}
              className="text-xs font-semibold text-[#26B997] hover:text-[#1FA887] disabled:text-slate-400 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {isResending ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Envoi...</span></>
              ) : resendCountdown > 0 ? (
                <span>Renvoyer ({resendCountdown}s)</span>
              ) : (
                <span className="underline underline-offset-2">Renvoyer un nouveau code</span>
              )}
            </button>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 w-full text-center">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /><span>Retour à la connexion</span>
            </Link>
          </div>
        </form>
      </div>
    );
  }

  // ── Écran principal : Vérification TOTP connexion classique ──
  return (
    <div className="w-full flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-full bg-[#E8F8F5] flex items-center justify-center mb-4">
        <ShieldCheck className="w-6 h-6 text-[#26B997]" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
        Ouvrez votre application d&apos;authentification
      </h1>
      <p className="text-sm text-slate-500 mb-6 max-w-sm">
        Entrez le code à 6 chiffres affiché par votre application pour accéder à votre espace administrateur.
      </p>

      {error && (
        <div className="w-full mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center gap-2 justify-center">
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
              aria-label={`Chiffre ${idx + 1}`}
              className="w-11 h-13 sm:w-13 sm:h-14 text-center text-xl sm:text-2xl font-bold font-mono text-slate-900 bg-white border border-slate-200 rounded-xl focus:border-[#26B997] focus:ring-4 focus:ring-[#26B997]/15 transition-all outline-none shadow-sm hover:border-slate-300"
            />
          ))}
        </div>
        <button
          type="submit"
          disabled={isLoading || otp.join('').length < 6}
          className="w-full py-3 sm:py-3.5 px-4 rounded-xl font-semibold text-white bg-[#26B997] hover:bg-[#1FA887] active:scale-[0.99] transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-[#26B997]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /><span>Vérification...</span></>
          ) : (
            <span>Vérifier</span>
          )}
        </button>
        <div className="mt-6 text-center">
          <Link
            href="/recovery-code"
            className="text-xs sm:text-sm font-medium text-slate-600 hover:text-[#1F6F5C] transition-colors inline-flex items-center gap-1.5"
          >
            <span>Vous avez perdu votre téléphone ?</span>
            <span className="font-semibold text-[#1F6F5C] underline underline-offset-2">
              Utiliser un code de récupération
            </span>
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function OtpPage() {
  return (
    <Suspense fallback={
      <div className="w-full flex flex-col items-center justify-center py-12">
        <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-center mb-3">
          <Loader2 className="w-5 h-5 text-[#26B997] animate-spin" />
        </div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chargement…</p>
      </div>
    }>
      <OtpContent />
    </Suspense>
  );
}
