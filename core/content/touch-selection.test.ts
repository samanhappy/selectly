import { afterEach, describe, expect, it, vi } from 'vitest';

import { observeTouchSelection } from './touch-selection';

afterEach(() => vi.useRealTimers());

function setup() {
  vi.useFakeTimers();
  const listeners = new Map<string, (event?: unknown) => void>();
  const selection = {
    anchorNode: {},
    focusNode: {},
    anchorOffset: 0,
    focusOffset: 8,
    toString: () => 'Selected',
  };
  const source = {
    getSelection: () => selection,
    addEventListener: (type: string, listener: (event?: unknown) => void) =>
      listeners.set(type, listener),
    removeEventListener: vi.fn(),
  };
  const callback = vi.fn();
  const cleanup = observeTouchSelection(source as unknown as Document, callback);
  const emit = (type: string, event: unknown = {}) => listeners.get(type)?.(event);
  return { callback, cleanup, emit, source, selection };
}

describe('observeTouchSelection', () => {
  it('ignores selection updates without a touch interaction', () => {
    const { emit, callback } = setup();
    emit('selectionchange');
    vi.runAllTimers();
    expect(callback).not.toHaveBeenCalled();
  });

  it('waits for release and processes an unchanged touch selection once', () => {
    const { emit, callback } = setup();
    emit('touchstart');
    emit('selectionchange');
    vi.advanceTimersByTime(500);
    expect(callback).not.toHaveBeenCalled();
    const end = { type: 'touchend' };
    emit('touchend', end);
    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith(end);
    emit('selectionchange');
    vi.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledOnce();
  });

  it('debounces late selection changes and processes moved selection handles', () => {
    const { emit, callback, selection } = setup();
    emit('touchstart');
    emit('touchend');
    emit('selectionchange');
    vi.advanceTimersByTime(50);
    emit('selectionchange');
    vi.advanceTimersByTime(99);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledOnce();
    selection.focusOffset = 10;
    emit('selectionchange');
    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('allows the same selection in a new touch gesture', () => {
    const { emit, callback } = setup();
    emit('touchstart');
    emit('touchend');
    vi.advanceTimersByTime(100);
    emit('touchstart');
    emit('touchend');
    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('tracks text-control range changes even when the document selection is unchanged', () => {
    const { emit, callback } = setup();
    const target = { selectionStart: 0, selectionEnd: 3 };
    emit('touchstart', { target });
    emit('touchend', { target });
    vi.advanceTimersByTime(100);
    target.selectionEnd = 6;
    emit('selectionchange');
    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it.each(['mousedown', 'keydown', 'touchcancel'])(
    'stops handling selection updates after %s',
    (type) => {
      const { emit, callback } = setup();
      emit('touchstart');
      emit('selectionchange');
      emit(type);
      emit('selectionchange');
      vi.runAllTimers();
      expect(callback).not.toHaveBeenCalled();
    }
  );

  it('cancels pending updates and removes all listeners on cleanup', () => {
    const { emit, callback, cleanup, source } = setup();
    emit('touchstart');
    emit('selectionchange');
    cleanup();
    vi.runAllTimers();
    expect(callback).not.toHaveBeenCalled();
    expect(source.removeEventListener).toHaveBeenCalledTimes(6);
  });
});
