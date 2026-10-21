'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: string;
  submessage?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Supprimer l’élément',
  message = 'Supprimer définitivement cet élément ?',
  submessage = 'Cette action est irréversible.',
  confirmText = 'Supprimer',
  cancelText = 'Annuler',
  loading = false,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, loading]);

  if (!isOpen || !mounted) return null;

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity"
      onClick={() => {
        if (!loading) onClose();
      }}
    >
      <div
        className="relative w-full max-w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 sm:p-7 animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
      >
        {/* En-tête */}
        <div className="flex items-center justify-between mb-4">
          <h3
            id="delete-dialog-title"
            className="text-base sm:text-lg font-bold text-slate-900 tracking-tight"
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1 -mr-1 text-slate-400 hover:text-slate-600 transition-colors rounded-lg focus:outline-hidden"
            aria-label="Fermer la boîte de confirmation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps */}
        <div className="space-y-1 mb-6 text-sm leading-relaxed text-slate-600">
          <p>{message}</p>
          {submessage && <p className="text-slate-500">{submessage}</p>}
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-sm font-bold transition-all focus:outline-hidden disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-[#E1062B] hover:bg-[#C90022] active:bg-[#B3001D] text-white text-sm font-bold shadow-sm transition-all focus:outline-hidden disabled:opacity-50 flex items-center justify-center min-w-[100px]"
          >
            {loading ? 'Suppression...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
