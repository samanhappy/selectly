import { normalizeThinkingMode, type ThinkingMode } from '../config/thinking-mode';

interface ThinkingModeRequest {
  providerId: string;
  thinkingMode?: ThinkingMode;
  allowFallback?: boolean;
}

export interface ThinkingModeRequestPlan {
  body: Record<string, unknown>;
  fallbackBody?: Record<string, unknown>;
}

export const buildThinkingModeRequestPlan = ({
  providerId,
  thinkingMode,
  allowFallback,
}: ThinkingModeRequest): ThinkingModeRequestPlan => {
  const mode = normalizeThinkingMode(thinkingMode);
  if (mode === 'auto') return { body: {}, fallbackBody: undefined };

  switch (providerId) {
    case 'deepseek':
      return { body: { thinking: { type: mode } }, fallbackBody: undefined };
    case 'openrouter':
      if (mode === 'enabled') {
        return { body: { reasoning: { enabled: true, exclude: true } }, fallbackBody: undefined };
      }
      return {
        body: { reasoning: { effort: 'none' } },
        fallbackBody: allowFallback
          ? { reasoning: { effort: 'minimal', exclude: true } }
          : undefined,
      };
    case 'siliconflow':
      return { body: { enable_thinking: mode === 'enabled' }, fallbackBody: undefined };
    default:
      return {
        body: { reasoning_effort: mode === 'enabled' ? 'medium' : 'none' },
        fallbackBody: undefined,
      };
  }
};

export const shouldFallbackForReasoningError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error || '');
  return /reasoning/i.test(message) && /mandatory|cannot be disabled|disable/i.test(message);
};

export const buildThinkingModeRequestBody = (
  request: ThinkingModeRequest
): Record<string, unknown> => buildThinkingModeRequestPlan(request).body;
