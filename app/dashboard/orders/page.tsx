'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  RotateCcw,
  Truck,
  Eye,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Order, PaymentStatus, ShippingStatus } from '@/types/dashboard';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { BatchActionBar } from '@/components/ui/BatchActionBar';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [shippingFilter, setShippingFilter] = useState<string>('all');

  // Pagination & Selection
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const searchParams = useSearchParams();
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
      setCurrentPage(1);
    }
  }, [searchParams]);

  async function loadOrders() {
    try {
      const data = await apiClient.getOrders();
      setOrders(data);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleOpenRefund = (order: Order) => {
    setSelectedOrder(order);
    setRefundReason('');
    setIsRefundModalOpen(true);
  };

  const handleUpdateShipping = async (newStatus: ShippingStatus) => {
    if (!selectedOrder) return;
    await apiClient.updateOrderStatus(selectedOrder.id, newStatus);
    await loadOrders();
    setIsDetailModalOpen(false);
    setActionNotice(`Statut d'expédition de la commande ${selectedOrder.orderNumber} mis à jour.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleConfirmRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !refundReason.trim()) return;

    await apiClient.refundOrder(selectedOrder.id, refundReason);
    await loadOrders();
    setIsRefundModalOpen(false);
    setActionNotice(`Remboursement enregistré pour la commande ${selectedOrder.orderNumber}.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPayment =
      paymentFilter === 'all' || order.paymentStatus === paymentFilter;

    const matchesShipping =
      shippingFilter === 'all' || order.shippingStatus === shippingFilter;

    return matchesSearch && matchesPayment && matchesShipping;
  });

  const totalItems = filteredOrders.length;
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedOrders.length && paginatedOrders.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedOrders.map((o) => o.id));
    }
  };

  const handleBulkExport = () => {
    const selected = orders.filter((o) => selectedIds.includes(o.id));
    const header = 'Numero,Client,Email,Montant,Paiement,Livraison,Date\n';
    const rows = selected
      .map(
        (o) =>
          `"${o.orderNumber}","${o.customerName}","${o.customerEmail}",${o.totalAmount},"${o.paymentStatus}","${o.shippingStatus}","${o.createdAt}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `commandes_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setActionNotice(`Export de ${selected.length} commande(s) généré avec succès.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleBulkShip = async () => {
    for (const id of selectedIds) {
      await apiClient.updateOrderStatus(id, 'in_transit');
    }
    await loadOrders();
    setActionNotice(`${selectedIds.length} commande(s) marquée(s) comme expédiée(s).`);
    setSelectedIds([]);
    setTimeout(() => setActionNotice(null), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Gestion des Commandes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Suivi des ventes de vélos, expéditions bpost, retraits atelier et remboursements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3.5 py-1.5 rounded-2xl bg-[#E8F8F5] text-[#1F6F5C] border border-[#26B997]/20 shadow-xs">
            Total : {orders.length} commandes
          </span>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-[#E8F8F5] border border-[#26B997]/20 text-[#1F6F5C] rounded-2xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Quick payment pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'Toutes les commandes', count: orders.length },
          { id: 'paid', label: 'Payées', count: orders.filter((o) => o.paymentStatus === 'paid').length },
          { id: 'pending', label: 'En attente', count: orders.filter((o) => o.paymentStatus === 'pending').length },
          { id: 'refunded', label: 'Remboursées', count: orders.filter((o) => o.paymentStatus === 'refunded').length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setPaymentFilter(tab.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              paymentFilter === tab.id
                ? 'bg-[#26B997] text-white shadow-sm shadow-[#26B997]/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                paymentFilter === tab.id
                  ? 'bg-amber-400 text-slate-900'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-[0_12px_40px_-18px_rgba(38,185,151,0.12)] flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par n° commande, nom ou email..."
            className="input-premium pl-10"
          />
        </div>

        {/* Shipping filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={shippingFilter}
            onChange={(e) => setShippingFilter(e.target.value)}
            className="input-premium cursor-pointer font-medium w-full md:w-auto"
          >
            <option value="all">Toutes les livraisons</option>
            <option value="in_transit">En cours bpost</option>
            <option value="ready_for_pickup">Retrait atelier prêt</option>
            <option value="delivered">Livré</option>
            <option value="pending">À préparer</option>
          </select>
        </div>
      </div>

      {/* Batch Selection Action Bar */}
      <BatchActionBar
        selectedCount={selectedIds.length}
        totalCount={filteredOrders.length}
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
          onClick={handleBulkShip}
          className="px-3 py-1.5 rounded-xl bg-[#26B997] hover:bg-[#1FA887] text-white font-bold text-xs transition-colors flex items-center gap-1.5"
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Marquer expédiées ({selectedIds.length})</span>
        </button>
      </BatchActionBar>

      {/* Orders Table */}
      <div className="panel overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Aucune commande trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 -mt-6 mb-0">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-4 pl-6 pr-2 w-10">
                    <input
                      type="checkbox"
                      checked={paginatedOrders.length > 0 && selectedIds.length === paginatedOrders.length}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate = selectedIds.length > 0 && selectedIds.length < paginatedOrders.length;
                        }
                      }}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-[#26B997] focus:ring-[#26B997] cursor-pointer"
                      aria-label="Sélectionner toutes les commandes affichées"
                    />
                  </th>
                  <th className="py-3.5 px-4">N° Commande</th>
                  <th className="py-3.5 px-6">Client</th>
                  <th className="py-3.5 px-6">Articles</th>
                  <th className="py-3.5 px-6">Total</th>
                  <th className="py-3.5 px-6">Paiement</th>
                  <th className="py-3.5 px-6">Livraison</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedOrders.map((order) => {
                  const isSelected = selectedIds.includes(order.id);
                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-[#E8F8F5]/50' : ''
                      }`}
                    >
                      <td className="py-4 pl-6 pr-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(order.id)}
                          className="w-4 h-4 rounded border-slate-300 text-[#26B997] focus:ring-[#26B997] cursor-pointer"
                          aria-label={`Sélectionner la commande ${order.orderNumber}`}
                        />
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {order.orderNumber}
                      </td>

                      <td className="py-4 px-6">
                        <p className="font-semibold text-slate-900">{order.customerName}</p>
                        <p className="text-[11px] text-slate-400">{order.customerEmail}</p>
                      </td>

                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="text-slate-800 line-clamp-1">
                              <span className="font-semibold text-[#1F6F5C]">{it.quantity}x</span>{' '}
                              {it.productName}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-4 px-6 font-extrabold text-slate-900 text-sm whitespace-nowrap">
                        {order.totalAmount.toLocaleString('fr-BE')} €
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        {order.paymentStatus === 'paid' && (
                          <Badge variant="success">Payé</Badge>
                        )}
                        {order.paymentStatus === 'pending' && (
                          <Badge variant="warning">En attente</Badge>
                        )}
                        {order.paymentStatus === 'refunded' && (
                          <Badge variant="error">Remboursé</Badge>
                        )}
                        {order.refundReason && (
                          <p className="text-[10px] text-rose-700 italic mt-1 max-w-[150px] truncate">
                            {order.refundReason}
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        {order.shippingStatus === 'delivered' && (
                          <Badge variant="success">Livré</Badge>
                        )}
                        {order.shippingStatus === 'in_transit' && (
                          <Badge variant="info">bpost en cours</Badge>
                        )}
                        {order.shippingStatus === 'ready_for_pickup' && (
                          <Badge variant="secondary">Prêt à l’atelier</Badge>
                        )}
                        {order.shippingStatus === 'pending' && (
                          <Badge variant="warning">À expédier</Badge>
                        )}
                      </td>

                      <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString('fr-BE', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(order)}
                            className="p-1.5 text-slate-600 hover:text-[#26B997] hover:bg-[#E8F8F5] rounded-lg transition-colors"
                            title="Voir le détail et statut"
                            aria-label={`Détails de la commande ${order.orderNumber}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {order.paymentStatus === 'paid' && (
                            <button
                              onClick={() => handleOpenRefund(order)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Effectuer un remboursement"
                              aria-label={`Rembourser la commande ${order.orderNumber}`}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Order Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Commande ${selectedOrder?.orderNumber || ''}`}
        description="Fiche détaillée de la commande et gestion de l’expédition"
        maxWidth="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Customer info card */}
            <div className="p-5 bg-gradient-to-br from-slate-50 to-[#E8F8F5]/30 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">Destinataire</p>
                <p className="text-base font-bold text-slate-900">{selectedOrder.customerName}</p>
                <p className="text-xs text-slate-500 font-medium">{selectedOrder.customerEmail}</p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">Méthode de livraison</p>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1F6F5C] bg-white px-3 py-1 rounded-full border border-[#26B997]/25 shadow-xs">
                  <Truck className="w-3.5 h-3.5" />
                  {selectedOrder.shippingMethod === 'bpost_delivery'
                    ? 'Colis suivi bpost'
                    : 'Retrait en atelier (Bruxelles)'}
                </span>
              </div>
            </div>

            {/* Items */}
            <div>
              <p className="label-premium">Articles commandés</p>
              <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white">
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{it.productName}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {it.quantity} unité{it.quantity > 1 ? 's' : ''} &times; {it.unitPrice.toLocaleString('fr-BE')} €
                      </p>
                    </div>
                    <span className="text-base font-extrabold text-[#1F6F5C]">
                      {(it.quantity * it.unitPrice).toLocaleString('fr-BE')} €
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center px-4 pt-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total réglé</span>
                <span className="text-lg font-black text-slate-900">{selectedOrder.totalAmount.toLocaleString('fr-BE')} €</span>
              </div>
            </div>

            {/* Shipping Status Action */}
            <div>
              <p className="label-premium">Modifier le statut d’expédition</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'pending', label: 'À préparer' },
                  { id: 'in_transit', label: 'En cours bpost' },
                  { id: 'ready_for_pickup', label: 'Prêt atelier' },
                  { id: 'delivered', label: 'Livré / Remis' },
                ].map((st) => {
                  const isActive = selectedOrder.shippingStatus === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleUpdateShipping(st.id as ShippingStatus)}
                      className={`p-2.5 rounded-2xl border text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#26B997] border-[#26B997] text-white shadow-md shadow-emerald-900/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="btn-secondary-soft"
              >
                Fermer la fiche
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Refund Modal */}
      <Modal
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        title="Traitement de remboursement"
        description={`Commande ${selectedOrder?.orderNumber} (${selectedOrder?.totalAmount.toLocaleString('fr-BE')} €)`}
        maxWidth="md"
      >
        {selectedOrder && (
          <form onSubmit={handleConfirmRefund} className="space-y-5">
            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-amber-900 flex items-start gap-3">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">
                Le remboursement sera consigné dans l’historique de la commande. L’avoir ou le virement vers le client s’opère via votre passerelle de règlement.
              </span>
            </div>

            <div>
              <label className="label-premium">
                Motif du remboursement <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Ex. Rétractation légale 14j, échange de taille de cadre validé en atelier..."
                className="input-premium resize-none leading-relaxed"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRefundModalOpen(false)}
                className="btn-secondary-soft"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 rounded-2xl shadow-md shadow-rose-600/20 transition-all active:scale-[0.98]"
              >
                Confirmer le remboursement
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
