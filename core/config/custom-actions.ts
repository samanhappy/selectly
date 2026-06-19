import type { FunctionConfig } from './llm-config';

export const FREE_CUSTOM_ACTION_LIMIT = 3;

export const isCustomFunctionConfig = (config?: FunctionConfig): boolean => {
  if (!config) return false;
  return config.isBuiltIn !== true;
};

export const getCustomFunctionKeys = (functions: Record<string, FunctionConfig>): string[] => {
  return Object.entries(functions)
    .filter(([, config]) => isCustomFunctionConfig(config))
    .map(([key]) => key);
};

export const getCustomFunctionCount = (functions: Record<string, FunctionConfig>): number => {
  return getCustomFunctionKeys(functions).length;
};

export const getRemainingCustomFunctionSlots = (
  functions: Record<string, FunctionConfig>,
  isSubscribed: boolean
): number => {
  if (isSubscribed) return Number.POSITIVE_INFINITY;
  return Math.max(FREE_CUSTOM_ACTION_LIMIT - getCustomFunctionCount(functions), 0);
};

export const canAddCustomFunctions = (
  functions: Record<string, FunctionConfig>,
  isSubscribed: boolean,
  count = 1
): boolean => {
  return getRemainingCustomFunctionSlots(functions, isSubscribed) >= count;
};
