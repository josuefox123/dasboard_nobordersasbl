'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Radio,
  Plus,
  Search,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
  Power,
  PowerOff,
  Image as ImageIcon,
  Upload,
  Paperclip,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { PressItem } from '@/types/dashboard';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { BatchActionBar } from '@/components/ui/BatchActionBar';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';

export default function PressPage() {
  const [pressItems, setPressItems] = useState<PressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination & Multi-Selection
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<PressItem> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id?: string; title: string; isBulk?: boolean } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<PressItem | null>(null);

  // Image upload state in form
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    loadPressItems();
  }, []);

  const searchParams = useSearchParams();
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
      setCurrentPage(1);
    }
  }, [searchParams]);

  async function loadPressItems() {
    try {
      const data = await apiClient.getPressItems();
      setPressItems(data);
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
      link: '',
      image: '',
      status: 'active',
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item: PressItem) => {
    setEditingItem({ ...item });
    setIsFormModalOpen(true);
  };

  const handleOpenDetail = (item: PressItem) => {
    setViewingItem(item);
    setIsDetailModalOpen(true);
  };

  // Image Upload Handler
  const processImageFile = (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return;

    setIsUploadingFiles(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setEditingItem((prev) => (prev ? { ...prev, image: result } : prev));
      }
      setIsUploadingFiles(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      setIsUploadingFiles(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    if (!editingItem) return;
    setEditingItem({ ...editingItem, image: '' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.title?.trim()) return;

    await apiClient.savePressItem(editingItem as any);
    await loadPressItems();
    setIsFormModalOpen(false);
    const wasEditing = !!editingItem.id;
    setEditingItem(null);
    showNotification(
      wasEditing
        ? 'Élément de presse modifié avec succès.'
        : 'Nouvel élément de presse ajouté avec succès.'
    );
  };

  const handleToggleStatus = async (item: PressItem) => {
    const updated = await apiClient.togglePressItemStatus(item.id);
    if (updated) {
      setPressItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      if (viewingItem?.id === updated.id) {
        setViewingItem(updated);
      }
      showNotification(
        updated.status === 'active'
          ? `Élément "${item.title.slice(0, 30)}..." activé.`
          : `Élément "${item.title.slice(0, 30)}..." désactivé.`
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
    if (selectedIds.length === paginatedItems.length && paginatedItems.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedItems.map((p) => p.id));
    }
  };

  const handleBulkDelete = () => {
    setDeleteTarget({ isBulk: true, title: `${selectedIds.length} élément(s)` });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      if (deleteTarget.isBulk) {
        for (const id of selectedIds) {
          await apiClient.deletePressItem(id);
        }
        await loadPressItems();
        showNotification(`${selectedIds.length} élément(s) supprimé(s).`);
        setSelectedIds([]);
      } else if (deleteTarget.id) {
        await apiClient.deletePressItem(deleteTarget.id);
        await loadPressItems();
        setSelectedIds((prev) => prev.filter((i) => i !== deleteTarget.id));
        if (viewingItem?.id === deleteTarget.id) {
          setIsDetailModalOpen(false);
          setViewingItem(null);
        }
        showNotification(`Élément "${deleteTarget.title}" supprimé.`);
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredItems = pressItems.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.title.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.source && item.source.toLowerCase().includes(q)) ||
      (item.link && item.link.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalItems = filteredItems.length;
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Gestion de la Presse
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Articles, reportages, parutions médias et publications externes consacrés à No Borders ASBL.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-primary-gradient inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un élément de presse</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
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
            placeholder="Rechercher par titre, média ou mot-clé..."
            className="input-premium pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
              setSelectedIds([]);
            }}
            className="input-premium cursor-pointer font-medium w-full md:w-auto"
          >
            <option value="all">Tous les statuts ({pressItems.length})</option>
            <option value="active">
              Actifs ({pressItems.filter((p) => p.status === 'active').length})
            </option>
            <option value="inactive">
              Désactivés ({pressItems.filter((p) => p.status === 'inactive').length})
            </option>
          </select>
        </div>
      </div>

      {/* Batch Selection Action Bar */}
      <BatchActionBar
        selectedCount={selectedIds.length}
        totalCount={filteredItems.length}
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

      {/* Press Table */}
      <div className="panel overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Radio className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Aucun élément de presse trouvé</p>
            <p className="text-xs text-slate-400 mt-1">
              Cliquez sur « Ajouter un élément de presse » pour enregistrer un premier article.
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
                        paginatedItems.length > 0 &&
                        selectedIds.length === paginatedItems.length
                      }
                      ref={(el) => {
                        if (el) {
                          el.indeterminate =
                            selectedIds.length > 0 &&
                            selectedIds.length < paginatedItems.length;
                        }
                      }}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-[#26B997] focus:ring-[#26B997] cursor-pointer"
                      aria-label="Sélectionner tous les éléments affichés"
                    />
                  </th>
                  <th className="py-3.5 px-3 w-16">Visuel</th>
                  <th className="py-3.5 px-4 max-w-sm md:max-w-md">Titre</th>
                  <th className="py-3.5 px-6 whitespace-nowrap">Statut</th>
                  <th className="py-3.5 px-6 whitespace-nowrap">Date de création</th>
                  <th className="py-3.5 px-6 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const isActive = item.status === 'active';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-[#E8F8F5]/50' : ''
                      }`}
                    >
                      <td className="py-4 pl-6 pr-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.id)}
                          className="w-4 h-4 rounded border-slate-300 text-[#26B997] focus:ring-[#26B997] cursor-pointer"
                          aria-label={`Sélectionner ${item.title}`}
                        />
                      </td>

                      {/* Visuel miniature */}
                      <td className="py-4 px-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 shadow-xs group">
                          {item.image ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                      </td>

                      {/* Titre */}
                      <td className="py-4 px-4 max-w-sm md:max-w-md">
                        <p
                          className="font-bold text-slate-900 text-sm leading-snug overflow-hidden text-ellipsis whitespace-nowrap cursor-default"
                          title={item.title}
                        >
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {item.source && (
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              {item.source}
                            </span>
                          )}
                          {item.link && (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-[#1F6F5C] hover:text-[#26B997] hover:underline inline-flex items-center gap-1 font-medium"
                              title="Ouvrir le lien externe"
                            >
                              <span>Lien de publication</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Statut avec bouton bascule */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          className="cursor-pointer transition-transform active:scale-95 text-left"
                          title={isActive ? 'Cliquez pour désactiver' : 'Cliquez pour activer'}
                        >
                          {isActive ? (
                            <Badge variant="success">Actif</Badge>
                          ) : (
                            <Badge variant="neutral">Désactivé</Badge>
                          )}
                        </button>
                      </td>

                      {/* Date de création simple (sans icône) */}
                      <td className="py-4 px-6 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {item.createdAt}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Voir */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(item)}
                            className="p-1.5 text-slate-600 hover:text-[#26B997] hover:bg-[#E8F8F5] rounded-lg transition-colors"
                            title="Consulter les détails"
                            aria-label="Consulter les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Modifier */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-600 hover:text-[#26B997] hover:bg-[#E8F8F5] rounded-lg transition-colors"
                            title="Modifier"
                            aria-label="Modifier"
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
                            title={isActive ? 'Désactiver l’élément' : 'Activer l’élément'}
                            aria-label={isActive ? 'Désactiver l’élément' : 'Activer l’élément'}
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

      {/* Modal Détails Presse */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setViewingItem(null);
        }}
        title="Détail de l’élément de presse"
        description="Informations complètes de l’article et référence média"
        maxWidth="lg"
      >
        {viewingItem && (
          <div className="space-y-5">
            {/* Header info */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Média / Source
                </span>
                <span className="inline-block px-2.5 py-1 bg-white border border-slate-200 text-[#1F6F5C] font-bold text-xs rounded-lg">
                  {viewingItem.source || 'Presse & Médias'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Statut :
                </span>
                {viewingItem.status === 'active' ? (
                  <Badge variant="success">Actif</Badge>
                ) : (
                  <Badge variant="neutral">Désactivé</Badge>
                )}
              </div>
            </div>

            {/* Titre */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Titre
              </label>
              <div className="p-3.5 bg-[#E8F8F5]/50 border border-[#26B997]/25 rounded-xl">
                <p className="font-bold text-base text-[#1F6F5C]">
                  {viewingItem.title}
                </p>
              </div>
            </div>

            {/* Image d’illustration */}
            {viewingItem.image && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Image associée
                </label>
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 shadow-xs max-h-64">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={viewingItem.image}
                    alt={viewingItem.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Lien externe */}
            {viewingItem.link && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Lien de l’article / Ressource
                </label>
                <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-600 font-mono truncate">
                    {viewingItem.link}
                  </span>
                  <a
                    href={viewingItem.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary-gradient text-xs shrink-0 inline-flex items-center gap-1.5 py-1.5 px-3"
                  >
                    <span>Ouvrir l’article</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Description */}
            {viewingItem.description && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Présentation / Résumé
                </label>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-normal shadow-xs">
                  {viewingItem.description}
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-2 border-t border-slate-100">
              <span>Créé le : {viewingItem.createdAt}</span>
              {viewingItem.updatedAt && <span>Dernière mise à jour : {viewingItem.updatedAt}</span>}
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
                <span>Modifier cet élément</span>
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

      {/* Modal Création / Modification Élément de Presse */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingItem(null);
        }}
        title={editingItem?.id ? 'Modifier l’élément de presse' : 'Ajouter un élément de presse'}
        description="Renseignez le titre, le statut, l’image, le lien et la description"
        maxWidth="lg"
      >
        {editingItem && (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Titre */}
            <div>
              <label className="label-premium">
                Titre de l’élément <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editingItem.title || ''}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, title: e.target.value })
                }
                placeholder="Ex. Quand le bambou révolutionne la mobilité inclusive..."
                className="input-premium"
              />
            </div>

            {/* Statut & Source / Média */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-premium">
                  Statut
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
                  <option value="active">Actif (affiché sur /presse)</option>
                  <option value="inactive">Désactivé (masqué)</option>
                </select>
              </div>

              <div>
                <label className="label-premium">
                  Source / Nom du média
                </label>
                <input
                  type="text"
                  value={editingItem.source || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, source: e.target.value })
                  }
                  placeholder="Ex. RTBF, Le Soir, BX1, LN24..."
                  className="input-premium"
                />
              </div>
            </div>

            {/* Lien */}
            <div>
              <label className="label-premium">
                Lien de la publication (URL)
              </label>
              <input
                type="url"
                value={editingItem.link || ''}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, link: e.target.value })
                }
                placeholder="https://www.rtbf.be/article/..."
                className="input-premium font-mono text-xs"
              />
            </div>

            {/* Description */}
            <div>
              <label className="label-premium">
                Description / Résumé
              </label>
              <textarea
                rows={4}
                value={editingItem.description || ''}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, description: e.target.value })
                }
                placeholder="Présentez brièvement le sujet de l'article ou de l'intervention média..."
                className="input-premium resize-none leading-relaxed"
              />
            </div>

            {/* Image associée */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <label className="label-premium mb-0 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#26B997]" />
                    <span>Image associée</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Importez une photo d’illustration depuis votre ordinateur
                  </p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) processImageFile(e.target.files);
                }}
              />

              {/* Si une image est présente */}
              {editingItem.image ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-[#26B997] max-h-52 bg-slate-100 aspect-video group shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={editingItem.image}
                    alt="Aperçu"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white text-slate-800 rounded-xl text-xs font-semibold shadow-xs hover:bg-slate-50 transition-colors"
                    >
                      Changer l’image
                    </button>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-rose-700 transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ) : (
                /* Zone Drag & Drop */
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    if (e.dataTransfer.files) processImageFile(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                    isDragOver
                      ? 'border-[#26B997] bg-[#E8F8F5]/70 scale-[1.01]'
                      : 'border-slate-300 hover:border-[#26B997] bg-slate-50/70 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#E8F8F5] text-[#1F6F5C] flex items-center justify-center shadow-xs">
                      {isUploadingFiles ? (
                        <div className="w-4 h-4 border-2 border-[#26B997] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {isUploadingFiles
                          ? 'Chargement de l’image...'
                          : 'Glissez une image ici ou cliquez pour parcourir'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Formats acceptés : JPG, PNG, WEBP
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-[#1F6F5C] font-bold text-xs shadow-xs hover:bg-slate-50 transition-colors mt-0.5"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Choisir un fichier</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Boutons formulaire */}
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
                {editingItem?.id ? 'Enregistrer les modifications' : 'Créer l’élément'}
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
        title={deleteTarget?.isBulk ? 'Supprimer les éléments' : 'Supprimer l’élément'}
        message={
          deleteTarget?.isBulk
            ? `Supprimer définitivement ces ${deleteTarget.title} ?`
            : `Supprimer définitivement cet élément de presse ?`
        }
        submessage="Cette action est irréversible."
      />
    </div>
  );
}
