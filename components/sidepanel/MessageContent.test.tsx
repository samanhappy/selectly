import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { isCodeBlockContent, MessageContent, sanitizeMarkdownHref } from './MessageContent';

describe('MessageContent', () => {
  it('renders fenced code as block content instead of inline code', () => {
    const html = renderToStaticMarkup(
      <MessageContent
        content={[
          '```python',
          'response = requests.post(url, json=payload, headers=headers)',
          'if response.status_code == 400 and "session" in response.text.lower():',
          '```',
        ].join('\n')}
      />
    );

    expect(html).toContain('sl-code-block');
    expect(html).toContain('sl-code-block-content');
    expect(html).not.toContain('sl-code-inline');
  });

  it('treats multiline code without a language class as block content', () => {
    expect(
      isCodeBlockContent({
        insidePre: false,
        className: undefined,
        children: 'first line\nsecond line',
      })
    ).toBe(true);
  });

  it('treats code inside a pre element as block content even when it is a single line', () => {
    const html = renderToStaticMarkup(
      <MessageContent content={['```', 'single_line()', '```'].join('\n')} />
    );

    expect(html).toContain('sl-code-block-content');
    expect(html).not.toContain('sl-code-inline');
  });

  it('renders inline code with inline code styling', () => {
    const html = renderToStaticMarkup(<MessageContent content="Use `token` here." />);

    expect(html).toContain('sl-code-inline');
    expect(html).not.toContain('sl-code-block-content');
  });

  it('removes unsafe markdown link protocols', () => {
    const html = renderToStaticMarkup(<MessageContent content="[bad](javascript:alert(1))" />);

    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('href=');
  });

  it('keeps safe markdown link protocols', () => {
    expect(sanitizeMarkdownHref(' https://example.com ')).toBe('https://example.com');
    expect(sanitizeMarkdownHref('mailto:support@example.com')).toBe('mailto:support@example.com');
  });
});
