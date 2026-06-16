import { CLOUD_PROVIDER, ConfigManager } from '../config/llm-config';
import { parseModelString } from '../config/model-resolution';
import { getContextBudget } from '../tab-context/budget';
import type { TabAssistantLaunchIntent } from '../tab-context/launch-intent';
import { getModelContextWindow } from '../tab-context/model-metadata';
import type { ModelContextBudget, TabContextSnapshot } from '../tab-context/types';
import { modelService } from './model-service';

export interface ActiveTabInfo {
  id: number;
  title?: string;
  url?: string;
  windowId?: number;
}

export class TabContextService {
  private static instance: TabContextService;
  private configManager = ConfigManager.getInstance();

  static getInstance(): TabContextService {
    if (!TabContextService.instance) {
      TabContextService.instance = new TabContextService();
    }
    return TabContextService.instance;
  }

  async getActiveTab(): Promise<ActiveTabInfo | null> {
    const res = await chrome.runtime.sendMessage({ action: 'tabContext:getActiveTab' });
    return res?.success ? res.tab || null : res?.tab || null;
  }

  async getDefaultModelContextWindow(model?: string): Promise<number | undefined> {
    const config = this.configManager.getConfig();
    const modelString = this.configManager.resolveModel(
      model || config.llm.defaultModel || 'default'
    );
    if (!modelString) return undefined;

    const overrides = config.llm.modelMetadataOverrides || {};
    let providerContextWindow: number | undefined;

    try {
      const { providerId, modelName } = parseModelString(modelString);
      const provider =
        providerId === CLOUD_PROVIDER.id ? CLOUD_PROVIDER : config.llm.providers[providerId];
      if (provider?.enabled) {
        const models = await modelService.loadModels(provider);
        providerContextWindow = models.find((model) => model.id === modelName)?.contextWindow;
      }
    } catch {
      providerContextWindow = undefined;
    }

    return getModelContextWindow({
      modelString,
      providerContextWindow,
      overrides,
    });
  }

  async getContextBudget(model?: string): Promise<ModelContextBudget> {
    return getContextBudget({
      contextWindow: await this.getDefaultModelContextWindow(model),
    });
  }

  async capture(tabId: number): Promise<TabContextSnapshot | null> {
    const budget = await this.getContextBudget();
    const res = await chrome.runtime.sendMessage({
      action: 'tabContext:capture',
      tabId,
      budget,
    });

    if (!res?.success) {
      return null;
    }

    return res.snapshot || null;
  }

  async consumeLaunchIntent(tabId: number): Promise<TabAssistantLaunchIntent | null> {
    const res = await chrome.runtime.sendMessage({
      action: 'tabContext:consumeLaunchIntent',
      tabId,
    });

    return res?.success ? res.intent || null : null;
  }
}

export const tabContextService = TabContextService.getInstance();
