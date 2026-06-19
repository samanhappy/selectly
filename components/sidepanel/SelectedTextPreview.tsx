import { X } from 'lucide-react';
import React from 'react';

export interface SelectedTextPreviewLabels {
  selectedText: string;
  expandSelectedText: string;
  collapseSelectedText: string;
  removeSelectedText: string;
}

interface SelectedTextPreviewProps {
  selectedText: string;
  expanded: boolean;
  labels: SelectedTextPreviewLabels;
  onToggle: () => void;
  onRemove: () => void;
}

export const SelectedTextPreview = ({
  selectedText,
  expanded,
  labels,
  onToggle,
  onRemove,
}: SelectedTextPreviewProps) => {
  const text = selectedText.trim();
  if (!text) return null;

  return (
    <section className="mb-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-slate-700">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold text-blue-800">{labels.selectedText}</h2>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className="rounded px-1.5 py-0.5 text-[11px] font-medium text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
            aria-expanded={expanded}
            onClick={onToggle}
          >
            {expanded ? labels.collapseSelectedText : labels.expandSelectedText}
          </button>
          <button
            type="button"
            className="inline-flex h-6 w-6 items-center justify-center rounded text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
            aria-label={labels.removeSelectedText}
            title={labels.removeSelectedText}
            onClick={onRemove}
          >
            <X size={13} aria-hidden="true" />
          </button>
        </div>
      </div>
      <p
        className={`whitespace-pre-wrap break-words leading-relaxed ${
          expanded ? '' : 'max-h-14 overflow-hidden'
        }`}
      >
        {text}
      </p>
    </section>
  );
};
