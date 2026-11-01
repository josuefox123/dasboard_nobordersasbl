'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const MONTHS_FR = [
  { value: 'janvier', label: 'Janvier', num: '01', maxDays: 31 },
  { value: 'février', label: 'Février', num: '02', maxDays: 29 },
  { value: 'mars', label: 'Mars', num: '03', maxDays: 31 },
  { value: 'avril', label: 'Avril', num: '04', maxDays: 30 },
  { value: 'mai', label: 'Mai', num: '05', maxDays: 31 },
  { value: 'juin', label: 'Juin', num: '06', maxDays: 30 },
  { value: 'juillet', label: 'Juillet', num: '07', maxDays: 31 },
  { value: 'août', label: 'Août', num: '08', maxDays: 31 },
  { value: 'septembre', label: 'Septembre', num: '09', maxDays: 30 },
  { value: 'octobre', label: 'Octobre', num: '10', maxDays: 31 },
  { value: 'novembre', label: 'Novembre', num: '11', maxDays: 30 },
  { value: 'décembre', label: 'Décembre', num: '12', maxDays: 31 },
];

function parseMonthAndDay(raw?: string): { month: string; day: string } {
  if (!raw || !raw.trim()) return { month: '', day: '' };
  const trimmed = raw.trim().toLowerCase();

  // Format YYYY-MM-DD ou MM-DD
  const isoMatch = /^(?:\d{4}-)?(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    const foundMonth = MONTHS_FR.find((m) => m.num === isoMatch[1]);
    const dayNum = String( parseInt(isoMatch[2], 10) );
    return {
      month: foundMonth ? foundMonth.value : '',
      day: dayNum,
    };
  }

  // Format "15 juin" ou "15 juin 2025"
  const foundMonth = MONTHS_FR.find((m) => trimmed.includes(m.value));
  const dayMatch = /\b([1-9]|[12]\d|3[01])\b/.exec(trimmed);

  return {
    month: foundMonth ? foundMonth.value : '',
    day: dayMatch ? dayMatch[1] : '',
  };
}

