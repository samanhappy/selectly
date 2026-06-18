import type { TabContextSnapshot } from './types';

export const SELECTION_CONTEXT_TTL_MS = 5 * 60 * 1000;

export interface TabSelectionContext {
  tabId: number;
  selectedText: string;
  updatedAt: number;
}

export const normalizeSelectedText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

export const createTabSelectionContext = (
  tabId: number,
  selectedText: unknown,
  updatedAt = Date.now()
): TabSelectionContext | null => {
  const text = normalizeSelectedText(selectedText);
  if (!text) return null;

  return {
    tabId,
    selectedText: text,
    updatedAt,
  };
};

export const isSelectionContextFresh = (
  selection: TabSelectionContext,
  now = Date.now()
): boolean => now - selection.updatedAt <= SELECTION_CONTEXT_TTL_MS;

export const mergeSelectedTextIntoSnapshot = (
  snapshot: TabContextSnapshot,
  selection: TabSelectionContext | null
): TabContextSnapshot => {
  if (!selection?.selectedText) return snapshot;

  return {
    ...snapshot,
    selectedText: selection.selectedText,
  };
};

export const removeSelectedTextFromSnapshot = (
  snapshot: TabContextSnapshot | null
): TabContextSnapshot | null => {
  if (!snapshot?.selectedText) return snapshot;

  const { selectedText: _selectedText, ...rest } = snapshot;
  return rest;
};
