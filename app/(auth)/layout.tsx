import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between selection:bg-[#E8F8F5] selection:text-[#1F6F5C]">
      {/* Centered Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10 w-full">
        <div className="w-full max-w-[420px] mx-auto animate-fadeIn flex flex-col items-center">
          {/* Logo centré juste au-dessus du formulaire */}
          <Link
            href="/login"
            className="inline-flex items-center justify-center mb-6 sm:mb-8 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#26B997] rounded-xl"
            aria-label="No Borders ASBL Accueil"
          >
            <Image
              src="/logoFichier 2logo_2.png"
              alt="No Borders ASBL"
              width={180}
              height={56}
              className="h-10 sm:h-12 w-auto object-contain"
              priority
            />
          </Link>

          {children}
        </div>
      </main>

      {/* Minimalist Footer */}
      <footer className="w-full py-6 px-4 text-center">
        <div className="flex items-center justify-center gap-6 text-xs text-slate-400">
          <Link
            href="#"
            className="hover:text-slate-600 transition-colors"
          >
            Conditions d&apos;utilisation
          </Link>
          <span className="w-1 h-1 rounded-full bg-slate-300" aria-hidden="true" />
          <Link
            href="#"
            className="hover:text-slate-600 transition-colors"
          >
            Politique de confidentialité
          </Link>
        </div>
      </footer>
    </div>
  );
}
