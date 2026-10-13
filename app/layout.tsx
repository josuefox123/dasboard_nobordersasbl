import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'No Borders ASBL | Administration',
  description: 'Panneau d’administration pour la boutique solidaire et les activités de No Borders ASBL.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" data-theme="noborders" className={fontSans.variable}>
      <body className="min-h-screen bg-[#F4F6FB] text-slate-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
