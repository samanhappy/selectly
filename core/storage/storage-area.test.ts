import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function area(values: Record<string, unknown>) {
  return {
    values,
    get: vi.fn(async () => ({ ...values })),
    set: vi.fn(async (next) => {
      Object.assign(values, next);
    }),
    clear: vi.fn(async () => {
      for (const key of Object.keys(values)) delete values[key];
    }),
  };
}

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('PLASMO_PUBLIC_CLOUD_ENABLED', undefined);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('local settings storage', () => {
  it('copies existing settings once, preserves local values, and leaves sync untouched', async () => {
    const local = area({ existing: 'newer local value' });
    const sync = area({ existing: 'older synced value', encryptedConfig: { d: 'ciphertext' } });
    vi.stubGlobal('chrome', { storage: { local, sync } });
    const { getStorageArea, getStorageNamespace } = await import('./storage-area');
    expect(await getStorageArea()).toBe(local);
    expect(getStorageNamespace()).toBe('local');
    expect(local.values.existing).toBe('newer local value');
    expect(local.values.encryptedConfig).toEqual({ d: 'ciphertext' });
    expect(await getStorageArea()).toBe(local);
    expect(sync.get).toHaveBeenCalledOnce();
    expect(sync.set).not.toHaveBeenCalled();
  });

  it('does not resurrect deleted settings from sync in a subsequent extension context', async () => {
    const local = area({ __selectly_local_storage_v1: true });
    const sync = area({ deletedSetting: 'old value' });
    vi.stubGlobal('chrome', { storage: { local, sync } });
    const { getStorageArea } = await import('./storage-area');
    await getStorageArea();
    expect(sync.get).not.toHaveBeenCalled();
    expect(local.values).not.toHaveProperty('deletedSetting');
  });

  it('keeps a deliberate local reset from restoring the old sync copy after reload', async () => {
    const local = area({ setting: 'local' });
    const sync = area({ setting: 'synced' });
    vi.stubGlobal('chrome', { storage: { local, sync } });
    const { clearStorageArea } = await import('./storage-area');
    await clearStorageArea();
    vi.resetModules();
    const { getStorageArea } = await import('./storage-area');
    await getStorageArea();
    expect(local.values).not.toHaveProperty('setting');
    expect(sync.get).toHaveBeenCalledOnce();
    expect(sync.set).not.toHaveBeenCalled();
    expect(sync.clear).not.toHaveBeenCalled();
  });
});
