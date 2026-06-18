import { BookmarkPlus, Copy } from 'lucide-react';
import React from 'react';

import type { TabMessage } from '../../core/tab-context/types';
import { MessageContent } from './MessageContent';

interface TabChatMessageLabels {
  copy: string;
  saveToCollections: string;
}

interface TabChatMessageProps {
  message: TabMessage;
  streaming: boolean;
  labels: TabChatMessageLabels;
  onCopy: (content: string) => void;
  onSave: (content: string) => void;
}

export const TabChatMessage = ({
  message,
  streaming,
  labels,
  onCopy,
  onSave,
}: TabChatMessageProps) => {
  const isUser = message.role === 'user';
  const showActions = message.role === 'assistant' && !!message.content && !streaming;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`group flex min-w-0 max-w-[92%] flex-col ${isUser ? 'items-end' : 'items-start'}`}
      >
        <div
          className={`selectly-tab-message-card min-w-0 overflow-hidden rounded-lg border px-3 py-2 text-sm leading-relaxed ${
            isUser
              ? 'border-blue-200 bg-blue-50 text-slate-900'
              : message.error
                ? 'border-red-200 bg-red-50 text-red-900'
                : 'border-slate-200 bg-white text-slate-800'
          }`}
        >
          <MessageContent content={message.content || (streaming ? '...' : '')} />
        </div>
        {showActions && (
          <div className="selectly-tab-message-actions mt-1 flex justify-start gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <button
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:bg-white hover:text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              title={labels.copy}
              aria-label={labels.copy}
              onClick={() => onCopy(message.content)}
            >
              <Copy size={12} />
            </button>
            <button
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:bg-white hover:text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              title={labels.saveToCollections}
              aria-label={labels.saveToCollections}
              onClick={() => onSave(message.content)}
            >
              <BookmarkPlus size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
