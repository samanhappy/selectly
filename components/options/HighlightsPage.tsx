/**
 * HighlightsPage Component
 * Single responsibility: Display and manage highlighted text items
 */

import { Copy, Search, Trash2 } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import { highlightDB, type HighlightItem } from '../../core/storage/highlight-db';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { PALETTE } from './constants';

interface HighlightsPageProps {
  t: any; // i18n translations
  highlightColor: string;
}

export const HighlightsPage: React.FC<HighlightsPageProps> = ({ t, highlightColor }) => {
  const [items, setItems] = useState<HighlightItem[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const list = await highlightDB.getAll();
    setItems(list);
    setLoading(false);
  };

  useEffect(() => {
    load();

    const highlightChannel = new BroadcastChannel('selectly-highlight-changes');
    highlightChannel.onmessage = (event) => {
      if (event.data === 'changed') {
        load();
      }
    };

    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        await load();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      highlightChannel.close();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const s = q.toLowerCase();
    return items.filter(
      (it) =>
        it.text.toLowerCase().includes(s) ||
        it.title.toLowerCase().includes(s) ||
        it.url.toLowerCase().includes(s) ||
        it.hostname.toLowerCase().includes(s)
    );
  }, [items, q]);

  const groups = useMemo(() => {
    const map = new Map<string, HighlightItem[]>();
    for (const it of filtered) {
      if (!map.has(it.url)) map.set(it.url, []);
      map.get(it.url)!.push(it);
    }
    const arr = Array.from(map.entries()).map(([url, arr]) => {
      const latest = Math.max(...arr.map((a) => a.created_at || 0));
      const first = arr[0];
      return { url, items: arr, latest, title: first.title, hostname: first.hostname };
    });
    arr.sort((a, b) => b.latest - a.latest);
    return arr;
  }, [filtered]);

  const remove = async (id: string) => {
    const { highlightService } = await import('../../core/services/highlight-service');
    await highlightService.deleteItem(id);
    await load();
  };

  const clearAll = async () => {
    if (!confirm(t.options?.highlights?.clearAllConfirm || 'Clear all highlights?')) return;
    await highlightDB.clearAll();
    await load();
  };

  return (
    <div style={{ padding: '12px', background: PALETTE.surfaceAlt, minHeight: '100%' }}>
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between rounded-t-lg border-b border-slate-200 bg-slate-50 px-3 py-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-900">
              {t.options?.highlights?.groups || 'Highlight Groups'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-[260px]">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.options?.highlights?.searchPlaceholder || 'Search'}
                className="pl-8"
              />
            </div>
            <Button
              variant="ghost"
              onClick={clearAll}
              className="!h-8 !px-3 border-slate-200 hover:bg-slate-100"
            >
              {t.options?.highlights?.clearAll || 'Clear All'}
            </Button>
          </div>
        </div>
        <div className="p-3">
          {loading ? (
            <div className="py-4 text-sm text-slate-600">
              {t.options?.highlights?.loading || 'Loading...'}
            </div>
          ) : items.length === 0 ? (
            <div className="py-4 text-sm text-slate-500">
              {t.options?.highlights?.noHighlights ||
                'No highlights yet. Select text on any page and click the highlight button.'}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {groups.map((group) => (
                <div
                  key={group.url}
                  className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                >
                  <ul className="flex list-none flex-col gap-3 p-2">
                    {group.items.map((item) => (
                      <li
                        key={item.id}
                        className="group flex items-start gap-3 rounded-md border border-slate-100 bg-slate-50 p-2 hover:border-slate-200 hover:bg-white transition-colors"
                      >
                        <div
                          className="mt-1 h-3 w-3 rounded-sm border border-slate-200"
                          style={{ backgroundColor: highlightColor || '#fff59d' }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="whitespace-pre-wrap break-words text-lg leading-relaxed text-slate-800 font-serif">
                            {item.text}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity self-end px-1">
                          <Button
                            variant="ghost"
                            onClick={() => navigator.clipboard.writeText(item.text)}
                            className="!h-6 !w-6 !p-0 border-slate-200 hover:bg-slate-100"
                            title={t.options?.highlights?.copy || 'Copy'}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => remove(item.id!)}
                            className="!h-6 !w-6 !p-0 border-slate-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                            title={t.options?.highlights?.delete || 'Delete'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-end p-2">
                    <a
                      href={group.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-xs text-slate-400 hover:text-slate-600 hover:underline transition-colors"
                    >
                      {group.title}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
