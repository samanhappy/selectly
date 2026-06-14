import { Check, ChevronDown, Loader2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import type { ModelChoice } from '../../core/services/model-options';
import { getModelChoiceLabel } from '../../core/services/model-options';

interface TabModelPickerProps {
  choices: ModelChoice[];
  selectedModel: string;
  disabled?: boolean;
  loading?: boolean;
  labels: {
    chooseModel: string;
    loadingModels: string;
    noModelsAvailable: string;
    selectedModel: string;
  };
  onSelect: (model: string) => void;
}

export const getCompactModelLabel = (model: string, choices: ModelChoice[]) =>
  getModelChoiceLabel(model, choices);

export const TabModelPicker = ({
  choices,
  selectedModel,
  disabled = false,
  loading = false,
  labels,
  onSelect,
}: TabModelPickerProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedLabel = getCompactModelLabel(selectedModel, choices);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        className="inline-flex h-8 max-w-[150px] items-center gap-1 rounded-full bg-slate-100 px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        title={`${labels.selectedModel}: ${selectedLabel}`}
        aria-label={`${labels.selectedModel}: ${selectedLabel}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {loading ? <Loader2 size={13} className="shrink-0 animate-spin" /> : null}
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown size={13} className={`shrink-0 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute bottom-full right-0 z-30 mb-2 w-[min(320px,calc(100vw-24px))] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
            {labels.chooseModel}
          </div>
          <div className="max-h-64 overflow-y-auto py-1" role="listbox">
            {loading && choices.length === 0 && (
              <div className="flex items-center gap-2 px-3 py-3 text-xs text-slate-500">
                <Loader2 size={14} className="animate-spin" />
                {labels.loadingModels}
              </div>
            )}
            {!loading && choices.length === 0 && (
              <div className="px-3 py-3 text-xs text-slate-500">
                {labels.noModelsAvailable}
              </div>
            )}
            {choices.map((choice) => {
              const selected = choice.value === selectedModel;
              return (
                <button
                  key={choice.value}
                  type="button"
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition ${
                    selected ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onSelect(choice.value);
                    setOpen(false);
                  }}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{choice.label}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {choice.providerName}
                      {choice.description && choice.description !== choice.label
                        ? ` · ${choice.description}`
                        : ''}
                    </span>
                  </span>
                  {selected && <Check size={15} className="shrink-0 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
