'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Eye,
  UserCheck,
  Calendar,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Customer } from '@/types/dashboard';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { BatchActionBar } from '@/components/ui/BatchActionBar';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Pagination & Selection
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    loadCustomers();
  }, []);

  const searchParams = useSearchParams();
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
      setCurrentPage(1);
    }
  }, [searchParams]);

  async function loadCustomers() {
    try {
      const data = await apiClient.getCustomers();
      setCustomers(data);
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = customers.filter((cust) => {
    const matchesSearch =
      cust.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || cust.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalItems = filteredCustomers.length;
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedCustomers.length && paginatedCustomers.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedCustomers.map((c) => c.id));
    }
  };

  const handleBulkExport = () => {
    const selected = customers.filter((c) => selectedIds.includes(c.id));
    const header = 'ID,Nom,Email,Telephone,Ville,Pays,Commandes,TotalDepense,Statut\n';
    const rows = selected
      .map(
        (c) =>
          `"${c.id}","${c.name}","${c.email}","${c.phone}","${c.city}","${c.country}",${c.totalOrders},${c.totalSpent},"${c.status}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `clients_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalSpentAll = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const activeCount = customers.filter((c) => c.status === 'active').length;
  const avgBasket = customers.length > 0 ? Math.round(totalSpentAll / customers.length) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Répertoire des Clients & Partenaires
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Acheteurs de vélos en bambou, Hase Bikes adaptés et usagers de l’atelier.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs bg-white border border-slate-200/80 px-4 py-2 rounded-2xl font-medium text-slate-700 shadow-xs">
            Volume cumulé : <span className="font-extrabold text-[#0B3C68]">{totalSpentAll.toLocaleString('fr-BE')} €</span>
          </div>
        </div>
      </div>

      {/* Quick KPI stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="panel p-5 card-hover">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Adhérents</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{customers.length}</p>
        </div>
        <div className="panel p-5 card-hover">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Comptes Actifs</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</p>
        </div>
        <div className="panel p-5 card-hover">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Panier Moyen</p>
          <p className="text-2xl font-black text-[#0B3C68] mt-1">{avgBasket.toLocaleString('fr-BE')} €</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-[0_12px_40px_-18px_rgba(11,60,104,0.12)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone ou ville..."
            className="input-premium pl-10"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="input-premium cursor-pointer font-medium w-full md:w-auto"
          >
            <option value="all">Tous les statuts de compte</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>
      </div>

      {/* Batch Selection Action Bar */}
      <BatchActionBar
        selectedCount={selectedIds.length}
        totalCount={filteredCustomers.length}
        onClearSelection={() => setSelectedIds([])}
      >
        <button
          type="button"
          onClick={handleBulkExport}
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
        >
          <span>Exporter CSV</span>
        </button>
      </BatchActionBar>

      {/* Customers Table */}
      <div className="panel overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Aucun client trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 -mt-6 mb-0">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-4 pl-6 pr-2 w-10">
                    <input
                      type="checkbox"
                      checked={paginatedCustomers.length > 0 && selectedIds.length === paginatedCustomers.length}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate = selectedIds.length > 0 && selectedIds.length < paginatedCustomers.length;
                        }
                      }}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-[#0B3C68] focus:ring-[#0B3C68] cursor-pointer"
                      aria-label="Sélectionner tous les clients affichés"
                    />
                  </th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-6">Contact</th>
                  <th className="py-3.5 px-6">Localisation</th>
                  <th className="py-3.5 px-6 text-center">Commandes</th>
                  <th className="py-3.5 px-6">Total Dépensé</th>
                  <th className="py-3.5 px-6">Statut</th>
                  <th className="py-3.5 px-6">Dernière Commande</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedCustomers.map((cust) => {
                  const isSelected = selectedIds.includes(cust.id);
                  return (
                    <tr
                      key={cust.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="py-4 pl-6 pr-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(cust.id)}
                          className="w-4 h-4 rounded border-slate-300 text-[#0B3C68] focus:ring-[#0B3C68] cursor-pointer"
                          aria-label={`Sélectionner ${cust.name}`}
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                            <Image
                              src="/default-avatar.svg"
                              alt={cust.name}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{cust.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">ID: {cust.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{cust.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{cust.phone}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{cust.city}, {cust.country}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-center font-bold text-slate-900">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {cust.totalOrders}
                        </span>
                      </td>

                      <td className="py-4 px-6 font-extrabold text-[#0B3C68] text-sm whitespace-nowrap">
                        {cust.totalSpent.toLocaleString('fr-BE')} €
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        {cust.status === 'active' ? (
                          <Badge variant="success">Actif</Badge>
                        ) : (
                          <Badge variant="neutral">Inactif</Badge>
                        )}
                      </td>

                      <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                        {new Date(cust.lastOrderDate).toLocaleDateString('fr-BE', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedCustomer(cust)}
                          className="p-1.5 text-slate-600 hover:text-[#0B3C68] hover:bg-blue-50 rounded-lg transition-colors"
                          title="Consulter la fiche client"
                          aria-label={`Fiche de ${cust.name}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
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

      {/* Customer Detail Modal */}
      <Modal
        isOpen={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        title={selectedCustomer?.name || 'Fiche Client'}
        description="Profil d’adhérent, historique d’achats et coordonnées"
        maxWidth="md"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Header Identity Card */}
            <div className="p-5 bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl border border-slate-100 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0B3C68] to-[#2563EB] text-white font-bold text-lg flex items-center justify-center shadow-md shadow-blue-900/20 shrink-0">
                {selectedCustomer.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-slate-900 truncate">{selectedCustomer.name}</h4>
                  <Badge variant={selectedCustomer.status === 'active' ? 'success' : 'neutral'}>
                    {selectedCustomer.status === 'active' ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">Identifiant : {selectedCustomer.id}</p>
              </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Commandes passées</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{selectedCustomer.totalOrders}</p>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 text-center">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#0B3C68]">Total des achats</p>
                <p className="text-2xl font-black text-[#0B3C68] mt-1">{selectedCustomer.totalSpent.toLocaleString('fr-BE')} €</p>
              </div>
            </div>

            {/* Contact details */}
            <div className="space-y-3">
              <p className="label-premium">Coordonnées & géolocalisation</p>
              <div className="p-4 rounded-2xl border border-slate-100 divide-y divide-slate-100 bg-white text-xs">
                <div className="py-2.5 flex items-center justify-between gap-2">
                  <span className="text-slate-500 font-medium">Adresse email</span>
                  <span className="font-bold text-slate-900">{selectedCustomer.email}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between gap-2">
                  <span className="text-slate-500 font-medium">Téléphone direct</span>
                  <span className="font-bold text-slate-900 font-mono">{selectedCustomer.phone}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between gap-2">
                  <span className="text-slate-500 font-medium">Ville & Pays</span>
                  <span className="font-bold text-slate-900">{selectedCustomer.city}, {selectedCustomer.country}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between gap-2">
                  <span className="text-slate-500 font-medium">Dernier achat</span>
                  <span className="font-semibold text-slate-700">{selectedCustomer.lastOrderDate}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="btn-primary-gradient"
              >
                Fermer la fiche
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
