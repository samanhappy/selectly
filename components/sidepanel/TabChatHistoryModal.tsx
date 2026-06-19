import { X } from 'lucide-react';
import React from 'react';

import {
  getTabChatHistoryTitle,
  getVisibleTabChatHistorySessions,
} from '../../core/tab-context/chat-history';
import type { TabChatSession } from '../../core/tab-context/types';

export interface TabChatHistoryLabels {
  title: string;
  currentChat: string;
  newChat: string;
  noPreviousChats: string;
  messageCount: string;
  updatedAt: string;
  close: string;
}

interface TabChatHistoryModalProps {
  sessions: TabChatSession[];
  currentSessionId?: string;
  labels: TabChatHistoryLabels;
  open: boolean;
  onClose: () => void;
  onSelectSession: (session: TabChatSession) => void;
}

const format = (template: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce(
    (next, [key, value]) => next.replace(new RegExp(`{{${key}}}`, 'g'), String(value)),
    template
  );

const formatTimestamp = (timestamp: number) => {
  const locale = typeof navigator !== 'undefined' ? navigator.language : undefined;
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);
};

export const TabChatHistoryModal: React.FC<TabChatHistoryModalProps> = ({
  sessions,
  currentSessionId,
  labels,
  open,
  onClose,
  onSelectSession,
}) => {
  if (!open) return null;

  const visibleSessions = getVisibleTabChatHistorySessions(sessions, currentSessionId);
  const previousChatCount = visibleSessions.filter((item) => item.id !== currentSessionId).length;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch bg-slate-900/30 p-3">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={labels.title}
        className="flex min-h-0 w-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl"
      >
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-3 py-2">
          <h2 className="truncate text-sm font-semibold text-slate-900">{labels.title}</h2>
          <button
            className="sl-btn sl-btn-ghost !h-8 !w-8 !shrink-0 !p-0"
            title={labels.close}
            aria-label={labels.close}
            onClick={onClose}
          >
            <X size={15} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-2" role="list">
            {visibleSessions.map((item) => {
              const isCurrent = item.id === currentSessionId;
              const title = getTabChatHistoryTitle(item, labels.newChat);
              const messageCount = format(labels.messageCount, {
                count: item.messages.length,
              });
              const updatedAt = format(labels.updatedAt, {
                time: formatTimestamp(item.updatedAt),
              });

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`w-full rounded-md border px-3 py-2 text-left transition ${
                    isCurrent
                      ? 'cursor-default border-blue-200 bg-blue-50 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-800 hover:border-blue-200 hover:bg-blue-50'
                  }`}
                  aria-current={isCurrent ? 'true' : undefined}
                  disabled={isCurrent}
                  onClick={() => onSelectSession(item)}
                >
                  <span className="flex min-w-0 items-start justify-between gap-2">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{title}</span>
                      <span className="mt-1 block truncate text-xs text-slate-500">
                        {updatedAt} · {messageCount}
                      </span>
                    </span>
                    {isCurrent && (
                      <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                        {labels.currentChat}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {previousChatCount === 0 && (
            <div className="mt-3 rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
              {labels.noPreviousChats}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
