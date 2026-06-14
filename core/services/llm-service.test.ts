import { describe, expect, it } from 'vitest';

import { BUILT_IN_PROVIDERS, DEFAULT_CONFIG } from '../config/llm-config';
import { isLLMConfigUsable } from './llm-config-state';

describe('isLLMConfigUsable', () => {
  it('treats the implicit cloud default model as configured', () => {
    expect(isLLMConfigUsable(DEFAULT_CONFIG)).toBe(true);
  });

  it('requires an enabled API-key-backed provider for non-cloud models', () => {
    expect(
      isLLMConfigUsable({
        ...DEFAULT_CONFIG,
        llm: {
          ...DEFAULT_CONFIG.llm,
          defaultModel: 'openai/gpt-4',
          providers: {
            openai: {
              ...BUILT_IN_PROVIDERS.openai,
              enabled: true,
              apiKey: '',
            },
          },
        },
      })
    ).toBe(false);
  });

  it('accepts configured non-cloud providers', () => {
    expect(
      isLLMConfigUsable({
        ...DEFAULT_CONFIG,
        llm: {
          ...DEFAULT_CONFIG.llm,
          defaultModel: 'openai/gpt-4',
          providers: {
            openai: {
              ...BUILT_IN_PROVIDERS.openai,
              enabled: true,
              apiKey: 'sk-test',
            },
          },
        },
      })
    ).toBe(true);
  });
});
