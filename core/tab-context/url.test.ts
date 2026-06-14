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
});
