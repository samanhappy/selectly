import { describe, expect, it } from 'vitest';

import { parseModelString, resolveModelString } from '../config/model-resolution';
import { buildThinkingModeRequestBody } from './thinking-mode-adapter';

describe('buildThinkingModeRequestBody', () => {
  it('omits extra parameters when mode is auto', () => {
    expect(
      buildThinkingModeRequestBody({
        providerId: 'deepseek',
        modelName: 'deepseek-chat',
        thinkingMode: 'auto',
      })
    ).toEqual({});
  });

  it('maps DeepSeek modes to the thinking object', () => {
    expect(
      buildThinkingModeRequestBody({
        providerId: 'deepseek',
        modelName: 'deepseek-chat',
        thinkingMode: 'enabled',
      })
    ).toEqual({ thinking: { type: 'enabled' } });
    expect(
      buildThinkingModeRequestBody({
        providerId: 'deepseek',
        modelName: 'deepseek-chat',
        thinkingMode: 'disabled',
      })
    ).toEqual({ thinking: { type: 'disabled' } });
  });

  it('maps OpenRouter modes without returning reasoning content', () => {
    expect(
      buildThinkingModeRequestBody({
        providerId: 'openrouter',
        modelName: 'deepseek/deepseek-r1',
        thinkingMode: 'enabled',
      })
    ).toEqual({ reasoning: { enabled: true, exclude: true } });
    expect(
      buildThinkingModeRequestBody({
        providerId: 'openrouter',
        modelName: 'deepseek/deepseek-r1',
        thinkingMode: 'disabled',
      })
    ).toEqual({ reasoning: { effort: 'none' } });
  });

  it('maps SiliconFlow modes only for models on the official allowlist', () => {
    expect(
      buildThinkingModeRequestBody({
        providerId: 'siliconflow',
        modelName: 'deepseek-ai/DeepSeek-V3.2',
        thinkingMode: 'enabled',
      })
    ).toEqual({ enable_thinking: true });
    expect(
      buildThinkingModeRequestBody({
        providerId: 'siliconflow',
        modelName: 'deepseek-ai/DeepSeek-V3.2',
        thinkingMode: 'disabled',
      })
    ).toEqual({ enable_thinking: false });
    expect(
      buildThinkingModeRequestBody({
        providerId: 'siliconflow',
        modelName: 'deepseek-ai/unsupported-model',
        thinkingMode: 'enabled',
      })
    ).toEqual({});
  });

  it('silently ignores providers without a first-party adapter', () => {
    for (const providerId of ['openai', 'anthropic', 'custom-provider']) {
      expect(
        buildThinkingModeRequestBody({
          providerId,
          modelName: 'any-model',
          thinkingMode: 'enabled',
        })
      ).toEqual({});
    }
  });

  it('applies an adapter after resolving a default model', () => {
    const resolvedModel = resolveModelString('default', 'deepseek/deepseek-chat');
    const { providerId, modelName } = parseModelString(resolvedModel);

    expect(
      buildThinkingModeRequestBody({ providerId, modelName, thinkingMode: 'disabled' })
    ).toEqual({
      thinking: { type: 'disabled' },
    });
  });
});
