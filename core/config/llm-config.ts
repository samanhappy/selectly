import { i18n } from '../i18n';
import type { SupportedLanguage } from '../i18n/types';
import { secureStorage } from '../storage/secure-storage';

export interface LLMProvider {
  id: string;
  name: string;
  baseURL: string;
  apiKey: string;
  enabled: boolean;
  isBuiltIn: boolean;
  testStatus?: 'idle' | 'testing' | 'success' | 'error';
  /** Official website URL for getting API keys */
  websiteURL?: string;
}

export interface LLMConfig {
  defaultModel: string;
  providers: Record<string, LLMProvider>;
}

export interface FunctionConfig {
  title: string;
  description: string;
  icon: string;
  model: string;
  prompt: string;
  autoExecute: boolean;
  autoExecuteDomains?: string[];
  autoCloseButtons: boolean;
  autoCloseResult?: boolean;
  collapsed?: boolean;
  enabled: boolean;
  displayDomains?: string[];
  isBuiltIn?: boolean;
  requiresAI?: boolean;
  targetLanguage?: string;
  searchEngine?: 'google' | 'bing' | 'baidu';
  highlightColor?: string;
}

export interface GeneralConfig {
  language: SupportedLanguage;
  buttonPosition: 'above' | 'below';
}

export interface UserConfig {
  general: GeneralConfig;
  llm: LLMConfig;
  functions: Record<string, FunctionConfig>;
  functionOrder?: string[];
}

export const CLOUD_PROVIDER: LLMProvider = {
  id: 'cloud',
  name: 'Cloud',
  baseURL: `${process.env.PLASMO_PUBLIC_API_URI}/api`,
  apiKey: '',
  isBuiltIn: true,
  enabled: true,
  websiteURL: 'https://www.selectly.app',
};

// Built-in LLM Providers
export const BUILT_IN_PROVIDERS: Record<
  string,
  Omit<LLMProvider, 'apiKey' | 'enabled' | 'testStatus'>
> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    isBuiltIn: true,
    websiteURL: 'https://platform.openai.com/api-keys',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    baseURL: 'https://api.anthropic.com/v1',
    isBuiltIn: true,
    websiteURL: 'https://console.anthropic.com/settings/keys',
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    isBuiltIn: true,
    websiteURL: 'https://platform.deepseek.com/api_keys',
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    baseURL: 'https://openrouter.ai/api/v1',
    isBuiltIn: true,
    websiteURL: 'https://openrouter.ai/settings/keys',
  },
  siliconflow: {
    id: 'siliconflow',
    name: 'SiliconFlow',
    baseURL: 'https://api.siliconflow.cn/v1',
    isBuiltIn: true,
    websiteURL: 'https://cloud.siliconflow.cn/account/ak',
  },
};

