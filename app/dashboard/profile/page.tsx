'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { DashboardUser } from '@/types/dashboard';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ProfilePage() {
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'permissions'>('info');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+32 2 456 78 90');
  const [organization, setOrganization] = useState('No Borders ASBL');
  const [location, setLocation] = useState('Bruxelles, Belgique');
  const [bio, setBio] = useState('Coordinateur général et administrateur de la plateforme No Borders ASBL.');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // Notice
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = await apiClient.getCurrentUser();
      setUser(data);
      setName(data.name);
      setEmail(data.email);
    } finally {
      setLoading(false);
    }
  }

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setNotice({ type: 'error', message: 'Le nom et l’adresse email sont obligatoires.' });
      return;
    }

    try {
      const updated = await apiClient.updateCurrentUser({
        name: name.trim(),
        email: email.trim(),
      });
      setUser(updated);
      setNotice({ type: 'success', message: 'Vos informations de profil ont été enregistrées avec succès.' });
      setTimeout(() => setNotice(null), 3500);
    } catch {
      setNotice({ type: 'error', message: 'Une erreur est survenue lors de l’enregistrement.' });
    }
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setNotice({ type: 'error', message: 'Veuillez saisir votre mot de passe actuel.' });
      return;
    }
    if (newPassword.length < 8) {
      setNotice({ type: 'error', message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setNotice({ type: 'error', message: 'Les nouveaux mots de passe ne correspondent pas.' });
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setNotice({ type: 'success', message: 'Votre mot de passe a été modifié avec succès.' });
    setTimeout(() => setNotice(null), 3500);
  };

  if (loading || !user) {
    return (
      <div className="space-y-6 animate-fade-in pt-6 max-w-5xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

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
              src="/default-avatar.svg"
              alt={user.name}
              width={96}
              height={96}
              className="w-full h-full object-cover"
              priority
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
            <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F8F5] text-[#1F6F5C]">
                {user.roleLabel}
              </span>
              <Badge variant="success">Actif</Badge>
            </div>
          </div>

          <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{user.email}</span>
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
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all ${
            activeTab === 'info'
              ? 'bg-white border-t border-x border-slate-200 text-[#26B997] shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Informations personnelles</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all ${
            activeTab === 'security'
              ? 'bg-white border-t border-x border-slate-200 text-[#26B997] shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Sécurité & Mot de passe</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('permissions')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all ${
            activeTab === 'permissions'
              ? 'bg-white border-t border-x border-slate-200 text-[#26B997] shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Rôle & Permissions</span>
        </button>
      </div>

      {/* CONTENU ONGLETS */}

      {/* 1. Informations Personnelles */}
      {activeTab === 'info' && (
        <form onSubmit={handleSaveInfo} className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-100 shadow-xs space-y-5 animate-fade-in">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Coordonnées et Identité</h3>
            <p className="text-xs text-slate-400">Ces informations sont visibles par les autres membres de l’équipe d’administration.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-premium">Nom complet</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-premium"
                placeholder="Ex : Josué Admin"
                required
              />
            </div>

            <div>
              <label className="label-premium">Adresse email professionnelle</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-premium"
                placeholder="direction@nobordersasbl.be"
                required
              />
            </div>

            <div>
              <label className="label-premium">Numéro de téléphone</label>
              <div className="relative">
                <input
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
              <label className="label-premium">Organisation / ASBL</label>
              <div className="relative">
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="input-premium pl-9"
                  placeholder="No Borders ASBL"
                />
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="label-premium">Localisation / Ville</label>
              <div className="relative">
                <input
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
              <label className="label-premium">Description & Notes</label>
              <textarea
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

      {/* 2. Sécurité & Mot de Passe */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-fade-in">
          {/* Formulaire Changement de mot de passe */}
          <form onSubmit={handleSavePassword} className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-100 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Modifier le mot de passe</h3>
              <p className="text-xs text-slate-400">Pour garantir la sécurité de votre compte, utilisez au moins 8 caractères avec chiffres et symboles.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label-premium">Mot de passe actuel</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-premium"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="label-premium">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-premium"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="label-premium">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-premium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button type="submit" className="btn-primary-gradient inline-flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>Mettre à jour le mot de passe</span>
              </button>
            </div>
          </form>

          {/* Authentification 2FA */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-900">Authentification à deux facteurs (2FA)</h4>
              </div>
              <p className="text-xs text-slate-500">
                Protégez les accès sensibles de votre tableau de bord grâce à une validation via code temporaire (OTP).
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setTwoFactorEnabled(!twoFactorEnabled);
                setNotice({
                  type: 'success',
                  message: twoFactorEnabled ? '2FA temporairement désactivé.' : '2FA activé avec succès.',
                });
                setTimeout(() => setNotice(null), 3000);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                twoFactorEnabled
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {twoFactorEnabled ? '✓ Activé' : 'Désactivé'}
            </button>
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

      {/* 3. Rôle & Permissions */}
      {activeTab === 'permissions' && (
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-100 shadow-xs space-y-5 animate-fade-in">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-[#26B997]" />
              <h3 className="text-base font-bold text-slate-900">Droits et Autorisations Administrateur</h3>
            </div>
            <p className="text-xs text-slate-400">
              En tant que <strong className="text-slate-700">{user.roleLabel}</strong>, vous disposez d’un accès complet à l’ensemble des fonctionnalités de la plateforme No Borders ASBL.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <FileCheck2 className="w-3.5 h-3.5" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900">Accès Maître (all_access)</p>
                <p className="text-[11px] text-slate-500">Contrôle intégral et gestion complète du système.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-[#E8F8F5] text-[#1F6F5C] flex items-center justify-center shrink-0 mt-0.5">
                <FileCheck2 className="w-3.5 h-3.5" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900">Gestion des utilisateurs & rôles</p>
                <p className="text-[11px] text-slate-500">Ajout, modification de permissions et suspension de comptes.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-[#E8F8F5] text-[#1F6F5C] flex items-center justify-center shrink-0 mt-0.5">
                <FileCheck2 className="w-3.5 h-3.5" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900">Boutique, Vélo & Stocks</p>
                <p className="text-[11px] text-slate-500">Gestion des vélos, pièces détachées et inventaire en temps réel.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <FileCheck2 className="w-3.5 h-3.5" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900">Finances, Dons & Fiscalité</p>
                <p className="text-[11px] text-slate-500">Émission des attestations fiscales conformes et comptabilité des dons.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3 sm:col-span-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                <FileCheck2 className="w-3.5 h-3.5" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900">Configuration Globale & Passerelles</p>
                <p className="text-[11px] text-slate-500">Paramétrage Stripe, Mollie, frais de port bpost et gestion multilingue FR/NL/EN.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
