import { describe, expect, it } from 'vitest';

import { createSelectionLaunchIntent, isLaunchIntentExpired } from './launch-intent';

describe('tab assistant launch intent', () => {
  it('creates a trimmed selection intent for the target tab', () => {
    const intent = createSelectionLaunchIntent({
      tabId: 42,
      selectedText: '  important phrase  ',
      pageTitle: 'Docs',
      pageUrl: 'https://example.com/docs',
    });

    expect(intent).toMatchObject({
      tabId: 42,
      source: 'selection',
      selectedText: 'important phrase',
      pageTitle: 'Docs',
      pageUrl: 'https://example.com/docs',
      autoSend: true,
    });
    expect(intent.id).toContain('selection_42_');
  });

  it('expires stale launch intents', () => {
    const intent = createSelectionLaunchIntent({
      tabId: 42,
      selectedText: 'text',
    });

    expect(isLaunchIntentExpired(intent, intent.createdAt + 30_000)).toBe(false);
    expect(isLaunchIntentExpired(intent, intent.createdAt + 121_000)).toBe(true);
  });
});
