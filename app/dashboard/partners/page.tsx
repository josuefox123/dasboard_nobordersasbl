'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Handshake,
  Plus,
  Search,
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
import { PartnerItem } from '@/types/dashboard';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { BatchActionBar } from '@/components/ui/BatchActionBar';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';

export default function PartnersPage() {
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination & Multi-Selection
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partial<PartnerItem> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id?: string; title: string; isBulk?: boolean } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Logo upload state in form
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    loadPartners();
  }, []);

  const searchParams = useSearchParams();
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
      setCurrentPage(1);
    }
  }, [searchParams]);

  async function loadPartners() {
    try {
      const data = await apiClient.getPartners();
      setPartners(data);
    } finally {
      setLoading(false);
    }
  }

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditingPartner({
      name: '',
      logo: '',
      status: 'active',
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (partner: PartnerItem) => {
    setEditingPartner({ ...partner });
    setIsFormModalOpen(true);
  };

  // Image upload handling
  const processImageFile = (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return;

    setIsUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setEditingPartner((prev) => (prev ? { ...prev, logo: result } : prev));
      }
      setIsUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      setIsUploadingLogo(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    if (!editingPartner) return;
    setEditingPartner({ ...editingPartner, logo: '' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner || !editingPartner.name?.trim()) return;

    await apiClient.savePartner(editingPartner as any);
    await loadPartners();
    setIsFormModalOpen(false);
    const wasEditing = !!editingPartner.id;
    setEditingPartner(null);
    showNotification(
      wasEditing
        ? 'Partenaire modifié avec succès.'
        : 'Nouveau partenaire ajouté avec succès.'
    );
  };

  const handleToggleStatus = async (partner: PartnerItem) => {
    const updated = await apiClient.togglePartnerStatus(partner.id);
    if (updated) {
      setPartners((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      showNotification(
        updated.status === 'active'
          ? `Partenaire "${partner.name}" activé.`
          : `Partenaire "${partner.name}" désactivé.`
      );
    }
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, title: name });
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedPartners.length && paginatedPartners.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedPartners.map((p) => p.id));
    }
  };

  const handleBulkDelete = () => {
    setDeleteTarget({ isBulk: true, title: `${selectedIds.length} partenaire(s)` });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      if (deleteTarget.isBulk) {
        for (const id of selectedIds) {
          await apiClient.deletePartner(id);
        }
        await loadPartners();
        showNotification(`${selectedIds.length} partenaire(s) supprimé(s).`);
        setSelectedIds([]);
      } else if (deleteTarget.id) {
        await apiClient.deletePartner(deleteTarget.id);
        await loadPartners();
        setSelectedIds((prev) => prev.filter((i) => i !== deleteTarget.id));
        showNotification(`Partenaire "${deleteTarget.title}" supprimé.`);
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPartners = partners.filter((partner) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = partner.name.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || partner.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalItems = filteredPartners.length;
  const paginatedPartners = filteredPartners.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* En-tête : Titre & Bouton Ajouter un partenaire */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Gestion des Partenaires
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Répertoire des institutions, fabricants et partenaires engagés avec No Borders ASBL.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-primary-gradient inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un partenaire</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Barre de Recherche et Filtres */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-[0_12px_40px_-18px_rgba(11,60,104,0.12)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom de partenaire..."
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
            <option value="all">Tous les statuts ({partners.length})</option>
            <option value="active">
              Actifs ({partners.filter((p) => p.status === 'active').length})
            </option>
            <option value="inactive">
              Désactivés ({partners.filter((p) => p.status === 'inactive').length})
            </option>
          </select>
        </div>
      </div>

      {/* Barre d'actions groupées */}
      <BatchActionBar
        selectedCount={selectedIds.length}
        totalCount={filteredPartners.length}
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

      {/* Tableau des partenaires */}
      <div className="panel overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : filteredPartners.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Handshake className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Aucun partenaire trouvé</p>
            <p className="text-xs text-slate-400 mt-1">
              Cliquez sur « Ajouter un partenaire » pour enregistrer un premier partenaire.
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
                        paginatedPartners.length > 0 &&
                        selectedIds.length === paginatedPartners.length
                      }
                      ref={(el) => {
                        if (el) {
                          el.indeterminate =
                            selectedIds.length > 0 &&
                            selectedIds.length < paginatedPartners.length;
                        }
                      }}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-[#0B3C68] focus:ring-[#0B3C68] cursor-pointer"
                      aria-label="Sélectionner tous les partenaires affichés"
                    />
                  </th>
                  <th className="py-3.5 px-4 font-bold text-slate-700">Nom du partenaire</th>
                  <th className="py-3.5 px-4 font-bold text-slate-700 w-28 sm:w-36">Logo</th>
                  <th className="py-3.5 px-6 whitespace-nowrap font-bold text-slate-700">Statut</th>
                  <th className="py-3.5 px-6 whitespace-nowrap font-bold text-slate-700">Date de création</th>
                  <th className="py-3.5 px-6 text-right whitespace-nowrap font-bold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedPartners.map((partner) => {
                  const isSelected = selectedIds.includes(partner.id);
                  const isActive = partner.status === 'active';

                  return (
                    <tr
                      key={partner.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      {/* Checkbox sélection */}
                      <td className="py-4 pl-6 pr-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(partner.id)}
                          className="w-4 h-4 rounded border-slate-300 text-[#0B3C68] focus:ring-[#0B3C68] cursor-pointer"
                          aria-label={`Sélectionner ${partner.name}`}
                        />
                      </td>

                      {/* Colonne 1 : Nom du partenaire */}
                      <td className="py-4 px-4 font-semibold text-slate-900">
                        <span className="text-sm font-bold text-slate-900 hover:text-[#0B3C68] transition-colors">
                          {partner.name}
                        </span>
                      </td>

                      {/* Colonne 2 : Logo */}
                      <td className="py-4 px-4">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-slate-200/80 p-1.5 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                          {partner.logo ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={partner.logo}
                              alt={`Logo ${partner.name}`}
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => {
                                // Fallback icon si image cassée
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                              <Handshake className="w-6 h-6 text-slate-300" />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Colonne 3 : Statut */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(partner)}
                          className="cursor-pointer group focus:outline-hidden"
                          title="Cliquer pour changer le statut"
                        >
                          <Badge
                            variant={isActive ? 'success' : 'neutral'}
                            dot
                            className="group-hover:opacity-85 transition-opacity"
                          >
                            {isActive ? 'Actif' : 'Désactivé'}
                          </Badge>
                        </button>
                      </td>

                      {/* Colonne 4 : Date de création */}
                      <td className="py-4 px-6 whitespace-nowrap text-xs text-slate-600 font-normal">
                        {partner.createdAt}
                      </td>

                      {/* Colonne 5 : Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Modifier */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(partner)}
                            className="p-1.5 text-slate-600 hover:text-[#0B3C68] hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier le partenaire"
                            aria-label={`Modifier ${partner.name}`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Activer / Désactiver */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(partner)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isActive
                                ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            }`}
                            title={isActive ? 'Désactiver le partenaire' : 'Activer le partenaire'}
                            aria-label={isActive ? 'Désactiver le partenaire' : 'Activer le partenaire'}
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
                            onClick={() => handleDelete(partner.id, partner.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Supprimer le partenaire"
                            aria-label={`Supprimer ${partner.name}`}
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

      {/* Formulaire réutilisable (Création & Modification) */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingPartner(null);
        }}
        title={editingPartner?.id ? 'Modifier le partenaire' : 'Ajouter un partenaire'}
        description="Renseignez le nom, téléversez le logo et définissez le statut du partenaire"
        maxWidth="md"
      >
        {editingPartner && (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Champ 1 : Nom */}
            <div>
              <label className="label-premium">
                Nom du partenaire <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editingPartner.name || ''}
                onChange={(e) =>
                  setEditingPartner({ ...editingPartner, name: e.target.value })
                }
                placeholder="Ex. Hase Bikes, ElliptiGO, Région de Bruxelles-Capitale..."
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
                value={editingPartner.status || 'active'}
                onChange={(e) =>
                  setEditingPartner({
                    ...editingPartner,
                    status: e.target.value as 'active' | 'inactive',
                  })
                }
                className="input-premium font-medium cursor-pointer"
              >
                <option value="active">Actif (affiché dans les espaces partenaires)</option>
                <option value="inactive">Désactivé (masqué)</option>
              </select>
            </div>

            {/* Champ 3 : Logo avec prévisualisation */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <label className="label-premium mb-0 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#0B3C68]" />
                    <span>Logo du partenaire</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Téléversez le logo (PNG, JPG, SVG, WebP)
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

              {/* Prévisualisation du logo existant ou sélectionné */}
              {editingPartner.logo ? (
                <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-3">
                  <div className="w-28 h-28 rounded-2xl bg-white border border-slate-200 shadow-xs p-2 flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editingPartner.logo}
                      alt="Aperçu du logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs hover:bg-slate-50 transition-colors"
                    >
                      Changer le logo
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold hover:bg-rose-100 transition-colors"
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
                      ? 'border-[#0B3C68] bg-blue-50/50'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <Upload className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">
                    {isUploadingLogo
                      ? 'Chargement du logo...'
                      : 'Cliquez ou glissez-déposez le logo ici'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    PNG, SVG, WEBP ou JPG jusqu’à 5 Mo
                  </p>
                </div>
              )}

              {/* Option URL directe pour le logo */}
              <div className="pt-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Ou renseigner l’URL directe d’un logo</span>
                </div>
                <input
                  type="url"
                  value={editingPartner.logo?.startsWith('data:') ? '' : editingPartner.logo || ''}
                  onChange={(e) =>
                    setEditingPartner({ ...editingPartner, logo: e.target.value })
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
                  setEditingPartner(null);
                }}
                className="btn-secondary-soft text-xs"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-primary-gradient text-xs"
              >
                {editingPartner.id ? 'Enregistrer les modifications' : 'Créer le partenaire'}
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
        title={deleteTarget?.isBulk ? 'Supprimer les partenaires' : 'Supprimer le partenaire'}
        message={
          deleteTarget?.isBulk
            ? `Supprimer définitivement ces ${deleteTarget.title} ?`
            : `Supprimer définitivement ce partenaire ?`
        }
        submessage="Cette action est irréversible."
      />
    </div>
  );
}
