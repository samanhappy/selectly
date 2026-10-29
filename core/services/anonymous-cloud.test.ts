import { afterEach, expect, it, vi } from 'vitest';

import { authService } from '../auth/auth-service';
import { CLOUD_PROVIDER, DEFAULT_CONFIG } from '../config/llm-config';
import { LLMService } from './llm-service';
import { modelService } from './model-service';

const originalBaseURL = CLOUD_PROVIDER.baseURL;

afterEach(() => {
  CLOUD_PROVIDER.baseURL = originalBaseURL;
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  modelService.clearCache();
});

it('omits Authorization on real SDK model-list, connection-test and chat requests', async () => {
  vi.stubEnv('PLASMO_PUBLIC_CLOUD_ENABLED', 'true');
  CLOUD_PROVIDER.baseURL = 'https://example.test/api';
  vi.spyOn(authService, 'getAccessToken').mockResolvedValue('old-account-token');
  const requests: Headers[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url, init) => {
      requests.push(new Headers(init?.headers));
      return new Response(
        JSON.stringify(
          init?.method === 'POST'
            ? { choices: [{ message: { content: 'Anonymous reply' } }] }
            : { data: [{ id: 'free-model' }] }
        ),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    })
  );
  modelService.clearCache();
  expect(await modelService.loadModels(CLOUD_PROVIDER)).toHaveLength(1);
  const llm = new LLMService();
  await llm.configure(DEFAULT_CONFIG.llm);
  expect(await llm.testProvider(CLOUD_PROVIDER)).toBe(true);
  expect(await llm.chat('Hello', 'cloud/default')).toBe('Anonymous reply');
  expect(requests).toHaveLength(3);
  expect(requests.every((headers) => !headers.has('Authorization'))).toBe(true);
  expect(authService.getAccessToken).not.toHaveBeenCalled();
});