export const getDefaultConfig = async (): Promise<UserConfig> => {
  await i18n.initialize();
  const config = i18n.getConfig();

  // Initialize built-in providers with default values
  const providers: Record<string, LLMProvider> = {};
  Object.values(BUILT_IN_PROVIDERS).forEach((provider) => {
    providers[provider.id] = {
      ...provider,
      apiKey: '',
      enabled: false,
      testStatus: 'idle',
    };
  });

  return {
    general: {
      language: i18n.getCurrentLanguage(),
      buttonPosition: 'above',
    },
    llm: {
      defaultModel: '',
      providers,
    },
    functions: {
      highlight: {
        title: config.defaultFunctions.highlight.title,
        description: config.defaultFunctions.highlight.description,
        icon: 'pencilline',
        model: 'default',
        prompt: config.defaultFunctions.highlight.prompt,
        autoExecute: false,
        autoExecuteDomains: [],
        autoCloseButtons: true,
        autoCloseResult: true,
        collapsed: false,
        enabled: true,
        displayDomains: [],
        isBuiltIn: true,
        requiresAI: false,
        highlightColor: '#fff59d',
      },
      translate: {
        title: config.defaultFunctions.translate.title,
        description: config.defaultFunctions.translate.description,
        icon: 'translate',
        model: 'default',
        prompt: config.defaultFunctions.translate.prompt,
        autoExecute: false,
        autoExecuteDomains: [],
        autoCloseButtons: true,
        autoCloseResult: true,
        collapsed: false,
        enabled: true,
        displayDomains: [],
        isBuiltIn: true,
        requiresAI: true,
      },
      polish: {
        title: config.defaultFunctions.polish.title,
        description: config.defaultFunctions.polish.description,
        icon: 'polish',
        model: 'default',
        prompt: config.defaultFunctions.polish.prompt,
        autoExecute: false,
        autoExecuteDomains: [],
        autoCloseButtons: true,
        autoCloseResult: true,
        collapsed: false,
        enabled: true,
        displayDomains: [],
        isBuiltIn: true,
        requiresAI: true,
      },
      explain: {
        title: config.defaultFunctions.explain.title,
        description: config.defaultFunctions.explain.description,
        icon: 'explain',
        model: 'default',
        prompt: config.defaultFunctions.explain.prompt,
        autoExecute: false,
        autoExecuteDomains: [],
        autoCloseButtons: true,
        autoCloseResult: true,
        collapsed: false,
        enabled: true,
        displayDomains: [],
        isBuiltIn: true,
        requiresAI: true,
      },
      correct: {
        title: config.defaultFunctions.correct.title,
        description: config.defaultFunctions.correct.description,
        icon: 'correct',
        model: 'default',
        prompt: config.defaultFunctions.correct.prompt,
        autoExecute: false,
        autoExecuteDomains: [],
        autoCloseButtons: true,
        autoCloseResult: true,
        collapsed: true,
        enabled: true,
        displayDomains: [],
        isBuiltIn: true,
        requiresAI: true,
      },
      copy: {
        title: config.defaultFunctions.copy.title,
        description: config.defaultFunctions.copy.description,
        icon: 'copy',
        model: 'default',
        prompt: config.defaultFunctions.copy.prompt,
        autoExecute: false,
        autoExecuteDomains: [],
        autoCloseButtons: false,
        autoCloseResult: true,
        collapsed: false,
        enabled: true,
        displayDomains: [],
        isBuiltIn: true,
        requiresAI: false,
      },
      search: {
        title: config.defaultFunctions.search.title,
        description: config.defaultFunctions.search.description,
        icon: 'search',
        model: 'default',
        prompt: config.defaultFunctions.search.prompt,
        autoExecute: false,
        autoExecuteDomains: [],
        autoCloseButtons: true,
        autoCloseResult: true,
        collapsed: true,
        enabled: true,
        displayDomains: [],
        isBuiltIn: true,
        requiresAI: false,
        searchEngine: 'google',
      },
      open: {
        title: config.defaultFunctions.open.title,
        description: config.defaultFunctions.open.description,
        icon: 'open',
        model: 'default',
        prompt: config.defaultFunctions.open.prompt,
        autoExecute: false,
        autoExecuteDomains: [],
        autoCloseButtons: true,
        autoCloseResult: true,
        collapsed: true,
        enabled: true,
        displayDomains: [],
        isBuiltIn: true,
        requiresAI: false,
      },
      collect: {
        title: config.defaultFunctions.collect?.title || 'Collect',
        description:
          config.defaultFunctions.collect?.description || 'Save selected text to collections',
        icon: 'bookmark',
        model: 'default',
        prompt: config.defaultFunctions.collect?.prompt || '{text}',
        autoExecute: false,
        autoExecuteDomains: [],
        autoCloseButtons: false,
        autoCloseResult: true,
        collapsed: false,
        enabled: true,
        displayDomains: [],
        isBuiltIn: true,
        requiresAI: false,
      },
      chat: {
        title: config.defaultFunctions.chat.title,
        description: config.defaultFunctions.chat.description,
        icon: 'chat',
        model: 'default',
        prompt: config.defaultFunctions.chat.prompt,
        autoExecute: false,
        autoExecuteDomains: [],
        autoCloseButtons: true,
        autoCloseResult: false,
        collapsed: false,
        enabled: true,
        displayDomains: [],
        isBuiltIn: true,
        requiresAI: true,
      },
      share: {
        title: config.defaultFunctions.share.title,
        description: config.defaultFunctions.share.description,
        icon: 'share',
        model: 'default',
        prompt: config.defaultFunctions.share.prompt,
        autoExecute: false,
        autoExecuteDomains: [],
        autoCloseButtons: true,
        autoCloseResult: true,
        collapsed: true,
        enabled: true,
        displayDomains: [],
        isBuiltIn: true,
        requiresAI: false,
      },
    },
    functionOrder: [
      'highlight',
      'translate',
      'polish',
      'explain',
      'correct',
      'chat',
      'copy',
      'collect',
      'search',
      'open',
      'share',
    ],
  };
};

// Default configuration (sync version for backward compatibility)
export const DEFAULT_CONFIG: UserConfig = {
  general: {
    language: 'en',
    buttonPosition: 'above',
  },
  llm: {
    defaultModel: '',
    providers: {},
  },
  functions: {},
  functionOrder: [],
};

