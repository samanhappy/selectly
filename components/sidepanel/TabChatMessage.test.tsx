import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { TabMessage } from '../../core/tab-context/types';
import { TabChatMessage } from './TabChatMessage';

const assistantMessage: TabMessage = {
  id: 'm1',
  role: 'assistant',
  content: 'Assistant answer',
  createdAt: 1,
};

const labels = {
  copy: 'Copy',
  saveToCollections: 'Save to Collections',
};

describe('TabChatMessage', () => {
  it('renders assistant actions outside the message card and aligned left', () => {
    const html = renderToStaticMarkup(
      <TabChatMessage
        message={assistantMessage}
        streaming={false}
        labels={labels}
        onCopy={() => {}}
        onSave={() => {}}
      />
    );

    expect(html).toContain('selectly-tab-message-card');
    expect(html).toContain('selectly-tab-message-actions');
    expect(html.indexOf('selectly-tab-message-card')).toBeLessThan(
      html.indexOf('selectly-tab-message-actions')
    );
    expect(html).toContain('items-start');
    expect(html).toContain('aria-label="Copy"');
    expect(html).toContain('aria-label="Save to Collections"');
  });

  it('does not render actions while the assistant message is streaming', () => {
    const html = renderToStaticMarkup(
      <TabChatMessage
        message={assistantMessage}
        streaming
        labels={labels}
        onCopy={() => {}}
        onSave={() => {}}
      />
    );

    expect(html).not.toContain('selectly-tab-message-actions');
  });
});
