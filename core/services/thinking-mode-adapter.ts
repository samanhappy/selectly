import { normalizeThinkingMode, type ThinkingMode } from '../config/thinking-mode';

interface ThinkingModeRequest {
  providerId: string;
  modelName: string;
  thinkingMode?: ThinkingMode;
}

const SILICONFLOW_THINKING_MODELS = new Set([
  'Pro/zai-org/GLM-5',
  'Pro/zai-org/GLM-4.7',
  'deepseek-ai/DeepSeek-V3.2',
  'Pro/deepseek-ai/DeepSeek-V3.2',
  'zai-org/GLM-4.6',
  'Qwen/Qwen3-8B',
  'Qwen/Qwen3-14B',
  'Qwen/Qwen3-32B',
  'Qwen/Qwen3-30B-A3B',
  'zai-org/GLM-4.5V',
  'deepseek-ai/DeepSeek-V3.1-Terminus',
  'Pro/deepseek-ai/DeepSeek-V3.1-Terminus',
  'Qwen/Qwen3.5-397B-A17B',
  'Qwen/Qwen3.5-122B-A10B',
  'Qwen/Qwen3.5-35B-A3B',
  'Qwen/Qwen3.5-27B',
  'Qwen/Qwen3.5-9B',
  'Qwen/Qwen3.5-4B',
]);

export const buildThinkingModeRequestBody = ({
  providerId,
  modelName,
  thinkingMode,
}: ThinkingModeRequest): Record<string, unknown> => {
  const mode = normalizeThinkingMode(thinkingMode);
  if (mode === 'auto') return {};

  switch (providerId) {
    case 'deepseek':
      return { thinking: { type: mode } };
    case 'openrouter':
      return mode === 'enabled'
        ? { reasoning: { enabled: true, exclude: true } }
        : { reasoning: { effort: 'none' } };
    case 'siliconflow':
      if (!SILICONFLOW_THINKING_MODELS.has(modelName)) return {};
      return { enable_thinking: mode === 'enabled' };
    default:
      return {};
  }
};
