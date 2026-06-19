import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { SelectedTextPreview, type SelectedTextPreviewLabels } from './SelectedTextPreview';

const labels: SelectedTextPreviewLabels = {
  selectedText: 'Selected text',
  expandSelectedText: 'Show more',
  collapseSelectedText: 'Show less',
  removeSelectedText: 'Remove selected text',
};

describe('SelectedTextPreview', () => {
  it('renders a collapsed selected text preview', () => {
    const html = renderToStaticMarkup(
      <SelectedTextPreview
        selectedText="Selected paragraph"
        expanded={false}
        labels={labels}
        onToggle={() => {}}
        onRemove={() => {}}
      />
    );

    expect(html).toContain('Selected text');
    expect(html).toContain('Selected paragraph');
    expect(html).toContain('Show more');
    expect(html).toContain('aria-label="Remove selected text"');
    expect(html).toContain('aria-expanded="false"');
  });

  it('renders an expanded selected text preview', () => {
    const html = renderToStaticMarkup(
      <SelectedTextPreview
        selectedText="Selected paragraph"
        expanded
        labels={labels}
        onToggle={() => {}}
        onRemove={() => {}}
      />
    );

    expect(html).toContain('Show less');
    expect(html).toContain('aria-expanded="true"');
  });

  it('renders nothing without selected text', () => {
    const html = renderToStaticMarkup(
      <SelectedTextPreview
        selectedText=" "
        expanded={false}
        labels={labels}
        onToggle={() => {}}
        onRemove={() => {}}
      />
    );

    expect(html).toBe('');
  });
});
