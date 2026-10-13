'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Key,
  Edit2,
  Lock,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { DashboardUser, UserRole } from '@/types/dashboard';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';

export default function UsersPage() {
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<DashboardUser | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('manager');
  const [editStatus, setEditStatus] = useState<'active' | 'suspended'>('active');
  const [notice, setNotice] = useState<string | null>(null);

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
          <span className="text-xs font-bold px-3.5 py-1.5 rounded-2xl bg-blue-50 text-[#0B3C68] border border-blue-200/80 shadow-xs">
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

      {/* Users Table */}
      <div className="panel overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 -my-6">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-4 px-6">Utilisateur</th>
                  <th className="py-4 px-6">Rôle</th>
                  <th className="py-4 px-6">Statut</th>
                  <th className="py-4 px-6">Permissions Actives</th>
                  <th className="py-4 px-6">Dernière Connexion</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-900 text-amber-300 font-bold flex items-center justify-center text-xs shadow-sm">
                          {user.name.slice(0, 2).toUpperCase()}
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
                            className="text-[10px] bg-blue-50 text-[#0B3C68] font-mono px-1.5 py-0.5 rounded border border-blue-100"
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
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-semibold transition-colors inline-flex items-center gap-1.5"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Modifier rôle</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40">
            <p className="font-bold text-[#0B3C68] mb-1">Super Administrateur</p>
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
