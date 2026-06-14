import { createLogger, setLogLevel } from '../../utils/logger';
import { i18n } from '../i18n';
import type { I18nConfig, SupportedLanguage } from '../i18n/types';
import { secureStorage } from '../storage/secure-storage';
import { parseModelString, resolveModelString } from './model-resolution';
import {
  migrateFunctionModelSettings,
  normalizeModelCallSettings,
  type ModelCallSettings,
  type ThinkingMode,
} from './thinking-mode';

export type { ModelCallSettings, ThinkingMode } from './thinking-mode';

const logger = createLogger('ConfigManager');

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
  defaultModelSettings?: ModelCallSettings;
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
  isPremium?: boolean;
  requiresAI?: boolean;
  modelSettings?: ModelCallSettings;
  /** @deprecated Use modelSettings.thinkingMode instead. */
  thinkingMode?: ThinkingMode;
  targetLanguage?: string;
  searchEngine?: 'google' | 'bing' | 'baidu';
  highlightColor?: string;
}

export interface GeneralConfig {
  language: SupportedLanguage;
  buttonPosition: 'above' | 'below';
  showReadingProgressBar?: boolean;
  readingProgressBarColor?: string;
  autoSaveReadingProgress?: boolean;
  autoRestoreReadingProgress?: boolean;
  readingProgressRetentionDays?: number;
  readingProgressListMode?: 'blacklist' | 'whitelist';
  readingProgressBlacklist?: string[];
  readingProgressWhitelist?: string[];
  useSystemReadingProgressBlacklist?: boolean;
  useSystemReadingProgressWhitelist?: boolean;
  debugEnabled?: boolean;
}

export interface UserConfig {
  general: GeneralConfig;
  llm: LLMConfig;
  functions: Record<string, FunctionConfig>;
  functionOrder?: string[];
}

const BUILT_IN_FUNCTION_KEYS = new Set([
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
]);

export const getFunctionDisplayFields = (
  functionKey: string,
  config: FunctionConfig,
  i18nConfig: I18nConfig = i18n.getConfig()
): { title: string; description: string } => {
  const localeEntry = (i18nConfig?.defaultFunctions as Record<string, any>)?.[functionKey];
  const isBuiltIn = config?.isBuiltIn ?? BUILT_IN_FUNCTION_KEYS.has(functionKey);

  if (isBuiltIn && localeEntry) {
    return {
      title: localeEntry.title || config?.title || functionKey,
      description: localeEntry.description || config?.description || '',
    };
  }

  return {
    title: config?.title || functionKey,
    description: config?.description || '',
  };
};

export const DEFAULT_HIGHLIGHT_COLOR = 'rgba(255, 204, 0, 0.24)';

export const SYSTEM_READING_PROGRESS_BLACKLIST = [
  'x.com',
  'twitter.com',
  'youtube.com',
  'twitch.tv',
  'linkedin.com',
  'instagram.com',
  'tiktok.com',
  'pinterest.com',
  'reddit.com',
  'bilibili.com',
  'weibo.com',
  'zhihu.com',
  'facebook.com',
  'google.com',
  'baidu.com',
];

