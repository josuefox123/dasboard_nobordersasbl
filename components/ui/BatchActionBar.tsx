'use client';

import React from 'react';
import { CheckSquare, X } from 'lucide-react';

interface BatchActionBarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  children: React.ReactNode;
}

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
  selectedCount,
  totalCount,
  onClearSelection,
  children,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="p-3 bg-white border border-slate-200/80 text-slate-900 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm animate-fade-in my-3">
      <div className="flex items-center gap-2.5">
        <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
          <CheckSquare className="w-4 h-4" />
        </span>
        <span className="text-xs font-bold text-slate-800">
          {selectedCount} élément{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
          <span className="text-slate-400 font-normal ml-1">
            (sur {totalCount})
          </span>
        </span>
        <button
          type="button"
          onClick={onClearSelection}
          className="text-[11px] font-medium text-slate-400 hover:text-slate-700 ml-2 underline underline-offset-2 transition-colors"
        >
          Désélectionner
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {children}
        <button
          type="button"
          onClick={onClearSelection}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          title="Fermer la sélection"
          aria-label="Fermer la sélection"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
