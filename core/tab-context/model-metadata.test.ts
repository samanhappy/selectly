import { describe, expect, it } from 'vitest';

import { getModelContextWindow, sanitizeModelMetadataOverride } from './model-metadata';

describe('model metadata helpers', () => {
  it('sanitizes invalid context window overrides', () => {
    expect(sanitizeModelMetadataOverride({ contextWindow: -1 })).toEqual({});
    expect(sanitizeModelMetadataOverride({ contextWindow: 128000 })).toEqual({
      contextWindow: 128000,
    });
  });

  it('prefers user overrides over provider metadata', () => {
    expect(
      getModelContextWindow({
        modelString: 'openai/gpt-test',
        providerContextWindow: 64000,
        overrides: {
          'openai/gpt-test': { contextWindow: 128000 },
        },
      })
    ).toBe(128000);
  });
});
