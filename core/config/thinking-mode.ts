export type ThinkingMode = 'auto' | 'enabled' | 'disabled';

export interface ModelCallSettings {
  thinkingMode: ThinkingMode;
}

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

export const normalizeModelCallSettings = (
  settings?: Partial<ModelCallSettings>
): ModelCallSettings => ({
  thinkingMode: normalizeThinkingMode(settings?.thinkingMode),
});

export const migrateFunctionModelSettings = (
  functionKey: string,
  config: {
    isBuiltIn?: boolean;
    modelSettings?: Partial<ModelCallSettings>;
    thinkingMode?: ThinkingMode;
  }
): ModelCallSettings => {
  if (config.modelSettings?.thinkingMode) {
    return normalizeModelCallSettings(config.modelSettings);
  }

  const isBuiltIn = config.isBuiltIn ?? true;
  if (!config.thinkingMode) {
    return { thinkingMode: 'auto' };
  }

  if (isBuiltIn && config.thinkingMode === getDefaultThinkingModeForFunction(functionKey, true)) {
    return { thinkingMode: 'auto' };
  }

  return { thinkingMode: config.thinkingMode };
};

export interface EffectiveThinkingModeRequest {
  functionKey: string;
  isBuiltIn: boolean;
  functionModel: string;
  functionModelSettings?: Partial<ModelCallSettings>;
  defaultModelSettings?: Partial<ModelCallSettings>;
}

export interface EffectiveThinkingMode {
  mode: ThinkingMode;
  allowFallback: boolean;
}

const isExplicitThinkingMode = (mode?: ThinkingMode): mode is 'enabled' | 'disabled' =>
  mode === 'enabled' || mode === 'disabled';

export const getEffectiveThinkingMode = ({
  functionKey,
  isBuiltIn,
  functionModel,
  functionModelSettings,
  defaultModelSettings,
}: EffectiveThinkingModeRequest): EffectiveThinkingMode => {
  const functionMode = normalizeThinkingMode(functionModelSettings?.thinkingMode);
  if (isExplicitThinkingMode(functionMode)) {
    return { mode: functionMode, allowFallback: false };
  }

  const defaultMode = normalizeThinkingMode(defaultModelSettings?.thinkingMode);
  if (functionModel === 'default' && isExplicitThinkingMode(defaultMode)) {
    return { mode: defaultMode, allowFallback: false };
  }

  return {
    mode: getDefaultThinkingModeForFunction(functionKey, isBuiltIn),
    allowFallback: true,
  };
};
