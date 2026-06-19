import { describe, expect, it } from 'vitest';

import { buildTabChatMessages, getTabChatPromptSnapshot } from './prompt';
import type { TabContextSnapshot, TabMessage } from './types';

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
  blocks: [
    {
      id: 'b1',
      order: 0,
      heading: 'Intro',
      text: 'The page says hello.',
      charCount: 20,
    },
  ],
  text: 'The page says hello.',
  stats: {
    totalChars: 20,
    includedChars: 20,
    blockCount: 1,
    frameCount: 1,
    skippedFrameCount: 0,
    truncated: false,
    maxContextChars: 24000,
  },
};

describe('buildTabChatMessages', () => {
  it('keeps page context out of the system message and marks it as untrusted', () => {
    const history: TabMessage[] = [];
    const messages = buildTabChatMessages({
      snapshot,
      history,
      userMessage: 'Summarize this page',
      uiLanguage: 'en',
      maxHistoryMessages: 6,
    });

    expect(messages[0].role).toBe('system');
    expect(messages[0].content).not.toContain('The page says hello.');
    expect(messages[1]).toMatchObject({ role: 'user' });
    expect(messages[1].content).toContain('UNTRUSTED PAGE CONTEXT');
    expect(messages[messages.length - 1]).toEqual({
      role: 'user',
      content: 'Summarize this page',
    });
  });
});

describe('getTabChatPromptSnapshot', () => {
  it('drops empty page context when there is no selected text', () => {
    expect(getTabChatPromptSnapshot({ ...snapshot, source: 'empty', text: '' })).toBeNull();
  });

  it('keeps empty page context when selected text is available', () => {
    const context = { ...snapshot, source: 'empty' as const, text: '', selectedText: 'selection' };

    expect(getTabChatPromptSnapshot(context)).toBe(context);
  });
});
