import { describe, expect, it } from 'vitest';

import { groupItemsByPageUrl } from './page-url';

describe('groupItemsByPageUrl', () => {
  it('groups page items by normalized URL', () => {
    const groups = groupItemsByPageUrl([
      {
        url: 'https://www.fast.ai/posts/2025-10-30-build-to-last.html#dogfooding',
        title: 'Build to Last',
        hostname: 'www.fast.ai',
        created_at: 1,
      },
      {
        url: 'https://www.fast.ai/posts/2025-10-30-build-to-last.html',
        title: 'Build to Last',
        hostname: 'www.fast.ai',
        created_at: 2,
      },
      {
        url: 'https://lexfridman.com/dhh-david-heinemeier-hansson-transcript/?utm_source=chatgpt.com#chapter33_money_and_happiness',
        title: 'DHH Transcript',
        hostname: 'lexfridman.com',
        created_at: 3,
      },
      {
        url: 'https://lexfridman.com/dhh-david-heinemeier-hansson-transcript/?utm_source=chatgpt.com#chapter12_vibe_coding',
        title: 'DHH Transcript',
        hostname: 'lexfridman.com',
        created_at: 4,
      },
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0].url).toBe('https://lexfridman.com/dhh-david-heinemeier-hansson-transcript/');
    expect(groups[0].items).toHaveLength(2);
    expect(groups[1].url).toBe('https://www.fast.ai/posts/2025-10-30-build-to-last.html');
    expect(groups[1].items).toHaveLength(2);
  });
});
