import { CLOUD_PROVIDER, type UserConfig } from '../config/llm-config';
import { parseModelString } from '../config/model-resolution';

const CLOUD_DEFAULT_MODEL = `${CLOUD_PROVIDER.id}/default`;

export const isLLMConfigUsable = (config: UserConfig): boolean => {
  const modelString = config.llm.defaultModel || CLOUD_DEFAULT_MODEL;

  try {
    const { providerId, modelName } = parseModelString(modelString);
    if (!modelName) return false;
    if (providerId === CLOUD_PROVIDER.id) return true;

    const provider = config.llm.providers?.[providerId];
    return Boolean(provider?.enabled && provider.apiKey);
  } catch {
    return false;
  }
};
