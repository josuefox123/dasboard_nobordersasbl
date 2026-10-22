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
  Info,
  Search,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { DashboardUser, UserRole } from '@/types/dashboard';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { BatchActionBar } from '@/components/ui/BatchActionBar';

export default function UsersPage() {
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<DashboardUser | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('manager');
  const [editStatus, setEditStatus] = useState<'active' | 'suspended'>('active');
  const [notice, setNotice] = useState<string | null>(null);

  // Pagination & Multi-Selection
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await apiClient.getUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenEdit = (user: DashboardUser) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setEditStatus(user.status);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    await apiClient.updateUserRole(selectedUser.id, editRole, editStatus);
    await loadUsers();
    setSelectedUser(null);
    setNotice(`Droits de l'utilisateur ${selectedUser.name} mis à jour avec succès.`);
    setTimeout(() => setNotice(null), 3000);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.roleLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalItems = filteredUsers.length;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
    const header = 'ID,Nom,Email,Role,Statut,DerniereConnexion\n';
    const rows = selected
      .map(
        (u) =>
          `"${u.id}","${u.name}","${u.email}","${u.roleLabel}","${u.status}","${u.lastLogin || 'Jamais'}"`
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
    setNotice(`Export de ${selected.length} utilisateur(s) généré avec succès.`);
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Utilisateurs & Permissions d’Accès
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Gestion des rôles de l’équipe No Borders ASBL et contrôle d’accès granulaire.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3.5 py-1.5 rounded-2xl bg-[#E8F8F5] text-[#1F6F5C] border border-[#26B997]/30 shadow-xs">
            {users.length} comptes autorisés
          </span>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Search Bar */}
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
            placeholder="Rechercher par nom, email ou rôle..."
            className="input-premium pl-10"
          />
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
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
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
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Aucun utilisateur trouvé</p>
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
                  <th className="py-4 px-6">Permissions Actives</th>
                  <th className="py-4 px-6">Dernière Connexion</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedUsers.map((user) => {
                  const isSelected = selectedIds.includes(user.id);
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
                          <div className="relative w-9 h-9 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                            <Image
                              src={user.avatar || '/default-avatar.svg'}
                              alt={user.name}
                              width={36}
                              height={36}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{user.name}</p>
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
                        {user.status === 'active' ? (
                          <Badge variant="success">Actif</Badge>
                        ) : (
                          <Badge variant="error">Suspendu</Badge>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {user.permissions.map((perm) => (
                            <span
                              key={perm}
                              className="text-[10px] bg-[#E8F8F5] text-[#1F6F5C] font-mono px-1.5 py-0.5 rounded border border-[#26B997]/20"
                            >
                              {perm}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                        {user.lastLogin || 'Jamais'}
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-1.5 text-slate-600 hover:text-[#26B997] hover:bg-[#E8F8F5] rounded-lg transition-colors"
                          title="Modifier le rôle et le statut"
                          aria-label={`Modifier le rôle de ${user.name}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
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

      {/* Permissions Matrix Reference Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-2">
          Matrice des Rôles & Droits d’Accès
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Droits accordés à chaque rôle de l’équipe.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl border border-[#26B997]/30 bg-[#E8F8F5]/40">
            <p className="font-bold text-[#1F6F5C] mb-1">Super Administrateur</p>
            <p className="text-[11px] text-slate-600 mb-2">Accès complet sans restriction</p>
            <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-0.5">
              <li>Gestion des comptes & clés</li>
              <li>Paramètres globaux & paiements</li>
              <li>Toutes les opérations boutique & dons</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
            <p className="font-bold text-slate-900 mb-1">Gestionnaire Boutique</p>
            <p className="text-[11px] text-slate-600 mb-2">Catalogue & logistique</p>
            <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-0.5">
              <li>Ajout / modification de vélos</li>
              <li>Mise à jour des stocks</li>
              <li>Expéditions bpost & retraits</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40">
            <p className="font-bold text-amber-900 mb-1">Trésorier / Dons</p>
            <p className="text-[11px] text-slate-600 mb-2">Comptabilité & mécénat</p>
            <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-0.5">
              <li>Suivi des flux financiers</li>
              <li>Émission des reçus fiscaux belges</li>
              <li>Rapprochements de virement</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
            <p className="font-bold text-slate-900 mb-1">Rédacteur Contenus</p>
            <p className="text-[11px] text-slate-600 mb-2">Communication & blog</p>
            <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-0.5">
              <li>Rédaction d’articles & ateliers</li>
              <li>Traduction des contenus FR/NL/EN</li>
              <li>Publication des actualités</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Edit Role Modal */}
      <Modal
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title={selectedUser ? `Droits d’accès : ${selectedUser.name}` : 'Modifier les accès'}
        description="Attribution des responsabilités et contrôle d’activité du compte"
        maxWidth="md"
      >
        {selectedUser && (
          <form onSubmit={handleSaveRole} className="space-y-5">
            <div>
              <label className="label-premium">
                Rôle attribué au membre
              </label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as UserRole)}
                className="input-premium font-medium"
              >
                <option value="super_admin">Super Administrateur</option>
                <option value="manager">Gestionnaire Boutique & Stocks</option>
                <option value="treasurer">Trésorier & Dons</option>
                <option value="editor">Rédacteur Web & Événements</option>
              </select>
            </div>

            <div>
              <label className="label-premium">
                Statut du compte
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
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
                className="btn-secondary-soft"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-primary-gradient"
              >
                Mettre à jour les accès
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
