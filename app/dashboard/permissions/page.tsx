'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Shield,
  ShieldAlert,
  Search,
  Lock,
  RefreshCw,
  Layers,
  KeyRound,
  RotateCcw,
  Eye,
  Calendar,
  Hash,
  FileText,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { PermissionItem } from '@/types/dashboard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ status?: number; message: string } | null>(null);

  // Modal Détail
  const [selectedPermission, setSelectedPermission] = useState<PermissionItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Recherche & Filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');

  // Pagination côté serveur
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Debounce sur la recherche pour ne pas saturer l'API
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Chargement des permissions depuis l'API Super Admin
  const loadPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getPermissions({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch,
        module: moduleFilter !== 'all' ? moduleFilter : undefined,
      });

      setPermissions(response.data || []);
      setTotalItems(response.pagination?.total || 0);

      // Si l'API renvoie la liste globale des modules distincts, on la met à jour
      if (response.modules && Array.isArray(response.modules)) {
        setAvailableModules(response.modules);
      } else {
        // Fallback dynamique à partir des données reçues
        const extracted = Array.from(
          new Set(response.data?.map((p) => p.module) || []),
        ).sort();
        setAvailableModules((prev) => (prev.length > 0 ? prev : extracted));
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement des permissions:', err);
      setError({
        status: err?.status,
        message:
          err?.message ||
          'Une erreur est survenue lors de la récupération des permissions.',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearch, moduleFilter]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  // Réinitialiser la page à 1 lors de la modification des filtres
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleModuleChange = (value: string) => {
    setModuleFilter(value);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setModuleFilter('all');
    setCurrentPage(1);
  };

  const handleOpenDetail = (perm: PermissionItem) => {
    setSelectedPermission(perm);
    setIsDetailOpen(true);
  };

  // Regroupement dynamique des permissions par module
  const groupedPermissions = useMemo(() => {
    const groups: { [key: string]: PermissionItem[] } = {};
    for (const perm of permissions) {
      if (!groups[perm.module]) {
        groups[perm.module] = [];
      }
      groups[perm.module].push(perm);
    }
    return Object.entries(groups).map(([moduleName, items]) => ({
      module: moduleName,
      items,
    }));
  }, [permissions]);

  // Helper pour formater l'affichage du nom de module (ex: 'faq' -> 'FAQ', 'donations' -> 'Donations')
  const formatModuleName = (raw: string): string => {
    if (!raw) return '';
    const upper = raw.toUpperCase();
    if (upper === 'FAQ' || upper === 'FAQS') return 'FAQ';
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  };

  return (
    <div className="space-y-6 animate-fade-in pt-6">
      {/* En-tête : Titre et Sous-titre */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Gestion des permissions
            </h1>
            {!loading && !error && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F8F5] text-[#1F6F5C] border border-[#26B997]/20">
                {totalItems} permission{totalItems > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Consultez les permissions et les autorisations disponibles sur la plateforme.
          </p>
        </div>

        {/* Bouton Rafraîchir */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadPermissions()}
            disabled={loading}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
            title="Rafraîchir la liste"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-[0_12px_40px_-18px_rgba(38,185,151,0.12)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Rechercher par code (ex: products:read) ou nom..."
            className="input-premium pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={moduleFilter}
            onChange={(e) => handleModuleChange(e.target.value)}
            className="input-premium cursor-pointer font-medium w-full md:w-auto"
          >
            <option value="all">
              Tous les modules {availableModules.length > 0 ? `(${availableModules.length})` : ''}
            </option>
            {availableModules.map((mod) => (
              <option key={mod} value={mod}>
                Module : {formatModuleName(mod)}
              </option>
            ))}
          </select>

          {(searchQuery || moduleFilter !== 'all') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1"
              title="Réinitialiser les filtres"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser</span>
            </button>
          )}
        </div>
      </div>

      {/* Panneau Principal : Tableau ou États */}
      <div className="panel overflow-hidden">
        {/* État d'erreur 403 : Réservé Super Admin */}
        {error?.status === 403 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Accès strictement réservé au Super Administrateur
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-4">
              Vous n&apos;avez pas les privilèges nécessaires pour consulter le catalogue central des permissions.
              Seul le compte ayant le rôle Super Administrateur peut accéder à cette ressource.
            </p>
          </div>
        ) : error?.status === 401 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Session expirée</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-4">
              Votre session d&apos;authentification a expiré. Veuillez vous reconnecter.
            </p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Erreur lors du chargement des permissions
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-4">
              {error.message}
            </p>
            <button
              type="button"
              onClick={() => loadPermissions()}
              className="px-4 py-2 rounded-xl bg-[#26B997] hover:bg-[#1F6F5C] text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Réessayer</span>
            </button>
          </div>
        ) : loading ? (
          /* État de chargement avec Skeleton */
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : permissions.length === 0 ? (
          /* État liste vide */
          <div className="p-12 text-center text-slate-500">
            <KeyRound className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Aucune permission trouvée</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery || moduleFilter !== 'all'
                ? 'Aucune permission ne correspond à vos critères de recherche ou de filtre.'
                : 'Aucune permission n’est actuellement enregistrée dans la base de données.'}
            </p>
            {(searchQuery || moduleFilter !== 'all') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Effacer les filtres</span>
              </button>
            )}
          </div>
        ) : (
          /* Tableau des permissions regroupées dynamiquement par module */
          <div className="overflow-x-auto -mx-6 -mt-6 mb-0">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 pl-6 pr-4 w-40">Module</th>
                  <th className="py-3.5 px-6 w-52">Code technique</th>
                  <th className="py-3.5 px-6 w-60">Nom de la permission</th>
                  <th className="py-3.5 px-6">Description</th>
                  <th className="py-3.5 px-6 text-right w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {groupedPermissions.map((group) => (
                  <React.Fragment key={group.module}>
                    {/* Ligne d'en-tête de groupe de module */}
                    <tr className="bg-slate-50/50 border-t border-slate-200/60">
                      <td colSpan={5} className="py-2.5 pl-6 pr-6">
                        <div className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-[#26B997]" />
                          <span className="font-bold text-slate-800 text-xs tracking-wide">
                            Module : {formatModuleName(group.module)}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400">
                            ({group.items.length} permission{group.items.length > 1 ? 's' : ''} sur cette page)
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Permissions de ce module */}
                    {group.items.map((perm) => (
                      <tr
                        key={perm.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        {/* Colonne 1 : Module */}
                        <td className="py-3.5 pl-6 pr-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-[#1F6F5C] border border-[#26B997]/20 font-semibold text-[11px]">
                            <Shield className="w-3 h-3 text-[#26B997]" />
                            <span>{formatModuleName(perm.module)}</span>
                          </span>
                        </td>

                        {/* Colonne 2 : Code technique */}
                        <td className="py-3.5 px-6 whitespace-nowrap">
                          <code className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-mono text-[11px] font-semibold border border-slate-200/70 inline-block">
                            {perm.name}
                          </code>
                        </td>

                        {/* Colonne 3 : Nom lisible */}
                        <td className="py-3.5 px-6 whitespace-nowrap font-bold text-slate-900">
                          {perm.label}
                        </td>

                        {/* Colonne 4 : Description tronquée */}
                        <td className="py-3.5 px-6 max-w-xs md:max-w-md">
                          <div
                            className="overflow-hidden text-ellipsis whitespace-nowrap text-slate-600 text-xs cursor-default"
                            title={perm.description || 'Aucune description'}
                          >
                            {perm.description || (
                              <span className="text-slate-400 italic">Aucune description</span>
                            )}
                          </div>
                        </td>

                        {/* Colonne 5 : Action (icône œil) */}
                        <td className="py-3.5 px-6 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(perm)}
                            className="p-1.5 text-slate-600 hover:text-[#26B997] hover:bg-[#E8F8F5] rounded-lg transition-colors inline-flex items-center gap-1"
                            title="Voir les détails de la permission"
                            aria-label={`Voir les détails de ${perm.name}`}
                          >
                            <Eye className="w-4 h-4 text-[#26B997]" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination côté serveur */}
        {!loading && !error && totalItems > 0 && (
          <div className="mt-6 pt-2">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
              pageSizeOptions={[10, 20, 50, 100]}
            />
          </div>
        )}
      </div>

      {/* Modal Détails d'une permission */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedPermission(null);
        }}
        title="Détails de la permission"
        description="Informations complètes et attributs techniques de la permission RBAC"
        maxWidth="lg"
      >
        {selectedPermission && (
          <div className="space-y-5">
            {/* Carte En-tête de la permission */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#26B997] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-extrabold text-slate-900 text-sm">
                    {selectedPermission.label}
                  </p>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">
                    {selectedPermission.name}
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 self-start sm:self-center px-3 py-1 rounded-xl bg-emerald-50 text-[#1F6F5C] border border-[#26B997]/20 font-bold text-xs">
                <Shield className="w-3.5 h-3.5 text-[#26B997]" />
                <span>Module : {formatModuleName(selectedPermission.module)}</span>
              </span>
            </div>

            {/* Description complète */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <FileText className="w-4 h-4 text-[#26B997]" />
                <span>Description détaillée :</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-700 text-xs sm:text-sm leading-relaxed shadow-xs">
                {selectedPermission.description ? (
                  selectedPermission.description
                ) : (
                  <span className="text-slate-400 italic">Aucune description détaillée renseignée pour cette permission.</span>
                )}
              </div>
            </div>

            {/* Métadonnées & Identifiants */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center gap-2.5">
                <Hash className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-400 font-medium">Identifiant unique (CUID)</p>
                  <p className="font-mono text-xs text-slate-800 truncate" title={selectedPermission.id}>
                    {selectedPermission.id}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-400 font-medium">Date d&apos;enregistrement</p>
                  <p className="text-xs text-slate-800 font-medium">
                    {selectedPermission.created_at
                      ? new Date(selectedPermission.created_at).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Non renseignée'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bouton Fermer */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsDetailOpen(false);
                  setSelectedPermission(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
