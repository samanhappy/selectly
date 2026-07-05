import { describe, expect, it } from 'vitest';

import { normalizePageUrl } from './url';

describe('normalizePageUrl', () => {
  it('removes hash and common tracking parameters while preserving content query params', () => {
    expect(
      normalizePageUrl(
        'https://example.com/article?id=42&utm_source=newsletter&fbclid=abc#comments'
      )
    ).toBe('https://example.com/article?id=42');
  });

  it('sorts preserved query params to make equivalent URLs stable', () => {
    expect(normalizePageUrl('https://example.com/search?b=2&a=1&utm_medium=email')).toBe(
      'https://example.com/search?a=1&b=2'
    );
  });

  it('uses the same page URL for article anchors', () => {
    expect(
      normalizePageUrl('https://www.fast.ai/posts/2025-10-30-build-to-last.html#dogfooding')
    ).toBe('https://www.fast.ai/posts/2025-10-30-build-to-last.html');
  });

  it('drops tracking params before comparing anchor links', () => {
    const chapter33 = normalizePageUrl(
      'https://lexfridman.com/dhh-david-heinemeier-hansson-transcript/?utm_source=chatgpt.com#chapter33_money_and_happiness'
    );
    const chapter12 = normalizePageUrl(
      'https://lexfridman.com/dhh-david-heinemeier-hansson-transcript/?utm_source=chatgpt.com#chapter12_vibe_coding'
    );

    expect(chapter33).toBe('https://lexfridman.com/dhh-david-heinemeier-hansson-transcript/');
    expect(chapter12).toBe(chapter33);
  });
});
