import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ChatDisplayToggle } from './ChatDisplayToggle';

const labels = {
  switchToSidebar: 'Switch to page sidebar',
  switchToFloating: 'Switch to floating window',
};

describe('ChatDisplayToggle', () => {
  it.each([
    [false, labels.switchToSidebar],
    [true, labels.switchToFloating],
  ] as const)('names the destination when sidebar is %s', (sidebar, label) => {
    const html = renderToStaticMarkup(
      <ChatDisplayToggle sidebar={sidebar} labels={labels} onToggle={() => {}} />
    );
    expect(html).toContain(`aria-label="${label}"`);
    expect(html).toContain('type="button"');
  });
});
