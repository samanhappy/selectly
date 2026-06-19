import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_CONFIG } from '../../../core/config/llm-config';
import { GeneralSettingsForm } from './GeneralSettingsForm';

describe('GeneralSettingsForm', () => {
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
