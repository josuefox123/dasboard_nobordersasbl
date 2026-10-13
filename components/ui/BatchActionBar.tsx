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
    <div className="p-3 bg-gradient-to-r from-blue-900 to-[#0B3C68] text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-blue-950/20 animate-fade-in my-3">
      <div className="flex items-center gap-2.5">
        <span className="p-1 rounded-lg bg-white/10 text-amber-300">
          <CheckSquare className="w-4 h-4" />
        </span>
        <span className="text-xs font-bold">
          {selectedCount} élément{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
          <span className="text-white/60 font-normal ml-1">
            (sur {totalCount})
          </span>
        </span>
        <button
          type="button"
          onClick={onClearSelection}
          className="text-[11px] underline text-blue-200 hover:text-white ml-2 transition-colors"
        >
          Désélectionner
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {children}
        <button
          type="button"
          onClick={onClearSelection}
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Fermer la sélection"
          aria-label="Fermer la sélection"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
