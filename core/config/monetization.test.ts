import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getSupportUrl, isPaidUiEnabled } from './monetization';

beforeEach(() => vi.stubEnv('PLASMO_PUBLIC_CLOUD_ENABLED', 'true'));
afterEach(() => vi.unstubAllEnvs());

describe('monetization UI switches', () => {
  it('keeps paid UI disabled even when the old switch is enabled', () => {
    vi.stubEnv('PLASMO_PUBLIC_PAID_UI_ENABLED', undefined);
    expect(isPaidUiEnabled()).toBe(false);
    vi.stubEnv('PLASMO_PUBLIC_PAID_UI_ENABLED', 'true');
    expect(isPaidUiEnabled()).toBe(false);
    vi.stubEnv('PLASMO_PUBLIC_PAID_UI_ENABLED', 'false');
    expect(isPaidUiEnabled()).toBe(false);
  });

  it('uses the project funding account by default and accepts a custom HTTPS link', () => {
    vi.stubEnv('PLASMO_PUBLIC_SUPPORT_ENABLED', undefined);
    vi.stubEnv('PLASMO_PUBLIC_SUPPORT_URL', undefined);
    expect(getSupportUrl()).toBe('https://ko-fi.com/samanhappy');
    vi.stubEnv('PLASMO_PUBLIC_SUPPORT_URL', 'https://example.com/support');
    expect(getSupportUrl()).toBe('https://example.com/support');
  });

  it('can disable support links independently of paid UI', () => {
    vi.stubEnv('PLASMO_PUBLIC_SUPPORT_ENABLED', 'false');
    vi.stubEnv('PLASMO_PUBLIC_PAID_UI_ENABLED', 'true');
    expect(getSupportUrl()).toBeNull();
    expect(isPaidUiEnabled()).toBe(false);
  });

  it.each(['', 'javascript:alert(1)', 'http://example.com', 'invalid'])(
    'hides an unusable support URL: %s',
    (value) => {
      vi.stubEnv('PLASMO_PUBLIC_SUPPORT_URL', value);
      expect(getSupportUrl()).toBeNull();
    }
  );
});
