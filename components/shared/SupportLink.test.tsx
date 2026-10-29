import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PremiumCrown } from './PremiumCrown';
import { SupportLink } from './SupportLink';

beforeEach(() => vi.stubEnv('PLASMO_PUBLIC_CLOUD_ENABLED', 'true'));
afterEach(() => vi.unstubAllEnvs());

describe('support and paid UI', () => {
  it('renders an accessible donation link without requiring an account', () => {
    vi.stubEnv('PLASMO_PUBLIC_SUPPORT_URL', undefined);
    vi.stubEnv('PLASMO_PUBLIC_SUPPORT_ENABLED', undefined);
    const html = renderToStaticMarkup(<SupportLink label="Support this project" />);
    expect(html).toContain('href="https://ko-fi.com/samanhappy"');
    expect(html).toContain('aria-label="Support this project"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('hides the donation entry when disabled', () => {
    vi.stubEnv('PLASMO_PUBLIC_SUPPORT_ENABLED', 'false');
    expect(renderToStaticMarkup(<SupportLink label="Support" />)).toBe('');
  });

  it('keeps premium badges hidden even with the old paid UI switch', () => {
    vi.stubEnv('PLASMO_PUBLIC_PAID_UI_ENABLED', undefined);
    expect(renderToStaticMarkup(<PremiumCrown active={false} />)).toBe('');
    vi.stubEnv('PLASMO_PUBLIC_PAID_UI_ENABLED', 'true');
    expect(renderToStaticMarkup(<PremiumCrown active={false} />)).toBe('');
  });
});
