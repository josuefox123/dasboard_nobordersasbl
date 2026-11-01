'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Shield,
  KeyRound,
  CheckCircle2,
  Building2,
  MapPin,
  Phone,
  Save,
  Laptop,
  Smartphone,
  Lock,
  Calendar,
  AlertCircle,
  FileCheck2,
  Eye,
  EyeOff,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Loader2,
  RotateCcw,
  Camera,
  X,
  ShieldAlert,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { apiClient, getMediaUrl } from '@/lib/api-client';
import { DashboardUser } from '@/types/dashboard';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';

// ─── Types ────────────────────────────────────────────────────────────────────

type PendingAction =
  | { type: 'info'; nom: string; prenom: string; photo: File | null }
  | { type: 'password'; current_password: string; password: string; password_confirmation: string };

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<DashboardUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'permissions'>('info');

  // ── Infos personnelles (champs connectés au backend) ─────────────────────
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);

  // Photo : fichier sélectionné + aperçu local avant envoi
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // ── Infos NON connectées (pas en base — conservées pour usage futur) ──────
  const [phone, setPhone] = useState('+32 2 456 78 90');
  const [organization, setOrganization] = useState('No Borders ASBL');
  const [location, setLocation] = useState('Bruxelles, Belgique');
  const [bio, setBio] = useState('Coordinateur général et administrateur de la plateforme No Borders ASBL.');
  // Note : email est affiché mais non modifiable depuis cette page (pas dans le contrat API)
  const [email, setEmail] = useState('');

  // ── Mot de passe ──────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // ── Modal de confirmation avant envoi ────────────────────────────────────
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [portalMounted, setPortalMounted] = useState(false);

  // ── 2FA ───────────────────────────────────────────────────────────────────
  const [twoFactorStatus, setTwoFactorStatus] = useState<{
    enabled: boolean;
    remainingCodes: number | null;
    loadingCodes: boolean;
    codesError: boolean;
  }>({
    enabled: true,
    remainingCodes: null,
    loadingCodes: true,
    codesError: false,
  });

  // Modal 1A : Régénérer codes
  const [isRegenModalOpen, setIsRegenModalOpen] = useState(false);
  const [regenPassword, setRegenPassword] = useState('');
  const [showRegenPassword, setShowRegenPassword] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);

  // Modal 1B : Affichage codes générés
  const [isCodesModalOpen, setIsCodesModalOpen] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [hasSavedCodes, setHasSavedCodes] = useState(false);

  // Modal 2 : Réinitialiser 2FA
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // ── Notice globale ────────────────────────────────────────────────────────
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    setPortalMounted(true);
    loadProfile();
  }, []);

  // Fermeture de la modale de confirmation via la touche Échap
  useEffect(() => {
    if (!isConfirmModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        setIsConfirmModalOpen(false);
        setPendingAction(null);
        setSaveError(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConfirmModalOpen, isSaving]);

  const refreshRecoveryCount = async () => {
    setTwoFactorStatus((prev) => ({ ...prev, loadingCodes: true, codesError: false }));
    try {
      const data = await apiClient.getTwoFactorRecoveryCount();
      if (data && typeof data.remaining_count === 'number') {
        setTwoFactorStatus((prev) => ({
          ...prev,
          remainingCodes: data.remaining_count,
          loadingCodes: false,
          codesError: false,
        }));
      } else {
        setTwoFactorStatus((prev) => ({ ...prev, loadingCodes: false, codesError: true }));
      }
    } catch {
      setTwoFactorStatus((prev) => ({ ...prev, loadingCodes: false, codesError: true }));
    }
  };

  async function loadProfile() {
    try {
      const [me, recoveryData, currentUserData] = await Promise.all([
        apiClient.getMe(),
        apiClient.getTwoFactorRecoveryCount(),
        apiClient.getCurrentUser(),
      ]);

      setUser(currentUserData);

      if (me) {
        if (me.nom) setNom(me.nom);
        if (me.prenom) setPrenom(me.prenom);
        if (me.email) setEmail(me.email);
        if ((me as any).profile_photo_url) {
          setProfilePhotoUrl((me as any).profile_photo_url);
        }
      } else if (currentUserData) {
        // Fallback sur les données mock si /auth/me n'est pas disponible
        const parts = currentUserData.name?.split(' ') ?? [];
        setPrenom(parts[0] ?? '');
        setNom(parts.slice(1).join(' ') ?? '');
        setEmail(currentUserData.email);
      }

      const is2faActive =
        typeof (me as any)?.two_factor_enabled === 'boolean'
          ? Boolean((me as any).two_factor_enabled)
          : recoveryData !== null;

      const remaining =
        recoveryData && typeof recoveryData.remaining_count === 'number'
          ? recoveryData.remaining_count
          : null;

      setTwoFactorStatus({
        enabled: is2faActive,
        remainingCodes: remaining,
        loadingCodes: false,
        codesError: is2faActive && recoveryData === null,
      });
    } catch {
      setTwoFactorStatus((prev) => ({ ...prev, loadingCodes: false, codesError: true }));
    } finally {
      setLoading(false);
    }
  }

  // ─── Sélection photo ──────────────────────────────────────────────────────

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setPhotoError('Format non autorisé. Formats acceptés : JPEG, PNG, WEBP, GIF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('La photo ne doit pas dépasser 5 Mo.');
      return;
    }

    setSelectedPhoto(file);
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);
    // Réinitialiser l'input pour permettre de re-sélectionner le même fichier
    e.target.value = '';
  };

  const handleRemoveSelectedPhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setSelectedPhoto(null);
    setPhotoPreview(null);
    setPhotoError(null);
  };

  // ─── Validation locale avant d'ouvrir la modal ───────────────────────────

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setNotice(null);

    const trimNom = nom.trim();
    const trimPrenom = prenom.trim();

    if (!trimNom && !trimPrenom && !selectedPhoto) {
      setNotice({ type: 'error', message: 'Aucune modification détectée.' });
      return;
    }

    setIsSaving(false);
    setPendingAction({ type: 'info', nom: trimNom, prenom: trimPrenom, photo: selectedPhoto });
    setIsConfirmModalOpen(true);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setNotice(null);

    if (!currentPassword) {
      setNotice({ type: 'error', message: 'Veuillez saisir votre mot de passe actuel.' });
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setNotice({ type: 'error', message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setNotice({ type: 'error', message: 'Les nouveaux mots de passe ne correspondent pas.' });
      return;
    }

    setIsSaving(false);
    setPendingAction({ type: 'password', current_password: currentPassword, password: newPassword, password_confirmation: confirmPassword });
    setIsConfirmModalOpen(true);
  };

  // ─── Confirmation et envoi à l'API ───────────────────────────────────────

  const handleConfirmSave = async () => {
    if (!pendingAction || isSaving) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      let result: Awaited<ReturnType<typeof apiClient.updateProfile>>;

      if (pendingAction.type === 'info') {
        result = await apiClient.updateProfile({
          nom: pendingAction.nom || undefined,
          prenom: pendingAction.prenom || undefined,
          photo: pendingAction.photo ?? undefined,
        });
      } else {
        result = await apiClient.updateProfile({
          current_password: pendingAction.current_password,
          password: pendingAction.password,
          password_confirmation: pendingAction.password_confirmation,
        });
      }

      // Fermer la modal et réinitialiser l'état
      setIsConfirmModalOpen(false);
      setPendingAction(null);

      // Mettre à jour l'affichage avec les données retournées
      if (result.user) {
        if (result.user.nom) setNom(result.user.nom);
        if (result.user.prenom) setPrenom(result.user.prenom);
        const newPhotoUrl = result.user.profile_photo_url || (result.user as any).profilePhotoUrl;
        if (newPhotoUrl) {
          setProfilePhotoUrl(newPhotoUrl);
        }
        // Mettre à jour aussi le user DashboardUser pour le hero card
        setUser((prev) => prev ? {
          ...prev,
          name: `${result.user.prenom} ${result.user.nom}`.trim(),
          avatar: newPhotoUrl || prev.avatar,
        } : prev);
      }

      // Nettoyer la photo sélectionnée après succès
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setSelectedPhoto(null);
      setPhotoPreview(null);

      // Nettoyer les champs de mot de passe (ne jamais conserver en mémoire)
      if (pendingAction.type === 'password') {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }

      if (result.password_changed) {
        // Le mot de passe a été modifié : le backend a révoqué toutes les sessions et effacé les cookies.
        // Nettoyer le cache côté frontend et rediriger vers /login.
        setNotice({
          type: 'success',
          message: 'Mot de passe mis à jour avec succès. Déconnexion et redirection vers la connexion...',
        });
        apiClient.clearSessionCache();
        setTimeout(() => router.replace('/login'), 1800);
      } else {
        // Modification des informations personnelles : l'utilisateur reste connecté
        setNotice({
          type: 'success',
          message: result.message || 'Vos informations personnelles ont été mises à jour avec succès.',
        });
        setTimeout(() => setNotice(null), 4000);
      }
    } catch (err: unknown) {
      const message = err instanceof Error
        ? err.message
        : 'Une erreur est survenue lors de la mise à jour.';
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelConfirm = () => {
    if (isSaving) return;
    setIsConfirmModalOpen(false);
    setPendingAction(null);
    setSaveError(null);
    setIsSaving(false);
  };

  // ─── Actions 2FA ─────────────────────────────────────────────────────────

  const handleRegenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regenPassword.trim() || isRegenerating) return;
    setIsRegenerating(true);
    setRegenError(null);
    try {
      const res = await apiClient.regenerateRecoveryCodes(regenPassword.trim());
      setRegenPassword('');
      setIsRegenModalOpen(false);
      setGeneratedCodes(res.recovery_codes || []);
      setTwoFactorStatus((prev) => ({ ...prev, remainingCodes: res.recovery_codes?.length || 8 }));
      setHasSavedCodes(false);
      setIsCodesModalOpen(true);
    } catch (err: unknown) {
      setRegenError(err instanceof Error ? err.message : 'Impossible de régénérer les codes.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopyAllCodes = async () => {
    if (!generatedCodes.length) return;
    try {
      await navigator.clipboard.writeText(generatedCodes.join('\n'));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch { /* fallback silencieux */ }
  };

  const handleCopySingleCode = async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch { /* fallback silencieux */ }
  };

  const handleDownloadCodes = () => {
    if (!generatedCodes.length) return;
    const content = [
      '========================================',
      'NO BORDERS ASBL — CODES DE RÉCUPÉRATION 2FA',
      '========================================',
      `Date de génération : ${new Date().toLocaleString('fr-FR')}`,
      '',
      'Ces codes sont strictement confidentiels et à usage unique.',
      'Conservez-les dans un gestionnaire de mots de passe ou un coffre-fort numérique.',
      '',
      ...generatedCodes.map((code, idx) => `${idx + 1}. ${code}`),
      '',
      '========================================',
    ].join('\r\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `noborders-codes-recuperation-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCloseCodesModal = () => {
    if (!hasSavedCodes) return;
    setGeneratedCodes([]);
    setHasSavedCodes(false);
    setIsCodesModalOpen(false);
    refreshRecoveryCount();
    setNotice({ type: 'success', message: 'Vos 8 nouveaux codes de récupération ont été validés et enregistrés.' });
    setTimeout(() => setNotice(null), 4000);
  };

  const handleResetTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassword.trim() || isResetting) return;
    setIsResetting(true);
    setResetError(null);
    try {
      await apiClient.resetTwoFactor(resetPassword.trim());
      apiClient.clearTwoFactorSetupData();
      setIsResetModalOpen(false);
      setNotice({ type: 'success', message: 'Configuration 2FA réinitialisée. Redirection vers la connexion...' });
      setTimeout(() => router.replace('/login'), 1500);
    } catch (err: unknown) {
      setResetError(err instanceof Error ? err.message : 'Impossible de réinitialiser le 2FA.');
      setIsResetting(false);
    }
  };

  // ─── Photo affichée dans le hero et le formulaire ─────────────────────────

  const displayPhotoSrc = photoPreview || getMediaUrl(profilePhotoUrl);

  // ─── Skeleton loading ─────────────────────────────────────────────────────

  if (loading || !user) {
    return (
      <div className="space-y-6 animate-fade-in pt-6 max-w-5xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  // ─── Rendu ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in pt-6 max-w-5xl">
      {/* Breadcrumb & Titre */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
          <Link href="/dashboard" className="hover:text-slate-700 transition-colors">
            Tableau de bord
          </Link>
          <span>/</span>
          <span className="text-[#1F6F5C]">Mon Profil</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Mon Profil</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Gérez vos informations personnelles, vos paramètres de sécurité et vos autorisations.
        </p>
      </div>

      {/* Notice globale */}
      {notice && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 animate-fade-in ${
            notice.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Hero Card Profil */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-slate-200 shadow-sm bg-slate-100 ring-4 ring-slate-50">
            <Image
              src={displayPhotoSrc}
              alt={user.name}
              width={96}
              height={96}
              className="w-full h-full object-cover"
              priority
              unoptimized={displayPhotoSrc !== '/default-avatar.svg'}
            />
          </div>
          <span
            className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-xs"
            title="Compte Actif"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </span>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              {prenom && nom ? `${prenom} ${nom}` : user.name}
            </h2>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F8F5] text-[#1F6F5C]">
                {user.roleLabel}
              </span>
              <Badge variant="success">Actif</Badge>
            </div>
          </div>
          <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{email || user.email}</span>
            <span className="text-slate-300">·</span>
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>{organization}</span>
          </p>
          <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 pt-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Dernière connexion : {user.lastLogin}</span>
          </p>
        </div>
      </div>

      {/* Onglets Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-px">
        {[
          { id: 'info' as const, icon: <User className="w-4 h-4" />, label: 'Informations personnelles' },
          { id: 'security' as const, icon: <KeyRound className="w-4 h-4" />, label: 'Sécurité & Mot de passe' },
          { id: 'permissions' as const, icon: <Shield className="w-4 h-4" />, label: 'Rôle & Permissions' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all ${
              activeTab === tab.id
                ? 'bg-white border-t border-x border-slate-200 text-[#26B997] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ─── Onglet 1 : Informations personnelles ──────────────────────────── */}
      {activeTab === 'info' && (
        <form
          onSubmit={handleInfoSubmit}
          className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-100 shadow-xs space-y-5 animate-fade-in"
        >
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Coordonnées et Identité</h3>
            <p className="text-xs text-slate-400">
              Ces informations sont visibles par les autres membres de l&apos;équipe d&apos;administration.
            </p>
          </div>

          {/* ── Photo de profil ── */}
          <div>
            <span className="label-premium">Photo de profil</span>
            <div className="flex items-start gap-4 mt-2">
              {/* Aperçu */}
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 shrink-0">
                <Image
                  src={displayPhotoSrc}
                  alt="Aperçu photo de profil"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                  unoptimized={displayPhotoSrc !== '/default-avatar.svg'}
                />
              </div>

              <div className="flex flex-col gap-2">
                {/* Bouton sélectionner */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-[#26B997]" />
                  <span>{selectedPhoto ? 'Changer la photo' : 'Sélectionner une photo'}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />

                {/* Photo sélectionnée en attente */}
                {selectedPhoto && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                    <Check className="w-3.5 h-3.5 text-[#26B997] shrink-0" />
                    <span className="truncate max-w-[160px]">{selectedPhoto.name}</span>
                    <button
                      type="button"
                      onClick={handleRemoveSelectedPhoto}
                      className="ml-auto text-slate-400 hover:text-rose-500 transition-colors"
                      aria-label="Supprimer la sélection"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {photoError && (
                  <p className="text-xs text-rose-600 font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {photoError}
                  </p>
                )}

                <p className="text-[11px] text-slate-400">
                  JPEG, PNG, WEBP ou GIF · 5 Mo maximum
                </p>
              </div>
            </div>
          </div>

          {/* ── Champs connectés au backend ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prenom" className="label-premium">Prénom</label>
              <input
                id="prenom"
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="input-premium"
                placeholder="Ex : Josué"
              />
            </div>

            <div>
              <label htmlFor="nom" className="label-premium">Nom</label>
              <input
                id="nom"
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="input-premium"
                placeholder="Ex : Admin"
              />
            </div>

            {/* ── Champs NON connectés (conservés pour usage futur) ── */}
            <div>
              <label htmlFor="email" className="label-premium flex items-center gap-1.5">
                Adresse email professionnelle
                <span className="text-[10px] font-normal text-slate-400 normal-case tracking-normal">(non modifiable depuis cette page)</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                readOnly
                className="input-premium opacity-60 cursor-not-allowed"
                tabIndex={-1}
              />
            </div>

            <div>
              <label htmlFor="phone" className="label-premium flex items-center gap-1.5">
                Numéro de téléphone
                <span className="text-[10px] font-normal text-slate-400 normal-case tracking-normal">(non synchronisé)</span>
              </label>
              <div className="relative">
                <input
                  id="phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-premium pl-9"
                  placeholder="+32 ..."
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label htmlFor="organization" className="label-premium flex items-center gap-1.5">
                Organisation / ASBL
                <span className="text-[10px] font-normal text-slate-400 normal-case tracking-normal">(non synchronisé)</span>
              </label>
              <div className="relative">
                <input
                  id="organization"
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="input-premium pl-9"
                  placeholder="No Borders ASBL"
                />
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label htmlFor="location" className="label-premium flex items-center gap-1.5">
                Localisation / Ville
                <span className="text-[10px] font-normal text-slate-400 normal-case tracking-normal">(non synchronisé)</span>
              </label>
              <div className="relative">
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="input-premium pl-9"
                  placeholder="Bruxelles, Belgique"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="bio" className="label-premium flex items-center gap-1.5">
                Description & Notes
                <span className="text-[10px] font-normal text-slate-400 normal-case tracking-normal">(non synchronisé)</span>
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="input-premium resize-none"
                placeholder="Quelques mots sur vos responsabilités..."
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button type="submit" className="btn-primary-gradient inline-flex items-center gap-2">
              <Save className="w-4 h-4" />
              <span>Enregistrer les modifications</span>
            </button>
          </div>
        </form>
      )}

      {/* ─── Onglet 2 : Sécurité & Mot de passe ───────────────────────────── */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-fade-in">
          {/* Formulaire changement de mot de passe */}
          <form
            onSubmit={handlePasswordSubmit}
            className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-100 shadow-xs space-y-4"
          >
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Modifier le mot de passe</h3>
              <p className="text-xs text-slate-400">
                Pour garantir la sécurité de votre compte, utilisez au moins 8 caractères avec lettres, chiffres et symboles.
                <strong className="text-slate-600"> Vous serez déconnecté après la modification.</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Mot de passe actuel */}
              <div>
                <label htmlFor="currentPassword" className="label-premium">Mot de passe actuel</label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    type={showCurrentPwd ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input-premium pr-10"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showCurrentPwd ? 'Masquer' : 'Afficher'}
                  >
                    {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Nouveau mot de passe */}
              <div>
                <label htmlFor="newPassword" className="label-premium">Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showNewPwd ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-premium pr-10"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showNewPwd ? 'Masquer' : 'Afficher'}
                  >
                    {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmation */}
              <div>
                <label htmlFor="confirmPassword" className="label-premium">Confirmer le mot de passe</label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPwd ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-premium pr-10"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showConfirmPwd ? 'Masquer' : 'Afficher'}
                  >
                    {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button type="submit" className="btn-primary-gradient inline-flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>Mettre à jour le mot de passe</span>
              </button>
            </div>
          </form>

          {/* 2FA — Statut */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-900">Authentification à deux facteurs (2FA)</h4>
              </div>
              <p className="text-xs text-slate-500 max-w-xl">
                Protection renforcée de votre compte administrateur. Une validation par application d&apos;authentification (TOTP) est requise à chaque connexion.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                twoFactorStatus.enabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${twoFactorStatus.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                {twoFactorStatus.enabled ? 'Activée' : 'Désactivée'}
              </span>
            </div>
          </div>

          {/* 2FA — Codes de récupération */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <KeyRound className="w-4 h-4 text-[#1F6F5C]" />
                  <h4 className="text-sm font-bold text-slate-900">Codes de récupération</h4>
                  {twoFactorStatus.loadingCodes ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin text-[#1F6F5C]" />
                      <span>Chargement...</span>
                    </span>
                  ) : twoFactorStatus.codesError || twoFactorStatus.remainingCodes === null ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-500 border border-slate-200">
                      Compteur indisponible
                    </span>
                  ) : twoFactorStatus.remainingCodes === 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Aucun code disponible
                    </span>
                  ) : twoFactorStatus.remainingCodes === 1 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      1 code disponible
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {twoFactorStatus.remainingCodes} codes disponibles
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 max-w-xl">
                  Gérez vos codes de secours pour retrouver l&apos;accès à votre compte en cas de perte de votre application d&apos;authentification.
                </p>
                {twoFactorStatus.remainingCodes === 0 && !twoFactorStatus.loadingCodes && (
                  <p className="text-xs font-semibold text-rose-600 mt-1">
                    Attention : vous n&apos;avez plus aucun code de secours. Régénérez-en dès maintenant.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setRegenPassword(''); setRegenError(null); setIsRegenModalOpen(true); }}
                disabled={!twoFactorStatus.enabled}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-all inline-flex items-center gap-2 shrink-0 self-start sm:self-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Régénérer les codes</span>
              </button>
            </div>
          </div>

          {/* 2FA — Réinitialiser */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <h4 className="text-sm font-bold text-slate-900">Réinitialiser la double authentification</h4>
                </div>
                <p className="text-xs text-slate-500 max-w-xl">
                  Vous avez perdu l&apos;accès à votre application d&apos;authentification ? Réinitialisez votre configuration 2FA. Vous devrez la configurer à nouveau lors de votre prochaine connexion.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setResetPassword(''); setResetError(null); setIsResetModalOpen(true); }}
                disabled={!twoFactorStatus.enabled}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-all inline-flex items-center gap-2 shrink-0 self-start sm:self-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Réinitialiser le 2FA</span>
              </button>
            </div>
          </div>

          {/* Sessions actives */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900">Sessions de connexion actives</h4>
            <div className="divide-y divide-slate-100">
              <div className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#E8F8F5] text-[#1F6F5C] flex items-center justify-center shrink-0">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Navigateur Chrome · Windows 11 (Session actuelle)</p>
                    <p className="text-[11px] text-slate-400">Bruxelles, Belgique · IP : 194.154.xxx.xx</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  En ligne
                </span>
              </div>
              <div className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Safari · iPhone 15 Pro</p>
                    <p className="text-[11px] text-slate-400">Bruxelles, Belgique · Actif il y a 2 jours</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNotice({ type: 'success', message: 'Session mobile déconnectée.' });
                    setTimeout(() => setNotice(null), 3000);
                  }}
                  className="text-xs font-semibold text-rose-600 hover:underline"
                >
                  Déconnecter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Onglet 3 : Rôle & Permissions ────────────────────────────────── */}
      {activeTab === 'permissions' && (
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-100 shadow-xs space-y-5 animate-fade-in">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-[#26B997]" />
              <h3 className="text-base font-bold text-slate-900">Droits et Autorisations Administrateur</h3>
            </div>
            <p className="text-xs text-slate-400">
              En tant que <strong className="text-slate-700">{user.roleLabel}</strong>, vous disposez d&apos;un accès complet à l&apos;ensemble des fonctionnalités de la plateforme No Borders ASBL.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {[
              { color: 'emerald', label: 'Accès Maître (all_access)', desc: 'Contrôle intégral et gestion complète du système.' },
              { color: 'green', label: 'Gestion des utilisateurs & rôles', desc: 'Ajout, modification de permissions et suspension de comptes.' },
              { color: 'green', label: 'Boutique, Vélo & Stocks', desc: 'Gestion des vélos, pièces détachées et inventaire en temps réel.' },
              { color: 'amber', label: 'Finances, Dons & Fiscalité', desc: 'Émission des attestations fiscales conformes et comptabilité des dons.' },
              { color: 'indigo', label: 'Configuration Globale & Passerelles', desc: 'Paramétrage Stripe, Mollie, frais de port bpost et gestion multilingue FR/NL/EN.', full: true },
            ].map((perm) => (
              <div
                key={perm.label}
                className={`p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3${perm.full ? ' sm:col-span-2' : ''}`}
              >
                <span className={`w-6 h-6 rounded-lg bg-${perm.color}-100 text-${perm.color}-700 flex items-center justify-center shrink-0 mt-0.5`}>
                  <FileCheck2 className="w-3.5 h-3.5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-900">{perm.label}</p>
                  <p className="text-[11px] text-slate-500">{perm.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL DE CONFIRMATION — avant envoi infos ou mot de passe
          Rendue via createPortal pour échapper au stacking context du layout.
          Style identique à la modal de déconnexion globale du Header.
      ═══════════════════════════════════════════════════════════════════ */}
      {portalMounted && isConfirmModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={handleCancelConfirm}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 p-6 text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton fermer */}
            <button
              type="button"
              onClick={handleCancelConfirm}
              disabled={isSaving}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40 cursor-pointer"
              aria-label="Fermer la modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icône */}
            <div className="w-12 h-12 rounded-2xl bg-[#E8F8F5] border border-[#26B997]/20 text-[#26B997] flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>

            {/* Titre */}
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">
              {pendingAction?.type === 'password'
                ? 'Confirmer la modification du mot de passe'
                : 'Confirmer la mise à jour de vos informations'}
            </h3>

            {/* Message */}
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              {pendingAction?.type === 'password' ? (
                <>
                  Vous êtes sur le point de modifier votre mot de passe.
                  Pour des raisons de sécurité,{' '}
                  <strong className="text-slate-700">vous serez automatiquement déconnecté</strong>{' '}
                  après la validation. Vous devrez vous reconnecter avec votre nouveau mot de passe.
                </>
              ) : (
                <>
                  Vous êtes sur le point de mettre à jour vos informations personnelles (nom, prénom ou photo de profil).
                  Vos modifications seront immédiatement enregistrées sur votre compte.
                </>
              )}
            </p>

            {/* Erreur API */}
            {saveError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {/* Boutons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancelConfirm}
                disabled={isSaving}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-60"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#26B997] hover:bg-[#1FA887] text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <span>Confirmer les modifications</span>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* ─── Modal 1A : Régénérer les codes 2FA ───────────────────────────── */}
      <Modal
        isOpen={isRegenModalOpen}
        onClose={() => {
          if (!isRegenerating) { setIsRegenModalOpen(false); setRegenPassword(''); setRegenError(null); }
        }}
        title="Régénérer les codes de récupération"
        description="Confirmez votre identité administrateur pour générer un nouveau jeu de codes de secours."
        maxWidth="md"
      >
        <form onSubmit={handleRegenerateCodes} className="space-y-5">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Attention : invalidation immédiate</p>
              <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                La génération de nouveaux codes invalidera immédiatement tous vos codes de secours actuels.
              </p>
            </div>
          </div>
          <div>
            <label className="label-premium">Mot de passe actuel</label>
            <div className="relative">
              <input
                type={showRegenPassword ? 'text' : 'password'}
                value={regenPassword}
                onChange={(e) => setRegenPassword(e.target.value)}
                className="input-premium pr-10"
                placeholder="••••••••••••"
                disabled={isRegenerating}
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowRegenPassword(!showRegenPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showRegenPassword ? 'Masquer' : 'Afficher'}
              >
                {showRegenPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {regenError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{regenError}</span>
            </div>
          )}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isRegenerating}
              onClick={() => { setIsRegenModalOpen(false); setRegenPassword(''); setRegenError(null); }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!regenPassword.trim() || isRegenerating}
              className="btn-primary-gradient inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRegenerating ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Régénération...</span></>
              ) : (
                <><KeyRound className="w-3.5 h-3.5" /><span>Confirmer et régénérer</span></>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Modal 1B : Affichage des nouveaux codes ──────────────────────── */}
      <Modal
        isOpen={isCodesModalOpen}
        onClose={handleCloseCodesModal}
        title="Vos nouveaux codes de récupération"
        description="Conservez précieusement ces 8 codes dans un endroit sécurisé."
        maxWidth="lg"
      >
        <div className="space-y-5">
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Affichage unique et définitif</p>
              <p className="text-rose-800 text-[11px] mt-0.5 leading-relaxed">
                Ces codes ne pourront plus jamais être récupérés depuis cette interface après la fermeture de cette fenêtre. Vos anciens codes ne fonctionnent plus.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {generatedCodes.map((code, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200/80 font-mono text-xs font-bold text-slate-800 tracking-wider shadow-2xs"
              >
                <span>{code}</span>
                <button
                  type="button"
                  onClick={() => handleCopySingleCode(code, index)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                  title="Copier ce code"
                >
                  {copiedIndex === index ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyAllCodes}
              className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 inline-flex items-center gap-1.5 transition-colors"
            >
              {copiedAll ? <><Check className="w-3.5 h-3.5 text-emerald-600" /><span>Tous copiés !</span></> : <><Copy className="w-3.5 h-3.5" /><span>Tout copier</span></>}
            </button>
            <button
              type="button"
              onClick={handleDownloadCodes}
              className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 inline-flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger (.txt)</span>
            </button>
          </div>
          <label className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer text-xs text-slate-700 select-none">
            <input
              type="checkbox"
              checked={hasSavedCodes}
              onChange={(e) => setHasSavedCodes(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <span className="font-semibold text-slate-800 leading-snug">
              J&apos;ai sauvegardé mes nouveaux codes de récupération.
            </span>
          </label>
          <button
            type="button"
            disabled={!hasSavedCodes}
            onClick={handleCloseCodesModal}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
              hasSavedCodes
                ? 'bg-[#26B997] hover:bg-[#1FA887] text-white cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            Fermer et terminer
          </button>
        </div>
      </Modal>

      {/* ─── Modal 2 : Réinitialiser le 2FA ───────────────────────────────── */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => {
          if (!isResetting) { setIsResetModalOpen(false); setResetPassword(''); setResetError(null); }
        }}
        title="Réinitialiser la double authentification"
        description="Cette opération sensible désactive le 2FA et révoque toutes les sessions en cours."
        maxWidth="md"
      >
        <form onSubmit={handleResetTwoFactor} className="space-y-5">
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Conséquences de la réinitialisation :</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-rose-800 text-[11px] leading-relaxed">
              <li>Votre configuration 2FA actuelle sera immédiatement supprimée.</li>
              <li>Tous vos codes de récupération seront invalidés.</li>
              <li>Toutes vos sessions seront révoquées et vous serez déconnecté.</li>
              <li>Vous devrez reconfigurer le 2FA lors de votre prochaine connexion.</li>
            </ul>
          </div>
          <div>
            <label className="label-premium">Mot de passe actuel</label>
            <div className="relative">
              <input
                type={showResetPassword ? 'text' : 'password'}
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                className="input-premium pr-10"
                placeholder="••••••••••••"
                disabled={isResetting}
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowResetPassword(!showResetPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showResetPassword ? 'Masquer' : 'Afficher'}
              >
                {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {resetError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{resetError}</span>
            </div>
          )}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isResetting}
              onClick={() => { setIsResetModalOpen(false); setResetPassword(''); setResetError(null); }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!resetPassword.trim() || isResetting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              {isResetting ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Réinitialisation...</span></>
              ) : (
                <><RotateCcw className="w-3.5 h-3.5" /><span>Confirmer la réinitialisation</span></>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
