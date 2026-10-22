'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Veuillez renseigner votre adresse email.');
      return;
    }

    setIsLoading(true);

    // Simulation d'envoi d'email
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 700);
  };

  return (
    <div className="w-full flex flex-col items-center text-center">
      {!isSubmitted ? (
        <>
          {/* Title & Subtitle */}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
            Mot de passe oublié ?
          </h1>
          <p className="text-sm text-slate-500 mb-8 max-w-xs">
            Entrez votre adresse email pour recevoir un lien sécurisé de réinitialisation.
          </p>

          {/* Error Message */}
          {error && (
            <div className="w-full mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center gap-2 justify-center animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 text-left">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
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
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
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
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <span>Envoyer le lien de réinitialisation</span>
              )}
            </button>

            <div className="text-center mt-6">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour à la connexion</span>
              </Link>
            </div>
          </form>
        </>
      ) : (
        /* Confirmation screen */
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-[#E8F8F5] text-[#1F6F5C] flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6 text-[#26B997]" />
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-2">
            Vérifiez votre boîte mail
          </h2>

          <p className="text-sm text-slate-500 mb-6 max-w-xs">
            Nous avons envoyé un lien de réinitialisation à l&apos;adresse{' '}
            <strong className="text-slate-900 font-semibold">{email}</strong>.
          </p>

          <Link
            href="/reset-password"
            className="w-full py-3 sm:py-3.5 px-4 rounded-xl font-semibold text-white bg-[#26B997] hover:bg-[#1FA887] transition-all shadow-sm text-center block mb-4"
          >
            Aller à la page de nouveau mot de passe
          </Link>

          <button
            type="button"
            onClick={() => setIsSubmitted(false)}
            className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            Vous n&apos;avez pas reçu l&apos;email ? Renvoyer
          </button>

          <div className="mt-6 pt-4 border-t border-slate-100 w-full text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour à la connexion</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
