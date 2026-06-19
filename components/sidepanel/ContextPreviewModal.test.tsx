import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { TabContextSnapshot } from '../../core/tab-context/types';
import { ContextPreviewModal, type ContextPreviewLabels } from './ContextPreviewModal';

const labels: ContextPreviewLabels = {
  title: 'Context preview',
  preview: 'Preview',
  blocks: 'Blocks',
  source: 'Source',
  frame: 'Frame',
  blockChars: '{{chars}} chars',
  copyContext: 'Copy context',
  contextCopied: 'Context copied',
  close: 'Close',
  contextReady: 'Page context ready',
  contextTruncated: 'Context truncated',
  noPageContext: 'No page context',
  contextStats: '{{chars}} chars · {{blocks}} blocks',
  skippedFrames: '{{count}} frames skipped',
};

const snapshot: TabContextSnapshot = {
  id: 'ctx_1',
  url: 'https://example.com/article',
  normalizedUrl: 'https://example.com/article',
  title: 'Example Article',
  hostname: 'example.com',
  language: 'en',
  capturedAt: 1,
  extractorVersion: 'test',
  source: 'dom',
  text: 'First extracted paragraph.\n\nSecond extracted paragraph.',
  blocks: [
    {
      id: 'b1',
      order: 0,
      heading: 'Intro',
      text: 'First extracted paragraph.',
      charCount: 26,
    },
    {
      id: 'b2',
      order: 1,
      text: 'Second extracted paragraph.',
      charCount: 27,
      frameUrl: 'https://example.com/embed',
    },
  ],
  stats: {
    totalChars: 53,
    includedChars: 53,
    blockCount: 2,
    frameCount: 2,
    skippedFrameCount: 1,
    truncated: false,
    maxContextChars: 24000,
  },
};

describe('ContextPreviewModal', () => {
  it('renders the final context text by default', () => {
    const html = renderToStaticMarkup(
      <ContextPreviewModal
        context={snapshot}
        labels={labels}
        open
        onClose={() => {}}
        onCopy={() => {}}
      />
    );

    expect(html).toContain('First extracted paragraph.');
    expect(html).toContain('Second extracted paragraph.');
    expect(html).toContain('53 chars · 2 blocks');
    expect(html).toContain('1 frames skipped');
    expect(html).toContain('aria-modal="true"');
  });

  it('renders readable block metadata in the Blocks view', () => {
    const html = renderToStaticMarkup(
      <ContextPreviewModal
        context={snapshot}
        labels={labels}
        open
        initialView="blocks"
        onClose={() => {}}
        onCopy={() => {}}
      />
    );

    expect(html).toContain('#1');
    expect(html).toContain('Intro');
    expect(html).toContain('26 chars');
    expect(html).toContain('https://example.com/embed');
  });

  it('renders nothing when closed', () => {
    const html = renderToStaticMarkup(
      <ContextPreviewModal
        context={snapshot}
        labels={labels}
        open={false}
        onClose={() => {}}
        onCopy={() => {}}
      />
    );

    expect(html).toBe('');
  });
});
