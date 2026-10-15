'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FileText,
  Plus,
  Search,
  Filter,
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
  Sparkles,
  PlusCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ContentItem, ContentType } from '@/types/dashboard';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { BatchActionBar } from '@/components/ui/BatchActionBar';

export default function ContentsPage() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [localeFilter, setLocaleFilter] = useState<string>('all');

  // Pagination & Multi-Selection
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal State & Images
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<ContentItem> | null>(null);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    loadContents();
  }, []);

  const searchParams = useSearchParams();
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
      setCurrentPage(1);
    }
  }, [searchParams]);

  async function loadContents() {
    try {
      const data = await apiClient.getContents();
      setContents(data);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenAdd = () => {
    setEditingItem({
      title: '',
      type: 'article',
      locale: 'fr',
      status: 'draft',
      image: '',
      images: [],
      content: '',
    });
    setNewPhotoUrl('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ContentItem) => {
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
    });
    setNewPhotoUrl('');
    setIsModalOpen(true);
  };

  // Local File Upload Handlers (Attachments)
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
          setEditingItem((prev) => {
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

  const handleAddPhoto = (urlToAdd?: string) => {
    const url = (urlToAdd || newPhotoUrl).trim();
    if (!url || !editingItem) return;
    const currentImages =
      editingItem.images && editingItem.images.length > 0
        ? [...editingItem.images]
        : editingItem.image
        ? [editingItem.image]
        : [];
    if (currentImages.includes(url)) return;
    const updated = [...currentImages, url];
    setEditingItem({
      ...editingItem,
      images: updated,
      image: updated[0] || '',
    });
    if (!urlToAdd) setNewPhotoUrl('');
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

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Confirmez-vous la suppression de "${title}" ?`)) {
      await apiClient.deleteContent(id);
      await loadContents();
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      setNotice(`Contenu "${title}" supprimé.`);
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.title?.trim()) return;

    const finalItem = {
      ...editingItem,
      image:
        editingItem.images && editingItem.images.length > 0
          ? editingItem.images[0]
          : editingItem.image || '',
      images: editingItem.images || [],
    };

    await apiClient.saveContent(finalItem as any);
    await loadContents();
    setIsModalOpen(false);
    setEditingItem(null);
    setNotice('Contenu enregistré avec succès.');
    setTimeout(() => setNotice(null), 3000);
  };

  const filteredContents = contents.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.author.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || c.type === typeFilter;
    const matchesLocale = localeFilter === 'all' || c.locale === localeFilter;

    return matchesSearch && matchesType && matchesLocale;
  });

  const totalItems = filteredContents.length;
  const paginatedContents = filteredContents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedContents.length && paginatedContents.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedContents.map((c) => c.id));
    }
  };

  const handleBulkExportCsv = () => {
    const selected = contents.filter((c) => selectedIds.includes(c.id));
    const header = 'ID,Titre,Slug,Type,Langue,Statut,Auteur,Vues,DerniereMiseAJour\n';
    const rows = selected
      .map(
        (c) =>
          `"${c.id}","${c.title}","${c.slug}","${c.type}","${c.locale}","${c.status}","${c.author}",${c.viewsCount},"${c.updatedAt}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `contenus_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setNotice(`Export de ${selected.length} contenu(s) généré avec succès.`);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Supprimer les ${selectedIds.length} contenus sélectionnés ?`)) return;
    for (const id of selectedIds) {
      await apiClient.deleteContent(id);
    }
    await loadContents();
    setNotice(`${selectedIds.length} contenu(s) supprimé(s).`);
    setSelectedIds([]);
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Contenus du Site & Actualités
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Articles, ateliers participatifs, annonces et pages multilingues (FR / NL / EN).
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
            placeholder="Rechercher par titre ou auteur..."
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
            className="input-premium cursor-pointer font-medium w-full md:w-auto"
          >
            <option value="all">Tous les types</option>
            <option value="article">Articles & Nouvelles</option>
            <option value="event">Événements & Ateliers</option>
            <option value="page">Pages Fixes</option>
          </select>

          <select
            value={localeFilter}
            onChange={(e) => {
              setLocaleFilter(e.target.value);
              setCurrentPage(1);
              setSelectedIds([]);
            }}
            className="input-premium cursor-pointer font-medium w-full md:w-auto"
          >
            <option value="all">Toutes les langues</option>
            <option value="fr">Français (FR)</option>
            <option value="nl">Nederlands (NL)</option>
            <option value="en">English (EN)</option>
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
          <div className="overflow-x-auto -mx-6 -my-6">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-4 pl-6 pr-2 w-10">
                    <input
                      type="checkbox"
                      checked={paginatedContents.length > 0 && selectedIds.length === paginatedContents.length}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate = selectedIds.length > 0 && selectedIds.length < paginatedContents.length;
                        }
                      }}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-[#0B3C68] focus:ring-[#0B3C68] cursor-pointer"
                      aria-label="Sélectionner tous les contenus affichés"
                    />
                  </th>
                  <th className="py-3.5 px-3 w-16">Visuel</th>
                  <th className="py-3.5 px-4">Titre & Slug</th>
                  <th className="py-3.5 px-6">Type</th>
                  <th className="py-3.5 px-6">Langue</th>
                  <th className="py-3.5 px-6">Statut</th>
                  <th className="py-3.5 px-6">Auteur</th>
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
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="py-4 pl-6 pr-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.id)}
                          className="w-4 h-4 rounded border-slate-300 text-[#0B3C68] focus:ring-[#0B3C68] cursor-pointer"
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
                            </>
                          ) : item.image ? (
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

                      <td className="py-4 px-4 max-w-sm">
                        <p className="font-bold text-slate-900 text-sm line-clamp-1">{item.title}</p>
                        <p className="text-[11px] text-slate-400 font-mono">/{item.slug}</p>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {item.type === 'article'
                            ? 'Article'
                            : item.type === 'event'
                            ? 'Événement'
                            : 'Page'}
                        </span>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="uppercase font-bold text-[11px] px-2 py-0.5 rounded bg-blue-50 text-[#0B3C68] border border-blue-100">
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

                      <td className="py-4 px-6 whitespace-nowrap text-slate-700">
                        {item.author}
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
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-600 hover:text-[#0B3C68] hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
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

        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>

      {/* Modal Add / Edit Content */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem?.id ? 'Modifier la publication' : 'Créer une nouvelle publication'}
        description="Diffusion éditoriale pour les adhérents et le site public de l’association"
        maxWidth="lg"
      >
        {editingItem && (
          <form onSubmit={handleSave} className="space-y-5">
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
                <label className="label-premium">
                  Format
                </label>
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
                <label className="label-premium">
                  Langue
                </label>
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
                <label className="label-premium">
                  Statut
                </label>
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
              <label className="label-premium">
                Corps du texte ou résumé
              </label>
              <textarea
                rows={3}
                value={editingItem.content || ''}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, content: e.target.value })
                }
                placeholder="Rédigez le contenu ou l'annonce de l'événement..."
                className="input-premium resize-none leading-relaxed"
              />
            </div>

            {/* Photos & Visuels du contenu Section */}
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <label className="label-premium mb-0 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#0B3C68]" />
                    <span>Visuels & Photos du contenu</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Importez des photos depuis votre ordinateur ou ajoutez des liens. La première photo est l&apos;image de couverture.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {(editingItem.images || (editingItem.image ? [editingItem.image] : [])).length} photo(s)
                </span>
              </div>

              {/* Local File Input & Dropzone (Pièces jointes depuis l'ordinateur) */}
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
                className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-[#0B3C68] bg-blue-50/70 scale-[1.01]'
                    : 'border-slate-300 hover:border-[#0B3C68] bg-slate-50/70 hover:bg-slate-50'
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#0B3C68]/10 text-[#0B3C68] flex items-center justify-center shadow-xs">
                    {isUploadingFiles ? (
                      <div className="w-5 h-5 border-2 border-[#0B3C68] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {isUploadingFiles
                        ? 'Chargement des photos en cours...'
                        : 'Ajouter des photos depuis votre ordinateur (pièce jointe)'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Glissez vos photos ici ou cliquez pour parcourir • <strong className="text-[#0B3C68]">Sélectionnez plusieurs photos à la fois</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-[#0B3C68] font-bold text-xs shadow-xs hover:bg-slate-50 transition-colors mt-1"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Choisir des fichiers sur mon PC</span>
                  </button>
                </div>
              </div>

              {/* Photos Grid */}
              {((editingItem.images && editingItem.images.length > 0) || editingItem.image) && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                    <span>Photos actuelles ({ (editingItem.images || (editingItem.image ? [editingItem.image] : [])).length }) :</span>
                    <span className="text-[10px] text-slate-400">Cliquez sur l&apos;étoile pour changer la photo principale</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(editingItem.images || (editingItem.image ? [editingItem.image] : [])).map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className={`relative group rounded-2xl overflow-hidden border-2 bg-slate-100 aspect-square ${
                          idx === 0 ? 'border-[#0B3C68] shadow-sm ring-2 ring-[#0B3C68]/20' : 'border-slate-200'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imgUrl}
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {idx === 0 && (
                          <div className="absolute top-1.5 left-1.5 bg-[#0B3C68] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
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

              {/* Alternative option for URL or presets */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-semibold text-slate-500">Ou ajouter via un lien web :</span>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="input-premium text-xs flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPhoto();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddPhoto()}
                    disabled={!newPhotoUrl.trim()}
                    className="px-3.5 py-2 rounded-2xl bg-[#0B3C68] hover:bg-[#082b4a] disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Ajouter URL</span>
                  </button>
                </div>

                {/* Quick suggestions presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Suggestions :
                  </span>
                  {[
                    { label: 'Atelier Bambou', url: 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=800&q=80' },
                    { label: 'Initiation Hase Bikes', url: 'https://images.unsplash.com/photo-1511994298241-608e28f14fde?auto=format&fit=crop&w=800&q=80' },
                    { label: 'Sortie ElliptiGO', url: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=800&q=80' },
                    { label: 'Rapport Annuel', url: 'https://images.unsplash.com/photo-1559348349-86f1f65817fe?auto=format&fit=crop&w=800&q=80' },
                  ].map((sug) => (
                    <button
                      key={sug.label}
                      type="button"
                      onClick={() => handleAddPhoto(sug.url)}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-[#0B3C68] border border-slate-200 transition-colors"
                    >
                      + {sug.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn-secondary-soft"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-primary-gradient"
              >
                Enregistrer la publication
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
