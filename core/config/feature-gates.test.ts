import { describe, expect, it } from 'vitest';

import {
  createDictionaryDisabledResponse,
  createReadingProgressDisabledResponse,
  isDictionaryEnabled,
  isReadingProgressEnabled,
} from './feature-gates';

describe('feature gates', () => {
  it('keeps reading progress hidden and inactive', () => {
    expect(isReadingProgressEnabled()).toBe(false);
  });

  it('returns a successful no-op response for disabled reading progress messages', () => {
    expect(createReadingProgressDisabledResponse()).toEqual({
      success: true,
      disabled: true,
      record: null,
    });
  });

  it('keeps dictionary hidden and inactive', () => {
    expect(isDictionaryEnabled()).toBe(false);
  });

  it('returns a successful no-op response for disabled dictionary messages', () => {
    expect(createDictionaryDisabledResponse()).toEqual({
      success: true,
      disabled: true,
    });
  });
});
