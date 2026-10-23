import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { authService } from '../auth/auth-service';
import { isCloudEnabled } from '../config/cloud-services';
import { CLOUD_PROVIDER, ConfigManager, DEFAULT_CONFIG } from '../config/llm-config';
import { callAPI, checkSubscription } from '../premium-api-v2';
import { LLMService } from './llm-service';
import { modelService } from './model-service';
import SubscriptionService from './subscription-service-v2';
import { SyncCore, type SyncAdapter, type SyncQueueItemBase } from './sync-core';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  listModels: vi.fn(async () => ({ data: [] })),
  getStorage: vi.fn(async () => ({
    authTokenData: { accessToken: 'cached', refreshToken: 'cached', expiresAt: 1 },
  })),
}));

vi.mock('openai', () => ({
  default: class {
    models = { list: mocks.listModels };
    constructor(options: unknown) {
      mocks.createClient(options);
    }
  },
}));
vi.mock('../storage/secure-storage', () => ({
  secureStorage: { get: mocks.getStorage, set: vi.fn(), onChanged: vi.fn() },
}));

beforeEach(() => {
  vi.stubEnv('PLASMO_PUBLIC_CLOUD_ENABLED', undefined);
  vi.stubGlobal('fetch', vi.fn());
  vi.clearAllMocks();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('official cloud disabled', () => {
  it('does not restore, validate, or refresh cached cloud credentials', async () => {
    await authService.initialize();
    expect(await authService.getAccessToken()).toBe('');
    expect(authService.isAuthenticated()).toBe(false);
    await expect(authService.signIn()).rejects.toThrow('disabled');
    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.getStorage).not.toHaveBeenCalled();
  });

  it('blocks premium API requests and subscription polling', async () => {
    const service = SubscriptionService.getInstance();
    await service.initialize();
    service.enableAutoRefresh();
    await service.refresh({ force: true });
    expect(await checkSubscription()).toEqual({ active: false, interval: 'none' });
    await expect(callAPI('/api/check-subscription')).rejects.toThrow('disabled');
    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.getStorage).not.toHaveBeenCalled();
    expect(service.isSubscriptionActive()).toBe(false);
  });

  it('never creates a cloud client or fetches its model list, including stale model selections', async () => {
    const llm = new LLMService();
    await llm.configure(DEFAULT_CONFIG.llm);
    expect(await modelService.loadModels(CLOUD_PROVIDER)).toEqual([]);
    expect(await llm.testProvider(CLOUD_PROVIDER)).toBe(false);
    await expect(llm.chatStream([], vi.fn(), 'cloud/default')).rejects.toThrow('disabled');
    await expect(llm.chatStream([], vi.fn())).rejects.toThrow('disabled');
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.listModels).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('still configures an explicitly supplied local model endpoint', async () => {
    const llm = new LLMService();
    await llm.configure({
      ...DEFAULT_CONFIG.llm,
      providers: {
        local: {
          id: 'local',
          name: 'Local',
          baseURL: 'http://127.0.0.1:11434/v1',
          apiKey: 'local',
          enabled: true,
          isBuiltIn: false,
        },
      },
    });
    expect(mocks.createClient).toHaveBeenCalledOnce();
    expect(mocks.createClient).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'http://127.0.0.1:11434/v1' })
    );
  });

  it('does not start synchronization or queue new local changes for upload', async () => {
    const adapter = { isSyncEnabled: vi.fn(), enqueue: vi.fn() };
    const core = new SyncCore(adapter as unknown as SyncAdapter<unknown, SyncQueueItemBase>, 1000);
    const interval = vi.spyOn(globalThis, 'setInterval');
    await core.initialize();
    core.startPeriodicSync();
    await core.sync();
    await core.fullSync();
    await core.queueForSync('local-item', 'create');
    expect(interval).not.toHaveBeenCalled();
    expect(adapter.isSyncEnabled).not.toHaveBeenCalled();
    expect(adapter.enqueue).not.toHaveBeenCalled();
  });

  it('requires explicit opt-in before exposing official cloud providers again', () => {
    expect(isCloudEnabled()).toBe(false);
    expect(ConfigManager.getInstance().getEnabledProviders()).not.toContainEqual(CLOUD_PROVIDER);
    vi.stubEnv('PLASMO_PUBLIC_CLOUD_ENABLED', 'true');
    expect(ConfigManager.getInstance().getEnabledProviders()).toContainEqual(CLOUD_PROVIDER);
  });
});
