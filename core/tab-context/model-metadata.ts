import type { ModelMetadataOverride } from './types';

export type ModelMetadataOverrides = Record<string, ModelMetadataOverride>;

export const sanitizeModelMetadataOverride = (
  override?: ModelMetadataOverride
): ModelMetadataOverride => {
  const contextWindow = override?.contextWindow;
  if (!contextWindow || !Number.isFinite(contextWindow) || contextWindow <= 0) {
    return {};
  }

  return { contextWindow: Math.floor(contextWindow) };
};

export const getModelContextWindow = ({
  modelString,
  providerContextWindow,
  overrides,
}: {
  modelString: string;
  providerContextWindow?: number;
  overrides?: ModelMetadataOverrides;
}): number | undefined => {
  const override = sanitizeModelMetadataOverride(overrides?.[modelString]);
  return override.contextWindow || providerContextWindow;
};
