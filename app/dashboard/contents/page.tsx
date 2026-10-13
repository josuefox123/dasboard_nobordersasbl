'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ContentItem, ContentType } from '@/types/dashboard';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ContentsPage() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [localeFilter, setLocaleFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<ContentItem> | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    loadContents();
  }, []);

  const searchParams = useSearchParams();
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) setSearchQuery(q);
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
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ContentItem) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Confirmez-vous la suppression de "${title}" ?`)) {
      await apiClient.deleteContent(id);
      await loadContents();
      setNotice(`Contenu "${title}" supprimé.`);
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.title?.trim()) return;

    await apiClient.saveContent(editingItem as any);
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
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par titre ou auteur..."
            className="input-premium pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-premium cursor-pointer font-medium w-full md:w-auto"
          >
            <option value="all">Tous les types</option>
            <option value="article">Articles & Nouvelles</option>
            <option value="event">Événements & Ateliers</option>
            <option value="page">Pages Fixes</option>
          </select>

          <select
            value={localeFilter}
            onChange={(e) => setLocaleFilter(e.target.value)}
            className="input-premium cursor-pointer font-medium w-full md:w-auto"
          >
            <option value="all">Toutes les langues</option>
            <option value="fr">Français (FR)</option>
            <option value="nl">Nederlands (NL)</option>
            <option value="en">English (EN)</option>
          </select>
        </div>
      </div>

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
                  <th className="py-3.5 px-6">Titre & Slug</th>
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
                {filteredContents.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 max-w-sm">
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
                ))}
              </tbody>
            </table>
          </div>
        )}
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
