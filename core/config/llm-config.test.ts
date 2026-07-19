import { describe, expect, it } from 'vitest';

import {
  CLOUD_PROVIDER,
  ConfigManager,
  DEFAULT_SELECTION_FLOATING_GAP,
  getDefaultConfig,
  MAX_SELECTION_FLOATING_GAP,
  MIN_SELECTION_FLOATING_GAP,
  normalizeSelectionFloatingGap,
} from './llm-config';

describe('ConfigManager', () => {
  it('provides a safe default config before async loading completes', () => {
    const manager = new ConfigManager();

    expect(manager.getConfig().llm.defaultModel).toBe('');
    expect(manager.getEnabledProviders()).toEqual([CLOUD_PROVIDER]);
    expect(manager.getConfig().general.selectionFloatingGap).toBe(DEFAULT_SELECTION_FLOATING_GAP);
  });

  it('normalizes selection floating gap values for slider persistence', () => {
    expect(normalizeSelectionFloatingGap(undefined)).toBe(DEFAULT_SELECTION_FLOATING_GAP);
    expect(normalizeSelectionFloatingGap('18.6')).toBe(19);
    expect(normalizeSelectionFloatingGap(-1)).toBe(MIN_SELECTION_FLOATING_GAP);
    expect(normalizeSelectionFloatingGap(999)).toBe(MAX_SELECTION_FLOATING_GAP);
  });

  it('migrates the legacy default translate prompt to the current default', async () => {
    const manager = new ConfigManager();
    const defaultConfig = await getDefaultConfig();
    const legacyPrompt =
      'You are a professional translator. Please translate the following text to {targetLanguage}. If the text is already in {targetLanguage}, translate it to English instead. Maintain the original tone and meaning. Return only the translation without any explanation or additional text:\n\n{text}';

    const merged = (manager as any).mergeConfig(defaultConfig, {
      ...defaultConfig,
      functions: {
        ...defaultConfig.functions,
        translate: {
          ...defaultConfig.functions.translate,
          prompt: legacyPrompt,
        },
      },
    });

    expect(merged.functions.translate.prompt).toBe(defaultConfig.functions.translate.prompt);
    expect(merged.functions.translate.prompt).toContain('same line');
    expect(merged.functions.translate.prompt).toContain('/.../');
    expect(merged.functions.translate.prompt).not.toContain('IPA:');
  });

  it('preserves a custom translate prompt during config migration', async () => {
    const manager = new ConfigManager();
    const defaultConfig = await getDefaultConfig();
    const customPrompt = 'Translate this carefully and keep my custom format:\n\n{text}';

    const merged = (manager as any).mergeConfig(defaultConfig, {
      ...defaultConfig,
      functions: {
        ...defaultConfig.functions,
        translate: {
          ...defaultConfig.functions.translate,
          prompt: customPrompt,
        },
      },
    });

    expect(merged.functions.translate.prompt).toBe(customPrompt);
  });
});
