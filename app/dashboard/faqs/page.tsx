'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  HelpCircle,
  Plus,
  Search,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
  Power,
  PowerOff,
  FolderTree,
  Calendar,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { FaqItem } from '@/types/dashboard';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { BatchActionBar } from '@/components/ui/BatchActionBar';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';

const DEFAULT_CATEGORIES = [
  'Général',
  'Vélos en Bambou',
  'Vélos Adaptés',
  'Dons & Fiscalité',
  'Commandes & Livraison',
  'Ateliers & Formations',
  'Garantie & SAV',
];

export default function FaqsPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Pagination & Multi-Selection
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Partial<FaqItem> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id?: string; title: string; isBulk?: boolean } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingFaq, setViewingFaq] = useState<FaqItem | null>(null);

  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    loadFaqs();
  }, []);

  const searchParams = useSearchParams();
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
      setCurrentPage(1);
    }
  }, [searchParams]);

  async function loadFaqs() {
    try {
      const data = await apiClient.getFaqs();
      setFaqs(data);
    } finally {
      setLoading(false);
    }
  }

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditingFaq({
      question: '',
      answer: '',
      category: 'Général',
      status: 'active',
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (faq: FaqItem) => {
    setEditingFaq({ ...faq });
    setIsFormModalOpen(true);
  };

  const handleOpenDetail = (faq: FaqItem) => {
    setViewingFaq(faq);
    setIsDetailModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaq || !editingFaq.question?.trim() || !editingFaq.answer?.trim()) return;

    await apiClient.saveFaq(editingFaq as any);
    await loadFaqs();
    setIsFormModalOpen(false);
    const wasEditing = !!editingFaq.id;
    setEditingFaq(null);
    showNotification(wasEditing ? 'FAQ modifiée avec succès.' : 'Nouvelle FAQ ajoutée avec succès.');
  };

  const handleToggleStatus = async (faq: FaqItem) => {
    const updated = await apiClient.toggleFaqStatus(faq.id);
    if (updated) {
      setFaqs((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      if (viewingFaq?.id === updated.id) {
        setViewingFaq(updated);
      }
      showNotification(
        updated.status === 'active'
          ? `FAQ "${faq.question.slice(0, 30)}..." activée.`
          : `FAQ "${faq.question.slice(0, 30)}..." désactivée.`
      );
    }
  };

  const handleDelete = (id: string, question: string) => {
    setDeleteTarget({ id, title: question });
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedFaqs.length && paginatedFaqs.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedFaqs.map((f) => f.id));
    }
  };

  const handleBulkDelete = () => {
    setDeleteTarget({ isBulk: true, title: `${selectedIds.length} FAQ` });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      if (deleteTarget.isBulk) {
        for (const id of selectedIds) {
          await apiClient.deleteFaq(id);
        }
        await loadFaqs();
        showNotification(`${selectedIds.length} FAQ supprimée(s).`);
        setSelectedIds([]);
      } else if (deleteTarget.id) {
        await apiClient.deleteFaq(deleteTarget.id);
        await loadFaqs();
        setSelectedIds((prev) => prev.filter((i) => i !== deleteTarget.id));
        if (viewingFaq?.id === deleteTarget.id) {
          setIsDetailModalOpen(false);
          setViewingFaq(null);
        }
        showNotification('FAQ supprimée.');
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const categories = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...faqs.map((f) => f.category).filter(Boolean)])
  ) as string[];

  const filteredFaqs = faqs.filter((faq) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      faq.question.toLowerCase().includes(q) ||
      faq.answer.toLowerCase().includes(q) ||
      (faq.category && faq.category.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === 'all' || faq.status === statusFilter;

    const matchesCategory =
      categoryFilter === 'all' || faq.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalItems = filteredFaqs.length;
  const paginatedFaqs = filteredFaqs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Foire Aux Questions (FAQ)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gérez les questions fréquentes affichées sur le site public pour guider les visiteurs et adhérents.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-primary-gradient inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle FAQ</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-[0_12px_40px_-18px_rgba(11,60,104,0.12)] flex flex-col md:flex-row items-center justify-between gap-4">
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
            placeholder="Rechercher une question, une réponse..."
            className="input-premium pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
              setSelectedIds([]);
            }}
            className="input-premium cursor-pointer font-medium w-full md:w-auto"
          >
            <option value="all">Toutes les catégories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
              setSelectedIds([]);
            }}
            className="input-premium cursor-pointer font-medium w-full md:w-auto"
          >
            <option value="all">Tous les statuts ({faqs.length})</option>
            <option value="active">Actives ({faqs.filter((f) => f.status === 'active').length})</option>
            <option value="inactive">Désactivées ({faqs.filter((f) => f.status === 'inactive').length})</option>
          </select>
        </div>
      </div>

      {/* Batch Selection Action Bar */}
      <BatchActionBar
        selectedCount={selectedIds.length}
        totalCount={filteredFaqs.length}
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

      {/* FAQ Table */}
      <div className="panel overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Aucune question fréquente trouvée</p>
            <p className="text-xs text-slate-400 mt-1">
              Cliquez sur « Nouvelle FAQ » pour créer votre première question-réponse.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 -mt-6 mb-0">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-4 pl-6 pr-2 w-10">
                    <input
                      type="checkbox"
                      checked={
                        paginatedFaqs.length > 0 &&
                        selectedIds.length === paginatedFaqs.length
                      }
                      ref={(el) => {
                        if (el) {
                          el.indeterminate =
                            selectedIds.length > 0 &&
                            selectedIds.length < paginatedFaqs.length;
                        }
                      }}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-[#0B3C68] focus:ring-[#0B3C68] cursor-pointer"
                      aria-label="Sélectionner toutes les FAQ affichées"
                    />
                  </th>
                  <th className="py-3.5 px-4 max-w-sm">Question</th>
                  <th className="py-3.5 px-6 max-w-md">Réponse</th>
                  <th className="py-3.5 px-6 whitespace-nowrap">Statut</th>
                  <th className="py-3.5 px-6 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedFaqs.map((faq) => {
                  const isSelected = selectedIds.includes(faq.id);
                  const isActive = faq.status === 'active';

                  return (
                    <tr
                      key={faq.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="py-4 pl-6 pr-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(faq.id)}
                          className="w-4 h-4 rounded border-slate-300 text-[#0B3C68] focus:ring-[#0B3C68] cursor-pointer"
                          aria-label={`Sélectionner FAQ ${faq.question}`}
                        />
                      </td>

                      <td className="py-4 px-4 max-w-xs md:max-w-sm">
                        <p
                          className="font-bold text-slate-900 text-sm leading-snug overflow-hidden text-ellipsis whitespace-nowrap cursor-default"
                          title={faq.question}
                        >
                          {faq.question}
                        </p>
                        {faq.category && (
                          <span className="inline-block mt-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {faq.category}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 max-w-md">
                        <p
                          className="overflow-hidden text-ellipsis whitespace-nowrap text-slate-600 text-xs cursor-default leading-relaxed"
                          title={faq.answer}
                        >
                          {faq.answer}
                        </p>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(faq)}
                          className="cursor-pointer transition-transform active:scale-95 text-left"
                          title={isActive ? 'Cliquez pour désactiver' : 'Cliquez pour activer'}
                        >
                          {isActive ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="neutral">Désactivée</Badge>
                          )}
                        </button>
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Voir */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(faq)}
                            className="p-1.5 text-slate-600 hover:text-[#0B3C68] hover:bg-blue-50 rounded-lg transition-colors"
                            title="Voir les détails"
                            aria-label="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Modifier */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(faq)}
                            className="p-1.5 text-slate-600 hover:text-[#0B3C68] hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier"
                            aria-label="Modifier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Activer / Désactiver */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(faq)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isActive
                                ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            }`}
                            title={isActive ? 'Désactiver la FAQ' : 'Activer la FAQ'}
                            aria-label={isActive ? 'Désactiver la FAQ' : 'Activer la FAQ'}
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
                            onClick={() => handleDelete(faq.id, faq.question)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Supprimer"
                            aria-label="Supprimer"
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

      {/* Modal Détails FAQ */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setViewingFaq(null);
        }}
        title="Détail de la FAQ"
        description="Fiche complète de la question-réponse"
        maxWidth="lg"
      >
        {viewingFaq && (
          <div className="space-y-5">
            {/* Header info */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Catégorie
                </span>
                <span className="inline-block px-2.5 py-1 bg-white border border-slate-200 text-[#0B3C68] font-bold text-xs rounded-lg">
                  {viewingFaq.category || 'Général'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Statut :
                </span>
                {viewingFaq.status === 'active' ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="neutral">Désactivée</Badge>
                )}
              </div>
            </div>

            {/* Question */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Question
              </label>
              <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl">
                <p className="font-bold text-sm text-[#0B3C68] leading-relaxed">
                  {viewingFaq.question}
                </p>
              </div>
            </div>

            {/* Réponse */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Réponse
              </label>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-normal shadow-xs">
                {viewingFaq.answer}
              </div>
            </div>

            {/* Dates */}
            {(viewingFaq.createdAt || viewingFaq.updatedAt) && (
              <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-2 border-t border-slate-100">
                {viewingFaq.createdAt && <span>Créée le : {viewingFaq.createdAt}</span>}
                {viewingFaq.updatedAt && <span>Dernière mise à jour : {viewingFaq.updatedAt}</span>}
              </div>
            )}

            {/* Boutons actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleOpenEdit(viewingFaq);
                }}
                className="btn-secondary-soft text-xs inline-flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Modifier cette FAQ</span>
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

      {/* Modal Création / Édition FAQ */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingFaq(null);
        }}
        title={editingFaq?.id ? 'Modifier la FAQ' : 'Ajouter une nouvelle FAQ'}
        description="Renseignez la question et sa réponse pour le site public"
        maxWidth="lg"
      >
        {editingFaq && (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label-premium">
                Question <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editingFaq.question || ''}
                onChange={(e) =>
                  setEditingFaq({ ...editingFaq, question: e.target.value })
                }
                placeholder="Ex. Quels sont les délais de fabrication d'un cadre bambou ?"
                className="input-premium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-premium">
                  Catégorie <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={editingFaq.category || 'Général'}
                  onChange={(e) =>
                    setEditingFaq({ ...editingFaq, category: e.target.value })
                  }
                  className="input-premium font-medium cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-premium">
                  Statut
                </label>
                <select
                  value={editingFaq.status || 'active'}
                  onChange={(e) =>
                    setEditingFaq({
                      ...editingFaq,
                      status: e.target.value as 'active' | 'inactive',
                    })
                  }
                  className="input-premium font-medium"
                >
                  <option value="active">Active (affichée en ligne)</option>
                  <option value="inactive">Désactivée (brouillon interne)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label-premium">
                Réponse détaillée <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={5}
                required
                value={editingFaq.answer || ''}
                onChange={(e) =>
                  setEditingFaq({ ...editingFaq, answer: e.target.value })
                }
                placeholder="Rédigez une réponse claire et explicite pour les visiteurs..."
                className="input-premium resize-none leading-relaxed"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsFormModalOpen(false);
                  setEditingFaq(null);
                }}
                className="btn-secondary-soft text-xs"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-primary-gradient text-xs"
              >
                {editingFaq?.id ? 'Enregistrer les modifications' : 'Créer la FAQ'}
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
        title={deleteTarget?.isBulk ? 'Supprimer les FAQ' : 'Supprimer la question'}
        message={
          deleteTarget?.isBulk
            ? `Supprimer définitivement ces ${deleteTarget.title} ?`
            : `Supprimer définitivement cette question ?`
        }
        submessage="Cette action est irréversible."
      />
    </div>
  );
}
