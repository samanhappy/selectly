import { describe, expect, it } from 'vitest';

import { parseModelString, resolveModelString } from '../config/model-resolution';
import {
  buildThinkingModeRequestPlan,
  shouldFallbackForReasoningError,
} from './thinking-mode-adapter';

describe('buildThinkingModeRequestPlan', () => {
  it('omits extra parameters when mode is auto', () => {
    expect(
      buildThinkingModeRequestPlan({
        providerId: 'deepseek',
        thinkingMode: 'auto',
      })
    ).toEqual({ body: {}, fallbackBody: undefined });
  });

  it('maps DeepSeek modes to the thinking object', () => {
    expect(
      buildThinkingModeRequestPlan({
        providerId: 'deepseek',
        thinkingMode: 'enabled',
      })
    ).toEqual({ body: { thinking: { type: 'enabled' } }, fallbackBody: undefined });
    expect(
      buildThinkingModeRequestPlan({
        providerId: 'deepseek',
        thinkingMode: 'disabled',
      })
    ).toEqual({ body: { thinking: { type: 'disabled' } }, fallbackBody: undefined });
  });

  it('maps explicit OpenRouter modes without fallback', () => {
    expect(
      buildThinkingModeRequestPlan({
        providerId: 'openrouter',
        thinkingMode: 'enabled',
      })
    ).toEqual({
      body: { reasoning: { enabled: true, exclude: true } },
      fallbackBody: undefined,
    });
    expect(
      buildThinkingModeRequestPlan({
        providerId: 'openrouter',
        thinkingMode: 'disabled',
      })
    ).toEqual({ body: { reasoning: { effort: 'none' } }, fallbackBody: undefined });
  });

  it('allows OpenRouter auto disabled requests to fallback to minimal hidden reasoning', () => {
    expect(
      buildThinkingModeRequestPlan({
        providerId: 'openrouter',
        thinkingMode: 'disabled',
        allowFallback: true,
      })
    ).toEqual({
      body: { reasoning: { effort: 'none' } },
      fallbackBody: { reasoning: { effort: 'minimal', exclude: true } },
    });
  });

  it('maps SiliconFlow modes without maintaining a model allowlist', () => {
    expect(
      buildThinkingModeRequestPlan({
        providerId: 'siliconflow',
        thinkingMode: 'enabled',
      })
    ).toEqual({ body: { enable_thinking: true }, fallbackBody: undefined });
    expect(
      buildThinkingModeRequestPlan({
        providerId: 'siliconflow',
        thinkingMode: 'disabled',
      })
    ).toEqual({ body: { enable_thinking: false }, fallbackBody: undefined });
  });

  it('uses the OpenAI standard for providers without a first-party adapter', () => {
    for (const providerId of ['openai', 'anthropic', 'cloud', 'custom-provider']) {
      expect(
        buildThinkingModeRequestPlan({
          providerId,
          thinkingMode: 'enabled',
        })
      ).toEqual({ body: { reasoning_effort: 'medium' }, fallbackBody: undefined });
      expect(
        buildThinkingModeRequestPlan({
          providerId,
          thinkingMode: 'disabled',
        })
      ).toEqual({ body: { reasoning_effort: 'none' }, fallbackBody: undefined });
    }
  });

  it('applies an adapter after resolving a default model', () => {
    const resolvedModel = resolveModelString('default', 'deepseek/deepseek-chat');
    const { providerId } = parseModelString(resolvedModel);

    expect(buildThinkingModeRequestPlan({ providerId, thinkingMode: 'disabled' })).toEqual({
      body: { thinking: { type: 'disabled' } },
      fallbackBody: undefined,
    });
  });

  it('only falls back for reasoning disabled compatibility errors', () => {
    expect(
      shouldFallbackForReasoningError(
        new Error('Reasoning is mandatory for this endpoint and cannot be disabled.')
      )
    ).toBe(true);
    expect(shouldFallbackForReasoningError(new Error('Invalid API key'))).toBe(false);
  });
});
