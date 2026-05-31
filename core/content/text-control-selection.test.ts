import { describe, expect, it, vi } from 'vitest';

import { observeTextControlKeyboardSelection } from './text-control-selection';

describe('observeTextControlKeyboardSelection', () => {
  it('reports textarea selections created by macOS Command+A', () => {
    let listener: ((event: KeyboardEvent) => void) | undefined;
    const source = {
      addEventListener: (_type: 'keyup', next: (event: KeyboardEvent) => void) => {
        listener = next;
      },
      removeEventListener: vi.fn(),
    };
    const onSelectionChange = vi.fn();

    const cleanup = observeTextControlKeyboardSelection(source, onSelectionChange);
    const value = 'selected with keyboard';
    const textarea = {
      tagName: 'TEXTAREA',
      value,
      selectionStart: 0,
      selectionEnd: value.length,
    } as HTMLTextAreaElement;

    listener?.({ key: 'a', metaKey: true, target: textarea } as unknown as KeyboardEvent);

    expect(onSelectionChange).toHaveBeenCalledWith({
      target: textarea,
      selectedText: value,
    });

    cleanup();
    expect(source.removeEventListener).toHaveBeenCalledWith('keyup', listener);
  });

  it('reports textarea selections created by Ctrl+A', () => {
    let listener: ((event: KeyboardEvent) => void) | undefined;
    const source = {
      addEventListener: (_type: 'keyup', next: (event: KeyboardEvent) => void) => {
        listener = next;
      },
      removeEventListener: vi.fn(),
    };
    const onSelectionChange = vi.fn();
    const value = 'selected with keyboard';
    const textarea = {
      tagName: 'TEXTAREA',
      value,
      selectionStart: 0,
      selectionEnd: value.length,
    } as HTMLTextAreaElement;

    observeTextControlKeyboardSelection(source, onSelectionChange);
    listener?.({ key: 'a', ctrlKey: true, target: textarea } as unknown as KeyboardEvent);

    expect(onSelectionChange).toHaveBeenCalledWith({
      target: textarea,
      selectedText: value,
    });
  });

  it('ignores keyboard events outside text controls', () => {
    let listener: ((event: KeyboardEvent) => void) | undefined;
    const source = {
      addEventListener: (_type: 'keyup', next: (event: KeyboardEvent) => void) => {
        listener = next;
      },
      removeEventListener: vi.fn(),
    };
    const onSelectionChange = vi.fn();

    observeTextControlKeyboardSelection(source, onSelectionChange);
    listener?.({ target: { tagName: 'DIV' } } as unknown as KeyboardEvent);

    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('reports a collapsed text-control selection as empty', () => {
    let listener: ((event: KeyboardEvent) => void) | undefined;
    const source = {
      addEventListener: (_type: 'keyup', next: (event: KeyboardEvent) => void) => {
        listener = next;
      },
      removeEventListener: vi.fn(),
    };
    const onSelectionChange = vi.fn();
    const textarea = {
      tagName: 'TEXTAREA',
      value: 'text',
      selectionStart: 2,
      selectionEnd: 2,
    } as HTMLTextAreaElement;

    observeTextControlKeyboardSelection(source, onSelectionChange);
    listener?.({ target: textarea } as unknown as KeyboardEvent);

    expect(onSelectionChange).toHaveBeenCalledWith({
      target: textarea,
      selectedText: '',
    });
  });
});
