import { describe, expect, it } from 'vitest';

import type { TabChatSession } from './types';
import {
  CLOUD_DEFAULT_TAB_MODEL,
  getTabSessionModel,
  normalizeTabSessionModel,
} from './session-model';

const createSession = (overrides: Partial<TabChatSession>): TabChatSession => ({
  id: 'session-1',
  normalizedUrl: 'https://example.com/',
  url: 'https://example.com/',
  title: 'Example',
  hostname: 'example.com',
  createdAt: 1,
  updatedAt: 1,
  expiresAt: 1,
  context: null,
  messages: [],
  ...overrides,
});

describe('tab session model', () => {
  it('normalizes an empty model to the cloud default', () => {
    expect(normalizeTabSessionModel('')).toBe(CLOUD_DEFAULT_TAB_MODEL);
  });

  it('prefers the session model over the current default model', () => {
    const session = createSession({ model: 'openai/gpt-4o' });

    expect(getTabSessionModel(session, 'cloud/default')).toBe('openai/gpt-4o');
  });

  it('uses legacy message metadata before falling back to the current default', () => {
    const session = createSession({
      messages: [
        { id: 'u1', role: 'user', content: 'Hi', createdAt: 1 },
        { id: 'a1', role: 'assistant', content: 'Hello', createdAt: 2, model: 'cloud/gpt-oss-20b' },
      ],
    });

    expect(getTabSessionModel(session, 'openai/gpt-4o')).toBe('cloud/gpt-oss-20b');
  });
});
