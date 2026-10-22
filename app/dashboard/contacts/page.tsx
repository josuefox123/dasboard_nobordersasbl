'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Mail,
  Search,
  Eye,
  Trash2,
  Clock,
  User,
  Inbox,
  CheckCircle2,
  Phone,
  Send,
  ExternalLink,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ContactMessage } from '@/types/dashboard';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { BatchActionBar } from '@/components/ui/BatchActionBar';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';

export default function ContactsPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination & Multi-Selection
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal Detail State
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id?: string; title: string; isBulk?: boolean } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const searchParams = useSearchParams();
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
      setCurrentPage(1);
    }
  }, [searchParams]);

  async function loadMessages() {
    try {
      const data = await apiClient.getContactMessages();
      setMessages(data);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenDetail = async (msg: ContactMessage) => {
    setSelectedMessage(msg);
    setIsDetailOpen(true);

    if (msg.status === 'unread') {
      await apiClient.markContactMessageAsRead(msg.id);
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status: 'read' } : m))
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

  const filteredMessages = messages.filter((m) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.subject.toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'unread' && m.status === 'unread') ||
      (statusFilter === 'read' && (m.status === 'read' || m.status === 'replied'));

    return matchesSearch && matchesStatus;
  });

  const totalItems = filteredMessages.length;
  const paginatedMessages = filteredMessages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedMessages.length && paginatedMessages.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedMessages.map((m) => m.id));
    }
  };

  const handleBulkDelete = () => {
    setDeleteTarget({ isBulk: true, title: `${selectedIds.length} message(s)` });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      if (deleteTarget.isBulk) {
        for (const id of selectedIds) {
          await apiClient.deleteContactMessage(id);
        }
        await loadMessages();
        setNotice(`${selectedIds.length} message(s) supprimé(s).`);
        setSelectedIds([]);
        setTimeout(() => setNotice(null), 3000);
      } else if (deleteTarget.id) {
        await apiClient.deleteContactMessage(deleteTarget.id);
        await loadMessages();
        setSelectedIds((prev) => prev.filter((i) => i !== deleteTarget.id));
        if (selectedMessage?.id === deleteTarget.id) {
          setIsDetailOpen(false);
          setSelectedMessage(null);
        }
        setNotice(`Message de "${deleteTarget.title}" supprimé.`);
        setTimeout(() => setNotice(null), 3000);
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkExportCsv = () => {
    const selected = messages.filter((m) => selectedIds.includes(m.id));
    const header = 'ID,Nom,Email,Telephone,Motif,DateReception,Statut,Message\n';
    const rows = selected
      .map(
        (m) =>
          `"${m.id}","${m.name}","${m.email}","${m.phone || ''}","${m.subject}","${m.createdAt}","${m.status}","${m.message.replace(/"/g, '""')}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `messages_contact_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setNotice(`Export de ${selected.length} message(s) généré avec succès.`);
    setTimeout(() => setNotice(null), 3000);
  };

  const unreadCount = messages.filter((m) => m.status === 'unread').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Messages de Contact
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Demandes d’informations, prises de contact et réservations reçues depuis les formulaires du site public.
          </p>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-[0_12px_40px_-18px_rgba(38,185,151,0.12)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
              setSelectedIds([]);
            }}
            placeholder="Rechercher par nom, email, motif ou mot-clé..."
            className="input-premium pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
              setSelectedIds([]);
            }}
            className="input-premium cursor-pointer font-medium w-full md:w-auto"
          >
            <option value="all">Tous les messages ({messages.length})</option>
            <option value="unread">Non lus ({unreadCount})</option>
            <option value="read">Lus & Traités</option>
          </select>
        </div>
      </div>

      {/* Batch Selection Action Bar */}
      <BatchActionBar
        selectedCount={selectedIds.length}
        totalCount={filteredMessages.length}
        onClearSelection={() => setSelectedIds([])}
      >
        <button
          type="button"
          onClick={handleBulkExportCsv}
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

      {/* Contact Messages Table */}
      <div className="panel overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Aucun message de contact trouvé</p>
            <p className="text-xs text-slate-400 mt-1">
              Les messages soumis par les visiteurs apparaîtront automatiquement ici.
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
                        paginatedMessages.length > 0 &&
                        selectedIds.length === paginatedMessages.length
                      }
                      ref={(el) => {
                        if (el) {
                          el.indeterminate =
                            selectedIds.length > 0 &&
                            selectedIds.length < paginatedMessages.length;
                        }
                      }}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-[#26B997] focus:ring-[#26B997] cursor-pointer"
                      aria-label="Sélectionner tous les messages affichés"
                    />
                  </th>
                  <th className="py-3.5 px-4">Nom</th>
                  <th className="py-3.5 px-6">Email</th>
                  <th className="py-3.5 px-6">Motif</th>
                  <th className="py-3.5 px-6">Message</th>
                  <th className="py-3.5 px-6">Date de réception</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedMessages.map((msg) => {
                  const isSelected = selectedIds.includes(msg.id);
                  const isUnread = msg.status === 'unread';

                  return (
                    <tr
                      key={msg.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected
                          ? 'bg-[#E8F8F5]/50'
                          : isUnread
                          ? 'bg-amber-50/20 font-medium'
                          : ''
                      }`}
                    >
                      <td className="py-4 pl-6 pr-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(msg.id)}
                          className="w-4 h-4 rounded border-slate-300 text-[#26B997] focus:ring-[#26B997] cursor-pointer"
                          aria-label={`Sélectionner message de ${msg.name}`}
                        />
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isUnread
                                ? 'bg-[#26B997] text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {msg.name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className={`font-bold text-slate-900 ${isUnread ? 'text-black' : ''}`}>
                              {msg.name}
                            </p>
                            {msg.phone && (
                              <p className="text-[11px] text-slate-400 font-mono">
                                {msg.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <a
                          href={`mailto:${msg.email}`}
                          className="text-[#1F6F5C] hover:text-[#26B997] hover:underline font-medium"
                          title={`Envoyer un email à ${msg.email}`}
                        >
                          {msg.email}
                        </a>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold text-[11px]">
                          {msg.subject}
                        </span>
                      </td>

                      <td className="py-4 px-6 max-w-xs md:max-w-sm">
                        <div
                          className="overflow-hidden text-ellipsis whitespace-nowrap text-slate-600 text-xs cursor-default"
                          title={msg.message}
                        >
                          {msg.message}
                        </div>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {msg.createdAt}
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(msg)}
                            className="p-1.5 text-slate-600 hover:text-[#26B997] hover:bg-[#E8F8F5] rounded-lg transition-colors flex items-center gap-1"
                            title="Voir les détails du message"
                            aria-label={`Voir les détails du message de ${msg.name}`}
                          >
                            <Eye className="w-4 h-4 text-[#26B997]" />
                          </button>
                          <button
                            onClick={() => handleDelete(msg.id, msg.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Supprimer ce message"
                            aria-label="Supprimer ce message"
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

      {/* Modal Detail du Message */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedMessage(null);
        }}
        title="Détail du message reçu"
        description="Informations de contact et message complet expédié depuis le site web"
        maxWidth="lg"
      >
        {selectedMessage && (
          <div className="space-y-5">
            {/* Infos Expéditeur */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#26B997] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                  {selectedMessage.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
                <div>
                  <p className="font-extrabold text-slate-900 text-sm">
                    {selectedMessage.name}
                  </p>
                  <p className="text-xs text-slate-500">{selectedMessage.email}</p>
                  {selectedMessage.phone && (
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span>{selectedMessage.phone}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{selectedMessage.createdAt}</span>
                </span>
              </div>
            </div>

            {/* Motif */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Motif de la demande
              </label>
              <div className="p-3 bg-[#E8F8F5]/50 border border-[#26B997]/25 rounded-xl">
                <p className="font-bold text-sm text-[#1F6F5C]">
                  {selectedMessage.subject}
                </p>
              </div>
            </div>

            {/* Contenu complet du Message */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Message complet
              </label>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-normal shadow-xs">
                {selectedMessage.message}
              </div>
            </div>

            {/* Actions de la modal */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleDelete(selectedMessage.id, selectedMessage.name)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer ce message</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
                  className="btn-secondary-soft text-xs"
                >
                  Fermer
                </button>
                <a
                  href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent(
                    `Re: ${selectedMessage.subject}`
                  )}`}
                  className="btn-primary-gradient inline-flex items-center gap-1.5 text-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Répondre par email</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Confirmation de Suppression */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title={deleteTarget?.isBulk ? 'Supprimer les messages' : 'Supprimer le message'}
        message={
          deleteTarget?.isBulk
            ? `Supprimer définitivement ces ${deleteTarget.title} ?`
            : `Supprimer définitivement ce message ?`
        }
        submessage="Cette action est irréversible."
      />
    </div>
  );
}
