'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Préchauffer CSRF et précharger la page OTP de vérification
    apiClient.warmupCsrf();
    router.prefetch('/otp');
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Veuillez renseigner votre adresse email.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Veuillez renseigner une adresse email valide.');
      return;
    }

    setIsLoading(true);
    const t0 = performance.now();

    try {
      await apiClient.forgotPassword(trimmedEmail);
      console.debug(`[auth/forgot-password] API: ${Math.round(performance.now() - t0)}ms`);

      // Conserver l'email en mémoire d'exécution pour la page OTP
      apiClient.setResetPasswordEmail(trimmedEmail);

      // Redirection automatique immédiate vers la page de saisie du code OTP
      router.push('/otp?flow=reset');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Impossible de traiter votre demande.';
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center text-center">
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
        Mot de passe oublié ?
      </h1>
      <p className="text-sm text-slate-500 mb-8 max-w-xs">
        Entrez votre adresse email pour recevoir un code de réinitialisation.
      </p>

      {error && (
        <div className="w-full mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center gap-2 justify-center animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 text-left">
        <div>
          <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Adresse Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              id="email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              placeholder="admin@nobordersasbl.be"
              className="w-full pl-10 pr-4 py-3 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl focus:border-[#26B997] focus:ring-4 focus:ring-[#26B997]/15 transition-all outline-none shadow-sm hover:border-slate-300 placeholder:text-slate-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-3 sm:py-3.5 px-4 rounded-xl font-semibold text-white bg-[#26B997] hover:bg-[#1FA887] active:scale-[0.99] transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-[#26B997]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /><span>Envoi en cours...</span></>
          ) : (
            <span>Envoyer le code de réinitialisation</span>
          )}
        </button>

        <div className="text-center mt-6">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /><span>Retour à la connexion</span>
          </Link>
        </div>
      </form>
    </div>
  );
}
