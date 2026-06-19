import { describe, expect, it } from 'vitest';

import {
  getCurrentSessionForTab,
  getNormalizedTabUrl,
  mergeActiveTabInfo,
  selectPreservedSession,
  shouldCaptureTabUpdate,
} from './session-loader';
import type { TabChatSession } from './types';

const session = (normalizedUrl: string): TabChatSession => ({
  id: normalizedUrl,
  normalizedUrl,
  url: normalizedUrl,
  title: 'Saved page',
  hostname: 'example.com',
  createdAt: 1,
  updatedAt: 1,
  expiresAt: 1,
  context: null,
  messages: [],
});

describe('tab session loading helpers', () => {
  it('keeps previous tab metadata when update events omit title or url during reload', () => {
    expect(
      mergeActiveTabInfo(
        { id: 1, windowId: 2 },
        { id: 1, title: 'Existing title', url: 'https://example.com/a', windowId: 2 }
      )
    ).toEqual({
      id: 1,
      title: 'Existing title',
      url: 'https://example.com/a',
      windowId: 2,
    });
  });

  it('only captures updated tabs after the page reports complete', () => {
    expect(shouldCaptureTabUpdate({ status: 'loading' })).toBe(false);
    expect(shouldCaptureTabUpdate({ title: 'Loading title' })).toBe(false);
    expect(shouldCaptureTabUpdate({ status: 'complete' })).toBe(true);
  });

  it('preserves the current session when capture fails without a usable url', () => {
    const currentSession = session('https://example.com/article');

    expect(
      selectPreservedSession({
        normalizedUrl: '',
        currentSession,
        storedSession: null,
      })
    ).toBe(currentSession);
  });

  it('only treats the current session as reusable for the same browser tab', () => {
    const currentSession = session('https://example.com/article');

    expect(
      getCurrentSessionForTab(
        { id: 1 },
        { id: 1, title: 'Existing title', url: 'https://example.com/article' },
        currentSession
      )
    ).toBe(currentSession);
    expect(
      getCurrentSessionForTab(
        { id: 2 },
        { id: 1, title: 'Existing title', url: 'https://example.com/article' },
        currentSession
      )
    ).toBeNull();
  });

  it('prefers the stored url session when capture fails after metadata resolves', () => {
    const storedSession = session('https://example.com/article');

    expect(
      selectPreservedSession({
        normalizedUrl: getNormalizedTabUrl({ id: 1, url: 'https://example.com/article#comments' }),
        currentSession: session('https://other.example/'),
        storedSession,
      })
    ).toBe(storedSession);
  });
});
