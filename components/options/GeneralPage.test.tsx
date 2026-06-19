import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_CONFIG } from '../../core/config/llm-config';
import { GeneralPage } from './GeneralPage';

describe('GeneralPage', () => {
  it('hides reading progress settings while the feature is disabled', () => {
    const html = renderToStaticMarkup(
      <GeneralPage
        t={{
          popup: {
            general: {
              readingProgressTitle: 'Reading Progress',
              showReadingProgressBar: 'Show progress bar',
            },
          },
        }}
        onReload={async () => {}}
        userConfig={DEFAULT_CONFIG}
        onChange={vi.fn()}
      />
    );

    expect(html).not.toContain('Reading Progress');
    expect(html).not.toContain('Show progress bar');
  });
});