// Configuration manager class
export class ConfigManager {
  private static instance: ConfigManager;
  private config: UserConfig;

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  async loadConfig(): Promise<UserConfig> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await secureStorage.get(['userConfig']);
        if (result.userConfig) {
          const defaultConfig = await getDefaultConfig();
          // Migrate old config format if necessary
          const migratedConfig = this.migrateConfig(result.userConfig);
          this.config = this.mergeConfig(defaultConfig, migratedConfig);
        } else {
          this.config = await getDefaultConfig();
        }
      } else {
        this.config = await getDefaultConfig();
      }
    } catch (error) {
      console.warn('Failed to load config:', error);
      this.config = await getDefaultConfig();
    }

    if (this.config.general?.language) {
      await i18n.setLanguage(this.config.general.language);
    }

    return this.config;
  }

  async saveConfig(newConfig: Partial<UserConfig>): Promise<void> {
    this.config = this.mergeConfig(this.config, newConfig, true);
    // console.log("Saving config:", this.config)
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await secureStorage.set({ userConfig: this.config });
      }
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  getConfig(): UserConfig {
    return this.config;
  }

  /**
   * Migrate old config format to new format
   */
  private migrateConfig(oldConfig: any): any {
    // Check if this is an old format config (has llm.baseURL and llm.apiKey)
    if (
      oldConfig.llm &&
      typeof oldConfig.llm.baseURL === 'string' &&
      typeof oldConfig.llm.apiKey === 'string'
    ) {
      console.log('[ConfigManager] Migrating old config format to new provider-based format');

      const migratedConfig = { ...oldConfig };

      // Convert old LLM config to new provider-based format
      const oldLlm = oldConfig.llm;
      const providers: Record<string, LLMProvider> = {};

      // Initialize all built-in providers
      Object.values(BUILT_IN_PROVIDERS).forEach((provider) => {
        providers[provider.id] = {
          ...provider,
          apiKey: '',
          enabled: false,
          testStatus: 'idle',
        };
      });

      // Find matching provider or create custom one
      let targetProviderId = 'openai'; // default
      const baseURL = oldLlm.baseURL;

      // Try to match with built-in providers
      for (const [id, provider] of Object.entries(BUILT_IN_PROVIDERS)) {
        if (provider.baseURL === baseURL) {
          targetProviderId = id;
          break;
        }
      }

      // If no match found, create a custom provider
      if (targetProviderId === 'openai' && baseURL !== BUILT_IN_PROVIDERS.openai.baseURL) {
        targetProviderId = 'migrated_custom';
        providers[targetProviderId] = {
          id: targetProviderId,
          name: 'Migrated Custom Provider',
          baseURL: baseURL,
          apiKey: oldLlm.apiKey || '',
          enabled: !!oldLlm.apiKey,
          isBuiltIn: false,
          testStatus: 'idle',
        };
      } else {
        // Use the matched built-in provider
        providers[targetProviderId] = {
          ...providers[targetProviderId],
          apiKey: oldLlm.apiKey || '',
          enabled: !!oldLlm.apiKey,
        };
      }

      // Set up new LLM config
      migratedConfig.llm = {
        defaultModel: `${targetProviderId}/${oldLlm.model || 'default'}`,
        providers,
      };

      // Migrate function models from specific models to "default"
      if (migratedConfig.functions) {
        Object.keys(migratedConfig.functions).forEach((functionKey) => {
          if (
            migratedConfig.functions[functionKey].model &&
            migratedConfig.functions[functionKey].model !== 'default'
          ) {
            migratedConfig.functions[functionKey].model = 'default';
          }
        });
      }

      console.log('[ConfigManager] Migration completed');
      return migratedConfig;
    }

    return oldConfig;
  }

  private mergeConfig(old: UserConfig, override: any, forceReplace?: boolean): UserConfig {
    // console.log("Merging config:", { old, override, forceReplace })
    // Merge functions first
    const mergedFunctions: Record<string, FunctionConfig> = mergeFunction(
      old,
      override,
      forceReplace
    );

    // Merge providers
    const overrideProviders = override.llm?.providers || {};
    const mergedProviders: Record<string, LLMProvider> = {
      ...overrideProviders,
    };

    // Ensure all built-in providers exist
    Object.values(BUILT_IN_PROVIDERS).forEach((provider) => {
      if (!mergedProviders[provider.id]) {
        mergedProviders[provider.id] = {
          ...provider,
          apiKey: '',
          enabled: false,
          testStatus: 'idle',
        };
      }
    });

    // Derive function order
    const existingOrder: string[] =
      override.functionOrder || old.functionOrder || Object.keys(mergedFunctions);
    // Ensure all function keys present, append missing
    const completeOrder = [
      ...existingOrder.filter((k) => k in mergedFunctions),
      ...Object.keys(mergedFunctions).filter((k) => !existingOrder.includes(k)),
    ];

    // Normalize function flags for backward compatibility
    const builtInKeys = [
      'translate',
      'polish',
      'explain',
      'correct',
      'copy',
      'collect',
      'search',
      'open',
      'chat',
      'share',
      'highlight',
    ];
    const nonAIKeys = ['copy', 'search', 'open', 'share', 'highlight'];
    // Ensure collect is treated as non-AI by default
    if (!nonAIKeys.includes('collect')) nonAIKeys.push('collect');

    const normalizedFunctions: Record<string, FunctionConfig> = Object.fromEntries(
      Object.entries(mergedFunctions).map(([key, fn]) => {
        const isBuiltIn = fn.isBuiltIn ?? builtInKeys.includes(key);
        const requiresAI = fn.requiresAI ?? !nonAIKeys.includes(key);
        return [key, { ...fn, isBuiltIn, requiresAI }];
      })
    );

    return {
      general: { ...old.general, ...override.general },
      llm: {
        defaultModel: override.llm?.defaultModel ?? old.llm?.defaultModel,
        providers: mergedProviders,
      },
      functions: normalizedFunctions,
      functionOrder: completeOrder,
    };
  }

  // Utility methods for working with providers and models

  /**
   * Get the actual model string for a function's model setting
   * Resolves "default" to the system default model
   */
  resolveModel(functionModel: string): string {
    if (functionModel === 'default') {
      return this.config.llm.defaultModel;
    }
    return functionModel;
  }

  /**
   * Parse a model string into provider and model components
   * Format: "providerId/modelName"
   */
  parseModel(modelString: string): { providerId: string; modelName: string } {
    if (!modelString || modelString === 'default') {
      return { providerId: 'cloud', modelName: 'default' };
    }

    const parts = modelString.split('/');
    if (parts.length === 1) {
      throw new Error(
        `Invalid model format: ${modelString}. Expected format: "providerId/modelName"`
      );
    }
    return {
      providerId: parts[0],
      modelName: parts.slice(1).join('/'),
    };
  }

  /**
   * Get provider configuration by ID
   */
  getProvider(providerId: string): LLMProvider | null {
    return this.config.llm.providers[providerId] || null;
  }

  /**
   * Get all enabled providers
   */
  getEnabledProviders(): LLMProvider[] {
    // add cloud provider into the list header
    return [CLOUD_PROVIDER, ...Object.values(this.config.llm.providers).filter((p) => p.enabled)];
  }

  /**
   * Add or update a custom provider
   */
  async setProvider(provider: LLMProvider): Promise<void> {
    const newConfig: Partial<UserConfig> = {
      llm: {
        ...this.config.llm,
        providers: {
          ...this.config.llm.providers,
          [provider.id]: provider,
        },
      },
    };
    await this.saveConfig(newConfig);
  }

  /**
   * Remove a custom provider (built-in providers cannot be removed)
   */
  async removeProvider(providerId: string): Promise<void> {
    const provider = this.getProvider(providerId);
    if (!provider || provider.isBuiltIn) {
      throw new Error(`Cannot remove built-in provider: ${providerId}`);
    }

    const { [providerId]: removed, ...remainingProviders } = this.config.llm.providers;

    const newConfig: Partial<UserConfig> = {
      llm: {
        ...this.config.llm,
        providers: remainingProviders,
      },
    };
    await this.saveConfig(newConfig);
  }

  /**
   * Update provider test status
   */
  async updateProviderStatus(providerId: string, status: LLMProvider['testStatus']): Promise<void> {
    const provider = this.getProvider(providerId);
    if (!provider) return;

    await this.setProvider({ ...provider, testStatus: status });
  }
}
function mergeFunction(old: UserConfig, override: any, forceReplace: boolean) {
  if (forceReplace) {
    return override.functions || {};
  }

  const mergedFunctions: Record<string, FunctionConfig> = {
    ...old.functions,
    ...Object.keys(override.functions || {}).reduce(
      (acc, key) => {
        const overrideFunc = override.functions[key];
        const baseFunc = old.functions[key];
        // If isBuiltIn == true and doesn't exist in base.functions, skip (remove from override)
        if (overrideFunc.isBuiltIn && !baseFunc) {
          return acc;
        }

        acc[key] = {
          ...baseFunc,
          ...overrideFunc,
        };

        return acc;
      },
      {} as Record<string, FunctionConfig>
    ),
  };
  return mergedFunctions;
}
