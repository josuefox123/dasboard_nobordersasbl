'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CalendarCheck,
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
  Star,
  Calendar,
  MapPin,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ActivityItem } from '@/types/dashboard';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { BatchActionBar } from '@/components/ui/BatchActionBar';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';

const DEFAULT_CATEGORIES = [
  'Ateliers Bambou',
  'Sorties & Mobilité Adaptée',
  'Initiation & Sport-Santé',
  'Réparation & Économie Circulaire',
  'Sensibilisation & Jeunesse',
  'Événements Solidaires',
];

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
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
  const [editingActivity, setEditingActivity] = useState<Partial<ActivityItem> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id?: string; title: string; isBulk?: boolean } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingActivity, setViewingActivity] = useState<ActivityItem | null>(null);

  // Images upload state in form
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    loadActivities();
  }, []);

  const searchParams = useSearchParams();
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
      setCurrentPage(1);
    }
  }, [searchParams]);

  async function loadActivities() {
    try {
      const data = await apiClient.getActivities();
      setActivities(data);
    } finally {
      setLoading(false);
    }
  }

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditingActivity({
      title: '',
      category: 'Ateliers Bambou',
      description: '',
      status: 'active',
      image: '',
      images: [],
      date: '',
      location: '',
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (act: ActivityItem) => {
    const initialImages =
      act.images && act.images.length > 0
        ? [...act.images]
        : act.image
        ? [act.image]
        : [];

    setEditingActivity({
      ...act,
      images: initialImages,
      image: initialImages[0] || '',
    });
    setIsFormModalOpen(true);
  };

  const handleOpenDetail = (act: ActivityItem) => {
    setViewingActivity(act);
    setIsDetailModalOpen(true);
  };

  // Image Upload Handlers (local files)
  const processImageFiles = (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsUploadingFiles(true);
    const fileList = Array.from(files);
    let loadedCount = 0;
    const newImages: string[] = [];

    fileList.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        loadedCount++;
        if (loadedCount === fileList.length) setIsUploadingFiles(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          newImages.push(result);
        }
        loadedCount++;
        if (loadedCount === fileList.length) {
          setEditingActivity((prev) => {
            if (!prev) return prev;
            const currentImages =
              prev.images && prev.images.length > 0
                ? [...prev.images]
                : prev.image
                ? [prev.image]
                : [];
            const merged = [...currentImages, ...newImages];
            return {
              ...prev,
              images: merged,
              image: merged[0] || '',
            };
          });
          setIsUploadingFiles(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      reader.onerror = () => {
        loadedCount++;
        if (loadedCount === fileList.length) setIsUploadingFiles(false);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index: number) => {
    if (!editingActivity) return;
    const currentImages =
      editingActivity.images && editingActivity.images.length > 0
        ? [...editingActivity.images]
        : editingActivity.image
        ? [editingActivity.image]
        : [];
    const updated = currentImages.filter((_, i) => i !== index);
    setEditingActivity({
      ...editingActivity,
      images: updated,
      image: updated[0] || '',
    });
  };

  const handleSetPrimaryPhoto = (index: number) => {
    if (!editingActivity) return;
    const currentImages = [
      ...(editingActivity.images || (editingActivity.image ? [editingActivity.image] : [])),
    ];
    if (index >= 0 && index < currentImages.length) {
      const [selected] = currentImages.splice(index, 1);
      currentImages.unshift(selected);
      setEditingActivity({
        ...editingActivity,
        images: currentImages,
        image: currentImages[0] || '',
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity || !editingActivity.title?.trim() || !editingActivity.description?.trim()) return;

    const finalItem = {
      ...editingActivity,
      image:
        editingActivity.images && editingActivity.images.length > 0
          ? editingActivity.images[0]
          : editingActivity.image || '',
      images: editingActivity.images || [],
    };

    await apiClient.saveActivity(finalItem as any);
    await loadActivities();
    setIsFormModalOpen(false);
    const wasEditing = !!editingActivity.id;
    setEditingActivity(null);
    showNotification(
      wasEditing ? 'Activité modifiée avec succès.' : 'Nouvelle activité ajoutée avec succès.'
    );
  };

  const handleToggleStatus = async (act: ActivityItem) => {
    const updated = await apiClient.toggleActivityStatus(act.id);
    if (updated) {
      setActivities((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      if (viewingActivity?.id === updated.id) {
        setViewingActivity(updated);
      }
      showNotification(
        updated.status === 'active'
          ? `Activité "${act.title}" activée.`
          : `Activité "${act.title}" désactivée.`
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
    if (selectedIds.length === paginatedActivities.length && paginatedActivities.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedActivities.map((a) => a.id));
    }
  };

  const handleBulkDelete = () => {
    setDeleteTarget({ isBulk: true, title: `${selectedIds.length} activité(s)` });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      if (deleteTarget.isBulk) {
        for (const id of selectedIds) {
          await apiClient.deleteActivity(id);
        }
        await loadActivities();
        showNotification(`${selectedIds.length} activité(s) supprimée(s).`);
        setSelectedIds([]);
      } else if (deleteTarget.id) {
        await apiClient.deleteActivity(deleteTarget.id);
        await loadActivities();
        setSelectedIds((prev) => prev.filter((i) => i !== deleteTarget.id));
        if (viewingActivity?.id === deleteTarget.id) {
          setIsDetailModalOpen(false);
          setViewingActivity(null);
        }
        showNotification(`Activité "${deleteTarget.title}" supprimée.`);
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const categories = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...activities.map((a) => a.category).filter(Boolean)])
  ) as string[];

  const filteredActivities = activities.filter((act) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      act.title.toLowerCase().includes(q) ||
      act.description.toLowerCase().includes(q) ||
      (act.category && act.category.toLowerCase().includes(q)) ||
      (act.location && act.location.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === 'all' || act.status === statusFilter;

    const matchesCategory =
      categoryFilter === 'all' || act.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalItems = filteredActivities.length;
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Gestion des Activités
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ateliers participatifs, sorties inclusives, initiations et programmes solidaires de l’association.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-primary-gradient inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une activité</span>
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
            placeholder="Rechercher par titre, catégorie, mot-clé..."
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
            <option value="all">Tous les statuts ({activities.length})</option>
            <option value="active">
              Actives ({activities.filter((a) => a.status === 'active').length})
            </option>
            <option value="inactive">
              Désactivées ({activities.filter((a) => a.status === 'inactive').length})
            </option>
          </select>
        </div>
      </div>

      {/* Batch Selection Action Bar */}
      <BatchActionBar
        selectedCount={selectedIds.length}
        totalCount={filteredActivities.length}
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

      {/* Activities Table */}
      <div className="panel overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Aucune activité trouvée</p>
            <p className="text-xs text-slate-400 mt-1">
              Cliquez sur « Ajouter une activité » pour publier votre premier atelier ou événement.
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
                        paginatedActivities.length > 0 &&
                        selectedIds.length === paginatedActivities.length
                      }
                      ref={(el) => {
                        if (el) {
                          el.indeterminate =
                            selectedIds.length > 0 &&
                            selectedIds.length < paginatedActivities.length;
                        }
                      }}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-[#26B997] focus:ring-[#26B997] cursor-pointer"
                      aria-label="Sélectionner toutes les activités affichées"
                    />
                  </th>
                  <th className="py-3.5 px-3 w-16">Visuel</th>
                  <th className="py-3.5 px-4 max-w-xs md:max-w-sm">Titre</th>
                  <th className="py-3.5 px-6 whitespace-nowrap">Catégorie</th>
                  <th className="py-3.5 px-6 max-w-md">Description</th>
                  <th className="py-3.5 px-6 whitespace-nowrap">Statut</th>
                  <th className="py-3.5 px-6 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedActivities.map((act) => {
                  const isSelected = selectedIds.includes(act.id);
                  const isActive = act.status === 'active';
                  const allImages =
                    act.images && act.images.length > 0
                      ? act.images
                      : act.image
                      ? [act.image]
                      : [];

                  return (
                    <tr
                      key={act.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-[#E8F8F5]/50' : ''
                      }`}
                    >
                      <td className="py-4 pl-6 pr-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(act.id)}
                          className="w-4 h-4 rounded border-slate-300 text-[#26B997] focus:ring-[#26B997] cursor-pointer"
                          aria-label={`Sélectionner activité ${act.title}`}
                        />
                      </td>

                      {/* Visuel miniature */}
                      <td className="py-4 px-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 shadow-xs group">
                          {allImages.length > 0 ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={allImages[0]}
                                alt={act.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              {allImages.length > 1 && (
                                <span className="absolute bottom-1 right-1 bg-black/75 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md leading-tight flex items-center gap-0.5 shadow-xs">
                                  <ImageIcon className="w-2.5 h-2.5" />
                                  <span>{allImages.length}</span>
                                </span>
                              )}
                            </>
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                      </td>

                      {/* Titre */}
                      <td className="py-4 px-4 max-w-xs md:max-w-sm">
                        <p
                          className="font-bold text-slate-900 text-sm leading-snug overflow-hidden text-ellipsis whitespace-nowrap cursor-default"
                          title={act.title}
                        >
                          {act.title}
                        </p>
                        {(act.date || act.location) && (
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                            {act.date} {act.location ? `• ${act.location}` : ''}
                          </p>
                        )}
                      </td>

                      {/* Catégorie */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-[#E8F8F5] text-[#1F6F5C] font-bold text-[11px] border border-[#26B997]/25">
                          {act.category}
                        </span>
                      </td>

                      {/* Description tronquée avec points de suspension */}
                      <td className="py-4 px-6 max-w-md">
                        <p
                          className="overflow-hidden text-ellipsis whitespace-nowrap text-slate-600 text-xs cursor-default leading-relaxed"
                          title={act.description}
                        >
                          {act.description}
                        </p>
                      </td>

                      {/* Statut avec bouton bascule */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(act)}
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

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Voir */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(act)}
                            className="p-1.5 text-slate-600 hover:text-[#26B997] hover:bg-[#E8F8F5] rounded-lg transition-colors"
                            title="Voir les détails"
                            aria-label="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Modifier */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(act)}
                            className="p-1.5 text-slate-600 hover:text-[#26B997] hover:bg-[#E8F8F5] rounded-lg transition-colors"
                            title="Modifier"
                            aria-label="Modifier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Activer / Désactiver */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(act)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isActive
                                ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            }`}
                            title={isActive ? 'Désactiver l’activité' : 'Activer l’activité'}
                            aria-label={isActive ? 'Désactiver l’activité' : 'Activer l’activité'}
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
                            onClick={() => handleDelete(act.id, act.title)}
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

      {/* Modal Détails Activité */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setViewingActivity(null);
        }}
        title="Détail de l’activité"
        description="Fiche complète de l’activité, présentation et galerie photos"
        maxWidth="lg"
      >
        {viewingActivity && (
          <div className="space-y-5">
            {/* Header info */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Catégorie
                </span>
                <span className="inline-block px-2.5 py-1 bg-white border border-slate-200 text-[#1F6F5C] font-bold text-xs rounded-lg">
                  {viewingActivity.category}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Statut :
                </span>
                {viewingActivity.status === 'active' ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="neutral">Désactivée</Badge>
                )}
              </div>
            </div>

            {/* Titre */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Titre de l’activité
              </label>
              <div className="p-3.5 bg-[#E8F8F5]/50 border border-[#26B997]/25 rounded-xl">
                <p className="font-bold text-base text-[#1F6F5C]">
                  {viewingActivity.title}
                </p>
                {(viewingActivity.date || viewingActivity.location) && (
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2 pt-2 border-t border-blue-100">
                    {viewingActivity.date && (
                      <span className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{viewingActivity.date}</span>
                      </span>
                    )}
                    {viewingActivity.location && (
                      <span className="flex items-center gap-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{viewingActivity.location}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Galerie Photos */}
            {((viewingActivity.images && viewingActivity.images.length > 0) || viewingActivity.image) && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Photos de l’activité ({ (viewingActivity.images || [viewingActivity.image]).length })
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(viewingActivity.images || [viewingActivity.image]).map((img, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 group shadow-xs"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      {idx === 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-[#26B997] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          <span>Couverture</span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Description
              </label>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-normal shadow-xs">
                {viewingActivity.description}
              </div>
            </div>

            {/* Dates */}
            {(viewingActivity.createdAt || viewingActivity.updatedAt) && (
              <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-2 border-t border-slate-100">
                {viewingActivity.createdAt && <span>Créée le : {viewingActivity.createdAt}</span>}
                {viewingActivity.updatedAt && <span>Dernière mise à jour : {viewingActivity.updatedAt}</span>}
              </div>
            )}

            {/* Boutons d'actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleOpenEdit(viewingActivity);
                }}
                className="btn-secondary-soft text-xs inline-flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Modifier cette activité</span>
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

      {/* Modal Création / Modification Activité */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingActivity(null);
        }}
        title={editingActivity?.id ? 'Modifier l’activité' : 'Ajouter une nouvelle activité'}
        description="Renseignez les détails, la catégorie et les photos de l’activité"
        maxWidth="lg"
      >
        {editingActivity && (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Titre */}
            <div>
              <label className="label-premium">
                Titre de l’activité <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editingActivity.title || ''}
                onChange={(e) =>
                  setEditingActivity({ ...editingActivity, title: e.target.value })
                }
                placeholder="Ex. Atelier de fabrication de cadre en bambou..."
                className="input-premium"
              />
            </div>

            {/* Catégorie & Statut */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-premium">
                  Catégorie <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={editingActivity.category || 'Ateliers Bambou'}
                  onChange={(e) =>
                    setEditingActivity({ ...editingActivity, category: e.target.value })
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
                  value={editingActivity.status || 'active'}
                  onChange={(e) =>
                    setEditingActivity({
                      ...editingActivity,
                      status: e.target.value as 'active' | 'inactive',
                    })
                  }
                  className="input-premium font-medium"
                >
                  <option value="active">Active (visible au public)</option>
                  <option value="inactive">Désactivée (brouillon interne)</option>
                </select>
              </div>
            </div>

            {/* Date / Période & Lieu facultatifs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-premium">
                  Date ou Fréquence
                </label>
                <input
                  type="text"
                  value={editingActivity.date || ''}
                  onChange={(e) =>
                    setEditingActivity({ ...editingActivity, date: e.target.value })
                  }
                  placeholder="Ex. 15 juin 2025 ou Tous les mercredis"
                  className="input-premium"
                />
              </div>

              <div>
                <label className="label-premium">
                  Lieu
                </label>
                <input
                  type="text"
                  value={editingActivity.location || ''}
                  onChange={(e) =>
                    setEditingActivity({ ...editingActivity, location: e.target.value })
                  }
                  placeholder="Ex. Atelier Bruxelles ou En extérieur"
                  className="input-premium"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="label-premium">
                Description de l’activité <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={editingActivity.description || ''}
                onChange={(e) =>
                  setEditingActivity({ ...editingActivity, description: e.target.value })
                }
                placeholder="Décrivez les objectifs, le déroulement et le public cible de l’activité..."
                className="input-premium resize-none leading-relaxed"
              />
            </div>

            {/* Gestion des Images */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <label className="label-premium mb-0 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#26B997]" />
                    <span>Images & Photos d’illustration</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Importez des photos depuis votre ordinateur. La première est utilisée comme couverture.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {(editingActivity.images || (editingActivity.image ? [editingActivity.image] : [])).length} photo(s)
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) processImageFiles(e.target.files);
                }}
              />

              {/* Zone Drag & Drop */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files) processImageFiles(e.dataTransfer.files);
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
                        ? 'Chargement des photos...'
                        : 'Glissez des photos ici ou cliquez pour parcourir'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Sélectionnez une ou plusieurs photos à la fois
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
                    <span>Choisir des fichiers</span>
                  </button>
                </div>
              </div>

              {/* Grille des photos déjà ajoutées */}
              {((editingActivity.images && editingActivity.images.length > 0) || editingActivity.image) && (
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                    <span>Photos actuelles ({ (editingActivity.images || (editingActivity.image ? [editingActivity.image] : [])).length }) :</span>
                    <span className="text-[10px] text-slate-400">Cliquez sur l’étoile pour définir la couverture</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(editingActivity.images || (editingActivity.image ? [editingActivity.image] : [])).map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className={`relative group rounded-2xl overflow-hidden border-2 bg-slate-100 aspect-square ${
                          idx === 0 ? 'border-[#26B997] shadow-sm ring-2 ring-[#26B997]/20' : 'border-slate-200'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imgUrl}
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {idx === 0 && (
                          <div className="absolute top-1.5 left-1.5 bg-[#26B997] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                            <span>Couverture</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryPhoto(idx)}
                              title="Définir comme photo de couverture"
                              className="p-1.5 bg-white/95 hover:bg-white text-slate-800 rounded-lg text-xs font-semibold shadow-xs"
                            >
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            title="Supprimer cette photo"
                            className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
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
                  setEditingActivity(null);
                }}
                className="btn-secondary-soft text-xs"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-primary-gradient text-xs"
              >
                {editingActivity?.id ? 'Enregistrer les modifications' : 'Créer l’activité'}
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
        title={deleteTarget?.isBulk ? 'Supprimer les activités' : 'Supprimer l’activité'}
        message={
          deleteTarget?.isBulk
            ? `Supprimer définitivement ces ${deleteTarget.title} ?`
            : `Supprimer définitivement cette activité ?`
        }
        submessage="Cette action est irréversible."
      />
    </div>
  );
}
