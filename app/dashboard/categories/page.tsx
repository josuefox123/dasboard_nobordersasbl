'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FolderTree,
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
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { CategoryItem } from '@/types/dashboard';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { BatchActionBar } from '@/components/ui/BatchActionBar';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination & Multi-Selection
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<CategoryItem> | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingCategory, setViewingCategory] = useState<CategoryItem | null>(null);

  // Image upload state in form
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const [notice, setNotice] = useState<string | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{ id?: string; title: string; isBulk?: boolean } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const searchParams = useSearchParams();
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
      setCurrentPage(1);
    }
  }, [searchParams]);

  async function loadCategories() {
    try {
      const data = await apiClient.getCategories();
      setCategories(data);
    } finally {
      setLoading(false);
    }
  }

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditingCategory({
      title: '',
      description: '',
      image: '',
      status: 'active',
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (category: CategoryItem) => {
    setEditingCategory({ ...category });
    setIsFormModalOpen(true);
  };

  const handleOpenDetail = (category: CategoryItem) => {
    setViewingCategory(category);
    setIsDetailModalOpen(true);
  };

  // Image upload handling
  const processImageFile = (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return;

    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setEditingCategory((prev) => (prev ? { ...prev, image: result } : prev));
      }
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      setIsUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    if (!editingCategory) return;
    setEditingCategory({ ...editingCategory, image: '' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.title?.trim()) return;

    await apiClient.saveCategory(editingCategory as any);
    await loadCategories();
    setIsFormModalOpen(false);
    const wasEditing = !!editingCategory.id;
    setEditingCategory(null);
    showNotification(
      wasEditing
        ? 'Catégorie modifiée avec succès.'
        : 'Nouvelle catégorie ajoutée avec succès.'
    );
  };

  const handleToggleStatus = async (category: CategoryItem) => {
    const updated = await apiClient.toggleCategoryStatus(category.id);
    if (updated) {
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      if (viewingCategory?.id === updated.id) {
        setViewingCategory(updated);
      }
      showNotification(
        updated.status === 'active'
          ? `Catégorie "${category.title}" activée.`
          : `Catégorie "${category.title}" désactivée.`
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
    if (selectedIds.length === paginatedCategories.length && paginatedCategories.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedCategories.map((c) => c.id));
    }
  };

  const handleBulkDelete = () => {
    setDeleteTarget({ isBulk: true, title: `${selectedIds.length} catégorie(s)` });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      if (deleteTarget.isBulk) {
        for (const id of selectedIds) {
          await apiClient.deleteCategory(id);
        }
        await loadCategories();
        showNotification(`${deleteTarget.title} supprimée(s).`);
        setSelectedIds([]);
      } else if (deleteTarget.id) {
        await apiClient.deleteCategory(deleteTarget.id);
        await loadCategories();
        setSelectedIds((prev) => prev.filter((i) => i !== deleteTarget.id));
        if (viewingCategory?.id === deleteTarget.id) {
          setIsDetailModalOpen(false);
          setViewingCategory(null);
        }
        showNotification(`Catégorie "${deleteTarget.title}" supprimée.`);
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCategories = categories.filter((cat) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      cat.title.toLowerCase().includes(q) ||
      (cat.description && cat.description.toLowerCase().includes(q));
    const matchesStatus = statusFilter === 'all' || cat.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalItems = filteredCategories.length;
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-fade-in pt-6">
      {/* En-tête : Titre & Bouton Ajouter une catégorie */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Gestion des Catégories
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Organisation du catalogue de la boutique solidaire (vélos bambou, adaptés, sport-santé et équipements).
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-primary-gradient inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une catégorie</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Barre de Recherche et Filtres */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-[0_12px_40px_-18px_rgba(38,185,151,0.12)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par titre ou description..."
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
            <option value="all">Tous les statuts ({categories.length})</option>
            <option value="active">
              Actives ({categories.filter((c) => c.status === 'active').length})
            </option>
            <option value="inactive">
              Désactivées ({categories.filter((c) => c.status === 'inactive').length})
            </option>
          </select>
        </div>
      </div>

      {/* Barre d'actions groupées */}
      <BatchActionBar
        selectedCount={selectedIds.length}
        totalCount={filteredCategories.length}
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

      {/* Tableau des catégories */}
      <div className="panel overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FolderTree className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Aucune catégorie trouvée</p>
            <p className="text-xs text-slate-400 mt-1">
              Cliquez sur « Ajouter une catégorie » pour créer votre première catégorie de produits.
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
                        paginatedCategories.length > 0 &&
                        selectedIds.length === paginatedCategories.length
                      }
                      ref={(el) => {
                        if (el) {
                          el.indeterminate =
                            selectedIds.length > 0 &&
                            selectedIds.length < paginatedCategories.length;
                        }
                      }}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-[#26B997] focus:ring-[#26B997] cursor-pointer"
                      aria-label="Sélectionner toutes les catégories affichées"
                    />
                  </th>
                  <th className="py-3.5 px-4 font-bold text-slate-700 w-64 md:w-72">Titre</th>
                  <th className="py-3.5 px-4 font-bold text-slate-700">Description</th>
                  <th className="py-3.5 px-6 whitespace-nowrap font-bold text-slate-700 w-32">Statut</th>
                  <th className="py-3.5 px-6 whitespace-nowrap font-bold text-slate-700 w-36">Date de création</th>
                  <th className="py-3.5 px-6 text-right whitespace-nowrap font-bold text-slate-700 w-44">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedCategories.map((category) => {
                  const isSelected = selectedIds.includes(category.id);
                  const isActive = category.status === 'active';

                  return (
                    <tr
                      key={category.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-[#E8F8F5]/50' : ''
                      }`}
                    >
                      {/* Checkbox sélection */}
                      <td className="py-4 pl-6 pr-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(category.id)}
                          className="w-4 h-4 rounded border-slate-300 text-[#26B997] focus:ring-[#26B997] cursor-pointer"
                          aria-label={`Sélectionner ${category.title}`}
                        />
                      </td>

                      {/* Colonne 1 : Titre (avec vignette optionnelle) */}
                      <td className="py-4 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 shadow-xs">
                            {category.image ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={category.image}
                                alt={category.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FolderTree className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <span
                            onClick={() => handleOpenDetail(category)}
                            className="text-sm font-bold text-slate-900 hover:text-[#26B997] cursor-pointer transition-colors line-clamp-1"
                            title={category.title}
                          >
                            {category.title}
                          </span>
                        </div>
                      </td>

                      {/* Colonne 2 : Description avec CSS text-overflow */}
                      <td className="py-4 px-4 text-slate-500">
                        <div
                          className="max-w-xs md:max-w-md lg:max-w-lg truncate overflow-hidden text-ellipsis whitespace-nowrap"
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={category.description}
                        >
                          {category.description || '—'}
                        </div>
                      </td>

                      {/* Colonne 3 : Statut */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(category)}
                          className="cursor-pointer group focus:outline-hidden"
                          title="Cliquer pour changer le statut"
                        >
                          <Badge
                            variant={isActive ? 'success' : 'neutral'}
                            dot
                            className="group-hover:opacity-85 transition-opacity"
                          >
                            {isActive ? 'Active' : 'Désactivée'}
                          </Badge>
                        </button>
                      </td>

                      {/* Colonne 4 : Date de création */}
                      <td className="py-4 px-6 whitespace-nowrap text-xs text-slate-600 font-normal">
                        {category.createdAt}
                      </td>

                      {/* Colonne 5 : Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Voir / Détails */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(category)}
                            className="p-1.5 text-slate-600 hover:text-[#26B997] hover:bg-[#E8F8F5] rounded-lg transition-colors"
                            title="Consulter les détails"
                            aria-label={`Détails de ${category.title}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Modifier */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(category)}
                            className="p-1.5 text-slate-600 hover:text-[#26B997] hover:bg-[#E8F8F5] rounded-lg transition-colors"
                            title="Modifier la catégorie"
                            aria-label={`Modifier ${category.title}`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Activer / Désactiver */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(category)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isActive
                                ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            }`}
                            title={isActive ? 'Désactiver la catégorie' : 'Activer la catégorie'}
                            aria-label={isActive ? 'Désactiver la catégorie' : 'Activer la catégorie'}
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
                            onClick={() => handleDelete(category.id, category.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Supprimer la catégorie"
                            aria-label={`Supprimer ${category.title}`}
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

      {/* Modal Détails Catégorie */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setViewingCategory(null);
        }}
        title="Détails de la catégorie"
        description="Fiche descriptive et visuel de la catégorie"
        maxWidth="lg"
      >
        {viewingCategory && (
          <div className="space-y-5">
            {/* Image d'illustration si présente */}
            {viewingCategory.image && (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={viewingCategory.image}
                  alt={viewingCategory.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* En-tête : Titre & Statut */}
            <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Nom de la catégorie
                </span>
                <h3 className="text-base font-extrabold text-[#1F6F5C]">
                  {viewingCategory.title}
                </h3>
              </div>
              <Badge
                variant={viewingCategory.status === 'active' ? 'success' : 'neutral'}
                dot
              >
                {viewingCategory.status === 'active' ? 'Active' : 'Désactivée'}
              </Badge>
            </div>

            {/* Description complète */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Description complète
              </span>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-normal shadow-xs">
                {viewingCategory.description || 'Aucune description renseignée pour cette catégorie.'}
              </div>
            </div>

            {/* Dates */}
            <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-2 border-t border-slate-100">
              <span>Créée le : {viewingCategory.createdAt}</span>
              {viewingCategory.updatedAt && (
                <span>Mise à jour : {viewingCategory.updatedAt}</span>
              )}
            </div>

            {/* Boutons d'actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleOpenEdit(viewingCategory);
                }}
                className="btn-secondary-soft text-xs inline-flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Modifier cette catégorie</span>
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
          setEditingCategory(null);
        }}
        title={editingCategory?.id ? 'Modifier la catégorie' : 'Ajouter une catégorie'}
        description="Renseignez le titre, la description, l'image d'illustration et le statut"
        maxWidth="lg"
      >
        {editingCategory && (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Champ 1 : Titre */}
            <div>
              <label className="label-premium">
                Titre de la catégorie <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editingCategory.title || ''}
                onChange={(e) =>
                  setEditingCategory({ ...editingCategory, title: e.target.value })
                }
                placeholder="Ex. Vélos en Bambou, Vélos Adaptés Hase Bikes..."
                className="input-premium"
                autoFocus
              />
            </div>

            {/* Champ 2 : Statut */}
            <div>
              <label className="label-premium">
                Statut <span className="text-rose-500">*</span>
              </label>
              <select
                value={editingCategory.status || 'active'}
                onChange={(e) =>
                  setEditingCategory({
                    ...editingCategory,
                    status: e.target.value as 'active' | 'inactive',
                  })
                }
                className="input-premium font-medium cursor-pointer"
              >
                <option value="active">Active (visible sur le catalogue)</option>
                <option value="inactive">Désactivée (masquée)</option>
              </select>
            </div>

            {/* Champ 3 : Description */}
            <div>
              <label className="label-premium">
                Description de la catégorie
              </label>
              <textarea
                rows={4}
                value={editingCategory.description || ''}
                onChange={(e) =>
                  setEditingCategory({ ...editingCategory, description: e.target.value })
                }
                placeholder="Présentez les particularités, usages et types d'équipements de cette catégorie..."
                className="input-premium resize-none leading-relaxed"
              />
            </div>

            {/* Champ 4 : Images avec prévisualisation */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <label className="label-premium mb-0 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#26B997]" />
                    <span>Image d’illustration</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Ajoutez une photo pour illustrer la catégorie (PNG, JPG, SVG, WebP)
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
              {editingCategory.image ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-[#26B997] max-h-52 bg-slate-100 aspect-video group shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={editingCategory.image}
                    alt="Aperçu de la catégorie"
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
                      onClick={handleRemoveImage}
                      className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-rose-700 transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ) : (
                /* Zone de téléversement (drag & drop / clic) */
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
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                    isDragOver
                      ? 'border-[#26B997] bg-[#E8F8F5]/50'
                      : 'border-slate-200 hover:border-[#26B997] bg-slate-50/50'
                  }`}
                >
                  <Upload className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">
                    {isUploadingImage
                      ? 'Chargement de l’image...'
                      : 'Cliquez ou glissez-déposez une image ici'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    PNG, JPG, WEBP jusqu’à 5 Mo
                  </p>
                </div>
              )}

              {/* Option URL directe pour l'image */}
              <div className="pt-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Ou renseigner l’URL directe d’une image</span>
                </div>
                <input
                  type="url"
                  value={editingCategory.image?.startsWith('data:') ? '' : editingCategory.image || ''}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, image: e.target.value })
                  }
                  placeholder="https://..."
                  className="input-premium font-mono text-xs"
                />
              </div>
            </div>

            {/* Boutons de validation du formulaire */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsFormModalOpen(false);
                  setEditingCategory(null);
                }}
                className="btn-secondary-soft text-xs"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-primary-gradient text-xs"
              >
                {editingCategory.id ? 'Enregistrer les modifications' : 'Créer la catégorie'}
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
        title={deleteTarget?.isBulk ? 'Supprimer les catégories' : 'Supprimer la catégorie'}
        message={
          deleteTarget?.isBulk
            ? `Supprimer définitivement ces ${deleteTarget.title} ?`
            : `Supprimer définitivement cette catégorie ?`
        }
        submessage="Cette action est irréversible."
      />
    </div>
  );
}
