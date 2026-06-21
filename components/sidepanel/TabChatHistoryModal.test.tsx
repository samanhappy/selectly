import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { TabChatSession } from '../../core/tab-context/types';
import { TabChatHistoryModal, type TabChatHistoryLabels } from './TabChatHistoryModal';

const labels: TabChatHistoryLabels = {
  title: 'Chat history',
  currentChat: 'Current',
  newChat: 'New chat',
  noPreviousChats: 'No previous chats for this page',
  messageCount: '{{count}} messages',
  updatedAt: 'Updated {{time}}',
  close: 'Close',
};

const createSession = (overrides: Partial<TabChatSession>): TabChatSession => ({
  id: overrides.id || 'session',
  normalizedUrl: 'https://example.com/article',
  url: 'https://example.com/article',
  title: 'Example article',
  hostname: 'example.com',
  createdAt: overrides.createdAt || 1,
  updatedAt: overrides.updatedAt || 1,
  expiresAt: overrides.expiresAt || 1,
  model: overrides.model,
  context: overrides.context || null,
  messages: overrides.messages || [],
});

describe('TabChatHistoryModal', () => {
  it('renders current chat and previous chats for the page', () => {
    const html = renderToStaticMarkup(
      <TabChatHistoryModal
        sessions={[
          createSession({ id: 'empty-old', messages: [] }),
          createSession({
            id: 'current',
            messages: [{ id: 'm1', role: 'user', content: 'Current question', createdAt: 1 }],
          }),
          createSession({
            id: 'previous',
            messages: [
              { id: 'm2', role: 'user', content: 'Previous question', createdAt: 2 },
              { id: 'm3', role: 'assistant', content: 'Previous answer', createdAt: 3 },
            ],
          }),
        ]}
        currentSessionId="current"
        labels={labels}
        open
        onClose={() => {}}
        onSelectSession={() => {}}
      />
    );

    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('Chat history');
    expect(html).toContain('Current question');
    expect(html).toContain('Previous question');
    expect(html).not.toContain('role="list"');
    expect(html).toContain('Current');
    expect(html).toContain('2 messages');
    expect(html).not.toContain('empty-old');
  });

  it('shows the page-scoped empty state when there is no previous chat', () => {
    const html = renderToStaticMarkup(
      <TabChatHistoryModal
        sessions={[createSession({ id: 'current', messages: [] })]}
        currentSessionId="current"
        labels={labels}
        open
        onClose={() => {}}
        onSelectSession={() => {}}
      />
    );

    expect(html).toContain('New chat');
    expect(html).toContain('No previous chats for this page');
  });

  it('renders nothing when closed', () => {
    const html = renderToStaticMarkup(
      <TabChatHistoryModal
        sessions={[createSession({ id: 'current' })]}
        currentSessionId="current"
        labels={labels}
        open={false}
        onClose={() => {}}
        onSelectSession={() => {}}
      />
    );

    expect(html).toBe('');
  });
});
