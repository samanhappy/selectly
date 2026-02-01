/**
 * DictionaryPage Component
 * Single responsibility: Display and manage dictionary entries
 */

import { ExternalLink, Search, Trash2 } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import { dictionaryService } from '../../core/services/dictionary-service';
import { type DictionaryEntry } from '../../core/storage/dictionary-db';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { openExternal, PALETTE } from './constants';

interface DictionaryPageProps {
  t: any; // i18n translations
}

export const DictionaryPage: React.FC<DictionaryPageProps> = ({ t }) => {
  const [dictItems, setDictItems] = useState<DictionaryEntry[]>([]);
  const [q, setQ] = useState('');
  const [dictLoading, setDictLoading] = useState(true);

  const loadDictionary = async () => {
    setDictLoading(true);
    const list = await dictionaryService.getAllEntries();
    setDictItems(list);
    setDictLoading(false);
  };

  useEffect(() => {
    loadDictionary();

    // Listen for data changes via BroadcastChannel
    const dictChannel = new BroadcastChannel('selectly-dictionary-changes');

    dictChannel.onmessage = (event) => {
      if (event.data === 'changed') {
        loadDictionary();
      }
    };

    // Also reload when page becomes visible (handles tab switching)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadDictionary();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      dictChannel.close();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const filteredDictionary = useMemo(() => {
    if (!q.trim()) return dictItems;
    const s = q.toLowerCase();
    return dictItems.filter(
      (it) =>
        it.source.toLowerCase().includes(s) ||
        it.translation.toLowerCase().includes(s) ||
        (it.sentence || '').toLowerCase().includes(s) ||
        it.title.toLowerCase().includes(s) ||
        it.url.toLowerCase().includes(s)
    );
  }, [dictItems, q]);

  const removeDict = async (id: string) => {
    await dictionaryService.deleteEntry(id);
    await loadDictionary();
  };

  const clearAllDict = async () => {
    if (!confirm(t.options?.collections.clearAllConfirm || 'Clear all dictionary entries?')) return;
    await dictionaryService.clearAll();
    await loadDictionary();
  };

  const exportDictionary = () => {
    const header = [
      t.options?.dictionary.csvHeaderText || 'text',
      t.options?.dictionary.csvHeaderTranslation || 'translation',
      t.options?.dictionary.csvHeaderSentence || 'sentence',
      t.options?.dictionary.csvHeaderURL || 'url',
      t.options?.dictionary.csvHeaderTitle || 'title',
      t.options?.dictionary.csvHeaderHostname || 'hostname',
      t.options?.dictionary.csvHeaderCreatedAt || 'createdAt',
    ];
    const rows = [header.join(',')];
    dictItems.forEach((d) => {
      const vals = [
        d.source,
        d.translation,
        d.sentence || '',
        d.url,
        d.title,
        d.hostname,
        String(d.createdAt),
      ];
      const escaped = vals.map((v) => '"' + (v || '').replace(/"/g, '""') + '"');
      rows.push(escaped.join(','));
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selectly-dictionary-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const visitPage = (url: string) => {
    openExternal(url);
  };

  return (
    <div style={{ padding: '12px', background: PALETTE.surfaceAlt, minHeight: '100%' }}>
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between rounded-t-lg border-b border-slate-200 bg-slate-50 px-3 py-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-900">
              {(t as any).options?.dictionary?.title || 'Dictionary'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-[260px]">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.options?.collections.searchPlaceholder || 'Search'}
                className="pl-8"
              />
            </div>
            <Button
              variant="ghost"
              onClick={exportDictionary}
              className="!h-7 !px-2 text-slate-700 border-slate-200 hover:bg-slate-100"
            >
              {(t as any).button.export || 'Export'}
            </Button>
          </div>
        </div>
        <div className="p-3">
          {dictLoading ? (
            <div className="py-4 text-sm text-slate-600">
              {t.options?.collections.loading || 'Loading...'}
            </div>
          ) : filteredDictionary.length === 0 ? (
            <div className="py-4 text-sm text-slate-500">
              {(t as any).options?.dictionary?.empty || 'No dictionary entries yet.'}
            </div>
          ) : (
            <ul className="flex list-none flex-col gap-3">
              {filteredDictionary.map((item) => (
                <li
                  key={item.id}
                  className="group rounded-md border border-slate-100 bg-slate-50 p-2 hover:border-slate-200 hover:bg-white transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="whitespace-pre-wrap break-words text-[16px] leading-relaxed text-slate-800 font-serif">
                        {item.source}
                        <span className="mt-1 text-[16px] text-slate-600 pl-1">
                          {item.translation}
                        </span>
                      </div>
                      {item.sentence && (
                        <div className="mt-1 text-sm text-slate-500 italic">{item.sentence}</div>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        onClick={() => visitPage(item.url)}
                        className="!h-6 !w-6 !p-0 border-slate-200 text-red-500 hover:bg-red-50"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => removeDict(item.id!)}
                        className="!h-6 !w-6 !p-0 border-slate-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                        title={t.options?.collections.delete || 'Delete'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
