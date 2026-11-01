'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FileText,
  Plus,
  Search,
  Globe,
  Edit3,
  Trash2,
  Eye,
  CheckCircle2,
  Calendar,
  Image as ImageIcon,
  Upload,
  Paperclip,
  Star,
  Video,
  Play,
  Link2,
  Power,
  PowerOff,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ContentItem, ContentType } from '@/types/dashboard';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { BatchActionBar } from '@/components/ui/BatchActionBar';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'application/ogg',
  'video/quicktime',
  'video/x-quicktime',
  'video/mov',
];

const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov'];

export default function ContentsPage() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [localeFilter, setLocaleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination & Multi-Selection
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{
    id?: string;
    title: string;
    isBulk?: boolean;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal State & Media
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<ContentItem> | null>(
    null,
  );
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoPreviewBlobUrl, setVideoPreviewBlobUrl] = useState<string | null>(
    null,
  );
  const [externalImageUrlInput, setExternalImageUrlInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Detail Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<ContentItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [videoDragOver, setVideoDragOver] = useState(false);
  const [notice, setNotice] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const showNotification = useCallback(
    (message: string, type: 'success' | 'error' = 'success') => {
      setNotice({ message, type });
      setTimeout(() => setNotice(null), 3500);
    },
    [],
  );

  const loadContents = useCallback(async () => {
    try {
      const data = await apiClient.getContents();
      setContents(data);
    } catch (err: any) {
      console.error(err);
      showNotification(
        err?.message || 'Erreur lors du chargement des publications.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    loadContents();
  }, [loadContents]);

  useEffect(() => {
    return () => {
      if (videoPreviewBlobUrl) {
        URL.revokeObjectURL(videoPreviewBlobUrl);
      }
    };
  }, [videoPreviewBlobUrl]);

  const searchParams = useSearchParams();
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
      setCurrentPage(1);
    }
  }, [searchParams]);

  const clearVideoBlobUrl = () => {
    if (videoPreviewBlobUrl) {
      URL.revokeObjectURL(videoPreviewBlobUrl);
      setVideoPreviewBlobUrl(null);
    }
  };

  const handleOpenAdd = () => {
    setFormError(null);
    setExternalImageUrlInput('');
    setSelectedVideoFile(null);
    clearVideoBlobUrl();
    setEditingItem({
      title: '',
      type: 'article',
      locale: 'fr',
      status: 'draft',
      image: '',
      images: [],
      video: '',
      content: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (item: ContentItem) => {
    setFormError(null);
    setExternalImageUrlInput('');
    setSelectedVideoFile(null);
    clearVideoBlobUrl();

    const initialImages =
      item.images && item.images.length > 0
        ? [...item.images]
        : item.image
        ? [item.image]
        : [];
    setEditingItem({
      ...item,
      images: initialImages,
      image: initialImages[0] || '',
      video: item.video || '',
    });
    setIsModalOpen(true);

    try {
      const fresh = await apiClient.getContentById(item.id);
      const freshImages =
        fresh.images && fresh.images.length > 0
          ? [...fresh.images]
          : fresh.image
          ? [fresh.image]
          : [];
      setEditingItem({
        ...fresh,
        images: freshImages,
        image: freshImages[0] || '',
        video: fresh.video || '',
      });
    } catch {
      // Conserver les données affichées si l'appel échoue
    }
  };

  const handleOpenDetail = async (item: ContentItem) => {
    setViewingItem(item);
    setIsDetailModalOpen(true);
    try {
      const fresh = await apiClient.getContentById(item.id);
      setViewingItem(fresh);
    } catch {
      // Conserver les données déjà affichées
    }
  };

  // Local Image File Upload Handlers (JPG, PNG, WEBP)
  const processImageFiles = (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const invalidFile = fileList.find(
      (f) => !ALLOWED_IMAGE_TYPES.includes((f.type || '').toLowerCase()),
    );
    if (invalidFile) {
      setFormError(
        `Format d'image non autorisé pour "${invalidFile.name}". Formats acceptés : JPG, PNG et WEBP.`,
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
          setEditingItem((prev) => {
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

  const handleAddExternalImageUrl = () => {
    if (!editingItem) return;
    const trimmed = externalImageUrlInput.trim();
    if (!trimmed) return;

    if (!/^https?:\/\/.+/i.test(trimmed)) {
      setFormError(
        "Veuillez saisir une URL d'image externe valide commençant par http:// ou https://.",
      );
      return;
    }

    setFormError(null);
    const currentImages =
      editingItem.images && editingItem.images.length > 0
        ? [...editingItem.images]
        : editingItem.image
        ? [editingItem.image]
        : [];
    const merged = [...currentImages, trimmed];
    setEditingItem({
      ...editingItem,
      images: merged,
      image: merged[0] || '',
    });
    setExternalImageUrlInput('');
  };

  const handleRemovePhoto = (index: number) => {
    if (!editingItem) return;
    const currentImages =
      editingItem.images && editingItem.images.length > 0
        ? [...editingItem.images]
        : editingItem.image
        ? [editingItem.image]
        : [];
    const updated = currentImages.filter((_, i) => i !== index);
    setEditingItem({
      ...editingItem,
      images: updated,
      image: updated[0] || '',
    });
  };

  const handleSetPrimaryPhoto = (index: number) => {
    if (!editingItem) return;
    const currentImages = [
      ...(editingItem.images || (editingItem.image ? [editingItem.image] : [])),
    ];
    if (index >= 0 && index < currentImages.length) {
      const [selected] = currentImages.splice(index, 1);
      currentImages.unshift(selected);
      setEditingItem({
        ...editingItem,
        images: currentImages,
        image: currentImages[0] || '',
      });
    }
  };

  const processVideoFile = (file: File) => {
    if (!file) return;
    const mime = (file.type || '').toLowerCase();
    const lowerName = (file.name || '').toLowerCase();
    const hasValidExt = ALLOWED_VIDEO_EXTENSIONS.some((ext) =>
      lowerName.endsWith(ext),
    );

    if (!ALLOWED_VIDEO_TYPES.includes(mime) && !hasValidExt) {
      setFormError(
        `Format de vidéo non autorisé pour "${file.name}". Formats acceptés : MP4, WebM, OGG et MOV.`,
      );
      if (videoFileInputRef.current) {
        videoFileInputRef.current.value = '';
      }
      return;
    }

    setFormError(null);
    setIsUploadingVideo(true);
    clearVideoBlobUrl();
    const previewUrl = URL.createObjectURL(file);
    setVideoPreviewBlobUrl(previewUrl);
    setSelectedVideoFile(file);
    setEditingItem((prev) => (prev ? { ...prev, video: previewUrl } : prev));
    setIsUploadingVideo(false);
    if (videoFileInputRef.current) {
      videoFileInputRef.current.value = '';
    }
  };

  const handleRemoveVideo = () => {
    setSelectedVideoFile(null);
    clearVideoBlobUrl();
    setEditingItem((prev) => (prev ? { ...prev, video: '' } : prev));
    if (videoFileInputRef.current) {
      videoFileInputRef.current.value = '';
    }
  };

  const getVideoEmbedUrl = (url?: string) => {
    if (!url) return null;
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('watch?v=')[1]?.split('&')[0];
      return videoId
        ? `https://www.youtube-nocookie.com/embed/${videoId}`
        : null;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return videoId
        ? `https://www.youtube-nocookie.com/embed/${videoId}`
        : null;
    }
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
    return null;
  };

  const handleDelete = (id: string, title: string) => {
    setDeleteTarget({ id, title });
  };

  const handleToggleStatus = async (item: ContentItem) => {
    try {
      const updated = await apiClient.toggleContentStatus(item.id);
      if (updated) {
        setContents((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c)),
        );
        if (viewingItem?.id === updated.id) {
          setViewingItem(updated);
        }
        showNotification(
          updated.status === 'published'
            ? `Publication "${updated.title}" publiée en ligne.`
            : `Publication "${updated.title}" passée en brouillon interne.`,
          'success',
        );
      }
    } catch (err: any) {
      console.error(err);
      showNotification(
        err?.message || 'Erreur lors du changement de statut.',
        'error',
      );
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.title?.trim()) {
      setFormError('Le titre de la publication est obligatoire.');
      return;
    }

    const finalImages =
      editingItem.images !== undefined
        ? editingItem.images
        : editingItem.image
        ? [editingItem.image]
        : [];

    const finalItem = {
      ...editingItem,
      image: finalImages[0] || '',
      images: finalImages,
      video: selectedVideoFile ? '' : editingItem.video || '',
      videoFile: selectedVideoFile,
    };

    try {
      setIsSaving(true);
      setFormError(null);
      const wasEditing = !!editingItem.id;
      await apiClient.saveContent(finalItem as any);
      await loadContents();
      setIsModalOpen(false);
      setEditingItem(null);
      setSelectedVideoFile(null);
      clearVideoBlobUrl();
      showNotification(
        wasEditing
          ? 'Publication modifiée avec succès.'
          : 'Nouvelle publication créée avec succès.',
        'success',
      );
    } catch (err: any) {
      console.error(err);
      setFormError(
        err?.message || "Erreur lors de l'enregistrement de la publication.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const filteredContents = contents.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.title.toLowerCase().includes(q) ||
      (c.content && c.content.toLowerCase().includes(q)) ||
      (c.author && c.author.toLowerCase().includes(q));

    const matchesType = typeFilter === 'all' || c.type === typeFilter;
    const matchesLocale = localeFilter === 'all' || c.locale === localeFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesType && matchesLocale && matchesStatus;
  });

  const totalItems = filteredContents.length;
  const paginatedContents = filteredContents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (
      selectedIds.length === paginatedContents.length &&
      paginatedContents.length > 0
    ) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedContents.map((c) => c.id));
    }
  };

  const handleBulkExportCsv = () => {
    const selected = contents.filter((c) => selectedIds.includes(c.id));
    const header =
      'ID,Titre,Slug,Format,Langue,Statut,Vues,DerniereMiseAJour\n';
    const rows = selected
      .map(
        (c) =>
          `"${c.id}","${c.title.replace(/"/g, '""')}","${c.slug}","${c.type}","${c.locale}","${c.status}",${c.viewsCount},"${c.updatedAt}"`,
      )
      .join('\n');
    const blob = new Blob([header + rows], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `contenus_export_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification(
      `Export de ${selected.length} publication(s) généré avec succès.`,
      'success',
    );
  };

  const handleBulkDelete = () => {
    setDeleteTarget({
      isBulk: true,
      title: `${selectedIds.length} publication(s)`,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      if (deleteTarget.isBulk) {
        for (const id of selectedIds) {
          await apiClient.deleteContent(id);
        }
        await loadContents();
        showNotification(
          `${selectedIds.length} publication(s) supprimée(s).`,
          'success',
        );
        setSelectedIds([]);
      } else if (deleteTarget.id) {
        await apiClient.deleteContent(deleteTarget.id);
        await loadContents();
        setSelectedIds((prev) => prev.filter((i) => i !== deleteTarget.id));
        if (viewingItem?.id === deleteTarget.id) {
          setIsDetailModalOpen(false);
          setViewingItem(null);
        }
        showNotification(
          `Publication "${deleteTarget.title}" supprimée.`,
          'success',
        );
      }
      setDeleteTarget(null);
    } catch (err: any) {
      console.error(err);
      showNotification(
        err?.message || 'Erreur lors de la suppression de la publication.',
        'error',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pt-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Contenus du Site & Actualités
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Articles, ateliers participatifs, annonces et pages multilingues (FR
            / NL / EN).
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-primary-gradient inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un Contenu</span>
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
            placeholder="Rechercher par titre ou contenu..."
            className="input-premium pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
              setSelectedIds([]);
            }}
            className="input-premium cursor-pointer font-medium w-full sm:w-auto"
          >
            <option value="all">Tous les formats</option>
            <option value="article">Article / Blog</option>
            <option value="event">Événement / Atelier</option>
            <option value="page">Page Institutionnelle</option>
          </select>

          <select
            value={localeFilter}
            onChange={(e) => {
              setLocaleFilter(e.target.value);
              setCurrentPage(1);
              setSelectedIds([]);
            }}
            className="input-premium cursor-pointer font-medium w-full sm:w-auto"
          >
            <option value="all">Toutes les langues</option>
            <option value="fr">Français (FR)</option>
            <option value="nl">Nederlands (NL)</option>
            <option value="en">English (EN)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
              setSelectedIds([]);
            }}
            className="input-premium cursor-pointer font-medium w-full sm:w-auto"
          >
            <option value="all">Tous les statuts</option>
            <option value="published">Publié</option>
            <option value="draft">Brouillon interne</option>
          </select>
        </div>
      </div>

      {/* Batch Selection Action Bar */}
      <BatchActionBar
        selectedCount={selectedIds.length}
        totalCount={filteredContents.length}
        onClearSelection={() => setSelectedIds([])}
      >
        <button
          type="button"
          onClick={handleBulkExportCsv}
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
        >
          <span>Exporter CSV</span>
        </button>
        <button
          type="button"
          onClick={handleBulkDelete}
          className="px-3 py-1.5 rounded-xl bg-rose-500/80 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Supprimer ({selectedIds.length})</span>
        </button>
      </BatchActionBar>

      {/* Content Table */}
      <div className="panel overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : filteredContents.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Aucun contenu trouvé</p>
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
                        paginatedContents.length > 0 &&
                        selectedIds.length === paginatedContents.length
                      }
                      ref={(el) => {
                        if (el) {
                          el.indeterminate =
                            selectedIds.length > 0 &&
                            selectedIds.length < paginatedContents.length;
                        }
                      }}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-[#26B997] focus:ring-[#26B997] cursor-pointer"
                      aria-label="Sélectionner tous les contenus affichés"
                    />
                  </th>
                  <th className="py-3.5 px-3 w-16">Visuel</th>
                  <th className="py-3.5 px-4">Titre & Slug</th>
                  <th className="py-3.5 px-6">Format</th>
                  <th className="py-3.5 px-6">Langue</th>
                  <th className="py-3.5 px-6">Statut</th>
                  <th className="py-3.5 px-6">Vues</th>
                  <th className="py-3.5 px-6">Dernière mise à jour</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedContents.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
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

                      <td className="py-4 px-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 shadow-xs group">
                          {item.images && item.images.length > 0 ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.images[0]}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              {item.images.length > 1 && (
                                <span className="absolute bottom-1 right-1 bg-black/75 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md leading-tight flex items-center gap-0.5 shadow-xs">
                                  <ImageIcon className="w-2.5 h-2.5" />
                                  <span>{item.images.length}</span>
                                </span>
                              )}
                              {item.video && (
                                <span
                                  className="absolute top-1 left-1 bg-black/75 backdrop-blur-xs text-white text-[9px] font-bold px-1 py-0.5 rounded-md leading-tight flex items-center shadow-xs"
                                  title="Contient une vidéo"
                                >
                                  <Video className="w-2.5 h-2.5 text-[#26B997]" />
                                </span>
                              )}
                            </>
                          ) : item.image ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              {item.video && (
                                <span
                                  className="absolute top-1 left-1 bg-black/75 backdrop-blur-xs text-white text-[9px] font-bold px-1 py-0.5 rounded-md leading-tight flex items-center shadow-xs"
                                  title="Contient une vidéo"
                                >
                                  <Video className="w-2.5 h-2.5 text-[#26B997]" />
                                </span>
                              )}
                            </>
                          ) : item.video ? (
                            <div
                              className="w-full h-full bg-slate-900 flex items-center justify-center text-white"
                              title="Contient une vidéo"
                            >
                              <Video className="w-5 h-5 text-[#26B997]" />
                            </div>
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 max-w-sm">
                        <p className="font-bold text-slate-900 text-sm line-clamp-1">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          /{item.slug}
                        </p>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {item.type === 'article'
                            ? 'Article / Blog'
                            : item.type === 'event'
                            ? 'Événement / Atelier'
                            : item.type === 'page'
                            ? 'Page Institutionnelle'
                            : item.type}
                        </span>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="uppercase font-bold text-[11px] px-2 py-0.5 rounded bg-[#E8F8F5] text-[#1F6F5C] border border-[#26B997]/20">
                          {item.locale}
                        </span>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        {item.status === 'published' ? (
                          <Badge variant="success">Publié</Badge>
                        ) : (
                          <Badge variant="warning">Brouillon</Badge>
                        )}
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap font-mono text-slate-600">
                        {item.viewsCount}
                      </td>

                      <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                        {item.updatedAt}
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(item)}
                            className="p-1.5 text-slate-600 hover:text-[#26B997] hover:bg-[#E8F8F5] rounded-lg transition-colors"
                            title="Consulter les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              item.status === 'published'
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={
                              item.status === 'published'
                                ? 'Passer en brouillon interne'
                                : 'Publier en ligne'
                            }
                          >
                            {item.status === 'published' ? (
                              <PowerOff className="w-4 h-4" />
                            ) : (
                              <Power className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-600 hover:text-[#26B997] hover:bg-[#E8F8F5] rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Supprimer"
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

      {/* Modal Add / Edit Content */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!isSaving) setIsModalOpen(false);
        }}
        title={
          editingItem?.id
            ? 'Modifier la publication'
            : 'Créer une nouvelle publication'
        }
        description="Diffusion éditoriale pour les adhérents et le site public de l’association"
        maxWidth="lg"
      >
        {editingItem && (
          <form onSubmit={handleSave} className="space-y-5">
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <div>
              <label className="label-premium">
                Titre de la publication <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editingItem.title || ''}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, title: e.target.value })
                }
                placeholder="Ex. Atelier découverte du vélo en bambou..."
                className="input-premium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label-premium">Format</label>
                <select
                  value={editingItem.type || 'article'}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      type: e.target.value as ContentType,
                    })
                  }
                  className="input-premium font-medium"
                >
                  <option value="article">Article / Blog</option>
                  <option value="event">Événement / Atelier</option>
                  <option value="page">Page Institutionnelle</option>
                </select>
              </div>

              <div>
                <label className="label-premium">Langue</label>
                <select
                  value={editingItem.locale || 'fr'}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      locale: e.target.value as any,
                    })
                  }
                  className="input-premium font-medium"
                >
                  <option value="fr">Français (FR)</option>
                  <option value="nl">Nederlands (NL)</option>
                  <option value="en">English (EN)</option>
                </select>
              </div>

              <div>
                <label className="label-premium">Statut</label>
                <select
                  value={editingItem.status || 'draft'}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      status: e.target.value as any,
                    })
                  }
                  className="input-premium font-medium"
                >
                  <option value="published">Publié en ligne</option>
                  <option value="draft">Brouillon interne</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label-premium">Corps du texte ou résumé</label>
              <textarea
                rows={4}
                value={editingItem.content || ''}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, content: e.target.value })
                }
                placeholder="Rédigez le contenu complet de la publication ou l'annonce de l'événement..."
                className="input-premium leading-relaxed"
              />
            </div>

            {/* Photos & Visuels du contenu Section */}
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <label className="label-premium mb-0 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#26B997]" />
                    <span>Visuels & Photos du contenu</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Importez des photos depuis votre ordinateur ou ajoutez des
                    liens URL. La première photo est l&apos;image de couverture.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {
                    (
                      editingItem.images ||
                      (editingItem.image ? [editingItem.image] : [])
                    ).length
                  }{' '}
                  photo(s)
                </span>
              </div>

              {/* Ajout d'image via lien URL externe */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Ajouter une image via un lien URL</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://exemple.com/photo.jpg"
                    value={externalImageUrlInput}
                    onChange={(e) => setExternalImageUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddExternalImageUrl();
                      }
                    }}
                    className="input-premium text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddExternalImageUrl}
                    className="px-3.5 py-2 text-xs text-[#1F6F5C] bg-[#E8F8F5] hover:bg-[#d5f3ed] border border-[#26B997]/30 rounded-xl font-bold transition-colors shrink-0"
                  >
                    Ajouter le lien
                  </button>
                </div>
              </div>

              {/* Local File Input & Dropzone (Pièces jointes depuis l'ordinateur) */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) processImageFiles(e.target.files);
                }}
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files)
                    processImageFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-[#26B997] bg-[#E8F8F5]/70 scale-[1.01]'
                    : 'border-slate-300 hover:border-[#26B997] bg-slate-50/70 hover:bg-slate-50'
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#E8F8F5] text-[#26B997] flex items-center justify-center shadow-xs">
                    {isUploadingFiles ? (
                      <div className="w-5 h-5 border-2 border-[#26B997] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {isUploadingFiles
                        ? 'Chargement des photos en cours...'
                        : 'Ajouter des photos depuis votre ordinateur (JPG, PNG, WEBP)'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Glissez vos photos ici ou cliquez pour parcourir •{' '}
                      <strong className="text-[#1F6F5C]">
                        Sélectionnez plusieurs photos à la fois
                      </strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-[#1F6F5C] font-bold text-xs shadow-xs hover:bg-[#E8F8F5] transition-colors mt-1"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Choisir des fichiers sur mon PC</span>
                  </button>
                </div>
              </div>

              {/* Photos Grid */}
              {((editingItem.images && editingItem.images.length > 0) ||
                editingItem.image) && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                    <span>
                      Photos actuelles (
                      {
                        (
                          editingItem.images ||
                          (editingItem.image ? [editingItem.image] : [])
                        ).length
                      }
                      ) :
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Cliquez sur l&apos;étoile pour définir la photo de
                      couverture
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(
                      editingItem.images ||
                      (editingItem.image ? [editingItem.image] : [])
                    ).map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className={`relative group rounded-2xl overflow-hidden border-2 bg-slate-100 aspect-square ${
                          idx === 0
                            ? 'border-[#26B997] shadow-sm ring-2 ring-[#26B997]/20'
                            : 'border-slate-200'
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

            {/* Vidéo du contenu (Optionnel) */}
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <label className="label-premium mb-0 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-[#26B997]" />
                    <span>Vidéo du contenu (Optionnel)</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Importez une vidéo depuis votre ordinateur (MP4, WebM, OGG,
                    MOV) ou renseignez un lien (YouTube, Vimeo ou lien direct).
                  </p>
                </div>
                {editingItem.video && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Vidéo configurée</span>
                  </span>
                )}
              </div>

              {/* Input URL pour vidéo externe */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Lien URL de la vidéo (YouTube, Vimeo, MP4...)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... ou https://.../video.mp4"
                    value={
                      editingItem.video?.startsWith('data:') ||
                      editingItem.video?.startsWith('blob:')
                        ? ''
                        : editingItem.video || ''
                    }
                    onChange={(e) => {
                      setSelectedVideoFile(null);
                      clearVideoBlobUrl();
                      setEditingItem({ ...editingItem, video: e.target.value });
                    }}
                    className="input-premium text-xs"
                  />
                  {editingItem.video &&
                    !editingItem.video.startsWith('data:') &&
                    !editingItem.video.startsWith('blob:') && (
                      <button
                        type="button"
                        onClick={handleRemoveVideo}
                        className="px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl font-medium transition-colors shrink-0"
                      >
                        Effacer
                      </button>
                    )}
                </div>
              </div>

              {/* Local Video File Input & Dropzone */}
              <input
                ref={videoFileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.ogg,.mov"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    processVideoFile(e.target.files[0]);
                  }
                }}
              />

              {!editingItem.video && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setVideoDragOver(true);
                  }}
                  onDragLeave={() => setVideoDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setVideoDragOver(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      processVideoFile(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => videoFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                    videoDragOver
                      ? 'border-[#26B997] bg-[#E8F8F5]/70 scale-[1.01]'
                      : 'border-slate-300 hover:border-[#26B997] bg-slate-50/70 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#E8F8F5] text-[#26B997] flex items-center justify-center shadow-xs">
                      {isUploadingVideo ? (
                        <div className="w-4 h-4 border-2 border-[#26B997] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Video className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {isUploadingVideo
                          ? 'Chargement de la vidéo en cours...'
                          : 'Importer une vidéo depuis votre ordinateur'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        MP4, WebM, OGG, MOV (glisser-déposer ou cliquer)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        videoFileInputRef.current?.click();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[#1F6F5C] font-bold text-xs shadow-xs hover:bg-[#E8F8F5] transition-colors mt-1"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Choisir un fichier vidéo sur mon PC</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Aperçu de la vidéo */}
              {editingItem.video && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Play className="w-3.5 h-3.5 text-[#26B997]" />
                      <span>Aperçu de la vidéo :</span>
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => videoFileInputRef.current?.click()}
                        className="inline-flex items-center gap-1 text-[11px] text-[#1F6F5C] hover:underline font-semibold"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Remplacer par un fichier</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveVideo}
                        className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-700 font-semibold hover:underline"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Supprimer la vidéo</span>
                      </button>
                    </div>
                  </div>

                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-black aspect-video max-h-56 flex items-center justify-center shadow-xs">
                    {getVideoEmbedUrl(editingItem.video) ? (
                      <iframe
                        src={getVideoEmbedUrl(editingItem.video)!}
                        title="Aperçu vidéo"
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={editingItem.video}
                        controls
                        className="w-full h-full max-h-56 object-contain"
                      >
                        Votre navigateur ne supporte pas la lecture de cette
                        vidéo.
                      </video>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setIsModalOpen(false)}
                className="btn-secondary-soft"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary-gradient"
              >
                {isSaving
                  ? 'Enregistrement...'
                  : 'Enregistrer la publication'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Détails de la Publication */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setViewingItem(null);
        }}
        title="Détail de la publication"
        description="Informations complètes de l’article et diffusion éditoriale"
        maxWidth="lg"
      >
        {viewingItem && (
          <div className="space-y-5">
            {/* Header info */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Format
                  </span>
                  <span className="inline-block px-2.5 py-1 bg-white border border-slate-200 text-[#1F6F5C] font-bold text-xs rounded-lg">
                    {viewingItem.type === 'article'
                      ? 'Article / Blog'
                      : viewingItem.type === 'event'
                      ? 'Événement / Atelier'
                      : viewingItem.type === 'page'
                      ? 'Page Institutionnelle'
                      : viewingItem.type}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Langue
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-[#1F6F5C] font-bold text-xs rounded-lg uppercase">
                    <Globe className="w-3.5 h-3.5" />
                    <span>{viewingItem.locale}</span>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Consultations
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg font-mono">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>{viewingItem.viewsCount} vue(s)</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Statut :
                </span>
                {viewingItem.status === 'published' ? (
                  <Badge variant="success">Publié</Badge>
                ) : (
                  <Badge variant="warning">Brouillon</Badge>
                )}
              </div>
            </div>

            {/* Titre */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Titre
              </span>
              <p className="font-bold text-base text-[#1F6F5C] break-words">
                {viewingItem.title}
              </p>
              {viewingItem.slug && (
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  /{viewingItem.slug}
                </p>
              )}
            </div>

            {/* Image de couverture et galerie */}
            {((viewingItem.images && viewingItem.images.length > 0) ||
              viewingItem.image) && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Photos du contenu ({ (viewingItem.images || [viewingItem.image]).length })
                </label>
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-h-72 aspect-video flex items-center justify-center shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        (viewingItem.images && viewingItem.images[0]) ||
                        viewingItem.image
                      }
                      alt={viewingItem.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 bg-[#26B997] text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span>Couverture</span>
                    </span>
                  </div>

                  {viewingItem.images && viewingItem.images.length > 1 && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {viewingItem.images.map((img, i) => (
                        <div
                          key={i}
                          className={`rounded-xl overflow-hidden border aspect-square bg-slate-100 shadow-2xs ${
                            i === 0 ? 'border-[#26B997] ring-2 ring-[#26B997]/20' : 'border-slate-200'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img}
                            alt={`${viewingItem.title} - ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Vidéo associée */}
            {viewingItem.video && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-[#26B997]" />
                  <span>Vidéo associée</span>
                </label>
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-black aspect-video max-h-64 flex items-center justify-center shadow-xs">
                  {getVideoEmbedUrl(viewingItem.video) ? (
                    <iframe
                      src={getVideoEmbedUrl(viewingItem.video)!}
                      title={viewingItem.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={viewingItem.video}
                      controls
                      className="w-full h-full max-h-64 object-contain"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Corps du texte */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Corps du texte ou résumé
              </span>
              <p className="text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] max-h-72 overflow-y-auto">
                {viewingItem.content || 'Aucun contenu textuel renseigné.'}
              </p>
            </div>

            {/* Dates */}
            <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-2 border-t border-slate-100">
              <span>Créé le : {viewingItem.publishedAt || viewingItem.updatedAt}</span>
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
                <span>Modifier cette publication</span>
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

      {/* Modal Confirmation de Suppression */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title={
          deleteTarget?.isBulk
            ? 'Supprimer les publications'
            : 'Supprimer la publication'
        }
        message={
          deleteTarget?.isBulk
            ? `Supprimer définitivement ces ${deleteTarget.title} ?`
            : `Supprimer définitivement cette publication ?`
        }
        submessage="Cette action est irréversible."
      />
    </div>
  );
}
