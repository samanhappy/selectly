export type ThinkingMode = 'auto' | 'enabled' | 'disabled';

const BUILT_IN_FUNCTION_THINKING_MODES: Record<string, ThinkingMode> = {
  translate: 'disabled',
  polish: 'disabled',
  correct: 'disabled',
  explain: 'enabled',
  chat: 'enabled',
};

export const normalizeThinkingMode = (thinkingMode?: ThinkingMode): ThinkingMode =>
  thinkingMode ?? 'auto';

export const getDefaultThinkingModeForFunction = (
  functionKey: string,
  isBuiltIn: boolean
): ThinkingMode => {
  if (!isBuiltIn) return 'auto';
  return BUILT_IN_FUNCTION_THINKING_MODES[functionKey] ?? 'auto';
};

export const resolveFunctionThinkingMode = (
  functionKey: string,
  isBuiltIn: boolean,
  thinkingMode?: ThinkingMode
): ThinkingMode => thinkingMode ?? getDefaultThinkingModeForFunction(functionKey, isBuiltIn);
