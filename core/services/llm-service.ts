import OpenAI from 'openai';

import { authService } from '~core/auth/auth-service';

import type { LLMConfig, LLMProvider } from '../config/llm-config';
import { CLOUD_PROVIDER, ConfigManager } from '../config/llm-config';
import { i18n, t } from '../i18n';

export class LLMService {
  private static instance: LLMService;
  private clients: Map<string, OpenAI> = new Map();
  private configManager: ConfigManager;

  static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  constructor() {
    this.configManager = ConfigManager.getInstance();
  }

  /**
   * Configure the service with the latest config
   */
  async configure(config: LLMConfig): Promise<void> {
    console.log('Configuring LLMService with config:', config);
    // Clear existing clients
    this.clients.clear();

    // Create clients for all enabled providers
    Object.values(config.providers).forEach((provider) => {
      if (provider.enabled && provider.apiKey) {
        this.clients.set(
          provider.id,
          new OpenAI({
            apiKey: provider.apiKey,
            baseURL: provider.baseURL,
            dangerouslyAllowBrowser: true,
          })
        );
      }
    });

    await authService.initialize();
    const token = await authService.getAccessToken();
    console.log('Configuring LLMService with token:', token ? '***' : 'no token');
    this.clients.set(
      'cloud',
      new OpenAI({
        apiKey: token || '',
        baseURL: CLOUD_PROVIDER.baseURL,
        dangerouslyAllowBrowser: true,
      })
    );
  }

  /**
   * Get OpenAI client for a specific provider
   */
  private getClient(providerId: string): OpenAI {
    const client = this.clients.get(providerId);
    if (!client) {
      throw new Error(`Provider ${providerId} is not configured or enabled`);
    }
    return client;
  }

  /**
   * Parse model string and get the appropriate client and model name
   */
  private parseModelAndGetClient(modelString: string): {
    client: OpenAI;
    modelName: string;
    providerId: string;
  } {
    const resolvedModel = this.configManager.resolveModel(modelString);
    const { providerId, modelName } = this.configManager.parseModel(resolvedModel);
    const client = this.getClient(providerId);

    return { client, modelName, providerId };
  }

  async chat(prompt: string, model?: string): Promise<string> {
    const modelToUse = model || this.configManager.getConfig().llm.defaultModel;
    const { client, modelName } = this.parseModelAndGetClient(modelToUse);
    console.log('Using model:', modelName);

    try {
      const response = await client.chat.completions.create({
        model: modelName,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from LLM');
      }

      return content.trim();
    } catch (error: any) {
      console.error('LLM service error:', error);

      // Provide friendlier error message
      if (error.status === 401) {
        throw new Error(i18n.t('errors.invalidApiKey'));
      } else if (error.status === 429) {
        throw new Error(i18n.t('errors.rateLimitExceeded'));
      } else if (error.status === 500) {
        throw new Error(i18n.t('errors.serverError'));
      } else if (error.message?.includes('network')) {
        throw new Error(i18n.t('errors.networkError'));
      } else {
        throw new Error(
          `${i18n.t('errors.llmServiceError')}: ${error.message || i18n.t('errors.unknownError')}`
        );
      }
    }
  }

  /**
   * Stream chat completion.
   * Backwards compatible: legacy single string prompt still supported (sent as single user message).
   * New preferred usage: pass an array of messages including an initial system message for chat mode.
   */
  async chatStream(
    messagesOrPrompt: string | Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    onChunk: (chunk: string, model: string) => void,
    model?: string
  ): Promise<void> {
    const modelToUse = model || this.configManager.getConfig().llm.defaultModel;
    const { client, modelName } = this.parseModelAndGetClient(modelToUse);
    console.log('Using model:', modelName);

    try {
      const messages =
        typeof messagesOrPrompt === 'string'
          ? [{ role: 'user' as const, content: messagesOrPrompt }]
          : messagesOrPrompt.map((m) => ({ role: m.role, content: m.content }));

      const stream = await client.chat.completions.create({
        model: modelName,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: true,
      });

      for await (const chunk of stream) {
        // console.log("Received chunk:", chunk)
        const model = chunk.model;
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          onChunk(content, model);
        }
      }
    } catch (error: any) {
      console.error('LLM stream service error:', error);

      // Provide friendlier error message
      if (error.status === 401) {
        throw new Error(i18n.t('errors.invalidApiKey'));
      } else if (error.status === 429) {
        throw new Error(i18n.t('errors.rateLimitExceeded'));
      } else if (error.status === 500) {
        throw new Error(i18n.t('errors.serverError'));
      } else if (error.message?.includes('network')) {
        throw new Error(i18n.t('errors.networkError'));
      } else {
        if (client === this.clients.get('default')) {
          throw new Error(`${i18n.t('errors.llmDefaultServiceError')}`);
        }
        throw new Error(`${i18n.t('errors.llmStreamingServiceError')}`);
      }
    }
  }

  isConfigured(): boolean {
    const config = this.configManager.getConfig();
    const enabledProviders = this.configManager.getEnabledProviders();
    return enabledProviders.length > 0 && !!config.llm.defaultModel;
  }

  getConfig(): LLMConfig {
    return this.configManager.getConfig().llm;
  }

  /**
   * Test connection to a specific provider
   */
  async testProvider(provider: LLMProvider): Promise<boolean> {
    try {
      const client = new OpenAI({
        apiKey: provider.apiKey,
        baseURL: provider.baseURL,
        dangerouslyAllowBrowser: true,
      });

      await client.models.list();

      return true;
    } catch (error) {
      console.error(`Provider test failed for ${provider.name}:`, error);
      return false;
    }
  }
}

// Text processing utility functions with enhanced variable support
export const processText = (
  text: string,
  prompt: string,
  variables?: Record<string, string>
): string => {
  let processedPrompt = prompt.replace('{text}', text);

  // Replace additional variables if provided
  if (variables) {
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      processedPrompt = processedPrompt.replace(
        new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        value
      );
    });
  }

  return processedPrompt;
};

// Quick test API connection
export const testConnection = async (config: LLMConfig): Promise<boolean> => {
  try {
    const testService = new LLMService();
    await testService.configure(config);
    await testService.chat(
      'Hello, please respond with "OK" if you can see this message.',
      config.defaultModel
    );
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
};
