import type { LLMProvider } from '../config/llm-config';
import { CLOUD_DEFAULT_TAB_MODEL } from '../tab-context/session-model';
import type { ModelInfo } from './model-service';

export interface ModelChoice {
  value: string;
  label: string;
  providerName: string;
  description?: string;
}

export const getModelNameFromString = (modelString: string) => {
  const parts = modelString.split('/');
  return parts.length > 1 ? parts.slice(1).join('/') : modelString || 'default';
};

const createFallbackChoice = (modelString: string, providers: LLMProvider[]): ModelChoice => {
  const providerId = modelString.split('/')[0] || 'cloud';
  const providerName =
    providers.find((provider) => provider.id === providerId)?.name || providerId;
  return {
    value: modelString,
    label: getModelNameFromString(modelString),
    providerName,
  };
};

export const buildModelChoices = (
  providerModels: Array<{ provider: LLMProvider; models: ModelInfo[] }>,
  requiredModel?: string
): ModelChoice[] => {
  const providers = providerModels.map(({ provider }) => provider);
  const choices: ModelChoice[] = providerModels.flatMap(({ provider, models }) =>
    models.map((model) => ({
      value: `${provider.id}/${model.id}`,
      label: model.name || model.id,
      providerName: provider.name,
      description: model.description,
    }))
  );

  const required = requiredModel || CLOUD_DEFAULT_TAB_MODEL;
  if (required && !choices.some((choice) => choice.value === required)) {
    choices.unshift(createFallbackChoice(required, providers));
  }

  if (choices.length === 0) {
    choices.push(createFallbackChoice(CLOUD_DEFAULT_TAB_MODEL, providers));
  }

  return Array.from(new Map(choices.map((choice) => [choice.value, choice])).values());
};

export const getModelChoiceLabel = (modelString: string, choices: ModelChoice[]) =>
  choices.find((choice) => choice.value === modelString)?.label ||
  getModelNameFromString(modelString);
