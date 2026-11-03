'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Shield,
  ShieldAlert,
  Search,
  Lock,
  RefreshCw,
  Plus,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
  KeyRound,
  RotateCcw,
  Check,
  Calendar,
  Layers,
  FileText,
  AlertCircle,
  Hash,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { PermissionItem, RoleItem } from '@/types/dashboard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [error, setError] = useState<{ status?: number; message: string } | null>(null);
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Recherche & Filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'system' | 'custom'>('all');

  // Modale Formulaire (Création / Modification)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [permSearchQuery, setPermSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modale Consultation (Détails)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingRole, setViewingRole] = useState<RoleItem | null>(null);

  // Modale Suppression
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showNotification = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setNotice({ message: msg, type });
    setTimeout(() => setNotice(null), 3500);
  }, []);

  // Chargement de la liste des rôles
  const loadRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getRoles();
      setRoles(data);
    } catch (err: any) {
      console.error('Erreur chargement rôles:', err);
      setError({
        status: err?.status,
        message: err?.message || 'Erreur lors de la récupération des rôles.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Chargement du catalogue complet des permissions pour le formulaire
  const loadAllPermissions = useCallback(async () => {
    if (allPermissions.length > 0) return;
    setLoadingPermissions(true);
    try {
      // On demande jusqu'à 100 permissions (notre catalogue complet actuel compte 86 permissions)
      const res = await apiClient.getPermissions({ limit: 100 });
      setAllPermissions(res.data || []);
    } catch (err) {
      console.error('Erreur chargement permissions pour formulaire:', err);
    } finally {
      setLoadingPermissions(false);
    }
  }, [allPermissions.length]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  // Ouverture modale Création
  const handleOpenCreate = () => {
    setFormError(null);
    setEditingRole(null);
    setFormName('');
    setFormLabel('');
    setFormDescription('');
    setSelectedPermissionIds([]);
    setPermSearchQuery('');
    loadAllPermissions();
    setIsFormModalOpen(true);
  };

  // Ouverture modale Modification
  const handleOpenEdit = (role: RoleItem) => {
    if (role.is_system) {
      showNotification('Ce rôle système est protégé et ne peut pas être modifié.', 'error');
      return;
    }
    setFormError(null);
    setEditingRole(role);
    setFormName(role.name);
    setFormLabel(role.label);
    setFormDescription(role.description || '');
    // Initialiser les permissions cochées
    const currentPermIds = role.permissions ? role.permissions.map((p) => p.id) : [];
    setSelectedPermissionIds(currentPermIds);
    setPermSearchQuery('');
    loadAllPermissions();
    setIsFormModalOpen(true);
  };

  // Ouverture modale Consultation
  const handleOpenView = async (role: RoleItem) => {
    try {
      // Rafraîchir les détails complets depuis l'API view
      const detailed = await apiClient.getRole(role.id);
      setViewingRole(detailed);
    } catch {
      setViewingRole(role);
    }
    setIsDetailModalOpen(true);
  };

  // Ouverture modale Suppression
  const handleOpenDelete = (role: RoleItem) => {
    if (role.is_system) {
      showNotification('Ce rôle système est protégé et ne peut pas être supprimé.', 'error');
      return;
    }
    setDeleteTarget({
      id: role.id,
      label: role.label,
      name: role.name,
    });
  };

  // Confirmation de suppression
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.deleteRole(deleteTarget.id);
      showNotification(`Le rôle "${deleteTarget.label}" a été supprimé avec succès.`, 'success');
      setDeleteTarget(null);
      await loadRoles();
    } catch (err: any) {
      console.error('Erreur suppression rôle:', err);
      showNotification(err?.message || 'Erreur lors de la suppression du rôle.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Soumission du formulaire Création / Modification
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanLabel = formLabel.trim();
    const cleanName = formName.trim().toLowerCase();

    if (!cleanLabel) {
      setFormError('Le nom du rôle est obligatoire.');
      return;
    }
    if (!cleanName) {
      setFormError('L&apos;identifiant technique est obligatoire.');
      return;
    }
    if (!/^[a-z0-9_-]+$/.test(cleanName)) {
      setFormError('L&apos;identifiant technique ne doit contenir que des lettres minuscules, chiffres, tirets (-) ou underscores (_).');
      return;
    }

    setIsSaving(true);
    try {
      if (editingRole) {
        // Mise à jour
        await apiClient.updateRole(editingRole.id, {
          name: cleanName !== editingRole.name ? cleanName : undefined,
          label: cleanLabel,
          description: formDescription.trim() || undefined,
          permissions: selectedPermissionIds,
        });
        showNotification(`Le rôle "${cleanLabel}" a été mis à jour avec succès.`, 'success');
      } else {
        // Création
        await apiClient.createRole({
          name: cleanName,
          label: cleanLabel,
          description: formDescription.trim() || undefined,
          permissions: selectedPermissionIds,
        });
        showNotification(`Le rôle "${cleanLabel}" a été créé avec succès.`, 'success');
      }

      setIsFormModalOpen(false);
      setEditingRole(null);
      await loadRoles();
    } catch (err: any) {
      console.error('Erreur sauvegarde rôle:', err);
      setFormError(err?.message || 'Une erreur est survenue lors de l&apos;enregistrement du rôle.');
    } finally {
      setIsSaving(false);
    }
  };

  // Génération automatique d'un slug pour l'identifiant technique à la saisie du nom si en mode création
  const handleLabelChange = (val: string) => {
    setFormLabel(val);
    if (!editingRole) {
      // Suggérer automatiquement un slug valide
      const slug = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      setFormName(slug);
    }
  };

  // Gestion des sélections de permissions dans le formulaire
  const handleTogglePermission = (permId: string) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId],
    );
  };

  const handleSelectAllModule = (modulePermissions: PermissionItem[]) => {
    const moduleIds = modulePermissions.map((p) => p.id);
    const allSelected = moduleIds.every((id) => selectedPermissionIds.includes(id));

    if (allSelected) {
      // Décocher tout le module
      setSelectedPermissionIds((prev) => prev.filter((id) => !moduleIds.includes(id)));
    } else {
      // Tout cocher dans ce module
      setSelectedPermissionIds((prev) => Array.from(new Set([...prev, ...moduleIds])));
    }
  };

  // Formatage du nom de module
  const formatModuleName = (raw: string): string => {
    if (!raw) return '';
    const upper = raw.toUpperCase();
    if (upper === 'FAQ' || upper === 'FAQS') return 'FAQ';
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  };

  // Regroupement dynamique de toutes les permissions par module
  const groupedAllPermissions = useMemo(() => {
    const q = permSearchQuery.trim().toLowerCase();
    const filtered = allPermissions.filter((p) => {
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.label.toLowerCase().includes(q) ||
        p.module.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    });

    const groups: { [key: string]: PermissionItem[] } = {};
    for (const p of filtered) {
      if (!groups[p.module]) groups[p.module] = [];
      groups[p.module].push(p);
    }

    return Object.entries(groups)
      .map(([mod, items]) => ({ module: mod, items }))
      .sort((a, b) => a.module.localeCompare(b.module));
  }, [allPermissions, permSearchQuery]);

  // Filtrage des rôles affichés dans le tableau
  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        role.name.toLowerCase().includes(q) ||
        role.label.toLowerCase().includes(q) ||
        (role.description && role.description.toLowerCase().includes(q));

      const matchesType =
        typeFilter === 'all' ||
        (typeFilter === 'system' && role.is_system) ||
        (typeFilter === 'custom' && !role.is_system);

      return matchesSearch && matchesType;
    });
  }, [roles, searchQuery, typeFilter]);

  // Regroupement des permissions du rôle en cours de consultation
  const groupedViewingRolePermissions = useMemo(() => {
    if (!viewingRole || !viewingRole.permissions) return [];
    const groups: { [key: string]: PermissionItem[] } = {};
    for (const p of viewingRole.permissions) {
      if (!groups[p.module]) groups[p.module] = [];
      groups[p.module].push(p);
    }
    return Object.entries(groups)
      .map(([mod, items]) => ({ module: mod, items }))
      .sort((a, b) => a.module.localeCompare(b.module));
  }, [viewingRole]);

  return (
    <div className="space-y-6 animate-fade-in pt-6">
      {/* En-tête : Titre, Compteur & Bouton Créer un rôle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Gestion des rôles
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Définissez et administrez les rôles d&apos;accès ainsi que les permissions attribuées aux utilisateurs de la plateforme.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => loadRoles()}
            disabled={loading}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
            title="Rafraîchir la liste des rôles"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="btn-primary-gradient inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Créer un rôle</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notice && (
        <div
          className={`p-3 rounded-2xl text-xs flex items-center gap-2 animate-fade-in border ${
            notice.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {notice.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Barre de Recherche et Filtres */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-[0_12px_40px_-18px_rgba(38,185,151,0.12)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom de rôle, code technique ou description..."
            className="input-premium pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="input-premium cursor-pointer font-medium w-full md:w-auto"
          >
            <option value="all">Tous les types ({roles.length})</option>
            <option value="system">Rôles système ({roles.filter((r) => r.is_system).length})</option>
            <option value="custom">Rôles personnalisés ({roles.filter((r) => !r.is_system).length})</option>
          </select>

          {(searchQuery || typeFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('all');
              }}
              className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1"
              title="Effacer les filtres"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser</span>
            </button>
          )}
        </div>
      </div>

      {/* Panneau Principal : Tableau ou États */}
      <div className="panel overflow-hidden">
        {/* Erreur 403 : Accès Super Admin requis */}
        {error?.status === 403 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Accès strictement réservé au Super Administrateur
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-4">
              La gestion des rôles et l&apos;attribution des permissions sont exclusivement réservées au Super Administrateur de la plateforme.
            </p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Erreur lors du chargement des rôles
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-4">
              {error.message}
            </p>
            <button
              type="button"
              onClick={() => loadRoles()}
              className="px-4 py-2 rounded-xl bg-[#26B997] hover:bg-[#1F6F5C] text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Réessayer</span>
            </button>
          </div>
        ) : loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Shield className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Aucun rôle trouvé</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery || typeFilter !== 'all'
                ? 'Aucun rôle ne correspond à vos critères de recherche ou de filtre.'
                : 'Commencez par créer un nouveau rôle applicatif pour organiser les accès.'}
            </p>
            {searchQuery || typeFilter !== 'all' ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('all');
                }}
                className="mt-4 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Effacer les filtres</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="btn-primary-gradient mt-4 inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Créer le premier rôle</span>
              </button>
            )}
          </div>
        ) : (
          /* Tableau des rôles */
          <div className="overflow-x-auto -mx-6 -mt-6 mb-0">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 pl-6 pr-4 w-60">Nom du rôle</th>
                  <th className="py-3.5 px-6 w-48">Identifiant technique</th>
                  <th className="py-3.5 px-6 w-36">Permissions</th>
                  <th className="py-3.5 px-6 w-32">Statut</th>
                  <th className="py-3.5 px-6 w-36">Date de création</th>
                  <th className="py-3.5 px-6 text-right w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRoles.map((role) => (
                  <tr
                    key={role.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Nom du rôle */}
                    <td className="py-4 pl-6 pr-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            role.is_system
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-[#1F6F5C] border border-[#26B997]/20'
                          }`}
                        >
                          {role.is_system ? (
                            <Lock className="w-4 h-4 text-amber-700" />
                          ) : (
                            <Shield className="w-4 h-4 text-[#26B997]" />
                          )}
                        </div>
                        <span className="font-extrabold text-slate-900 text-xs">
                          {role.label}
                        </span>
                      </div>
                    </td>

                    {/* Identifiant technique */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <code className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-mono text-[11px] font-semibold border border-slate-200/70 inline-block">
                        {role.name}
                      </code>
                    </td>

                    {/* Permissions attribuées */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-[11px] border border-slate-200/60">
                        <KeyRound className="w-3 h-3 text-[#26B997]" />
                        <span>
                          {role.permissions_count || (role.permissions ? role.permissions.length : 0)} permission{role.permissions_count > 1 ? 's' : ''}
                        </span>
                      </span>
                    </td>

                    {/* Statut (Système / Personnalisé) */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      {role.is_system ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Lock className="w-3 h-3 text-amber-600" />
                          <span>Système</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-[#1F6F5C] border border-[#26B997]/20">
                          Personnalisé
                        </span>
                      )}
                    </td>

                    {/* Date de création */}
                    <td className="py-4 px-6 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {role.created_at
                        ? new Date(role.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* Consultation */}
                        <button
                          type="button"
                          onClick={() => handleOpenView(role)}
                          className="p-1.5 text-slate-600 hover:text-[#26B997] hover:bg-[#E8F8F5] rounded-lg transition-colors"
                          title="Consulter les détails du rôle"
                          aria-label={`Voir les détails du rôle ${role.label}`}
                        >
                          <Eye className="w-4 h-4 text-[#26B997]" />
                        </button>

                        {/* Modification */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(role)}
                          disabled={role.is_system}
                          className={`p-1.5 rounded-lg transition-colors ${
                            role.is_system
                              ? 'text-slate-300 cursor-not-allowed opacity-50'
                              : 'text-slate-600 hover:text-amber-600 hover:bg-amber-50'
                          }`}
                          title={
                            role.is_system
                              ? 'Ce rôle système est protégé et ne peut pas être modifié'
                              : 'Modifier ce rôle'
                          }
                          aria-label={`Modifier le rôle ${role.label}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Suppression */}
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(role)}
                          disabled={role.is_system}
                          className={`p-1.5 rounded-lg transition-colors ${
                            role.is_system
                              ? 'text-slate-300 cursor-not-allowed opacity-50'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                          title={
                            role.is_system
                              ? 'Ce rôle système est protégé et ne peut pas être supprimé'
                              : 'Supprimer ce rôle'
                          }
                          aria-label={`Supprimer le rôle ${role.label}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODALE 1 : Création / Modification d'un Rôle */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => {
          if (!isSaving) {
            setIsFormModalOpen(false);
            setEditingRole(null);
          }
        }}
        title={editingRole ? `Modifier le rôle : ${editingRole.label}` : 'Créer un nouveau rôle'}
        description="Renseignez les attributs du rôle et sélectionnez les permissions attribuées."
        maxWidth="xl"
      >
        <form onSubmit={handleSubmitForm} className="space-y-5">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Grille : Nom lisible et Code technique */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nom du rôle <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formLabel}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="Ex : Gestionnaire Boutique & Stocks"
                className="input-premium w-full text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Identifiant technique <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value.toLowerCase().trim())}
                placeholder="Ex : gestionnaire_boutique"
                className="input-premium w-full text-xs font-mono"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Minuscules, chiffres, tirets (-) ou underscores (_) uniquement.
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Description du rôle <span className="text-slate-400 font-normal">(facultative)</span>
            </label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Décrivez les attributions, les responsabilités ou le périmètre de ce rôle..."
              rows={2}
              className="input-premium w-full text-xs resize-none"
            />
          </div>

          {/* Section Sélection des Permissions */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#26B997]" />
                  <span className="text-xs font-bold text-slate-800">
                    Permissions associées au rôle
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F8F5] text-[#1F6F5C] border border-[#26B997]/20">
                    {selectedPermissionIds.length} sélectionnée{selectedPermissionIds.length > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Sélectionnez les permissions accordées à ce rôle. Elles sont regroupées dynamiquement par module.
                </p>
              </div>

              {/* Barre de recherche rapide de permission */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={permSearchQuery}
                  onChange={(e) => setPermSearchQuery(e.target.value)}
                  placeholder="Filtrer permissions..."
                  className="input-premium pl-8 py-1.5 text-xs w-full"
                />
              </div>
            </div>

            {/* Conteneur défilant des permissions par module */}
            <div className="max-h-72 overflow-y-auto space-y-3.5 pr-1 border border-slate-100 rounded-2xl p-3 bg-slate-50/50">
              {loadingPermissions ? (
                <div className="p-4 space-y-3">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : groupedAllPermissions.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  Aucune permission ne correspond à votre recherche.
                </div>
              ) : (
                groupedAllPermissions.map((group) => {
                  const moduleIds = group.items.map((p) => p.id);
                  const selectedInModuleCount = moduleIds.filter((id) =>
                    selectedPermissionIds.includes(id),
                  ).length;
                  const allSelectedInModule =
                    group.items.length > 0 && selectedInModuleCount === group.items.length;

                  return (
                    <div
                      key={group.module}
                      className="bg-white rounded-xl border border-slate-200/70 p-3 shadow-2xs space-y-2.5"
                    >
                      {/* En-tête du module */}
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-[#26B997]" />
                          <span className="font-extrabold text-slate-800 text-xs tracking-tight">
                            Module : {formatModuleName(group.module)}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            ({selectedInModuleCount}/{group.items.length})
                          </span>
                        </div>

                        {/* Bouton Tout sélectionner / Tout désélectionner du module */}
                        <button
                          type="button"
                          onClick={() => handleSelectAllModule(group.items)}
                          className="text-[11px] font-bold text-[#1F6F5C] hover:text-[#26B997] transition-colors"
                        >
                          {allSelectedInModule ? 'Tout désélectionner' : 'Tout sélectionner'}
                        </button>
                      </div>

                      {/* Liste des permissions du module */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {group.items.map((perm) => {
                          const isChecked = selectedPermissionIds.includes(perm.id);
                          return (
                            <label
                              key={perm.id}
                              className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-[#E8F8F5]/60 border-[#26B997]/40 text-slate-900 shadow-2xs'
                                  : 'bg-white border-slate-200/60 hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePermission(perm.id)}
                                className="w-4 h-4 mt-0.5 rounded border-slate-300 text-[#26B997] focus:ring-[#26B997] cursor-pointer"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-xs leading-tight">
                                  {perm.label}
                                </p>
                                <code className="block text-[10px] text-slate-400 font-mono mt-0.5">
                                  {perm.name}
                                </code>
                                {perm.description && (
                                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-1" title={perm.description}>
                                    {perm.description}
                                  </p>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Boutons d'action du formulaire */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                setIsFormModalOpen(false);
                setEditingRole(null);
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary-gradient px-5 py-2 text-xs font-bold inline-flex items-center gap-1.5"
            >
              {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{editingRole ? 'Enregistrer les modifications' : 'Créer le rôle'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* MODALE 2 : Consultation détaillée d'un Rôle (VIEW) */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setViewingRole(null);
        }}
        title="Détails du rôle"
        description="Attributs généraux et liste complète des autorisations associées"
        maxWidth="xl"
      >
        {viewingRole && (
          <div className="space-y-5">
            {/* Carte Récapitulative du rôle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
                    viewingRole.is_system
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-[#26B997] text-white'
                  }`}
                >
                  {viewingRole.is_system ? (
                    <Lock className="w-6 h-6 text-amber-700" />
                  ) : (
                    <Shield className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    {viewingRole.label}
                  </h3>
                  <code className="text-xs font-mono text-slate-500 mt-0.5 inline-block">
                    {viewingRole.name}
                  </code>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                {viewingRole.is_system ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Rôle système protégé</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-[#1F6F5C] border border-[#26B997]/20">
                    Rôle personnalisé
                  </span>
                )}
              </div>
            </div>

            {/* Description complète */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <FileText className="w-4 h-4 text-[#26B997]" />
                <span>Description :</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-slate-100 text-slate-700 text-xs sm:text-sm leading-relaxed shadow-xs">
                {viewingRole.description || (
                  <span className="text-slate-400 italic">Aucune description renseignée pour ce rôle.</span>
                )}
              </div>
            </div>

            {/* Métadonnées */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center gap-2.5">
                <Hash className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium">Identifiant unique (CUID)</p>
                  <p className="font-mono text-xs text-slate-800 truncate" title={viewingRole.id}>
                    {viewingRole.id}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium">Date de création</p>
                  <p className="text-xs text-slate-800 font-medium">
                    {viewingRole.created_at
                      ? new Date(viewingRole.created_at).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Non renseignée'}
                  </p>
                </div>
              </div>
            </div>

            {/* Liste des permissions attribuées regroupées par module */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#26B997]" />
                  <span className="text-xs font-bold text-slate-800">
                    Permissions attribuées
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F8F5] text-[#1F6F5C] border border-[#26B997]/20">
                  {viewingRole.permissions ? viewingRole.permissions.length : 0} permission{(viewingRole.permissions?.length || 0) > 1 ? 's' : ''}
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                {groupedViewingRolePermissions.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 text-center text-slate-400 text-xs italic">
                    Aucune permission n&apos;est actuellement attribuée à ce rôle.
                  </div>
                ) : (
                  groupedViewingRolePermissions.map((group) => (
                    <div
                      key={group.module}
                      className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2"
                    >
                      <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200/50">
                        <Layers className="w-3.5 h-3.5 text-[#26B997]" />
                        <span className="font-extrabold text-slate-800 text-xs">
                          Module : {formatModuleName(group.module)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          ({group.items.length})
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.items.map((perm) => (
                          <div
                            key={perm.id}
                            className="p-2 rounded-lg bg-white border border-slate-100 shadow-2xs"
                          >
                            <p className="font-bold text-xs text-slate-900 leading-tight">
                              {perm.label}
                            </p>
                            <code className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                              {perm.name}
                            </code>
                            {perm.description && (
                              <p className="text-[10px] text-slate-500 mt-1 line-clamp-1" title={perm.description}>
                                {perm.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bouton Fermer */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setViewingRole(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODALE 3 : Confirmation de Suppression */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title="Supprimer le rôle"
        message={`Êtes-vous sûr de vouloir supprimer définitivement le rôle "${deleteTarget?.label}" (${deleteTarget?.name}) ?`}
        submessage="Cette action est irréversible. Les permissions de la plateforme resteront intactes et ne seront jamais supprimées."
      />
    </div>
  );
}

