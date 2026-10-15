'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  Bike,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  PackageCheck,
  Tag,
  Image as ImageIcon,
  X,
  PlusCircle,
  Star,
  Sparkles,
  Upload,
  Paperclip,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Product, ProductCategory } from '@/types/dashboard';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { BatchActionBar } from '@/components/ui/BatchActionBar';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');

  // Pagination & Selection
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const searchParams = useSearchParams();
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
      setCurrentPage(1);
    }
  }, [searchParams]);

  async function loadProducts() {
    try {
      const data = await apiClient.getProducts();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenAdd = () => {
    setEditingProduct({
      category: 'bamboo-bikes',
      price: 0,
      stock: 1,
      name: '',
      sku: '',
      description: '',
      images: [],
      image: '',
    });
    setNewPhotoUrl('');
    setFormErrors({});
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
      images: initialImages,
      image: initialImages[0] || '',
    });
    setNewPhotoUrl('');
    setFormErrors({});
    setIsModalOpen(true);
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

  const handleAddPhoto = (urlToAdd?: string) => {
    const url = (urlToAdd || newPhotoUrl).trim();
    if (!url || !editingProduct) return;
    const currentImages =
      editingProduct.images && editingProduct.images.length > 0
        ? [...editingProduct.images]
        : editingProduct.image
        ? [editingProduct.image]
        : [];
    if (currentImages.includes(url)) return;
    const updated = [...currentImages, url];
    setEditingProduct({
      ...editingProduct,
      images: updated,
      image: updated[0] || '',
    });
    if (!urlToAdd) setNewPhotoUrl('');
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
      ...(editingProduct.images || (editingProduct.image ? [editingProduct.image] : [])),
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

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le produit "${name}" ?`)) {
      await apiClient.deleteProduct(id);
      await loadProducts();
      setFeedbackMsg(`Produit "${name}" supprimé.`);
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    // Validation
    const errors: Record<string, string> = {};
    if (!editingProduct.name?.trim()) errors.name = 'Le nom du vélo ou équipement est requis.';
    if (editingProduct.price === undefined || editingProduct.price <= 0) errors.price = 'Le prix unitaire doit être supérieur à 0 €.';
    if (editingProduct.stock === undefined || editingProduct.stock < 0) errors.stock = 'Le stock ne peut être négatif.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const finalProduct = {
      ...editingProduct,
      image: editingProduct.images && editingProduct.images.length > 0 ? editingProduct.images[0] : (editingProduct.image || ''),
      images: editingProduct.images || [],
    };

    await apiClient.saveProduct(finalProduct as any);
    await loadProducts();
    setIsModalOpen(false);
    setEditingProduct(null);
    setFeedbackMsg('Produit enregistré avec succès.');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Filtered Products
  const filteredProducts = products.filter((prod) => {
    const matchesCategory =
      selectedCategory === 'all' || prod.category === selectedCategory;

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
    currentPage * itemsPerPage
  );

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedProducts.length && paginatedProducts.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedProducts.map((p) => p.id));
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Confirmez-vous la suppression de ${selectedIds.length} produit(s) ?`)) {
      for (const id of selectedIds) {
        await apiClient.deleteProduct(id);
      }
      await loadProducts();
      setSelectedIds([]);
      setFeedbackMsg(`${selectedIds.length} produit(s) supprimé(s).`);
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  const handleBulkExport = () => {
    const selected = products.filter((p) => selectedIds.includes(p.id));
    const header = 'ID,Nom,SKU,Categorie,Prix,Stock,Statut\n';
    const rows = selected
      .map((p) => `"${p.id}","${p.name}","${p.sku}","${p.categoryLabel}",${p.price},${p.stock},"${p.status}"`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `produits_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setFeedbackMsg(`Export de ${selected.length} produit(s) généré avec succès.`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Produits & Modèles Spécialisés
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Gestion du catalogue : Vélos en bambou artisanaux, tricycles Hase Bikes adaptés et ElliptiGO.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-primary-gradient inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un Produit</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'all', label: 'Tous les produits', count: products.length },
          {
            id: 'bamboo-bikes',
            label: 'Vélos en Bambou',
            count: products.filter((p) => p.category === 'bamboo-bikes').length,
          },
          {
            id: 'hase-bikes',
            label: 'Hase Bikes (Adaptés)',
            count: products.filter((p) => p.category === 'hase-bikes').length,
          },
          {
            id: 'elliptigo',
            label: 'ElliptiGO',
            count: products.filter((p) => p.category === 'elliptigo').length,
          },
          {
            id: 'accessories',
            label: 'Accessoires & Pièces',
            count: products.filter((p) => p.category === 'accessories').length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              selectedCategory === tab.id
                ? 'bg-[#0B3C68] text-white shadow-sm shadow-blue-900/20'
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
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-[0_12px_40px_-18px_rgba(11,60,104,0.12)] flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par modèle, réf SKU ou caractéristiques..."
            className="input-premium pl-10"
          />
        </div>

        {/* Stock status filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
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
            <p className="font-semibold text-slate-700">Aucun produit ne correspond à ces critères</p>
            <p className="text-xs text-slate-400 mt-1">Modifiez vos filtres ou effectuez une autre recherche.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 -my-6">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-4 pl-6 pr-2 w-10">
                    <input
                      type="checkbox"
                      checked={paginatedProducts.length > 0 && selectedIds.length === paginatedProducts.length}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate = selectedIds.length > 0 && selectedIds.length < paginatedProducts.length;
                        }
                      }}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-[#0B3C68] focus:ring-[#0B3C68] cursor-pointer"
                      aria-label="Sélectionner tous les produits affichés"
                    />
                  </th>
                  <th className="py-4 px-3 w-16">Photo</th>
                  <th className="py-4 px-4">Modèle / Article</th>
                  <th className="py-4 px-6">Catégorie</th>
                  <th className="py-4 px-6">Prix Vente</th>
                  <th className="py-4 px-6">Quantité Stock</th>
                  <th className="py-4 px-6">Statut Stock</th>
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
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="py-4 pl-6 pr-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(prod.id)}
                          className="w-4 h-4 rounded border-slate-300 text-[#0B3C68] focus:ring-[#0B3C68] cursor-pointer"
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
                        <div className="font-bold text-slate-900 text-sm">{prod.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[11px] text-slate-400">{prod.sku}</span>
                          {prod.isFeatured && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                              En vedette
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 text-[11px] line-clamp-1 mt-1 max-w-sm">
                          {prod.description}
                        </p>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#0B3C68] font-semibold border border-blue-100">
                          {prod.categoryLabel}
                        </span>
                      </td>

                      <td className="py-4 px-6 font-extrabold text-slate-900 text-sm whitespace-nowrap">
                        {prod.price.toLocaleString('fr-BE')} €
                      </td>

                      <td className="py-4 px-6 font-bold whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className="text-slate-800">{prod.stock} unités</span>
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

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(prod)}
                            className="p-1.5 text-slate-600 hover:text-[#0B3C68] hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(prod.id, prod.name)}
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

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct?.id ? 'Modifier le modèle' : 'Ajouter un nouveau modèle'}
        description="Fiche technique pour la boutique solidaire No Borders ASBL"
        maxWidth="lg"
      >
        {editingProduct && (
          <form onSubmit={handleSave} className="space-y-5">
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
                  value={editingProduct.category || 'bamboo-bikes'}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      category: e.target.value as ProductCategory,
                    })
                  }
                  className="input-premium cursor-pointer font-medium"
                >
                  <option value="bamboo-bikes">Vélos en Bambou</option>
                  <option value="hase-bikes">Hase Bikes (Tandems & Trikes)</option>
                  <option value="elliptigo">ElliptiGO (Outdoor Elliptique)</option>
                  <option value="accessories">Accessoires & Pièces</option>
                </select>
              </div>

              <div>
                <label className="label-premium">
                  Référence / SKU
                </label>
                <input
                  type="text"
                  value={editingProduct.sku || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, sku: e.target.value })
                  }
                  placeholder="Ex. BAM-GRV-01"
                  className="input-premium font-mono text-xs uppercase"
                />
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
                  value={editingProduct.price !== undefined ? editingProduct.price : ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="Ex. 1890"
                  className={`input-premium ${
                    formErrors.price ? 'border-rose-400 ring-1 ring-rose-300' : ''
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
                  Stock atelier <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingProduct.stock !== undefined ? editingProduct.stock : ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      stock: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  placeholder="Ex. 5"
                  className={`input-premium ${
                    formErrors.stock ? 'border-rose-400 ring-1 ring-rose-300' : ''
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
                    <ImageIcon className="w-4 h-4 text-[#0B3C68]" />
                    <span>Photos du produit</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Importez des photos depuis votre ordinateur ou ajoutez des liens. La première photo est la photo principale.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {(editingProduct.images || (editingProduct.image ? [editingProduct.image] : [])).length} photo(s)
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
              {((editingProduct.images && editingProduct.images.length > 0) || editingProduct.image) && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                    <span>Photos actuelles ({ (editingProduct.images || (editingProduct.image ? [editingProduct.image] : [])).length }) :</span>
                    <span className="text-[10px] text-slate-400">Cliquez sur l&apos;étoile pour changer la photo principale</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(editingProduct.images || (editingProduct.image ? [editingProduct.image] : [])).map((imgUrl, idx) => (
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
                            <span>Principale</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryPhoto(idx)}
                              title="Définir comme photo principale"
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

              {/* Collapsible / Alternative option for URL or presets */}
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
                    { label: 'Gravel Bambou', url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80' },
                    { label: 'Cadre Bambou', url: 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=800&q=80' },
                    { label: 'Tricycle Hase', url: 'https://images.unsplash.com/photo-1511994298241-608e28f14fde?auto=format&fit=crop&w=800&q=80' },
                    { label: 'ElliptiGO', url: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=800&q=80' },
                    { label: 'Casque & Équipement', url: 'https://images.unsplash.com/photo-1559348349-86f1f65817fe?auto=format&fit=crop&w=800&q=80' },
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
                {editingProduct?.id ? 'Enregistrer les modifications' : 'Créer le produit'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
