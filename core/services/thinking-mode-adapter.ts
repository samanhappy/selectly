import { normalizeThinkingMode, type ThinkingMode } from '../config/thinking-mode';

interface ThinkingModeRequest {
  providerId: string;
  thinkingMode?: ThinkingMode;
}

export const buildThinkingModeRequestBody = ({
  providerId,
  thinkingMode,
}: ThinkingModeRequest): Record<string, unknown> => {
  const mode = normalizeThinkingMode(thinkingMode);
  if (mode === 'auto') return {};

  switch (providerId) {
    case 'deepseek':
      return { thinking: { type: mode } };
    case 'openrouter':
      if (mode === 'enabled') {
        return { reasoning: { enabled: true, exclude: true } };
      }
      return { reasoning: { exclude: true } };
    case 'siliconflow':
      return { enable_thinking: mode === 'enabled' };
    default:
      return { reasoning_effort: mode === 'enabled' ? 'medium' : 'none' };
  }
};