function buildIsoDateFromMonthDay(monthValue: string, dayValue: string): string {
  const m = MONTHS_FR.find((item) => item.value === monthValue);
  if (!m || !dayValue) return '';
  const year = new Date().getFullYear();
  const paddedDay = String(dayValue).padStart(2, '0');
  return `${year}-${m.num}-${paddedDay}`;
}

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
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id?: string; title: string; isBulk?: boolean } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingActivity, setViewingActivity] = useState<ActivityItem | null>(null);

  // Images upload state in form
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeDateInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setNotice({ message: msg, type });
    setTimeout(() => setNotice(null), 3500);
  }, []);

  const loadActivities = useCallback(async () => {
    try {
      const data = await apiClient.getActivities();
      setActivities(data);
    } catch (err: any) {
      console.error(err);
      showNotification(err?.message || 'Erreur lors du chargement des activités', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const searchParams = useSearchParams();
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
      setCurrentPage(1);
    }
  }, [searchParams]);

  const handleOpenAdd = () => {
    setFormError(null);
    setSelectedMonth('');
    setSelectedDay('');
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

  const handleOpenEdit = async (act: ActivityItem) => {
    setFormError(null);
    const initialImages =
      act.images && act.images.length > 0
        ? [...act.images]
        : act.image
        ? [act.image]
        : [];

    const initialDate = act.date || '';
    const initialLocation = act.location || (act as any).lieu || '';
    const parsed = parseMonthAndDay(initialDate);
    setSelectedMonth(parsed.month);
    setSelectedDay(parsed.day);

    setEditingActivity({
      ...act,
      date: initialDate,
      location: initialLocation,
      images: initialImages,
      image: initialImages[0] || '',
    });
    setIsFormModalOpen(true);

    try {
      const fresh = await apiClient.getActivityById(act.id);
      const freshImages =
        fresh.images && fresh.images.length > 0
          ? [...fresh.images]
          : fresh.image
          ? [fresh.image]
          : [];
      const freshDate = fresh.date || '';
      const freshLocation = fresh.location || (fresh as any).lieu || '';
      const freshParsed = parseMonthAndDay(freshDate);
      setSelectedMonth(freshParsed.month);
      setSelectedDay(freshParsed.day);
      setEditingActivity({
        ...fresh,
        date: freshDate,
        location: freshLocation,
        images: freshImages,
        image: freshImages[0] || '',
      });
    } catch {
      // Conserver les données locales si l'appel échoue
    }
  };

  const handleOpenDetail = async (act: ActivityItem) => {
    setViewingActivity(act);
    setIsDetailModalOpen(true);
    try {
      const fresh = await apiClient.getActivityById(act.id);
      setViewingActivity(fresh);
    } catch {
      // Conserver les données déjà affichées si la requête échoue
    }
  };

  const updateDateFromMonthAndDay = (nextMonth: string, nextDay: string) => {
    setSelectedMonth(nextMonth);
    setSelectedDay(nextDay);
    let formatted = '';
    if (nextDay && nextMonth) {
      formatted = `${nextDay} ${nextMonth}`;
    } else if (nextMonth) {
      formatted = nextMonth;
    } else if (nextDay) {
      formatted = nextDay;
    }
    setEditingActivity((prev) => (prev ? { ...prev, date: formatted } : prev));
  };

  // Image Upload Handlers (JPG, PNG, WEBP)
  const processImageFiles = (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const invalidFile = fileList.find(
      (f) => !ALLOWED_IMAGE_TYPES.includes((f.type || '').toLowerCase()),
    );
    if (invalidFile) {
      setFormError(
        `Format non autorisé pour "${invalidFile.name}". Formats acceptés : JPG, PNG et WEBP.`,
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setFormError(null);
    setIsUploadingFiles(true);
    let loadedCount = 0;
    const newImages: string[] = new Array(fileList.length);

    fileList.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          newImages[idx] = result;
        }
        loadedCount++;
        if (loadedCount === fileList.length) {
          const validLoaded = newImages.filter(Boolean);
          setEditingActivity((prev) => {
            if (!prev) return prev;
            const currentImages =
              prev.images && prev.images.length > 0
                ? [...prev.images]
                : prev.image
                ? [prev.image]
                : [];
            const merged = [...currentImages, ...validLoaded];
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

    try {
      setIsSaving(true);
      setFormError(null);
      await apiClient.saveActivity(finalItem as any);
      await loadActivities();
      setIsFormModalOpen(false);
      const wasEditing = !!editingActivity.id;
      setEditingActivity(null);
      showNotification(
        wasEditing ? 'Activité modifiée avec succès.' : 'Nouvelle activité ajoutée avec succès.',
        'success',
      );
    } catch (err: any) {
      console.error(err);
      setFormError(err?.message || 'Erreur lors de la sauvegarde de l’activité');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (act: ActivityItem) => {
    try {
      const updated = await apiClient.toggleActivityStatus(act.id);
      if (updated) {
        setActivities((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        if (viewingActivity?.id === updated.id) {
          setViewingActivity(updated);
        }
        showNotification(
          updated.status === 'active'
            ? `Activité "${act.title}" activée.`
            : `Activité "${act.title}" désactivée.`,
          'success',
        );
      }
    } catch (err: any) {
      console.error(err);
      showNotification(err?.message || 'Erreur lors du changement de statut', 'error');
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
        showNotification(`${selectedIds.length} activité(s) supprimée(s).`, 'success');
        setSelectedIds([]);
      } else if (deleteTarget.id) {
        await apiClient.deleteActivity(deleteTarget.id);
        await loadActivities();
        setSelectedIds((prev) => prev.filter((i) => i !== deleteTarget.id));
        if (viewingActivity?.id === deleteTarget.id) {
          setIsDetailModalOpen(false);
          setViewingActivity(null);
        }
        showNotification(`Activité "${deleteTarget.title}" supprimée.`, 'success');
      }
      setDeleteTarget(null);
    } catch (err: any) {
      console.error(err);
      showNotification(err?.message || 'Erreur lors de la suppression de l’activité', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const categories = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...activities.map((a) => a.category).filter(Boolean)])
  ) as string[];

  const maxDaysInSelectedMonth =
    MONTHS_FR.find((m) => m.value === selectedMonth)?.maxDays ?? 31;
  const daysOptions = Array.from({ length: maxDaysInSelectedMonth }, (_, i) =>
    String(i + 1),
  );

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
    <div className="space-y-6 animate-fade-in pt-6">
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
        <div
          className={`p-3 rounded-2xl text-xs flex items-center gap-2 animate-fade-in border ${
            notice.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <CheckCircle2
            className={`w-4 h-4 shrink-0 ${
              notice.type === 'error' ? 'text-rose-600' : 'text-emerald-600'
            }`}
          />
          <span>{notice.message}</span>
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
                  <th className="py-3.5 px-4 max-w-[200px]">Titre</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Catégorie</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Date</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Lieu</th>
                  <th className="py-3.5 px-4 w-56 max-w-[220px]">Description</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Statut</th>
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
                  const shortDescription =
                    act.description && act.description.length > 55
                      ? `${act.description.slice(0, 55)}...`
                      : act.description;

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
                      <td className="py-4 px-4 max-w-[200px]">
                        <p
                          className="font-bold text-slate-900 text-sm leading-snug truncate cursor-default"
                          title={act.title}
                        >
                          {act.title}
                        </p>
                      </td>

                      {/* Catégorie */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-[#E8F8F5] text-[#1F6F5C] font-bold text-[11px] border border-[#26B997]/25">
                          {act.category}
                        </span>
                      </td>

                      {/* Date (Mois et Jour) */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {act.date ? (
                          <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium text-xs">
                            <Calendar className="w-3.5 h-3.5 text-[#26B997] shrink-0" />
                            <span>{act.date}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">—</span>
                        )}
                      </td>

                      {/* Lieu */}
                      <td className="py-4 px-4 whitespace-nowrap max-w-[160px]">
                        {act.location ? (
                          <span
                            className="inline-flex items-center gap-1.5 text-slate-700 font-medium text-xs truncate max-w-full"
                            title={act.location}
                          >
                            <MapPin className="w-3.5 h-3.5 text-[#26B997] shrink-0" />
                            <span className="truncate">{act.location}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">—</span>
                        )}
                      </td>

                      {/* Description tronquée avec points de suspension */}
                      <td className="py-4 px-4 w-56 max-w-[220px]">
                        <p
                          className="truncate text-slate-600 text-xs cursor-default leading-relaxed"
                          title={act.description}
                        >
                          {shortDescription}
                        </p>
                      </td>

                      {/* Statut avec bouton bascule */}
                      <td className="py-4 px-4 whitespace-nowrap">
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
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Titre de l’activité
              </span>
              <p className="font-bold text-base text-[#1F6F5C] break-words">
                {viewingActivity.title}
              </p>
              {(viewingActivity.date || viewingActivity.location) && (
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                  {viewingActivity.date && (
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-[#26B997]" />
                      <span>{viewingActivity.date}</span>
                    </span>
                  )}
                  {viewingActivity.location && (
                    <span className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[#26B997]" />
                      <span>{viewingActivity.location}</span>
                    </span>
                  )}
                </div>
              )}
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
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Description
              </span>
              <p className="text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] max-h-72 overflow-y-auto">
                {viewingActivity.description}
              </p>
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
          setFormError(null);
        }}
        title={editingActivity?.id ? 'Modifier l’activité' : 'Ajouter une nouvelle activité'}
        description="Renseignez les détails, la catégorie et les photos de l’activité"
        maxWidth="lg"
      >
        {editingActivity && (
          <form onSubmit={handleSave} className="space-y-4">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs leading-relaxed">
                {formError}
              </div>
            )}

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

            {/* Date (Mois et Jour) & Lieu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-premium">
                  Date (Mois et Jour)
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedMonth}
                    onChange={(e) => {
                      const nextMonth = e.target.value;
                      const maxDays =
                        MONTHS_FR.find((m) => m.value === nextMonth)?.maxDays ?? 31;
                      const adjustedDay =
                        selectedDay && Number(selectedDay) > maxDays
                          ? String(maxDays)
                          : selectedDay;
                      updateDateFromMonthAndDay(nextMonth, adjustedDay);
                    }}
                    className="input-premium font-medium cursor-pointer flex-1"
                    aria-label="Mois de l'activité"
                  >
                    <option value="">Mois...</option>
                    {MONTHS_FR.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedDay}
                    onChange={(e) =>
                      updateDateFromMonthAndDay(selectedMonth, e.target.value)
                    }
                    className="input-premium font-medium cursor-pointer w-24"
                    aria-label="Jour de l'activité"
                  >
                    <option value="">Jour...</option>
                    {daysOptions.map((d) => (
                      <option key={d} value={d}>
                        {d.padStart(2, '0')}
                      </option>
                    ))}
                  </select>

                  <div className="relative">
                    <input
                      ref={nativeDateInputRef}
                      type="date"
                      value={buildIsoDateFromMonthDay(selectedMonth, selectedDay)}
                      onChange={(e) => {
                        const parsed = parseMonthAndDay(e.target.value);
                        updateDateFromMonthAndDay(parsed.month, parsed.day);
                      }}
                      className="sr-only"
                      tabIndex={-1}
                      aria-label="Sélecteur calendrier (mois et jour)"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (nativeDateInputRef.current) {
                          if (typeof nativeDateInputRef.current.showPicker === 'function') {
                            nativeDateInputRef.current.showPicker();
                          } else {
                            nativeDateInputRef.current.click();
                          }
                        }
                      }}
                      title="Choisir via le calendrier"
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-[#E8F8F5] text-slate-600 hover:text-[#1F6F5C] transition-colors shrink-0"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                </div>
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
                    Importez des photos depuis votre ordinateur (JPG, PNG, WEBP). La première est utilisée comme couverture.
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
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
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
                      Sélectionnez une ou plusieurs photos à la fois (JPG, PNG, WEBP)
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
                  setFormError(null);
                }}
                className="btn-secondary-soft text-xs"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary-gradient text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving
                  ? 'Enregistrement...'
                  : editingActivity?.id
                  ? 'Enregistrer les modifications'
                  : 'Créer l’activité'}
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
