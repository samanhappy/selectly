import { describe, expect, it } from 'vitest';

import {
  CLOUD_PROVIDER,
  ConfigManager,
  DEFAULT_SELECTION_FLOATING_GAP,
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
});
