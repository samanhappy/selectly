import { describe, expect, it } from 'vitest';

import { getContextBudget } from './budget';

describe('getContextBudget', () => {
  it('uses 60 percent of model context window for page context when metadata is available', () => {
    expect(getContextBudget({ contextWindow: 32000 }).maxContextTokens).toBe(19200);
  });

  it('falls back to 24k characters when model metadata is missing', () => {
    expect(getContextBudget({}).maxContextChars).toBe(24000);
  });
});