export const SYSTEM_READING_PROGRESS_WHITELIST = [];

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
      showReadingProgressBar: true,
      readingProgressBarColor: '#60a5fa',
      autoSaveReadingProgress: true,
      autoRestoreReadingProgress: true,
      readingProgressRetentionDays: 30,
      readingProgressListMode: 'whitelist',
      readingProgressBlacklist: [],
      readingProgressWhitelist: [],
      useSystemReadingProgressBlacklist: true,
      useSystemReadingProgressWhitelist: true,
      debugEnabled: false,
    },
    llm: {
      defaultModel: '',
      providers,
      defaultModelSettings: { thinkingMode: 'auto' },
    },
    functions: {
      highlight: {
        title: config.defaultFunctions.highlight.title,
        description: config.defaultFunctions.highlight.description,
        icon: 'highlight',
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
        highlightColor: DEFAULT_HIGHLIGHT_COLOR,
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
        modelSettings: { thinkingMode: 'auto' },
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
        modelSettings: { thinkingMode: 'auto' },
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
        modelSettings: { thinkingMode: 'auto' },
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
        modelSettings: { thinkingMode: 'auto' },
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
        modelSettings: { thinkingMode: 'auto' },
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
    showReadingProgressBar: true,
    readingProgressBarColor: '#60a5fa',
    autoSaveReadingProgress: true,
    autoRestoreReadingProgress: true,
    readingProgressRetentionDays: 30,
    readingProgressListMode: 'whitelist',
    readingProgressBlacklist: [],
    readingProgressWhitelist: [],
    useSystemReadingProgressBlacklist: true,
    useSystemReadingProgressWhitelist: true,
    debugEnabled: false,
  },
  llm: {
    defaultModel: '',
    providers: {},
    defaultModelSettings: { thinkingMode: 'auto' },
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
      logger.warn('Failed to load config:', error);
      this.config = await getDefaultConfig();
    }

    if (this.config.general?.language) {
      await i18n.setLanguage(this.config.general.language);
    }

    // Apply debug log level from config
    setLogLevel(
      this.config.general?.debugEnabled
        ? 'debug'
        : process.env.NODE_ENV === 'production'
          ? 'warn'
          : 'debug'
    );

    // Listen for config changes from other contexts
    this.startListening();

    return this.config;
  }

  async saveConfig(newConfig: Partial<UserConfig>): Promise<void> {
    this.config = this.mergeConfig(this.config, newConfig, true);
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await secureStorage.set({ userConfig: this.config });
      }
      // Apply debug log level from config
      setLogLevel(
        this.config.general?.debugEnabled
          ? 'debug'
          : process.env.NODE_ENV === 'production'
            ? 'warn'
            : 'debug'
      );
    } catch (error) {
      logger.error('Failed to save config:', error);
    }
  }

  getConfig(): UserConfig {
    return this.config;
  }

  /**
   * Start listening for storage changes to react to config updates from other contexts
   */
  private startListening(): void {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      secureStorage.onChanged((changes) => {
        if (changes.userConfig?.newValue) {
          const newConfig = changes.userConfig.newValue as UserConfig;
          this.config = newConfig;
          setLogLevel(
            newConfig.general?.debugEnabled
              ? 'debug'
              : process.env.NODE_ENV === 'production'
                ? 'warn'
                : 'debug'
          );
        }
      });
    }
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
      logger.info('Migrating old config format to new provider-based format');

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

      logger.info('Migration completed');
      return migratedConfig;
    }

    return oldConfig;
  }

  private mergeConfig(old: UserConfig, override: any, forceReplace?: boolean): UserConfig {
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

    const overrideFunctions = override.functions || {};
    const normalizedFunctions: Record<string, FunctionConfig> = Object.fromEntries(
      Object.entries(mergedFunctions).map(([key, fn]) => {
        const overrideFunction = overrideFunctions[key];
        const isBuiltIn = fn.isBuiltIn ?? builtInKeys.includes(key);
        const requiresAI = fn.requiresAI ?? !nonAIKeys.includes(key);
        const modelSettings = migrateFunctionModelSettings(key, {
          isBuiltIn,
          modelSettings:
            overrideFunction?.modelSettings ?? (forceReplace ? fn.modelSettings : undefined),
          thinkingMode: fn.thinkingMode,
        });
        const { thinkingMode, ...functionWithoutLegacyThinkingMode } = fn;
        return [
          key,
          {
            ...functionWithoutLegacyThinkingMode,
            isBuiltIn,
            requiresAI,
            ...(requiresAI ? { modelSettings } : {}),
          },
        ];
      })
    );

    return {
      general: { ...old.general, ...override.general },
      llm: {
        defaultModel: override.llm?.defaultModel ?? old.llm?.defaultModel,
        providers: mergedProviders,
        defaultModelSettings: normalizeModelCallSettings(
          override.llm?.defaultModelSettings ?? old.llm?.defaultModelSettings
        ),
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
    return resolveModelString(functionModel, this.config.llm.defaultModel);
  }

  /**
   * Parse a model string into provider and model components
   * Format: "providerId/modelName"
   */
  parseModel(modelString: string): { providerId: string; modelName: string } {
    return parseModelString(modelString);
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
