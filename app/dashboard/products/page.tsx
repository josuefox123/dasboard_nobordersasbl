'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Product, ProductCategory } from '@/types/dashboard';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const searchParams = useSearchParams();
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) setSearchQuery(q);
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
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct({ ...prod });
    setFormErrors({});
    setIsModalOpen(true);
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

    await apiClient.saveProduct(editingProduct as any);
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
                  <th className="py-4 px-6">Modèle / Article</th>
                  <th className="py-4 px-6">Catégorie</th>
                  <th className="py-4 px-6">Prix Vente</th>
                  <th className="py-4 px-6">Quantité Stock</th>
                  <th className="py-4 px-6">Statut Stock</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
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
                ))}
              </tbody>
            </table>
          </div>
        )}
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
