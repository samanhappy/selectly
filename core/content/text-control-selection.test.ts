import { describe, expect, it } from 'vitest';

import { getTextControlSelectedText, isTextControlElement } from './text-control-selection';

describe('getTextControlSelectedText', () => {
  it('reads a textarea native selection', () => {
    const value = 'selected with keyboard';
    const textarea = {
      tagName: 'TEXTAREA',
      value,
      selectionStart: 0,
      selectionEnd: value.length,
    } as HTMLTextAreaElement;

    expect(getTextControlSelectedText(textarea)).toBe(value);
  });

  it('returns empty text for a collapsed selection', () => {
    const textarea = {
      tagName: 'TEXTAREA',
      value: 'text',
      selectionStart: 2,
      selectionEnd: 2,
    } as HTMLTextAreaElement;

    expect(getTextControlSelectedText(textarea)).toBe('');
  });

  it('returns empty text outside text controls', () => {
    expect(getTextControlSelectedText({ tagName: 'DIV' } as HTMLElement)).toBe('');
  });
});

describe('isTextControlElement', () => {
  it('recognizes native text controls', () => {
    expect(isTextControlElement({ tagName: 'INPUT' } as HTMLInputElement)).toBe(true);
    expect(isTextControlElement({ tagName: 'TEXTAREA' } as HTMLTextAreaElement)).toBe(true);
    expect(isTextControlElement({ tagName: 'DIV' } as HTMLElement)).toBe(false);
  });
});
