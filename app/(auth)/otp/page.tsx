'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight, KeyRound, Loader2, AlertCircle } from 'lucide-react';

export default function OtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input automatically
    if (!useRecoveryCode) {
      inputRefs.current[0]?.focus();
    }
  }, [useRecoveryCode]);

  const handleChange = (index: number, value: string) => {
    // Keep only numeric characters
    const numericValue = value.replace(/\D/g, '');

    if (!numericValue) {
      const nextOtp = [...otp];
      nextOtp[index] = '';
      setOtp(nextOtp);
      return;
    }

    // If typing single digit
    const char = numericValue.slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = char;
    setOtp(nextOtp);
    setError(null);

    // Auto-focus next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const nextOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      nextOtp[i] = pastedData[i];
    }
    setOtp(nextOtp);
    setError(null);

    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (useRecoveryCode) {
      if (!recoveryCode.trim() || recoveryCode.trim().length < 8) {
        setError('Veuillez renseigner un code de secours valide (ex: ABCD-1234).');
        return;
      }
    } else {
      const fullCode = otp.join('');
      if (fullCode.length < 6) {
        setError('Veuillez entrer les 6 chiffres du code d’authentification.');
        return;
      }
    }

    setIsLoading(true);

    // Simuler la validation 2FA
    setTimeout(() => {
      setIsLoading(false);
      router.push('/dashboard');
    }, 800);
  };

  return (
    <div className="w-full flex flex-col items-center text-center">
      {/* Title & Subtitle */}
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
        {useRecoveryCode
          ? 'Code de secours 2FA'
          : 'Ouvrez votre application d’authentification'}
      </h1>

      <p className="text-sm text-slate-500 mb-8 max-w-xs">
        {useRecoveryCode
          ? 'Entrez l’un de vos codes de secours à usage unique.'
          : 'Entrez le code à 6 chiffres.'}
      </p>

      {/* Error message */}
      {error && (
        <div className="w-full mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center gap-2 justify-center animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
        {!useRecoveryCode ? (
          /* 6-digit OTP Inputs */
          <div className="flex items-center justify-between gap-2 sm:gap-2.5 w-full mb-6">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
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
        ) : (
          /* Recovery code input */
          <div className="w-full mb-6 text-left">
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={recoveryCode}
                onChange={(e) => {
                  setRecoveryCode(e.target.value);
                  setError(null);
                }}
                placeholder="ex. ABCD-EFGH-1234"
                autoFocus
                className="w-full pl-10 pr-4 py-3 text-sm font-mono text-slate-900 bg-white border border-slate-200 rounded-xl focus:border-[#26B997] focus:ring-4 focus:ring-[#26B997]/15 transition-all outline-none shadow-sm hover:border-slate-300"
              />
            </div>
          </div>
        )}

        {/* Primary Action Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 sm:py-3.5 px-4 rounded-xl font-semibold text-white bg-[#26B997] hover:bg-[#1FA887] active:scale-[0.99] transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-[#26B997]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Vérification...</span>
            </>
          ) : (
            <span>Vérifier</span>
          )}
        </button>

        {/* Switch to Recovery Code */}
        <button
          type="button"
          onClick={() => {
            setUseRecoveryCode(!useRecoveryCode);
            setError(null);
          }}
          className="mt-6 text-sm font-medium text-slate-700 hover:text-[#1F6F5C] transition-colors focus:outline-none"
        >
          {useRecoveryCode
            ? 'Utiliser l’application d’authentification à la place'
            : 'Utiliser un code de secours à la place'}
        </button>

        {/* Lost 2FA link */}
        <div className="mt-6 text-xs text-slate-500">
          <span>Accès perdu à votre méthode 2FA ? </span>
          <Link
            href="/contacts"
            className="font-medium text-slate-900 hover:text-[#1F6F5C] underline underline-offset-2 transition-colors"
          >
            Lancer la récupération 2FA
          </Link>
        </div>
      </form>
    </div>
  );
}
