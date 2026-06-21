import { describe, expect, it } from 'vitest';

import { getTabChatHistoryTitle, getVisibleTabChatHistorySessions } from './chat-history';
import type { TabChatSession } from './types';

const createSession = (overrides: Partial<TabChatSession>): TabChatSession => ({
  id: overrides.id || 'session',
  normalizedUrl: overrides.normalizedUrl || 'https://example.com/article',
  url: overrides.url || 'https://example.com/article',
  title: overrides.title || 'Example article',
  hostname: overrides.hostname || 'example.com',
  createdAt: overrides.createdAt || 1,
  updatedAt: overrides.updatedAt || 1,
  expiresAt: overrides.expiresAt || 1,
  model: overrides.model,
  context: overrides.context || null,
  messages: overrides.messages || [],
});

describe('tab chat history helpers', () => {
  it('keeps the current session visible and hides other empty sessions', () => {
    const current = createSession({ id: 'current', updatedAt: 3, messages: [] });
    const previousWithMessages = createSession({
      id: 'previous',
      updatedAt: 2,
      messages: [{ id: 'm1', role: 'user', content: 'Summarize this', createdAt: 2 }],
    });
    const previousEmpty = createSession({ id: 'empty', updatedAt: 4, messages: [] });

    expect(
      getVisibleTabChatHistorySessions(
        [previousEmpty, previousWithMessages, current],
        current.id
      ).map((session) => session.id)
    ).toEqual(['current', 'previous']);
  });

  it('sorts visible sessions by most recently updated first', () => {
    const older = createSession({
      id: 'older',
      updatedAt: 10,
      messages: [{ id: 'm1', role: 'user', content: 'Older chat', createdAt: 1 }],
    });
    const current = createSession({
      id: 'current',
      updatedAt: 20,
      messages: [{ id: 'm2', role: 'user', content: 'Current chat', createdAt: 2 }],
    });
    const newer = createSession({
      id: 'newer',
      updatedAt: 30,
      messages: [{ id: 'm3', role: 'user', content: 'Newer chat', createdAt: 3 }],
    });

    expect(
      getVisibleTabChatHistorySessions([older, current, newer], current.id).map(
        (session) => session.id
      )
    ).toEqual(['newer', 'current', 'older']);
  });

  it('uses the first user message as the history title', () => {
    const session = createSession({
      messages: [
        { id: 'a1', role: 'assistant', content: 'Hello', createdAt: 1 },
        { id: 'u1', role: 'user', content: '  Explain the pricing table  ', createdAt: 2 },
      ],
    });

    expect(getTabChatHistoryTitle(session, 'New chat')).toBe('Explain the pricing table');
  });

  it('falls back for sessions without a user message', () => {
    expect(getTabChatHistoryTitle(createSession({ messages: [] }), 'New chat')).toBe('New chat');
  });
});
