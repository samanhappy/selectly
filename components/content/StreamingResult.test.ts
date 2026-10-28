import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { shouldShowDictionaryAction, StreamingResult } from './StreamingResult';

// These assertions exercise markup only; layout is verified in the browser.
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, useLayoutEffect: actual.useEffect };
});

describe('StreamingResult dictionary action', () => {
  it('hides the dictionary action while the feature is disabled', () => {
    expect(shouldShowDictionaryAction('translate')).toBe(false);
  });
});

const renderResult = (isDialogue: boolean) =>
  renderToStaticMarkup(
    React.createElement(StreamingResult, {
      title: 'Chat',
      anchor: {
        getBoundingClientRect: () => ({
          x: 0,
          y: 0,
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          width: 0,
          height: 0,
          toJSON: () => ({}),
        }),
      },
      floatingGap: 10,
      isDialogue,
      onClose: () => {},
    })
  );

describe('conversation display controls', () => {
  it('offers sidebar display for inline conversations', () => {
    expect(renderResult(true)).toContain('aria-label="Switch to page sidebar"');
  });
  it('does not offer conversation layout controls for action results', () => {
    expect(renderResult(false)).not.toContain('Switch to page sidebar');
  });
});
