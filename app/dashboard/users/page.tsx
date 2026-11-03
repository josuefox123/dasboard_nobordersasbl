'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  ShieldCheck,
  UserCheck,
  Key,
  Edit2,
  Lock,
  CheckCircle2,
  AlertCircle,
  Search,
  UserPlus,
  Send,
  Eye,
  Clock,
  Mail,
  Loader2,
  Shield,
  Calendar,
  X,
  ExternalLink,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { DashboardUser, RoleItem } from '@/types/dashboard';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { BatchActionBar } from '@/components/ui/BatchActionBar';

export default function UsersPage() {
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending_activation' | 'suspended'>('all');

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<DashboardUser | null>(null);
  const [selectedUser, setSelectedUser] = useState<DashboardUser | null>(null);

  // Formulaire de création / invitation
  const [createForm, setCreateForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    role_id: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Action renvoi d'invitation
  const [resendingUserId, setResendingUserId] = useState<string | null>(null);

  // Formulaire modification
  const [editRole, setEditRole] = useState<string>('');
  const [editStatus, setEditStatus] = useState<string>('active');
  const [editLoading, setEditLoading] = useState(false);

  // Notifications
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Pagination & Multi-Selection
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([
        apiClient.getUsers(),
        apiClient.getRoles().catch(() => []),
      ]);
      setUsers(usersData);
      // Exclure formellement le rôle super_admin ainsi que les rôles inactifs
      const assignableRoles = rolesData.filter((r) => {
        const isInactive = r.isActive === false || r.is_active === false;
        const isSuperAdmin =
          r.name?.toLowerCase() === 'super_admin' ||
          r.label?.toLowerCase().includes('super admin');
        return !isInactive && !isSuperAdmin;
      });
      setRoles(assignableRoles);
      if (assignableRoles.length > 0 && !createForm.role_id) {
        setCreateForm((prev) => ({
          ...prev,
          role_id: assignableRoles[0].id,
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Impossible de charger les utilisateurs.';
      setNotice({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  }

  // ── Création d'un administrateur (Envoi d'invitation) ──────────────────
  const handleOpenCreate = () => {
    setCreateForm({
      nom: '',
      prenom: '',
      email: '',
      role_id: roles[0]?.id || '',
    });
    setCreateError(null);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!createForm.nom.trim() || !createForm.prenom.trim() || !createForm.email.trim()) {
      setCreateError('Veuillez renseigner le nom, le prénom et l’adresse e-mail.');
      return;
    }

    if (!createForm.role_id) {
      setCreateError('Veuillez sélectionner un rôle pour le nouvel utilisateur.');
      return;
    }

    const selectedRole = roles.find((r) => r.id === createForm.role_id);
    const roleLabel = selectedRole?.label || 'sélectionné';

    setCreateLoading(true);
    try {
      const res = await apiClient.createAdminInvitation({
        nom: createForm.nom.trim(),
        prenom: createForm.prenom.trim(),
        email: createForm.email.trim().toLowerCase(),
        role_id: createForm.role_id,
      });

      if (res.email_sent === false) {
        setNotice({
          type: 'error',
          message:
            res.message ||
            `Le compte a été créé, mais l’envoi de l’e-mail à l’utilisateur ${roleLabel} a échoué.`,
        });
      } else {
        const targetLabel = res.invitation?.role?.label || roleLabel;
        setNotice({
          type: 'success',
          message:
            res.message ||
            `L'invitation a été envoyée avec succès à l'utilisateur ${targetLabel}.`,
        });
      }
      setIsCreateOpen(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la création de l’invitation.';
      setCreateError(msg);
    } finally {
      setCreateLoading(false);
    }
  };

  // ── Renvoi d'invitation ────────────────────────────────────────────────
  const handleResendInvitation = async (user: DashboardUser) => {
    setResendingUserId(user.id);
    try {
      const res = await apiClient.resendInvitation({
        userId: user.id,
        email: user.email,
        invitationId: user.invitation?.id,
      });

      const roleLabel = user.roleLabel || 'utilisateur';
      setNotice({
        type: 'success',
        message:
          res.message ||
          `Une nouvelle invitation a été envoyée avec succès à l'utilisateur ${roleLabel}.`,
      });
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Impossible de renvoyer l’invitation.';
      setNotice({ type: 'error', message: msg });
    } finally {
      setResendingUserId(null);
    }
  };

  // ── Consultation des détails ───────────────────────────────────────────
  const handleOpenDetail = (user: DashboardUser) => {
    setDetailUser(user);
  };

  // ── Modification (Rôle / Statut) ───────────────────────────────────────
  const handleOpenEdit = (user: DashboardUser) => {
    if (user.role === 'SUPER_ADMIN' || user.role === 'super_admin') {
      setNotice({
        type: 'error',
        message: 'Le compte Super Administrateur système ne peut pas être modifié.',
      });
      return;
    }
    setSelectedUser(user);
    setEditRole(user.activeRole?.id || roles[0]?.id || '');
    setEditStatus(user.status);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setEditLoading(true);
    try {
      await apiClient.updateUserRole(selectedUser.id, editRole as any, editStatus as any);
      setSelectedUser(null);
      setNotice({
        type: 'success',
        message: `Droits de l’utilisateur ${selectedUser.name} mis à jour avec succès.`,
      });
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la mise à jour des droits.';
      setNotice({ type: 'error', message: msg });
    } finally {
      setEditLoading(false);
    }
  };

  // ── Filtres et Pagination ──────────────────────────────────────────────
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.roleLabel.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? u.status === 'active'
        : statusFilter === 'pending_activation'
        ? u.status === 'pending_activation' || u.status === 'pending_verification'
        : u.status === 'suspended';

    return matchesSearch && matchesStatus;
  });

  const totalItems = filteredUsers.length;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const activeCount = users.filter((u) => u.status === 'active').length;
  const pendingCount = users.filter(
    (u) => u.status === 'pending_activation' || u.status === 'pending_verification'
  ).length;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedUsers.length && paginatedUsers.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedUsers.map((u) => u.id));
    }
  };

  const handleBulkExportCsv = () => {
    const selected = users.filter((u) => selectedIds.includes(u.id));
    const header = 'ID,Nom,Email,Role,Statut,DerniereConnexion,DateCreation\n';
    const rows = selected
      .map(
        (u) =>
          `"${u.id}","${u.name}","${u.email}","${u.roleLabel}","${u.status}","${u.lastLogin || 'Jamais'}","${u.createdAt || ''}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `utilisateurs_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setNotice({
      type: 'success',
      message: `Export de ${selected.length} utilisateur(s) généré avec succès.`,
    });
  };

  // Helper statut badge
  const renderStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'active') {
      return (
        <Badge variant="success" dot>
          Actif
        </Badge>
      );
    }
    if (s === 'pending_activation') {
      return (
        <Badge variant="warning" dot className="bg-amber-50 text-amber-900 border-amber-300">
          En attente d’activation
        </Badge>
      );
    }
    if (s === 'pending_verification') {
      return (
        <Badge variant="warning" dot>
          Vérification e-mail
        </Badge>
      );
    }
    return (
      <Badge variant="error" dot>
        Suspendu
      </Badge>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pt-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Utilisateurs & Permissions d’Accès</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Gestion des comptes de l’équipe No Borders ASBL, rôles et envoi d’invitations sécurisées.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="btn-primary-gradient inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Inviter un utilisateur</span>
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`p-3 rounded-2xl text-xs flex items-center justify-between gap-2 animate-fade-in ${
            notice.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{notice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="p-1 hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
            aria-label="Fermer la notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search & Filters Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-[0_12px_40px_-18px_rgba(38,185,151,0.12)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
              setSelectedIds([]);
            }}
            placeholder="Rechercher par nom, e-mail ou rôle..."
            className="input-premium pl-10"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-400 font-medium">Statut :</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="input-premium text-xs py-2 px-3 font-medium bg-slate-50 cursor-pointer"
          >
            <option value="all">Tous les statuts ({users.length})</option>
            <option value="active">Actifs ({activeCount})</option>
            <option value="pending_activation">En attente ({pendingCount})</option>
            <option value="suspended">Suspendus</option>
          </select>
        </div>
      </div>

      {/* Batch Selection Action Bar */}
      <BatchActionBar
        selectedCount={selectedIds.length}
        totalCount={filteredUsers.length}
        onClearSelection={() => setSelectedIds([])}
      >
        <button
          type="button"
          onClick={handleBulkExportCsv}
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span>Exporter CSV</span>
        </button>
      </BatchActionBar>

      {/* Users Table */}
      <div className="panel overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Aucun utilisateur trouvé</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery ? 'Modifiez votre recherche ou vos filtres.' : 'Commencez par inviter un nouvel utilisateur.'}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="btn-primary-gradient inline-flex items-center gap-2 mt-4 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Inviter un utilisateur</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 -mt-6 mb-0">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-4 pl-6 pr-2 w-10">
                    <input
                      type="checkbox"
                      checked={paginatedUsers.length > 0 && selectedIds.length === paginatedUsers.length}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate = selectedIds.length > 0 && selectedIds.length < paginatedUsers.length;
                        }
                      }}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-[#26B997] focus:ring-[#26B997] cursor-pointer"
                      aria-label="Sélectionner tous les utilisateurs affichés"
                    />
                  </th>
                  <th className="py-4 px-4">Utilisateur</th>
                  <th className="py-4 px-6">Rôle</th>
                  <th className="py-4 px-6">Statut</th>
                  <th className="py-4 px-6">Date de création</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedUsers.map((user) => {
                  const isSelected = selectedIds.includes(user.id);
                  const isPending =
                    user.status === 'pending_activation' || user.status === 'pending_verification';
                  const isSuperAdmin = user.role === 'SUPER_ADMIN' || user.role === 'super_admin';
                  const isResending = resendingUserId === user.id;

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-[#E8F8F5]/50' : ''
                      }`}
                    >
                      <td className="py-4 pl-6 pr-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(user.id)}
                          className="w-4 h-4 rounded border-slate-300 text-[#26B997] focus:ring-[#26B997] cursor-pointer"
                          aria-label={`Sélectionner ${user.name}`}
                        />
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-9 h-9 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0 flex items-center justify-center font-bold text-slate-600 text-xs uppercase">
                            {user.avatar ? (
                              <Image
                                src={user.avatar}
                                alt={user.name}
                                width={36}
                                height={36}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{(user.prenom?.[0] || '') + (user.nom?.[0] || '') || 'U'}</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-slate-900">{user.name}</p>
                              {isSuperAdmin && (
                                <span title="Super Administrateur Système">
                                  <ShieldCheck className="w-3.5 h-3.5 text-[#26B997]" />
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {user.roleLabel}
                        </span>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        {renderStatusBadge(user.status)}
                      </td>

                      <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Détails */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(user)}
                            className="p-1.5 text-slate-500 hover:text-[#26B997] hover:bg-[#E8F8F5] rounded-lg transition-colors cursor-pointer"
                            title="Voir les détails"
                            aria-label={`Consulter le profil de ${user.name}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Renvoyer l'invitation (uniquement si en attente d'activation) */}
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleResendInvitation(user)}
                              disabled={isResending}
                              className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                              title="Renvoyer l’invitation par e-mail"
                              aria-label={`Renvoyer l'invitation à ${user.name}`}
                            >
                              {isResending ? (
                                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          {/* Modifier droits (non permis pour SUPER_ADMIN) */}
                          {!isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(user)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Modifier les droits"
                              aria-label={`Modifier le rôle de ${user.name}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 pt-2">
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      </div>

      {/* Permissions Matrix Reference (Dynamique selon les rôles enregistrés) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#26B997]" />
            <span>Matrice des Rôles & Droits d’Accès</span>
          </h3>
          <span className="text-xs text-slate-400">
            {roles.length} rôle(s) actif(s) configuré(s)
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Responsabilités et permissions accordées aux différents rôles de la plateforme.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {roles.map((r) => (
            <div
              key={r.id}
              className={`p-3.5 rounded-xl border transition-all ${
                r.is_system
                  ? 'border-[#26B997]/30 bg-[#E8F8F5]/40'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <p
                  className={`font-bold ${
                    r.is_system ? 'text-[#1F6F5C]' : 'text-slate-900'
                  }`}
                >
                  {r.label}
                </p>
                {r.is_system && (
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#26B997]/20 text-[#1F6F5C]">
                    Système
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 mb-2 line-clamp-2">
                {r.description || 'Aucune description spécifique fournie.'}
              </p>
              <div className="text-[11px] text-slate-500 font-mono">
                {r.permissions_count ?? r.permissions?.length ?? 0} permission(s)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MODALE CRÉATION / INVITATION D'UN ADMINISTRATEUR ──────────────── */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Inviter un utilisateur"
        description="Créez le compte utilisateur et envoyez-lui un lien sécurisé par e-mail pour définir son mot de passe."
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {createError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label-premium">Nom *</label>
              <input
                type="text"
                required
                value={createForm.nom}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, nom: e.target.value }))
                }
                placeholder="Dupont"
                className="input-premium"
              />
            </div>
            <div>
              <label className="label-premium">Prénom *</label>
              <input
                type="text"
                required
                value={createForm.prenom}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, prenom: e.target.value }))
                }
                placeholder="Jean"
                className="input-premium"
              />
            </div>
          </div>

          <div>
            <label className="label-premium">Adresse e-mail professionnelle *</label>
            <input
              type="email"
              required
              value={createForm.email}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="jean.dupont@nobordersasbl.be"
              className="input-premium"
            />
          </div>

          <div>
            <label className="label-premium">Rôle d’accès attribué *</label>
            <select
              value={createForm.role_id}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, role_id: e.target.value }))
              }
              className="input-premium font-medium"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
            {createForm.role_id && (
              <p className="text-[11px] text-slate-500 mt-1 italic">
                {roles.find((r) => r.id === createForm.role_id)?.description ||
                  'Rôle avec permissions configurées.'}
              </p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 text-[11px] flex items-start gap-2">
            <Mail className="w-4 h-4 text-[#26B997] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">
                Invitation par e-mail automatique
              </p>
              <p>
                Le nouvel utilisateur recevra un lien sécurisé valable pendant{' '}
                <strong>48 heures</strong> pour définir son mot de passe et activer
                son compte. Aucun mot de passe temporaire n’est requis.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              disabled={createLoading}
              className="btn-secondary-soft cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="btn-primary-gradient flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {createLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Envoyer l’invitation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODALE CONSULTATION DÉTAILS D'UN UTILISATEUR ─────────────────── */}
      <Modal
        isOpen={Boolean(detailUser)}
        onClose={() => setDetailUser(null)}
        title={detailUser ? `Profil : ${detailUser.name}` : 'Détails de l’utilisateur'}
        description="Informations du compte, statut d’activation et permissions associées."
        maxWidth="lg"
      >
        {detailUser && (
          <div className="space-y-5 text-xs">
            {/* Carte Identité */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-300 bg-white shrink-0 flex items-center justify-center font-bold text-slate-700 text-sm uppercase">
                {detailUser.avatar ? (
                  <Image
                    src={detailUser.avatar}
                    alt={detailUser.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {(detailUser.prenom?.[0] || '') + (detailUser.nom?.[0] || '') || 'U'}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {detailUser.name}
                  </h3>
                  {renderStatusBadge(detailUser.status)}
                </div>
                <p className="text-slate-500">{detailUser.email}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  ID : <span className="font-mono">{detailUser.id}</span>
                </p>
              </div>
            </div>

            {/* Grille d'informations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Rôle Attribué
                </p>
                <p className="font-bold text-slate-900 text-sm">
                  {detailUser.roleLabel}
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Type : {detailUser.role}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Date de création
                </p>
                <p className="font-bold text-slate-900">
                  {detailUser.createdAt
                    ? new Date(detailUser.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Dernière connexion : {detailUser.lastLogin || 'Aucune enregistrée'}
                </p>
              </div>
            </div>

            {/* Bloc d'invitation (si présent) */}
            {detailUser.invitation && (
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Dernière invitation envoyée</span>
                  </div>
                  {detailUser.invitation.acceptedAt ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Acceptée
                    </span>
                  ) : new Date(detailUser.invitation.expiresAt) < new Date() ? (
                    <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                      Expirée
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      En cours de validité
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 mt-2">
                  <div>
                    <span className="text-slate-400">Émise le :</span>{' '}
                    {new Date(detailUser.invitation.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div>
                    <span className="text-slate-400">Expire le :</span>{' '}
                    {new Date(detailUser.invitation.expiresAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {!detailUser.invitation.acceptedAt && (
                  <div className="mt-3 pt-2 border-t border-amber-200/60 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setDetailUser(null);
                        handleResendInvitation(detailUser);
                      }}
                      className="btn-secondary-soft text-amber-800 border-amber-300 hover:bg-amber-100 flex items-center gap-1.5 text-xs py-1.5 px-3 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Renvoyer l’invitation maintenant</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Permissions actives */}
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                Permissions associées ({detailUser.permissions.length})
              </p>
              {detailUser.permissions.length === 0 ? (
                <p className="text-slate-400 italic">Aucune permission spécifique.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {detailUser.permissions.map((p) => (
                    <span
                      key={p}
                      className="font-mono text-[10px] bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200 shadow-2xs"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailUser(null)}
                className="btn-secondary-soft cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODALE MODIFICATION RÔLE & STATUT ─────────────────────────────── */}
      <Modal
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title={selectedUser ? `Droits d’accès : ${selectedUser.name}` : 'Modifier les accès'}
        description="Attribution des responsabilités et contrôle d’activité du compte"
        maxWidth="md"
      >
        {selectedUser && (
          <form onSubmit={handleSaveRole} className="space-y-4">
            <div>
              <label className="label-premium">Rôle attribué au membre</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="input-premium font-medium"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-premium">Statut du compte</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="input-premium font-medium"
              >
                <option value="active">Actif (Accès autorisé)</option>
                <option value="suspended">Suspendu (Accès bloqué)</option>
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                disabled={editLoading}
                className="btn-secondary-soft cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="btn-primary-gradient cursor-pointer"
              >
                {editLoading ? 'Enregistrement...' : 'Mettre à jour les accès'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
