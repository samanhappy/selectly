import { describe, expect, it } from 'vitest';

import { parseModelString, resolveModelString } from '../config/model-resolution';
import { buildThinkingModeRequestBody } from './thinking-mode-adapter';

describe('buildThinkingModeRequestBody', () => {
  it('omits extra parameters when mode is auto', () => {
    expect(
      buildThinkingModeRequestBody({
        providerId: 'deepseek',
        thinkingMode: 'auto',
      })
    ).toEqual({});
  });

  it('maps DeepSeek modes to the thinking object', () => {
    expect(
      buildThinkingModeRequestBody({
        providerId: 'deepseek',
        thinkingMode: 'enabled',
      })
    ).toEqual({ thinking: { type: 'enabled' } });
    expect(
      buildThinkingModeRequestBody({
        providerId: 'deepseek',
        thinkingMode: 'disabled',
      })
    ).toEqual({ thinking: { type: 'disabled' } });
  });

  it('maps OpenRouter modes without returning reasoning content', () => {
    expect(
      buildThinkingModeRequestBody({
        providerId: 'openrouter',
        thinkingMode: 'enabled',
      })
    ).toEqual({ reasoning: { enabled: true, exclude: true } });
    expect(
      buildThinkingModeRequestBody({
        providerId: 'openrouter',
        thinkingMode: 'disabled',
      })
    ).toEqual({ reasoning: { exclude: true } });
  });

  it('maps SiliconFlow modes without maintaining a model allowlist', () => {
    expect(
      buildThinkingModeRequestBody({
        providerId: 'siliconflow',
        thinkingMode: 'enabled',
      })
    ).toEqual({ enable_thinking: true });
    expect(
      buildThinkingModeRequestBody({
        providerId: 'siliconflow',
        thinkingMode: 'disabled',
      })
    ).toEqual({ enable_thinking: false });
  });

  it('uses the OpenAI standard for providers without a first-party adapter', () => {
    for (const providerId of ['openai', 'anthropic', 'cloud', 'custom-provider']) {
      expect(
        buildThinkingModeRequestBody({
          providerId,
          thinkingMode: 'enabled',
        })
      ).toEqual({ reasoning_effort: 'medium' });
      expect(
        buildThinkingModeRequestBody({
          providerId,
          thinkingMode: 'disabled',
        })
      ).toEqual({ reasoning_effort: 'none' });
    }
  });

  it('applies an adapter after resolving a default model', () => {
    const resolvedModel = resolveModelString('default', 'deepseek/deepseek-chat');
    const { providerId } = parseModelString(resolvedModel);

    expect(buildThinkingModeRequestBody({ providerId, thinkingMode: 'disabled' })).toEqual({
      thinking: { type: 'disabled' },
    });
  });
});
