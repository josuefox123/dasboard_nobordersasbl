'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KeyRound, Loader2, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

function RecoveryCodeContent() {
  const router = useRouter();
  const [recoveryCode, setRecoveryCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    // Préchauffer CSRF et précharger la destination
    apiClient.warmupCsrf();
    router.prefetch('/dashboard');
  }, [router]);

  const executeSubmit = async (codeToVerify: string) => {
    if (isSubmittingRef.current || isLoading) return;

    const trimmed = codeToVerify.trim();
    const isValidFormat = /^[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(trimmed);
    if (!isValidFormat) {
      setError('Veuillez entrer un code complet au format XXXXX-XXXXX.');
      return;
    }

    isSubmittingRef.current = true;
    setIsLoading(true);
    setError(null);
    const t0 = performance.now();

    try {
      await apiClient.verifyTwoFactor({ recovery_code: trimmed });
      console.debug(`[auth/recovery-code] API: ${Math.round(performance.now() - t0)}ms`);
      router.push('/dashboard');
      // Spinner maintenu jusqu'à navigation effective
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Code de récupération invalide ou déjà utilisé.';
      setError(message);
      setIsLoading(false);
      isSubmittingRef.current = false;
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setError(null);

    // Extraction des seuls caractères alphanumériques (le tiret n'est pas compté dans les 10 caractères)
    const cleaned = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
    const formatted = cleaned.length > 5 ? `${cleaned.slice(0, 5)}-${cleaned.slice(5)}` : cleaned;
    setRecoveryCode(formatted);

    // Déclencher automatiquement la validation dès que les 10 caractères sont complétés
    if (cleaned.length === 10) {
      executeSubmit(formatted);
    }
  };

  const isComplete = /^[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(recoveryCode.trim());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSubmit(recoveryCode.trim());
  };

  return (
    <div className="w-full flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-full bg-[#E8F8F5] text-[#1F6F5C] flex items-center justify-center mb-4">
        <KeyRound className="w-6 h-6 text-[#26B997]" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
        Code de récupération
      </h1>
      <p className="text-sm text-slate-500 mb-6 max-w-sm">
        Saisissez l&apos;un de vos codes de récupération pour accéder à votre espace administrateur.
        Chaque code ne peut être utilisé qu&apos;une seule fois.
      </p>

      {error && (
        <div className="w-full mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center gap-2 justify-center">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
        <div className="w-full mb-6 text-left">
          <input
            ref={inputRef}
            type="text"
            value={recoveryCode}
            onChange={handleCodeChange}
            placeholder="AB12C-DE34F"
            maxLength={11}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            autoFocus
            className="w-full py-3.5 px-4 text-center text-xl sm:text-2xl font-bold font-mono tracking-widest text-slate-900 bg-white border border-slate-200 rounded-xl focus:border-[#26B997] focus:ring-4 focus:ring-[#26B997]/15 transition-all outline-none shadow-sm hover:border-slate-300 placeholder:text-slate-300 placeholder:font-mono uppercase"
          />
          <p className="text-[11px] text-slate-400 text-center mt-2">
            Format attendu : 10 caractères alphanumériques séparés par un tiret (ex. AB12C-DE34F)
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading || !isComplete}
          className="w-full py-3 sm:py-3.5 px-4 rounded-xl font-semibold text-white bg-[#26B997] hover:bg-[#1FA887] active:scale-[0.99] transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-[#26B997]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /><span>Vérification...</span></>
          ) : (
            <><span>Vérifier et continuer</span><ArrowRight className="w-4 h-4" /></>
          )}
        </button>

        <div className="mt-6 pt-4 border-t border-slate-100 w-full text-center">
          <Link href="/otp" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Revenir à la vérification par application (TOTP)</span>
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function RecoveryCodePage() {
  return (
    <Suspense fallback={
      <div className="w-full flex flex-col items-center justify-center py-12">
        <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-center mb-3">
          <Loader2 className="w-5 h-5 text-[#26B997] animate-spin" />
        </div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chargement…</p>
      </div>
    }>
      <RecoveryCodeContent />
    </Suspense>
  );
}
