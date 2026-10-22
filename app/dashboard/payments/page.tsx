'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CreditCard,
  Search,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  Calendar,
  User,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { PaymentRecord, PaymentStatus } from '@/types/dashboard';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(7);

  // Detail Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingPayment, setViewingPayment] = useState<PaymentRecord | null>(null);

  useEffect(() => {
    loadPayments();
  }, []);

  const searchParams = useSearchParams();
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
      setCurrentPage(1);
    }
  }, [searchParams]);

  async function loadPayments() {
    try {
      const data = await apiClient.getPayments();
      setPayments(data);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenDetail = (payment: PaymentRecord) => {
    setViewingPayment(payment);
    setIsDetailModalOpen(true);
  };

  const formatAmount = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-BE', {
      style: 'currency',
      currency: currency || 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return (
          <Badge variant="success" dot>
            Réussi
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="warning" dot>
            En attente
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="error" dot>
            Échoué
          </Badge>
        );
      case 'refunded':
        return (
          <Badge variant="neutral" dot>
            Remboursé
          </Badge>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getPaymentMethodLabel = (method: PaymentRecord['paymentMethod']) => {
    switch (method) {
      case 'bancontact':
        return 'Bancontact / Payconiq';
      case 'stripe':
        return 'Carte bancaire (Stripe)';
      case 'bank_transfer':
        return 'Virement bancaire SEPA';
      default:
        return 'Paiement électronique';
    }
  };

  const filteredPayments = payments.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.reference.toLowerCase().includes(q) ||
      item.customerName.toLowerCase().includes(q) ||
      (item.customerEmail && item.customerEmail.toLowerCase().includes(q)) ||
      item.service.toLowerCase().includes(q) ||
      (item.transactionId && item.transactionId.toLowerCase().includes(q)) ||
      (item.orderNumber && item.orderNumber.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalItems = filteredPayments.length;
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-fade-in pt-6">
      {/* En-tête : Titre & Sous-titre (Consultation seule) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Consultation des Paiements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Historique et traçabilité des règlements, transactions bancaires et dons perçus.
          </p>
        </div>

        {/* Badge récapitulatif */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 border border-slate-200/80 px-3.5 py-1.5 rounded-2xl">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-semibold text-slate-700">
            {payments.filter((p) => p.status === 'paid').length} règlements validés
          </span>
        </div>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-[0_12px_40px_-18px_rgba(38,185,151,0.12)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par référence, client, service..."
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
            }}
            className="input-premium cursor-pointer font-medium w-full md:w-auto"
          >
            <option value="all">Tous les statuts ({payments.length})</option>
            <option value="paid">
              Réussis ({payments.filter((p) => p.status === 'paid').length})
            </option>
            <option value="pending">
              En attente ({payments.filter((p) => p.status === 'pending').length})
            </option>
            <option value="failed">
              Échoués ({payments.filter((p) => p.status === 'failed').length})
            </option>
            <option value="refunded">
              Remboursés ({payments.filter((p) => p.status === 'refunded').length})
            </option>
          </select>
        </div>
      </div>

      {/* Tableau des paiements */}
      <div className="panel overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Aucun paiement trouvé</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery || statusFilter !== 'all'
                ? 'Aucun résultat ne correspond à vos filtres actuels.'
                : 'Aucun enregistrement de paiement disponible dans le système.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 -mt-6 mb-0">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 pl-6 pr-4 font-bold text-slate-700">Référence</th>
                  <th className="py-3.5 px-4 font-bold text-slate-700">Client</th>
                  <th className="py-3.5 px-4 font-bold text-slate-700">Service</th>
                  <th className="py-3.5 px-4 font-bold text-slate-700">Montant</th>
                  <th className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-700">Statut</th>
                  <th className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-700">Date de paiement</th>
                  <th className="py-3.5 pr-6 pl-4 text-right whitespace-nowrap font-bold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedPayments.map((payment) => {
                  return (
                    <tr
                      key={payment.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Colonne 1 : Référence */}
                      <td className="py-4 pl-6 pr-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-[#1F6F5C] bg-[#E8F8F5]/80 px-2.5 py-1 rounded-md border border-[#26B997]/20">
                          {payment.reference}
                        </span>
                      </td>

                      {/* Colonne 2 : Client */}
                      <td className="py-4 px-4 font-semibold text-slate-900">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">
                            {payment.customerName}
                          </span>
                          {payment.customerEmail && (
                            <span className="text-[11px] text-slate-400 font-normal">
                              {payment.customerEmail}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Colonne 3 : Service */}
                      <td className="py-4 px-4 text-slate-600 font-medium">
                        <div className="max-w-xs md:max-w-sm truncate" title={payment.service}>
                          {payment.service}
                        </div>
                      </td>

                      {/* Colonne 4 : Montant */}
                      <td className="py-4 px-4 font-extrabold text-slate-900 whitespace-nowrap">
                        <span className="text-sm font-mono tracking-tight text-[#1F6F5C]">
                          {formatAmount(payment.amount, payment.currency)}
                        </span>
                      </td>

                      {/* Colonne 5 : Statut */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {getStatusBadge(payment.status)}
                      </td>

                      {/* Colonne 6 : Date de paiement */}
                      <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-600 font-normal">
                        {payment.paymentDate}
                      </td>

                      {/* Colonne 7 : Actions (Voir les détails) */}
                      <td className="py-4 pr-6 pl-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(payment)}
                          className="p-1.5 text-slate-600 hover:text-[#26B997] hover:bg-[#E8F8F5] rounded-lg transition-colors"
                          title="Consulter les détails du paiement"
                          aria-label={`Détails du paiement ${payment.reference}`}
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

      {/* Modal Détails du Paiement */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setViewingPayment(null);
        }}
        title="Détails du paiement"
        description="Informations financières et traçabilité du règlement"
        maxWidth="lg"
      >
        {viewingPayment && (
          <div className="space-y-5">
            {/* Montant & Statut Header */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Montant réglé
                </span>
                <span className="text-2xl font-black text-[#1F6F5C] font-mono tracking-tight">
                  {formatAmount(viewingPayment.amount, viewingPayment.currency)}
                </span>
              </div>
              <div className="flex flex-col sm:items-end">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Statut du paiement
                </span>
                <div>{getStatusBadge(viewingPayment.status)}</div>
              </div>
            </div>

            {/* Grille informations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Référence */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Référence du paiement
                </span>
                <span className="font-mono text-xs font-bold text-slate-800">
                  {viewingPayment.reference}
                </span>
              </div>

              {/* Date de paiement */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Date du paiement
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {viewingPayment.paymentDate}
                </span>
              </div>

              {/* Client */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Client / Payeur
                </span>
                <span className="text-xs font-bold text-slate-800 block">
                  {viewingPayment.customerName}
                </span>
                {viewingPayment.customerEmail && (
                  <span className="text-[11px] text-slate-500 font-normal">
                    {viewingPayment.customerEmail}
                  </span>
                )}
              </div>

              {/* Méthode de paiement */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Méthode de paiement
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {getPaymentMethodLabel(viewingPayment.paymentMethod)}
                </span>
              </div>
            </div>

            {/* Service & Commande */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Service / Prestation concernée
              </span>
              <p className="text-xs sm:text-sm font-semibold text-slate-800">
                {viewingPayment.service}
              </p>
              {viewingPayment.orderNumber && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>Numéro de commande liée :</span>
                  <span className="font-mono font-bold text-[#1F6F5C]">
                    {viewingPayment.orderNumber}
                  </span>
                </div>
              )}
            </div>

            {/* Identifiant de transaction technique */}
            {viewingPayment.transactionId && (
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">ID de transaction bancaire :</span>
                <span className="font-mono text-slate-700 font-semibold">
                  {viewingPayment.transactionId}
                </span>
              </div>
            )}

            {/* Bouton Fermer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
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
    </div>
  );
}
