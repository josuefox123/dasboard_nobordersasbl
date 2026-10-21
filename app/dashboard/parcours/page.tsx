'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Milestone,
  Plus,
  Search,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
  Power,
  PowerOff,
  Calendar,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ParcoursItem } from '@/types/dashboard';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { BatchActionBar } from '@/components/ui/BatchActionBar';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';

export default function ParcoursPage() {
  const [parcoursList, setParcoursList] = useState<ParcoursItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination & Multi-Selection
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<ParcoursItem> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id?: string; title: string; isBulk?: boolean } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<ParcoursItem | null>(null);

  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    loadParcours();
  }, []);

  const searchParams = useSearchParams();
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
      setCurrentPage(1);
    }
  }, [searchParams]);

  async function loadParcours() {
    try {
      const data = await apiClient.getParcours();
      setParcoursList(data);
    } finally {
      setLoading(false);
    }
  }

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditingItem({
      title: '',
      description: '',
      period: '',
      status: 'active',
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item: ParcoursItem) => {
    setEditingItem({ ...item });
    setIsFormModalOpen(true);
  };

  const handleOpenDetail = (item: ParcoursItem) => {
    setViewingItem(item);
    setIsDetailModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.title?.trim()) return;

    await apiClient.saveParcours(editingItem as any);
    await loadParcours();
    setIsFormModalOpen(false);
    const wasEditing = !!editingItem.id;
    setEditingItem(null);
    showNotification(
      wasEditing
        ? 'Élément de parcours modifié avec succès.'
        : 'Nouvel élément de parcours ajouté avec succès.'
    );
  };

  const handleToggleStatus = async (item: ParcoursItem) => {
    const updated = await apiClient.toggleParcoursStatus(item.id);
    if (updated) {
      setParcoursList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      if (viewingItem?.id === updated.id) {
        setViewingItem(updated);
      }
      showNotification(
        updated.status === 'active'
          ? `Parcours "${item.title}" activé.`
          : `Parcours "${item.title}" désactivé.`
      );
    }
  };

  const handleDelete = (id: string, title: string) => {
    setDeleteTarget({ id, title });
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedParcours.length && paginatedParcours.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedParcours.map((p) => p.id));
    }
  };

  const handleBulkDelete = () => {
    setDeleteTarget({ isBulk: true, title: `${selectedIds.length} parcours` });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      if (deleteTarget.isBulk) {
        for (const id of selectedIds) {
          await apiClient.deleteParcours(id);
        }
        await loadParcours();
        showNotification(`${selectedIds.length} parcours supprimé(s).`);
        setSelectedIds([]);
      } else if (deleteTarget.id) {
        await apiClient.deleteParcours(deleteTarget.id);
        await loadParcours();
        setSelectedIds((prev) => prev.filter((i) => i !== deleteTarget.id));
        if (viewingItem?.id === deleteTarget.id) {
          setIsDetailModalOpen(false);
          setViewingItem(null);
        }
        showNotification(`Parcours "${deleteTarget.title}" supprimé.`);
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredParcours = parcoursList.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.title.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.period && item.period.toLowerCase().includes(q));
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalItems = filteredParcours.length;
  const paginatedParcours = filteredParcours.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* En-tête : Titre & Bouton Ajouter un parcours */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Gestion des Parcours
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Chronologie, étapes d’expérience, formations et jalons historiques de No Borders ASBL.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-primary-gradient inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un parcours</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Barre de Recherche et Filtres */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-[0_12px_40px_-18px_rgba(11,60,104,0.12)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par titre, période ou description..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="input-premium pl-10 text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
              setSelectedIds([]);
            }}
            className="input-premium cursor-pointer font-medium w-full md:w-auto"
          >
            <option value="all">Tous les statuts ({parcoursList.length})</option>
            <option value="active">
              Actifs ({parcoursList.filter((p) => p.status === 'active').length})
            </option>
            <option value="inactive">
              Désactivés ({parcoursList.filter((p) => p.status === 'inactive').length})
            </option>
          </select>
        </div>
      </div>

      {/* Barre d'actions groupées */}
      <BatchActionBar
        selectedCount={selectedIds.length}
        totalCount={filteredParcours.length}
        onClearSelection={() => setSelectedIds([])}
      >
        <button
          type="button"
          onClick={handleBulkDelete}
          className="px-3 py-1.5 rounded-xl bg-rose-500/80 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Supprimer ({selectedIds.length})</span>
        </button>
      </BatchActionBar>

      {/* Tableau des parcours */}
      <div className="panel overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : filteredParcours.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Milestone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Aucun parcours trouvé</p>
            <p className="text-xs text-slate-400 mt-1">
              Cliquez sur « Ajouter un parcours » pour enregistrer une première étape ou formation.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 -mt-6 mb-0">
            <table className="w-full text-left text-xs table-fixed">
              <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-4 pl-6 pr-2 w-12">
                    <input
                      type="checkbox"
                      checked={
                        paginatedParcours.length > 0 &&
                        selectedIds.length === paginatedParcours.length
                      }
                      ref={(el) => {
                        if (el) {
                          el.indeterminate =
                            selectedIds.length > 0 &&
                            selectedIds.length < paginatedParcours.length;
                        }
                      }}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-[#0B3C68] focus:ring-[#0B3C68] cursor-pointer"
                      aria-label="Sélectionner tous les parcours affichés"
                    />
                  </th>
                  <th className="py-3.5 px-4 font-bold text-slate-700 w-64 md:w-72">Titre</th>
                  <th className="py-3.5 px-4 font-bold text-slate-700">Description</th>
                  <th className="py-3.5 px-6 whitespace-nowrap font-bold text-slate-700 w-36">Année du parcours</th>
                  <th className="py-3.5 px-6 whitespace-nowrap font-bold text-slate-700 w-32">Statut</th>
                  <th className="py-3.5 px-6 whitespace-nowrap font-bold text-slate-700 w-36">Date de création</th>
                  <th className="py-3.5 px-6 text-right whitespace-nowrap font-bold text-slate-700 w-44">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedParcours.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const isActive = item.status === 'active';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      {/* Checkbox sélection */}
                      <td className="py-4 pl-6 pr-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.id)}
                          className="w-4 h-4 rounded border-slate-300 text-[#0B3C68] focus:ring-[#0B3C68] cursor-pointer"
                          aria-label={`Sélectionner ${item.title}`}
                        />
                      </td>

                      {/* Colonne 1 : Titre */}
                      <td className="py-4 px-4 font-semibold text-slate-900">
                        <span
                          onClick={() => handleOpenDetail(item)}
                          className="text-sm font-bold text-slate-900 hover:text-[#0B3C68] cursor-pointer transition-colors line-clamp-1"
                          title={item.title}
                        >
                          {item.title}
                        </span>
                      </td>

                      {/* Colonne 2 : Description tronquée */}
                      <td className="py-4 px-4 text-slate-500">
                        <div
                          className="max-w-xs md:max-w-md lg:max-w-lg truncate overflow-hidden text-ellipsis whitespace-nowrap"
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={item.description}
                        >
                          {item.description || '—'}
                        </div>
                      </td>

                      {/* Colonne 3 : Année du parcours */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50/80 text-[#0B3C68] font-bold text-xs border border-blue-100/80">
                          {item.period || '—'}
                        </span>
                      </td>

                      {/* Colonne 4 : Statut */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          className="cursor-pointer group focus:outline-hidden"
                          title="Cliquer pour changer le statut"
                        >
                          <Badge
                            variant={isActive ? 'success' : 'neutral'}
                            dot
                            className="group-hover:opacity-85 transition-opacity"
                          >
                            {isActive ? 'Actif' : 'Désactivé'}
                          </Badge>
                        </button>
                      </td>

                      {/* Colonne 5 : Date de création */}
                      <td className="py-4 px-6 whitespace-nowrap text-xs text-slate-600 font-normal">
                        {item.createdAt}
                      </td>

                      {/* Colonne 6 : Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Voir / Détails */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(item)}
                            className="p-1.5 text-slate-600 hover:text-[#0B3C68] hover:bg-blue-50 rounded-lg transition-colors"
                            title="Consulter les détails"
                            aria-label={`Détails de ${item.title}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Modifier */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-600 hover:text-[#0B3C68] hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier le parcours"
                            aria-label={`Modifier ${item.title}`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Activer / Désactiver */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isActive
                                ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            }`}
                            title={isActive ? 'Désactiver le parcours' : 'Activer le parcours'}
                            aria-label={isActive ? 'Désactiver le parcours' : 'Activer le parcours'}
                          >
                            {isActive ? (
                              <Power className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <PowerOff className="w-4 h-4 text-slate-400" />
                            )}
                          </button>

                          {/* Supprimer */}
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Supprimer le parcours"
                            aria-label={`Supprimer ${item.title}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination espacée */}
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

      {/* Modal Détails Parcours */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setViewingItem(null);
        }}
        title="Détails du parcours"
        description="Fiche descriptive et période de l’étape ou formation"
        maxWidth="lg"
      >
        {viewingItem && (
          <div className="space-y-5">
            {/* En-tête : Titre & Période & Statut */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Titre du parcours
                </span>
                <h3 className="text-base font-extrabold text-[#0B3C68]">
                  {viewingItem.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-[#0B3C68] font-bold text-xs shadow-xs">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{viewingItem.period || 'Non spécifiée'}</span>
                </span>
                <Badge
                  variant={viewingItem.status === 'active' ? 'success' : 'neutral'}
                  dot
                >
                  {viewingItem.status === 'active' ? 'Actif' : 'Désactivé'}
                </Badge>
              </div>
            </div>

            {/* Description complète */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Contenu détaillé
              </span>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-normal shadow-xs">
                {viewingItem.description || 'Aucune description détaillée renseignée pour ce parcours.'}
              </div>
            </div>

            {/* Dates */}
            <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-2 border-t border-slate-100">
              <span>Créé le : {viewingItem.createdAt}</span>
              {viewingItem.updatedAt && (
                <span>Mise à jour : {viewingItem.updatedAt}</span>
              )}
            </div>

            {/* Boutons d'actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleOpenEdit(viewingItem);
                }}
                className="btn-secondary-soft text-xs inline-flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Modifier ce parcours</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="btn-primary-gradient text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Formulaire réutilisable (Création & Modification) */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingItem(null);
        }}
        title={editingItem?.id ? 'Modifier le parcours' : 'Ajouter un parcours'}
        description="Renseignez le titre, la période ou année et la description du parcours"
        maxWidth="lg"
      >
        {editingItem && (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Champ 1 : Titre */}
            <div>
              <label className="label-premium">
                Titre du parcours <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editingItem.title || ''}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, title: e.target.value })
                }
                placeholder="Ex. Fondation de l’ASBL & Premiers prototypes en bambou..."
                className="input-premium"
                autoFocus
              />
            </div>

            {/* Champ 2 : Année du parcours & Statut */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-premium">
                  Année / Période du parcours <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.period || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, period: e.target.value })
                  }
                  placeholder="Ex. 2022–2023 ou 2024–Présent"
                  className="input-premium font-medium"
                />
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400">Suggestions :</span>
                  {['2024–Présent', '2023–2024', '2022–2023', '2020–2021'].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setEditingItem({ ...editingItem, period: suggestion })}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-[#0B3C68] text-slate-600 font-mono transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-premium">
                  Statut <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editingItem.status || 'active'}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      status: e.target.value as 'active' | 'inactive',
                    })
                  }
                  className="input-premium font-medium cursor-pointer"
                >
                  <option value="active">Actif (affiché dans le parcours)</option>
                  <option value="inactive">Désactivé (masqué)</option>
                </select>
              </div>
            </div>

            {/* Champ 3 : Description */}
            <div>
              <label className="label-premium">
                Description détaillée
              </label>
              <textarea
                rows={5}
                value={editingItem.description || ''}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, description: e.target.value })
                }
                placeholder="Détaillez les réalisations, apprentissages, compétences développées ou jalons franchis..."
                className="input-premium resize-none leading-relaxed"
              />
            </div>

            {/* Boutons de validation */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsFormModalOpen(false);
                  setEditingItem(null);
                }}
                className="btn-secondary-soft text-xs"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-primary-gradient text-xs"
              >
                {editingItem.id ? 'Enregistrer les modifications' : 'Créer le parcours'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Confirmation de Suppression */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title={deleteTarget?.isBulk ? 'Supprimer les parcours' : 'Supprimer le parcours'}
        message={
          deleteTarget?.isBulk
            ? `Supprimer définitivement ces ${deleteTarget.title} ?`
            : `Supprimer définitivement ce parcours ?`
        }
        submessage="Cette action est irréversible."
      />
    </div>
  );
}
