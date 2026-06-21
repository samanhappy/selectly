import { describe, expect, it } from 'vitest';

import { shouldShowDictionaryAction } from './StreamingResult';

describe('StreamingResult dictionary action', () => {
  it('hides the dictionary action while the feature is disabled', () => {
    expect(shouldShowDictionaryAction('translate')).toBe(false);
  });
});
