'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  HeartHandshake,
  FileCheck2,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  Building,
  User,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Donation } from '@/types/dashboard';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/dashboard/StatCard';
import { Skeleton } from '@/components/ui/Skeleton';

export default function DonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [taxReceiptFilter, setTaxReceiptFilter] = useState<string>('all');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    loadDonations();
  }, []);

  const searchParams = useSearchParams();
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) setSearchQuery(q);
  }, [searchParams]);

  async function loadDonations() {
    try {
      const data = await apiClient.getDonations();
      setDonations(data);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleReceipt = async (id: string, donorName: string) => {
    const updated = await apiClient.toggleTaxReceipt(id);
    await loadDonations();
    if (updated) {
      setNotice(
        updated.taxReceiptSent
          ? `Attestation fiscale marquée comme ÉMISE pour ${donorName}.`
          : `Attestation fiscale remise en attente pour ${donorName}.`
      );
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
  const totalTaxReceiptsIssued = donations.filter((d) => d.taxReceiptSent).length;
  const pendingTaxReceipts = donations.filter(
    (d) => d.taxReceiptRequested && !d.taxReceiptSent
  ).length;

  const filteredDonations = donations.filter((d) => {
    const matchesSearch =
      d.donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.donorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.project.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProject =
      projectFilter === 'all' || d.project.toLowerCase().includes(projectFilter.toLowerCase());

    const matchesTax =
      taxReceiptFilter === 'all'
        ? true
        : taxReceiptFilter === 'sent'
        ? d.taxReceiptSent
        : taxReceiptFilter === 'pending'
        ? d.taxReceiptRequested && !d.taxReceiptSent
        : !d.taxReceiptRequested;

    return matchesSearch && matchesProject && matchesTax;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Dons, Mécénat & Attestations Fiscales
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Gestion des dons déductibles (dès 40 € en Belgique) pour les actions d’inclusion No Borders ASBL.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3.5 py-1.5 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200/80 flex items-center gap-1.5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Agrément Fiscal Belge</span>
          </span>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Montant Total des Dons"
          value={`${totalAmount.toLocaleString('fr-BE')} €`}
          icon={HeartHandshake}
          variant="yellow"
          subtext="Année en cours"
        />
        <StatCard
          title="Total Versements"
          value={donations.length}
          icon={User}
          variant="blue"
          subtext="Particuliers & mécènes"
        />
        <StatCard
          title="Attestations Émises"
          value={totalTaxReceiptsIssued}
          icon={FileCheck2}
          variant="emerald"
          subtext="Conformes SPF Finances"
        />
        <StatCard
          title="Attestations en Attente"
          value={pendingTaxReceipts}
          icon={Clock}
          variant="purple"
          subtext="Dons ≥ 40 € éligibles"
        />
      </div>

      {/* Project Funding Progress Section */}
      <div className="panel space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Avancement des Projets Solidaires
          </h2>
          <span className="text-xs font-semibold text-slate-500">Objectifs 2026</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
            <div className="flex justify-between text-xs font-bold mb-2">
              <span className="text-slate-800">Mobilité Inclusive</span>
              <span className="text-[#0B3C68]">78%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#0B3C68] to-[#1D4ED8] rounded-full w-[78%]" />
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">Financement de tandems adaptés</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
            <div className="flex justify-between text-xs font-bold mb-2">
              <span className="text-slate-800">Atelier Bambou Solidaire</span>
              <span className="text-amber-600">65%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full w-[65%]" />
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">Outillage et formation jeunes</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
            <div className="flex justify-between text-xs font-bold mb-2">
              <span className="text-slate-800">Fonds d’Urgence Sociale</span>
              <span className="text-emerald-600">92%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 rounded-full w-[92%]" />
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">Aides directes aux bénéficiaires</p>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-[0_12px_40px_-18px_rgba(11,60,104,0.12)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un donateur, référence ou projet..."
            className="input-premium pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="input-premium cursor-pointer font-medium w-full md:w-auto"
          >
            <option value="all">Tous les projets financés</option>
            <option value="mobilité">Mobilité Inclusive (Tandems)</option>
            <option value="bambou">Atelier Bambou Solidaire</option>
            <option value="général">Fonds Général</option>
          </select>

          <select
            value={taxReceiptFilter}
            onChange={(e) => setTaxReceiptFilter(e.target.value)}
            className="input-premium cursor-pointer font-medium w-full md:w-auto"
          >
            <option value="all">Toutes les attestations</option>
            <option value="sent">Reçu fiscal émis</option>
            <option value="pending">En attente d’émission</option>
            <option value="none">Non demandée</option>
          </select>
        </div>
      </div>

      {/* Donations Table */}
      <div className="panel overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : filteredDonations.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <HeartHandshake className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Aucun don répertorié avec ces critères</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 -my-6">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-6">Réf. Don</th>
                  <th className="py-3.5 px-6">Donateur / Entreprise</th>
                  <th className="py-3.5 px-6">Montant Don</th>
                  <th className="py-3.5 px-6">Projet Assigné</th>
                  <th className="py-3.5 px-6">Règlement</th>
                  <th className="py-3.5 px-6">Attestation Fiscale</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6 text-right">Action Fiscale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredDonations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {d.reference}
                    </td>

                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900">{d.donorName}</p>
                      <p className="text-[11px] text-slate-400">{d.donorEmail}</p>
                    </td>

                    <td className="py-4 px-6 font-black text-amber-600 text-sm whitespace-nowrap">
                      {d.amount.toLocaleString('fr-BE')} €
                    </td>

                    <td className="py-4 px-6">
                      <span className="font-semibold text-slate-800 line-clamp-1">
                        {d.project}
                      </span>
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap uppercase font-mono text-[11px] text-slate-600">
                      {d.paymentMethod === 'bank_transfer'
                        ? 'Virement Bancaire'
                        : d.paymentMethod === 'bancontact'
                        ? 'Bancontact / Payconiq'
                        : 'Carte Bancaire (Stripe)'}
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap">
                      {d.taxReceiptSent ? (
                        <Badge variant="success">Émise & Envoyée</Badge>
                      ) : d.taxReceiptRequested ? (
                        <Badge variant="warning">À émettre (≥ 40€)</Badge>
                      ) : (
                        <Badge variant="neutral">Non demandée</Badge>
                      )}
                    </td>

                    <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                      {new Date(d.createdAt).toLocaleDateString('fr-BE', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleToggleReceipt(d.id, d.donorName)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                          d.taxReceiptSent
                            ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        {d.taxReceiptSent ? 'Marquer Non-Émise' : 'Émettre l’attestation'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
