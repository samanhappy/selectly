import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { GlobalActionBar } from './GlobalActionBar';

const labels = {
  askPage: 'Ask this page',
  saveProgress: 'Save progress',
  progressSaved: 'Progress saved',
};

describe('GlobalActionBar', () => {
  it('groups multiple available actions behind a single trigger', () => {
    const html = renderToStaticMarkup(
      <GlobalActionBar
        labels={labels}
        showTabAssistant
        showSaveProgress
        onOpenTabAssistant={async () => {}}
        onSaveProgress={async () => {}}
      />
    );

    expect(html).toContain('selectly-global-action-cluster');
    expect(html).toContain('selectly-global-action-trigger');
    expect(html).toContain('is-expand-up');
    expect(html.match(/selectly-global-action-drag-target/g)).toHaveLength(1);
    expect(html.match(/selectly-global-action-btn/g)).toHaveLength(3);
  });

  it('keeps a single available action as a direct button', () => {
    const html = renderToStaticMarkup(
      <GlobalActionBar
        labels={labels}
        showTabAssistant
        showSaveProgress={false}
        onOpenTabAssistant={async () => {}}
      />
    );

    expect(html).not.toContain('selectly-global-action-cluster');
    expect(html).not.toContain('selectly-global-action-trigger');
    expect(html.match(/selectly-global-action-drag-target/g)).toHaveLength(1);
    expect(html.match(/selectly-global-action-btn/g)).toHaveLength(1);
  });
});
