import { afterEach, describe, expect, it, vi } from 'vitest';

import { observeKeyboardSelection } from './keyboard-selection';

type Listener = (event: Event) => void;

afterEach(() => {
  vi.useRealTimers();
});

function createSource({
  activeElement,
  selectedText = '',
}: {
  activeElement: HTMLElement;
  selectedText?: string;
}) {
  const listeners = new Map<string, Listener>();
  const source = {
    activeElement,
    body: { tagName: 'BODY' },
    getSelection: () => ({ toString: () => selectedText }),
    addEventListener: (type: string, listener: Listener) => listeners.set(type, listener),
    removeEventListener: vi.fn(),
  };

  return {
    listeners,
    source: source as unknown as Document,
  };
}

describe('observeKeyboardSelection', () => {
  it('reports a document selection after macOS Command+A', () => {
    const body = { tagName: 'BODY' } as HTMLBodyElement;
    const { listeners, source } = createSource({
      activeElement: body,
      selectedText: 'selected page text',
    });
    const onSelectionChange = vi.fn();

    observeKeyboardSelection(source, onSelectionChange);
    listeners.get('keydown')?.({
      key: 'a',
      metaKey: true,
      target: body,
    } as unknown as KeyboardEvent);
    listeners.get('selectionchange')?.({ target: source } as unknown as Event);

    expect(onSelectionChange).toHaveBeenCalledWith({
      target: body,
      selectedText: 'selected page text',
    });
  });

  it('reads a textarea native selection instead of the document selection', () => {
    const value = 'selected textarea text';
    const textarea = {
      tagName: 'TEXTAREA',
      value,
      selectionStart: 0,
      selectionEnd: value.length,
    } as HTMLTextAreaElement;
    const { listeners, source } = createSource({ activeElement: textarea });
    const onSelectionChange = vi.fn();

    observeKeyboardSelection(source, onSelectionChange);
    listeners.get('keydown')?.({
      key: 'a',
      metaKey: true,
      target: textarea,
    } as unknown as KeyboardEvent);
    listeners.get('selectionchange')?.({ target: textarea } as unknown as Event);

    expect(onSelectionChange).toHaveBeenCalledWith({
      target: textarea,
      selectedText: value,
    });
  });

  it('ignores selection changes that were not initiated by the keyboard', () => {
    const body = { tagName: 'BODY' } as HTMLBodyElement;
    const { listeners, source } = createSource({
      activeElement: body,
      selectedText: 'mouse selection',
    });
    const onSelectionChange = vi.fn();

    observeKeyboardSelection(source, onSelectionChange);
    listeners.get('selectionchange')?.({ target: source } as unknown as Event);

    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('falls back to reading the selection after keydown when selectionchange is not emitted', () => {
    vi.useFakeTimers();
    const body = { tagName: 'BODY' } as HTMLBodyElement;
    const { listeners, source } = createSource({
      activeElement: body,
      selectedText: 'unchanged page selection',
    });
    const onSelectionChange = vi.fn();

    observeKeyboardSelection(source, onSelectionChange);
    listeners.get('keydown')?.({
      key: 'a',
      metaKey: true,
      target: body,
    } as unknown as KeyboardEvent);
    vi.runAllTimers();

    expect(onSelectionChange).toHaveBeenCalledWith({
      target: body,
      selectedText: 'unchanged page selection',
    });
  });

  it('does not report an unchanged selection after unrelated keyboard shortcuts', () => {
    vi.useFakeTimers();
    const body = { tagName: 'BODY' } as HTMLBodyElement;
    const { listeners, source } = createSource({
      activeElement: body,
      selectedText: 'existing page selection',
    });
    const onSelectionChange = vi.fn();

    observeKeyboardSelection(source, onSelectionChange);
    listeners.get('keydown')?.({
      key: 'c',
      metaKey: true,
      target: body,
    } as unknown as KeyboardEvent);
    vi.runAllTimers();

    expect(onSelectionChange).not.toHaveBeenCalled();
  });
});
