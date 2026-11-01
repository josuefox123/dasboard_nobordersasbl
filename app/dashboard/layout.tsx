'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { apiClient } from '@/lib/api-client';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Récupération de la session en mémoire pour éliminer les écrans de chargement intrusifs lors des navigations
  const cachedUser = apiClient.getCachedUser();
  const isInitiallyAdmin = Boolean(
    cachedUser &&
      (cachedUser.role === 'ADMIN' || cachedUser.role === 'SUPER_ADMIN'),
  );

  // Sécurisation de l'accès : vérification de session active auprès du backend
  const [isAuthorized, setIsAuthorized] = useState<boolean>(isInitiallyAdmin);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(!isInitiallyAdmin);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role: string;
    profile_photo_url?: string | null;
  } | null>(cachedUser || null);

  // Synchronisation dynamique : écouter les mises à jour utilisateur déclenchées par updateProfile
  useEffect(() => {
    const handleUserUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        setCurrentUser((prev) => ({ ...prev, ...customEvent.detail }));
      }
    };
    window.addEventListener('auth:user-updated', handleUserUpdated);
    return () => {
      window.removeEventListener('auth:user-updated', handleUserUpdated);
    };
  }, []);

  useEffect(() => {
    // Préchauffer le cookie CSRF dès que le layout est monté.
    // Toutes les pages du dashboard font des requêtes mutatives (POST/PATCH/DELETE).
    // Sans ce préchauffage, si le cookie CSRF est absent ou expiré, la première
    // action de l'utilisateur échoue avec "jeton CSRF manquant ou invalide" (403).
    apiClient.warmupCsrf();

    let isMounted = true;

    async function verifyAdminSession() {
      try {
        const user = await apiClient.getMe();

        if (!isMounted) return;

        // Autoriser exclusivement les rôles administratifs
        if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
          setCurrentUser(user);
          setIsAuthorized(true);
          setIsCheckingSession(false);
        } else {
          // Non authentifié, session expirée ou rôle insuffisant (ex. USER standard)
          apiClient.clearSessionCache();
          setIsAuthorized(false);
          setIsCheckingSession(false);
          router.replace('/login');
        }
      } catch {
        if (!isMounted) return;
        apiClient.clearSessionCache();
        setIsAuthorized(false);
        setIsCheckingSession(false);
        router.replace('/login');
      }
    }

    verifyAdminSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    const saved = localStorage.getItem('nb_sidebar_collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('nb_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Aucun contenu du dashboard n'est rendu tant que la session n'est pas formellement validée par le backend.
  // Vérification silencieuse : aucun spinner ni texte n'est affiché (redirection vers /login en cas d'échec).
  if (isCheckingSession || !isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <Sidebar
        isOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      <div
        className={`flex flex-col min-h-screen transition-[padding] duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-[70px]' : 'lg:pl-64'
        }`}
      >
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
          user={currentUser}
        />
        <main className="flex-1 px-4 sm:px-8 pb-10 w-full max-w-[1400px] mx-auto">
          <Suspense fallback={null}>{children}</Suspense>
        </main>
      </div>
    </div>
  );
}
