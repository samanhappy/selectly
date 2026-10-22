import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

afterEach(() => vi.unstubAllEnvs());

describe('cloud account payment UI', () => {
  it('preserves sign-in and cloud provider while hiding purchase and redemption by default', () => {
    vi.stubEnv('PLASMO_PUBLIC_PAID_UI_ENABLED', undefined);
    const html = renderToStaticMarkup(<SubscriptionManagerV3 palette={PALETTE} />);
    expect(html).toContain('Sign In');
    expect(html).toContain('Cloud account');
    expect(html).not.toContain('>Subscribe<');
    expect(html).not.toContain('Redeem Code');
    expect(
      ConfigManager.getInstance()
        .getEnabledProviders()
        .some((p) => p.id === 'cloud')
    ).toBe(true);
  });

  it('restores purchase and redemption controls when explicitly enabled', () => {
    vi.stubEnv('PLASMO_PUBLIC_PAID_UI_ENABLED', 'true');
    const html = renderToStaticMarkup(<SubscriptionManagerV3 palette={PALETTE} />);
    expect(html).toContain('>Subscribe<');
    expect(html).toContain('Redeem Code');
  });
});
