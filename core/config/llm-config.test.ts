import { describe, expect, it } from 'vitest';

import { CLOUD_PROVIDER, ConfigManager } from './llm-config';

describe('ConfigManager', () => {
  it('provides a safe default config before async loading completes', () => {
    const manager = new ConfigManager();

    expect(manager.getConfig().llm.defaultModel).toBe('cloud/default');
    expect(manager.getEnabledProviders()).toEqual([CLOUD_PROVIDER]);
  });
});
