'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, Check, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Criteria validation
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasMinLength || !hasUppercase || !hasNumber) {
      setError('Veuillez respecter tous les critères de sécurité pour votre mot de passe.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe saisis ne sont pas identiques.');
      return;
    }

    setIsLoading(true);

    // Simulation de réinitialisation
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }, 800);
  };

  return (
    <div className="w-full flex flex-col items-center text-center">
      {!isSuccess ? (
        <>
          {/* Title & Subtitle */}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
            Nouveau mot de passe
          </h1>
          <p className="text-sm text-slate-500 mb-8 max-w-xs">
            Définissez un mot de passe robuste pour protéger votre compte.
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
            {/* Nouveau mot de passe */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl focus:border-[#26B997] focus:ring-4 focus:ring-[#26B997]/15 transition-all outline-none shadow-sm hover:border-slate-300 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors p-0.5 focus:outline-none"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmer le mot de passe */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl focus:border-[#26B997] focus:ring-4 focus:ring-[#26B997]/15 transition-all outline-none shadow-sm hover:border-slate-300 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors p-0.5 focus:outline-none"
                  aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Critères de sécurité */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                    hasMinLength ? 'bg-[#26B997] text-white' : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span className={hasMinLength ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                  Au moins 8 caractères
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                    hasUppercase ? 'bg-[#26B997] text-white' : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span className={hasUppercase ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                  Au moins une majuscule
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                    hasNumber ? 'bg-[#26B997] text-white' : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span className={hasNumber ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                  Au moins un chiffre
                </span>
              </div>

              {confirmPassword.length > 0 && (
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                      passwordsMatch ? 'bg-[#26B997] text-white' : 'bg-red-200 text-red-600'
                    }`}
                  >
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span className={passwordsMatch ? 'text-slate-900 font-medium' : 'text-red-500'}>
                    {passwordsMatch ? 'Les mots de passe correspondent' : 'Les mots de passe ne correspondent pas'}
                  </span>
                </div>
              )}
            </div>

            {/* Bouton de mise à jour */}
            <button
              type="submit"
              disabled={isLoading || !hasMinLength || !hasUppercase || !hasNumber || !passwordsMatch}
              className="w-full mt-2 py-3 sm:py-3.5 px-4 rounded-xl font-semibold text-white bg-[#26B997] hover:bg-[#1FA887] active:scale-[0.99] transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-[#26B997]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <span>Mettre à jour le mot de passe</span>
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
        /* Confirmation de succès */
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-[#E8F8F5] text-[#1F6F5C] flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6 text-[#26B997]" />
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-2">
            Mot de passe mis à jour !
          </h2>

          <p className="text-sm text-slate-500 mb-6 max-w-xs">
            Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers la page de connexion.
          </p>

          <Link
            href="/login"
            className="w-full py-3 sm:py-3.5 px-4 rounded-xl font-semibold text-white bg-[#26B997] hover:bg-[#1FA887] transition-all shadow-sm text-center block"
          >
            Se connecter maintenant
          </Link>
        </div>
      )}
    </div>
  );
}
