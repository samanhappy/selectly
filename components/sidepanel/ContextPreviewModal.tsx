import { Copy, X } from 'lucide-react';
import React, { useState } from 'react';

import type { TabContextSnapshot } from '../../core/tab-context/types';

type ContextPreviewView = 'preview' | 'blocks';

export interface ContextPreviewLabels {
  title: string;
  preview: string;
  blocks: string;
  source: string;
  frame: string;
  blockChars: string;
  copyContext: string;
  contextCopied: string;
  close: string;
  contextReady: string;
  contextTruncated: string;
  noPageContext: string;
  contextStats: string;
  skippedFrames: string;
}

interface ContextPreviewModalProps {
  context: TabContextSnapshot | null;
  labels: ContextPreviewLabels;
  open: boolean;
  initialView?: ContextPreviewView;
  onClose: () => void;
  onCopy: () => void | Promise<void>;
}

const format = (template: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce(
    (next, [key, value]) => next.replace(new RegExp(`{{${key}}}`, 'g'), String(value)),
    template
  );

export const ContextPreviewModal: React.FC<ContextPreviewModalProps> = ({
  context,
  labels,
  open,
  initialView = 'preview',
  onClose,
  onCopy,
}) => {
  const [view, setView] = useState<ContextPreviewView>(initialView);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const hasContext = !!context && context.source !== 'empty' && !!context.text.trim();
  const stats = context?.stats;
  const status = !hasContext
    ? labels.noPageContext
    : stats?.truncated
      ? labels.contextTruncated
      : labels.contextReady;
  const meta =
    context && stats
      ? [
          format(labels.contextStats, {
            chars: stats.includedChars.toLocaleString(),
            blocks: stats.blockCount,
          }),
          stats.skippedFrameCount
            ? format(labels.skippedFrames, { count: stats.skippedFrameCount })
            : '',
        ]
          .filter(Boolean)
          .join(' · ')
      : labels.noPageContext;

  const copyContext = async () => {
    if (!hasContext) return;
    await onCopy();
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch bg-slate-900/30 p-3">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={labels.title}
        className="flex min-h-0 w-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-3 py-2">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-slate-900">{labels.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                {status}
              </span>
              <span>{meta}</span>
              {context?.source && (
                <span>
                  {labels.source}: {context.source}
                </span>
              )}
            </div>
          </div>
          <button
            className="sl-btn sl-btn-ghost !h-8 !w-8 !shrink-0 !p-0"
            title={labels.close}
            aria-label={labels.close}
            onClick={onClose}
          >
            <X size={15} />
          </button>
        </header>

        <div className="border-b border-slate-100 px-3 pt-2">
          <div className="sl-tabs">
            {(['preview', 'blocks'] as const).map((nextView) => (
              <button
                key={nextView}
                className="sl-tab-btn"
                data-active={view === nextView}
                onClick={() => setView(nextView)}
              >
                {nextView === 'preview' ? labels.preview : labels.blocks}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {view === 'preview' ? (
            <pre className="whitespace-pre-wrap break-words rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-800">
              {hasContext ? context.text : labels.noPageContext}
            </pre>
          ) : (
            <div className="space-y-2">
              {hasContext && context.blocks.length > 0 ? (
                context.blocks.map((block, index) => (
                  <article
                    key={`${block.id}-${index}`}
                    className="rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-700"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500">
                      <span className="text-slate-900">#{index + 1}</span>
                      {block.heading && <span className="text-slate-700">{block.heading}</span>}
                      <span>{format(labels.blockChars, { chars: block.charCount })}</span>
                      {block.frameUrl && (
                        <span className="min-w-0 truncate">
                          {labels.frame}: {block.frameUrl}
                        </span>
                      )}
                    </div>
                    <div className="whitespace-pre-wrap break-words leading-relaxed">
                      {block.text}
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                  {labels.noPageContext}
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-slate-200 px-3 py-2">
          {copied && <span className="text-xs text-green-700">{labels.contextCopied}</span>}
          <button
            className="sl-btn sl-btn-secondary !px-3 !py-1.5 text-xs"
            disabled={!hasContext}
            onClick={copyContext}
          >
            <Copy size={13} /> {labels.copyContext}
          </button>
        </footer>
      </section>
    </div>
  );
};
