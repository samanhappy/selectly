import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const listeners: Array<
  (request: unknown, sender: unknown, respond: (response: unknown) => void) => unknown
> = [];
const runtime = {
  onMessage: { addListener: (listener: (typeof listeners)[number]) => listeners.push(listener) },
  sendMessage: vi.fn(
    (request: unknown) =>
      new Promise((resolve, reject) => {
        if (!listeners.length) return reject(new Error('No migration coordinator'));
        listeners.forEach((listener) => listener(request, {}, resolve));
      })
  ),
};
async function loadCoordinator() {
  const storage = await import('./storage-area');
  const handle = storage.createStorageMigrationCoordinator();
  runtime.onMessage.addListener((request, _sender, respond) => handle(request, respond));
  return storage;
}

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
  listeners.length = 0;
  runtime.sendMessage.mockClear();
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
    vi.stubGlobal('chrome', { storage: { local, sync }, runtime });
    const { getStorageArea, getStorageNamespace } = await loadCoordinator();
    expect(await getStorageArea()).toBe(local);
    expect(getStorageNamespace()).toBe('local');
    expect(local.values.existing).toBe('newer local value');
    expect(local.values.encryptedConfig).toEqual({ d: 'ciphertext' });
    expect(await getStorageArea()).toBe(local);
    expect(sync.get).toHaveBeenCalledOnce();
    expect(sync.set).not.toHaveBeenCalled();
  });

  it('serializes migration across contexts so delayed sync reads cannot overwrite new settings', async () => {
    const local = area({});
    const sync = area({ encryptedConfig: 'old synced value' });
    let release: (value: Record<string, unknown>) => void;
    sync.get.mockImplementationOnce(async () => ({ ...sync.values }));
    sync.get.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve;
        })
    );
    vi.stubGlobal('chrome', { storage: { local, sync }, runtime });
    const coordinator = await loadCoordinator();
    vi.resetModules();
    const client = await import('./storage-area');
    const first = coordinator.getStorageArea();
    const second = client.getStorageArea();
    await first;
    await local.set({ encryptedConfig: 'newly saved value' });
    release?.({ encryptedConfig: 'old synced value' });
    await second;
    expect(local.values).toHaveProperty('encryptedConfig', 'newly saved value');
    expect(sync.get).toHaveBeenCalledOnce();
  });

  it('blocks access on migration failure and allows a later retry', async () => {
    const local = area({});
    const sync = area({ setting: 'synced' });
    sync.get.mockRejectedValueOnce(new Error('Storage unavailable'));
    vi.stubGlobal('chrome', { storage: { local, sync }, runtime });
    const { getStorageArea } = await loadCoordinator();
    await expect(getStorageArea()).rejects.toThrow('Storage unavailable');
    expect(local.set).not.toHaveBeenCalled();
    expect(await getStorageArea()).toBe(local);
    expect(local.values).toHaveProperty('setting', 'synced');
  });

  it('keeps a client blocked after coordinator failure and retries through the background', async () => {
    const local = area({});
    const sync = area({ setting: 'synced' });
    sync.get.mockRejectedValueOnce(new Error('Temporary failure'));
    vi.stubGlobal('chrome', { storage: { local, sync }, runtime });
    await loadCoordinator();
    vi.resetModules();
    const client = await import('./storage-area');
    await expect(client.getStorageArea()).rejects.toThrow('Local storage migration is not ready');
    expect(local.set).not.toHaveBeenCalled();
    expect(await client.getStorageArea()).toBe(local);
    expect(local.values).toHaveProperty('setting', 'synced');
  });

  it('keeps settings local even with anonymous cloud models enabled', async () => {
    vi.stubEnv('PLASMO_PUBLIC_CLOUD_ENABLED', 'true');
    const local = area({});
    const sync = area({ setting: 'synced' });
    vi.stubGlobal('chrome', { storage: { local, sync }, runtime });
    const { getStorageArea } = await loadCoordinator();
    expect(await getStorageArea()).toBe(local);
    expect(local.values).toHaveProperty('setting', 'synced');
    expect(sync.set).not.toHaveBeenCalled();
  });

  it('does not resurrect deleted settings from sync in a subsequent extension context', async () => {
    const local = area({ __selectly_local_storage_v1: true });
    const sync = area({ deletedSetting: 'old value' });
    vi.stubGlobal('chrome', { storage: { local, sync }, runtime });
    const { getStorageArea } = await loadCoordinator();
    await getStorageArea();
    expect(sync.get).not.toHaveBeenCalled();
    expect(local.values).not.toHaveProperty('deletedSetting');
  });

  it('keeps a deliberate local reset from restoring the old sync copy after reload', async () => {
    const local = area({ setting: 'local' });
    const sync = area({ setting: 'synced' });
    vi.stubGlobal('chrome', { storage: { local, sync }, runtime });
    const { clearStorageArea } = await loadCoordinator();
    await clearStorageArea();
    vi.resetModules();
    const { getStorageArea } = await loadCoordinator();
    await getStorageArea();
    expect(local.values).not.toHaveProperty('setting');
    expect(sync.get).toHaveBeenCalledOnce();
    expect(sync.set).not.toHaveBeenCalled();
    expect(sync.clear).not.toHaveBeenCalled();
  });
});
