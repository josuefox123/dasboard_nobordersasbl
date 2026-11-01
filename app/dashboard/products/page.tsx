'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  Bike,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  PackageCheck,
  Tag,
  Image as ImageIcon,
  X,
  Star,
  Upload,
  Paperclip,
  CheckCircle2,
  Power,
  PowerOff,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Product, ProductCategory, CategoryItem } from '@/types/dashboard';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { BatchActionBar } from '@/components/ui/BatchActionBar';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<
    'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  >('all');

  // Pagination & Selection
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal State (Edit / Create)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(
    null,
  );
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Detail Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{
    id?: string;
    name: string;
    isBulk?: boolean;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const searchParams = useSearchParams();
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
      setCurrentPage(1);
    }
  }, [searchParams]);

  async function loadData() {
    try {
      setLoading(true);
      const [prodsData, catsData] = await Promise.all([
        apiClient.getProducts(),
        apiClient.getCategories(),
      ]);
      setProducts(prodsData);
      setCategories(catsData);
    } catch (err) {
      console.error('Erreur chargement données produits:', err);
    } finally {
      setLoading(false);
    }
  }

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleOpenAdd = () => {
    const defaultCat = categories.length > 0 ? categories[0].id : '';
    setEditingProduct({
      name: '',
      sku: '',
      categoryId: defaultCat,
      category: defaultCat as ProductCategory,
      price: 0,
      stock: 1,
      isFeatured: false,
      statut: 'active',
      description: '',
      images: [],
      image: '',
    });
    setFormErrors({});
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    const initialImages =
      prod.images && prod.images.length > 0
        ? [...prod.images]
        : prod.image
        ? [prod.image]
        : [];
    setEditingProduct({
      ...prod,
      categoryId: prod.categoryId || prod.category,
      images: initialImages,
      image: initialImages[0] || '',
      isFeatured: Boolean(prod.isFeatured),
      statut: prod.statut || 'active',
    });
    setFormErrors({});
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenView = (prod: Product) => {
    setViewingProduct(prod);
    setActiveImageIndex(0);
    setIsDetailModalOpen(true);
  };

  // Local File Upload Handlers (Attachments)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

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
          setEditingProduct((prev) => {
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
    if (!editingProduct) return;
    const currentImages =
      editingProduct.images && editingProduct.images.length > 0
        ? [...editingProduct.images]
        : editingProduct.image
        ? [editingProduct.image]
        : [];
    const updated = currentImages.filter((_, i) => i !== index);
    setEditingProduct({
      ...editingProduct,
      images: updated,
      image: updated[0] || '',
    });
  };

  const handleSetPrimaryPhoto = (index: number) => {
    if (!editingProduct) return;
    const currentImages = [
      ...(editingProduct.images ||
        (editingProduct.image ? [editingProduct.image] : [])),
    ];
    if (index >= 0 && index < currentImages.length) {
      const [selected] = currentImages.splice(index, 1);
      currentImages.unshift(selected);
      setEditingProduct({
        ...editingProduct,
        images: currentImages,
        image: currentImages[0] || '',
      });
    }
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const handleToggleStatus = async (prod: Product) => {
    try {
      const updated = await apiClient.toggleProductStatus(prod.id);
      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id ? updated : p)),
      );
      showNotification(
        `Statut du produit "${prod.name}" basculé vers ${
          updated.statut === 'active' ? 'Actif' : 'Inactif'
        }.`,
      );
    } catch (err: any) {
      showNotification(
        err?.message || 'Erreur lors du changement de statut.',
        'error',
      );
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setModalError(null);

    // Validation
    const errors: Record<string, string> = {};
    if (!editingProduct.name?.trim()) {
      errors.name = 'Le nom du vélo ou équipement est requis.';
    }
    if (!editingProduct.sku?.trim()) {
      errors.sku = 'La référence (SKU) est requise.';
    }
    if (
      editingProduct.price === undefined ||
      editingProduct.price === null ||
      Number(editingProduct.price) < 0
    ) {
      errors.price = 'Le prix unitaire doit être supérieur ou égal à 0 €.';
    }
    if (
      editingProduct.stock === undefined ||
      editingProduct.stock === null ||
      Number(editingProduct.stock) < 0
    ) {
      errors.stock = 'La quantité en stock ne peut pas être négative.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setModalError('Veuillez renseigner tous les champs obligatoires indiqués en rouge.');
      return;
    }

    try {
      setIsSaving(true);
      const finalProduct = {
        ...editingProduct,
        name: editingProduct.name?.trim(),
        sku: editingProduct.sku?.trim().toUpperCase(),
        price: Number(editingProduct.price),
        stock: Number(editingProduct.stock || 0),
        categoryId: editingProduct.categoryId || editingProduct.category,
        isFeatured: Boolean(editingProduct.isFeatured),
        statut: editingProduct.statut || 'active',
        description: editingProduct.description?.trim() || '',
        coverImage: editingProduct.image || (editingProduct.images && editingProduct.images[0]) || undefined,
        image:
          editingProduct.images && editingProduct.images.length > 0
            ? editingProduct.image || editingProduct.images[0]
            : editingProduct.image || '',
        images: editingProduct.images || [],
      };

      await apiClient.saveProduct(finalProduct as any);
      await loadData();
      setIsModalOpen(false);
      setEditingProduct(null);
      setModalError(null);
      showNotification('Produit enregistré avec succès.');
    } catch (err: any) {
      setModalError(
        err?.message || "Erreur lors de l'enregistrement du produit.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered Products
  const filteredProducts = products.filter((prod) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      prod.categoryId === selectedCategory ||
      prod.category === selectedCategory ||
      prod.categoryLabel === selectedCategory;

    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStock =
      stockFilter === 'all' || prod.status === stockFilter;

    return matchesCategory && matchesSearch && matchesStock;
  });

  const totalItems = filteredProducts.length;
  const paginatedProducts = filteredProducts.slice(
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
      selectedIds.length === paginatedProducts.length &&
      paginatedProducts.length > 0
    ) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedProducts.map((p) => p.id));
    }
  };

  const handleBulkDelete = () => {
    setDeleteTarget({
      isBulk: true,
      name: `${selectedIds.length} produit(s)`,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      if (deleteTarget.isBulk) {
        for (const id of selectedIds) {
          await apiClient.deleteProduct(id);
        }
        await loadData();
        setSelectedIds([]);
        showNotification(`${deleteTarget.name} supprimé(s).`);
      } else if (deleteTarget.id) {
        await apiClient.deleteProduct(deleteTarget.id);
        await loadData();
        setSelectedIds((prev) => prev.filter((i) => i !== deleteTarget.id));
        showNotification(`Produit "${deleteTarget.name}" supprimé.`);
      }
      setDeleteTarget(null);
    } catch (err: any) {
      showNotification(
        err?.message || 'Erreur lors de la suppression.',
        'error',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkExport = () => {
    const selected = products.filter((p) => selectedIds.includes(p.id));
    const header = 'ID,Nom,SKU,Categorie,Prix,Stock,Statut Stock,En Vedette\n';
    const rows = selected
      .map(
        (p) =>
          `"${p.id}","${p.name}","${p.sku}","${p.categoryLabel}",${p.price},${p.stock},"${p.status}","${p.isFeatured ? 'Oui' : 'Non'}"`,
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
      `produits_export_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification(
      `Export de ${selected.length} produit(s) généré avec succès.`,
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pt-6">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Produits & Modèles Spécialisés
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Gestion du catalogue : Vélos en bambou artisanaux, vélos adaptés et équipements solidaires.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-primary-gradient inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un Produit</span>
        </button>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3 rounded-2xl text-xs flex items-center gap-2 animate-fade-in border ${
            feedbackMsg.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {feedbackMsg.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Category Tabs (dynamically preloaded from Category module) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'all', label: 'Tous les produits', count: products.length },
          ...categories.map((c) => ({
            id: c.id,
            label: c.title,
            count: products.filter(
              (p) =>
                p.categoryId === c.id ||
                p.category === c.id ||
                p.categoryLabel === c.title,
            ).length,
          })),
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setSelectedCategory(tab.id);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              selectedCategory === tab.id
                ? 'bg-[#26B997] text-white shadow-sm shadow-emerald-900/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                selectedCategory === tab.id
                  ? 'bg-amber-400 text-slate-900'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-[0_12px_40px_-18px_rgba(38,185,151,0.12)] flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Rechercher par modèle, réf SKU ou caractéristiques..."
            className="input-premium pl-10"
          />
        </div>

        {/* Stock status filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="input-premium cursor-pointer font-medium w-full md:w-auto"
          >
            <option value="all">Tous les états de stock</option>
            <option value="in_stock">En stock suffisant</option>
            <option value="low_stock">Stock faible (≤ 2)</option>
            <option value="out_of_stock">Rupture de stock</option>
          </select>
        </div>
      </div>

      {/* Batch Selection Action Bar */}
      <BatchActionBar
        selectedCount={selectedIds.length}
        totalCount={filteredProducts.length}
        onClearSelection={() => setSelectedIds([])}
      >
        <button
          type="button"
          onClick={handleBulkExport}
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span>Exporter CSV</span>
        </button>
        <button
          type="button"
          onClick={handleBulkDelete}
          className="px-3 py-1.5 rounded-xl bg-rose-500/80 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Supprimer ({selectedIds.length})</span>
        </button>
      </BatchActionBar>

      {/* Products Table */}
      <div className="panel overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <PackageCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">
              Aucun produit ne correspond à ces critères
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Modifiez vos filtres ou effectuez une autre recherche.
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
                        paginatedProducts.length > 0 &&
                        selectedIds.length === paginatedProducts.length
                      }
                      ref={(el) => {
                        if (el) {
                          el.indeterminate =
                            selectedIds.length > 0 &&
                            selectedIds.length < paginatedProducts.length;
                        }
                      }}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-[#26B997] focus:ring-[#26B997] cursor-pointer"
                      aria-label="Sélectionner tous les produits affichés"
                    />
                  </th>
                  <th className="py-4 px-3 w-16">Photo</th>
                  <th className="py-4 px-4">Modèle / Article</th>
                  <th className="py-4 px-6">Catégorie</th>
                  <th className="py-4 px-6">Prix Vente</th>
                  <th className="py-4 px-6">Quantité Stock</th>
                  <th className="py-4 px-6">Statut Stock</th>
                  <th className="py-4 px-6">Statut</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedProducts.map((prod) => {
                  const isSelected = selectedIds.includes(prod.id);
                  return (
                    <tr
                      key={prod.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-[#E8F8F5]/50' : ''
                      }`}
                    >
                      <td className="py-4 pl-6 pr-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(prod.id)}
                          className="w-4 h-4 rounded border-slate-300 text-[#26B997] focus:ring-[#26B997] cursor-pointer"
                          aria-label={`Sélectionner ${prod.name}`}
                        />
                      </td>

                      <td className="py-4 px-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 shadow-xs group">
                          {prod.images && prod.images.length > 0 ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={prod.images[0]}
                                alt={prod.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              {prod.images.length > 1 && (
                                <span className="absolute bottom-1 right-1 bg-black/75 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md leading-tight flex items-center gap-0.5 shadow-xs">
                                  <ImageIcon className="w-2.5 h-2.5" />
                                  <span>{prod.images.length}</span>
                                </span>
                              )}
                            </>
                          ) : prod.image ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {prod.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[11px] text-slate-400">
                            {prod.sku}
                          </span>
                          {prod.isFeatured && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                              <span>En vedette</span>
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 text-[11px] line-clamp-1 mt-1 max-w-sm">
                          {prod.description}
                        </p>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-[#E8F8F5] text-[#1F6F5C] font-semibold border border-[#26B997]/25">
                          {prod.categoryLabel}
                        </span>
                      </td>

                      <td className="py-4 px-6 font-extrabold text-slate-900 text-sm whitespace-nowrap">
                        {prod.price.toLocaleString('fr-BE')} €
                      </td>

                      <td className="py-4 px-6 font-bold whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className="text-slate-800">
                            {prod.stock} unités
                          </span>
                          <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                prod.stock === 0
                                  ? 'bg-rose-500 w-0'
                                  : prod.stock <= 2
                                  ? 'bg-amber-500 w-1/3'
                                  : 'bg-emerald-500 w-full'
                              }`}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        {prod.status === 'in_stock' && (
                          <Badge variant="success">En stock</Badge>
                        )}
                        {prod.status === 'low_stock' && (
                          <Badge variant="warning">Stock faible (≤ 2)</Badge>
                        )}
                        {prod.status === 'out_of_stock' && (
                          <Badge variant="error">Épuisé</Badge>
                        )}
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(prod)}
                          title="Cliquer pour basculer le statut"
                          className="cursor-pointer"
                        >
                          {prod.statut === 'inactive' ? (
                            <Badge variant="neutral">Inactif</Badge>
                          ) : (
                            <Badge variant="success">Actif</Badge>
                          )}
                        </button>
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenView(prod)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(prod)}
                            className="p-1.5 text-slate-600 hover:text-[#26B997] hover:bg-[#E8F8F5] rounded-lg transition-colors cursor-pointer"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(prod)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              prod.statut !== 'inactive'
                                ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            }`}
                            title={
                              prod.statut !== 'inactive'
                                ? 'Désactiver le produit'
                                : 'Activer le produit'
                            }
                            aria-label={
                              prod.statut !== 'inactive'
                                ? 'Désactiver le produit'
                                : 'Activer le produit'
                            }
                          >
                            {prod.statut !== 'inactive' ? (
                              <Power className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <PowerOff className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(prod.id, prod.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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

      {/* Modal Détails (Clean Flat Design sans boîtes ni bordures de conteneurs) */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Détails du produit"
        description="Fiche descriptive et caractéristiques techniques du modèle"
        maxWidth="lg"
      >
        {viewingProduct && (
          <div className="space-y-5">
            {/* Visuels du produit - Présentation e-commerce interactive avec grande vue et miniatures cliquables */}
            {(() => {
              const galleryImages =
                viewingProduct.images && viewingProduct.images.length > 0
                  ? viewingProduct.images
                  : viewingProduct.image
                  ? [viewingProduct.image]
                  : [];
              if (galleryImages.length === 0) return null;

              const currentImg = galleryImages[activeImageIndex] || galleryImages[0];
              const coverImg = viewingProduct.image || galleryImages[0];

              return (
                <div className="space-y-3">
                  {/* Grande photo active */}
                  <div className="relative w-full h-64 sm:h-80 rounded-3xl overflow-hidden bg-slate-50 border border-slate-200/80 flex items-center justify-center shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentImg}
                      alt={viewingProduct.name}
                      className="w-full h-full object-contain p-2 transition-all duration-300"
                    />
                    {currentImg === coverImg && (
                      <div className="absolute top-3 left-3 bg-[#26B997] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                        <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                        <span>Photo principale</span>
                      </div>
                    )}
                    <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono font-medium px-2 py-0.5 rounded-lg">
                      {activeImageIndex + 1} / {galleryImages.length}
                    </span>
                  </div>

                  {/* Ligne de miniatures (Thumbnails cliquables) */}
                  {galleryImages.length > 1 && (
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                      {galleryImages.map((imgUrl, idx) => {
                        const isActive = idx === activeImageIndex;
                        const isPrimary = imgUrl === coverImg;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveImageIndex(idx)}
                            className={`relative rounded-xl overflow-hidden w-16 h-16 sm:w-20 sm:h-20 shrink-0 border-2 transition-all cursor-pointer bg-slate-100 ${
                              isActive
                                ? 'border-[#26B997] ring-2 ring-[#26B997]/25 scale-105'
                                : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imgUrl}
                              alt={`Miniature ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {isPrimary && (
                              <span
                                className="absolute top-1 left-1 w-2 h-2 rounded-full bg-[#26B997] ring-1 ring-white"
                                title="Photo principale"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* En-tête : Nom du vélo & Statut */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Nom du vélo ou équipement
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-[#1F6F5C] break-words">
                  {viewingProduct.name}
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {viewingProduct.isFeatured && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>En vedette</span>
                  </span>
                )}
                <Badge
                  variant={
                    viewingProduct.statut === 'inactive' ? 'neutral' : 'success'
                  }
                  dot
                >
                  {viewingProduct.statut === 'inactive' ? 'Inactif' : 'Actif'}
                </Badge>
              </div>
            </div>

            {/* Caractéristiques techniques : SKU, Catégorie, Prix, Stock & État */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Référence / SKU
                </span>
                <p className="font-mono text-xs sm:text-sm font-bold text-slate-800">
                  {viewingProduct.sku}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Catégorie
                </span>
                <p className="font-bold text-xs sm:text-sm text-slate-900">
                  {viewingProduct.categoryLabel}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Prix de vente
                </span>
                <p className="font-extrabold text-xs sm:text-sm text-slate-900">
                  {viewingProduct.price.toLocaleString('fr-BE')} €
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  État du stock
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-xs sm:text-sm text-slate-800">
                    {viewingProduct.stock} unité(s)
                  </span>
                  {viewingProduct.status === 'in_stock' && (
                    <Badge variant="success">En stock</Badge>
                  )}
                  {viewingProduct.status === 'low_stock' && (
                    <Badge variant="warning">Faible (≤ 2)</Badge>
                  )}
                  {viewingProduct.status === 'out_of_stock' && (
                    <Badge variant="error">Épuisé</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Description & spécifications techniques */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Description & spécifications techniques
              </span>
              <p className="text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] max-h-64 overflow-y-auto">
                {viewingProduct.description ||
                  'Aucune description ni spécification technique renseignée.'}
              </p>
            </div>

            {/* Dates */}
            <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-2 border-t border-slate-100">
              <span>Créé le : {viewingProduct.createdAt}</span>
              {viewingProduct.updatedAt && (
                <span>Mise à jour : {viewingProduct.updatedAt}</span>
              )}
            </div>

            {/* Boutons d'actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleOpenEdit(viewingProduct);
                }}
                className="btn-secondary-soft text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Modifier ce produit</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="btn-primary-gradient text-xs cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalError(null);
        }}
        title={
          editingProduct?.id ? 'Modifier le modèle' : 'Ajouter un nouveau modèle'
        }
        description="Fiche technique pour la boutique solidaire No Borders ASBL"
        maxWidth="lg"
      >
        {editingProduct && (
          <form onSubmit={handleSave} className="space-y-4">
            {modalError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2.5 animate-fade-in shadow-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold leading-relaxed">{modalError}</span>
              </div>
            )}

            <div>
              <label className="label-premium">
                Nom du vélo ou équipement <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={editingProduct.name || ''}
                onChange={(e) =>
                  setEditingProduct({ ...editingProduct, name: e.target.value })
                }
                placeholder="Ex. Vélo Bambou Gravel Explorer"
                className={`input-premium ${
                  formErrors.name ? 'border-rose-400 ring-1 ring-rose-300' : ''
                }`}
              />
              {formErrors.name && (
                <p className="text-xs font-semibold text-rose-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {formErrors.name}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-premium">
                  Catégorie spécialisée <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editingProduct.categoryId || editingProduct.category || ''}
                  onChange={(e) => {
                    const selectedCat = categories.find(
                      (c) => c.id === e.target.value,
                    );
                    setEditingProduct({
                      ...editingProduct,
                      categoryId: e.target.value,
                      category: e.target.value as any,
                      categoryLabel:
                        selectedCat?.title || editingProduct.categoryLabel || '',
                    });
                  }}
                  className="input-premium cursor-pointer font-medium"
                >
                  {categories.length === 0 && (
                    <option value="">Sélectionner une catégorie</option>
                  )}
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.title}
                    </option>
                  ))}
                  {/* Fallback si aucune catégorie n'est encore créée */}
                  {categories.length === 0 && (
                    <>
                      <option value="bamboo-bikes">Vélos en Bambou</option>
                      <option value="hase-bikes">
                        Hase Bikes (Tandems & Trikes)
                      </option>
                      <option value="elliptigo">
                        ElliptiGO (Outdoor Elliptique)
                      </option>
                      <option value="accessories">Accessoires & Pièces</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="label-premium">
                  Référence / SKU <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingProduct.sku || ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      sku: e.target.value,
                    })
                  }
                  placeholder="Ex. BAM-GRV-01"
                  className={`input-premium font-mono text-xs uppercase ${
                    formErrors.sku ? 'border-rose-400 ring-1 ring-rose-300' : ''
                  }`}
                />
                {formErrors.sku && (
                  <p className="text-xs font-semibold text-rose-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {formErrors.sku}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sélecteur Mettre en vedette (demandé explicitement) */}
              <div>
                <label className="label-premium flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Produit en vedette</span>
                </label>
                <select
                  value={editingProduct.isFeatured ? 'true' : 'false'}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      isFeatured: e.target.value === 'true',
                    })
                  }
                  className="input-premium cursor-pointer font-medium"
                >
                  <option value="false">Non (Produit standard)</option>
                  <option value="true">Oui (Mettre en vedette)</option>
                </select>
              </div>

              {/* Statut de publication */}
              <div>
                <label className="label-premium">
                  Statut de publication
                </label>
                <select
                  value={editingProduct.statut || 'active'}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      statut: e.target.value as 'active' | 'inactive',
                    })
                  }
                  className="input-premium cursor-pointer font-medium"
                >
                  <option value="active">Actif (Publié au catalogue)</option>
                  <option value="inactive">Inactif (Brouillon masqué)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-premium">
                  Prix TTC (€) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    editingProduct.price !== undefined
                      ? editingProduct.price
                      : ''
                  }
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="Ex. 1890"
                  className={`input-premium ${
                    formErrors.price
                      ? 'border-rose-400 ring-1 ring-rose-300'
                      : ''
                  }`}
                />
                {formErrors.price && (
                  <p className="text-xs font-semibold text-rose-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {formErrors.price}
                  </p>
                )}
              </div>

              <div>
                <label className="label-premium">
                  Quantité en stock <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={
                    editingProduct.stock !== undefined
                      ? editingProduct.stock
                      : ''
                  }
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      stock: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  placeholder="Ex. 5"
                  className={`input-premium ${
                    formErrors.stock
                      ? 'border-rose-400 ring-1 ring-rose-300'
                      : ''
                  }`}
                />
                {formErrors.stock && (
                  <p className="text-xs font-semibold text-rose-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {formErrors.stock}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="label-premium">
                Description & spécifications techniques
              </label>
              <textarea
                rows={3}
                value={editingProduct.description || ''}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    description: e.target.value,
                  })
                }
                placeholder="Détails du cadre, transmission, motorisation ou adaptabilité..."
                className="input-premium resize-none leading-relaxed"
              />
            </div>

            {/* Photos & Galerie Section */}
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <label className="label-premium mb-0 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#26B997]" />
                    <span>Photos du produit</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Importez des photos depuis votre ordinateur ou renseignez des URLs. La première photo est automatiquement définie comme image de couverture.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {(
                    editingProduct.images ||
                    (editingProduct.image ? [editingProduct.image] : [])
                  ).length}{' '}
                  photo(s)
                </span>
              </div>

              {/* Local File Input & Dropzone */}
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
                    ? 'border-[#26B997] bg-[#E8F8F5]/70 scale-[1.01]'
                    : 'border-slate-300 hover:border-[#26B997] bg-slate-50/70 hover:bg-slate-50'
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#E8F8F5] text-[#1F6F5C] flex items-center justify-center shadow-xs">
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
                        : 'Ajouter des photos depuis votre ordinateur (pièce jointe)'}
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
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-[#1F6F5C] font-bold text-xs shadow-xs hover:bg-slate-50 transition-colors mt-1 cursor-pointer"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Choisir des fichiers sur mon PC</span>
                  </button>
                </div>
              </div>

              {/* Photos Grid */}
              {((editingProduct.images && editingProduct.images.length > 0) ||
                editingProduct.image) && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                    <span>
                      Photos actuelles (
                      {
                        (
                          editingProduct.images ||
                          (editingProduct.image ? [editingProduct.image] : [])
                        ).length
                      }
                      ) :
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Cliquez sur l&apos;étoile pour changer la photo principale
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(
                      editingProduct.images ||
                      (editingProduct.image ? [editingProduct.image] : [])
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
                            <span>Principale</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryPhoto(idx)}
                              title="Définir comme photo principale"
                              className="p-1.5 bg-white/95 hover:bg-white text-slate-800 rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                            >
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            title="Supprimer cette photo"
                            className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
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

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setModalError(null);
                }}
                className="btn-secondary-soft cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary-gradient cursor-pointer disabled:opacity-50"
              >
                {isSaving
                  ? 'Enregistrement...'
                  : editingProduct?.id
                  ? 'Enregistrer les modifications'
                  : 'Créer le produit'}
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
        title={
          deleteTarget?.isBulk
            ? 'Supprimer les produits'
            : 'Supprimer le produit'
        }
        message={
          deleteTarget?.isBulk
            ? `Supprimer définitivement ces ${deleteTarget.name} ?`
            : `Supprimer définitivement ce produit ?`
        }
        submessage="Cette action est irréversible."
      />
    </div>
  );
}
