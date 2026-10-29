import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfigManager } from '../../core/config/llm-config';
import { PALETTE } from './constants';
import { SubscriptionManagerV3 } from './SubscriptionManagerV3';

vi.mock('../../core/auth/auth-service', () => ({
  authService: {
    getState: () => ({ isAuthenticated: false, user: null }),
  },
}));
vi.mock('../../core/services/subscription-service-v2', () => ({
  default: { getInstance: () => ({ getSubscriptionStatus: () => null }) },
}));
vi.mock('../../core/services/collect-service', () => ({ collectService: {} }));
vi.mock('../../core/premium-api-v2', () => ({ redeemSubscriptionCode: vi.fn() }));

beforeEach(() => vi.stubEnv('PLASMO_PUBLIC_CLOUD_ENABLED', 'true'));
afterEach(() => vi.unstubAllEnvs());

describe('cloud account payment UI', () => {
  it('does not expose sign-in or payment controls in local mode', () => {
    vi.stubEnv('PLASMO_PUBLIC_CLOUD_ENABLED', 'false');
    vi.stubEnv('PLASMO_PUBLIC_PAID_UI_ENABLED', 'true');
    expect(renderToStaticMarkup(<SubscriptionManagerV3 palette={PALETTE} />)).toBe('');
  });
  it('hides account and payment controls while preserving anonymous cloud models', () => {
    vi.stubEnv('PLASMO_PUBLIC_PAID_UI_ENABLED', 'true');
    expect(renderToStaticMarkup(<SubscriptionManagerV3 palette={PALETTE} />)).toBe('');
    expect(
      ConfigManager.getInstance()
        .getEnabledProviders()
        .some((p) => p.id === 'cloud')
    ).toBe(true);
  });
});
