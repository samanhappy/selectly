import { describe, expect, it } from 'vitest';

import {
  createTabSelectionContext,
  isSelectionContextFresh,
  mergeSelectedTextIntoSnapshot,
  removeSelectedTextFromSnapshot,
} from './selection-context';
import type { TabContextSnapshot } from './types';

const snapshot: TabContextSnapshot = {
  id: 'ctx_1',
  url: 'https://example.com/article',
  normalizedUrl: 'https://example.com/article',
  title: 'Example Article',
  hostname: 'example.com',
  language: 'en',
  capturedAt: 1,
  extractorVersion: 'test',
  source: 'readability',
  blocks: [],
  text: 'The page says hello.',
  stats: {
    totalChars: 20,
    includedChars: 20,
    blockCount: 0,
    frameCount: 1,
    skippedFrameCount: 0,
    truncated: false,
    maxContextChars: 24000,
  },
};

describe('selection context helpers', () => {
  it('normalizes non-empty selected text for a tab', () => {
    expect(createTabSelectionContext(7, '  selected text  ', 100)).toEqual({
      tabId: 7,
      selectedText: 'selected text',
      updatedAt: 100,
    });
  });

  it('rejects empty selected text', () => {
    expect(createTabSelectionContext(7, '   ', 100)).toBeNull();
  });

  it('treats selection context as stale after the ttl', () => {
    expect(isSelectionContextFresh({ tabId: 7, selectedText: 'text', updatedAt: 100 }, 200)).toBe(
      true
    );
    expect(
      isSelectionContextFresh(
        { tabId: 7, selectedText: 'text', updatedAt: 100 },
        100 + 5 * 60 * 1000 + 1
      )
    ).toBe(false);
  });

  it('merges fresh selected text into a captured snapshot', () => {
    expect(
      mergeSelectedTextIntoSnapshot(snapshot, {
        tabId: 7,
        selectedText: 'selected text',
        updatedAt: 100,
      })
    ).toMatchObject({
      selectedText: 'selected text',
      text: 'The page says hello.',
    });
  });

  it('keeps the existing snapshot when there is no selection context', () => {
    expect(mergeSelectedTextIntoSnapshot(snapshot, null)).toBe(snapshot);
  });

  it('removes selected text from a snapshot without changing page context', () => {
    const result = removeSelectedTextFromSnapshot({
      ...snapshot,
      selectedText: 'selected text',
    });

    expect(result).toMatchObject({
      text: 'The page says hello.',
    });
    expect(result).not.toHaveProperty('selectedText');
  });
});
