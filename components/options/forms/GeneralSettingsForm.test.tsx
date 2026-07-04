import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_CONFIG } from '../../../core/config/llm-config';
import { GeneralSettingsForm } from './GeneralSettingsForm';

describe('GeneralSettingsForm', () => {
  it('renders the selection distance slider', () => {
    const html = renderToStaticMarkup(
      <GeneralSettingsForm
        userConfig={{
          ...DEFAULT_CONFIG,
          general: {
            ...DEFAULT_CONFIG.general,
            selectionFloatingGap: 24,
          },
        }}
        i18n={{
          getConfig: () => ({
            common: { close: 'Close' },
            popup: {
              general: {
                title: 'General Settings',
                selectionFloatingGap: 'Distance from selection',
                selectionFloatingGapDesc: 'Adjust spacing.',
              },
            },
          }),
        }}
        onChange={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(html).toContain('Distance from selection');
    expect(html).toContain('type="range"');
    expect(html).toContain('24px');
  });

  it('hides reading progress controls while the feature is disabled', () => {
    const html = renderToStaticMarkup(
      <GeneralSettingsForm
        userConfig={DEFAULT_CONFIG}
        i18n={{
          getConfig: () => ({
            common: { close: 'Close' },
            popup: {
              general: {
                title: 'General Settings',
                readingProgressTitle: 'Reading Progress',
                showReadingProgressBar: 'Show progress bar',
              },
            },
          }),
        }}
        onChange={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(html).not.toContain('Reading Progress');
    expect(html).not.toContain('Show progress bar');
  });
});
