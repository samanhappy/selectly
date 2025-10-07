import OpenAI from 'openai';

import type { LLMProvider } from '../config/llm-config';

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  contextWindow?: number;
  pricing?: {
    input: number;
    output: number;
  };
}

export class ModelService {
  private static instance: ModelService;
  private modelCache: Map<string, ModelInfo[]> = new Map();

  static getInstance(): ModelService {
    if (!ModelService.instance) {
      ModelService.instance = new ModelService();
    }
    return ModelService.instance;
  }

  /**
   * Load available models from a provider's /models endpoint
   */
  async loadModels(provider: LLMProvider): Promise<ModelInfo[]> {
    const cacheKey = `${provider.id}_${provider.baseURL}`;

    // Return cached models if available
    if (this.modelCache.has(cacheKey)) {
      return this.modelCache.get(cacheKey)!;
    }

    try {
      const client = new OpenAI({
        apiKey: provider.apiKey,
        baseURL: provider.baseURL,
        dangerouslyAllowBrowser: true,
      });

      const response = await client.models.list();
      const models: ModelInfo[] = response.data.map((model) => ({
        id: model.id,
        name: model.id,
        description: model.id,
        contextWindow: undefined,
      }));

      // Cache the results
      this.modelCache.set(cacheKey, models);
      return models;
    } catch (error) {
      console.error(`Failed to load models from ${provider.name}:`, error);
    }
  }

  /**
   * Clear the model cache for a specific provider
   */
  clearCache(provider?: LLMProvider): void {
    if (provider) {
      const cacheKey = `${provider.id}_${provider.baseURL}`;
      this.modelCache.delete(cacheKey);
    } else {
      this.modelCache.clear();
    }
  }

  /**
   * Get all available models from all enabled providers
   */
  async getAllAvailableModels(enabledProviders: LLMProvider[]): Promise<
    Array<{
      provider: LLMProvider;
      models: ModelInfo[];
    }>
  > {
    const results = await Promise.allSettled(
      enabledProviders.map(async (provider) => ({
        provider,
        models: await this.loadModels(provider),
      }))
    );

    return results
      .filter(
        (
          result
        ): result is PromiseFulfilledResult<{
          provider: LLMProvider;
          models: ModelInfo[];
        }> => result.status === 'fulfilled'
      )
      .map((result) => result.value);
  }
}

export const modelService = ModelService.getInstance();
