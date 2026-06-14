import { describe, expect, it } from 'vitest';

import { TAB_CONTEXT_BLOCK_SELECTOR } from './extractor';

describe('tab context extractor', () => {
  it('does not select broad container elements as text blocks', () => {
    const selectors = TAB_CONTEXT_BLOCK_SELECTOR.split(',');

    expect(selectors).not.toContain('article');
    expect(selectors).not.toContain('main');
    expect(selectors).not.toContain('section');
  });
});
