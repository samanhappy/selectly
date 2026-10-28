import { afterEach, describe, expect, it, vi } from 'vitest';

import { observeTouchSelection } from './touch-selection';

afterEach(() => vi.useRealTimers());

function setup() {
  vi.useFakeTimers();
  const listeners = new Map<string, (event?: unknown) => void>();
  const source = {
    addEventListener: (type: string, listener: (event?: unknown) => void) =>
      listeners.set(type, listener),
    removeEventListener: vi.fn(),
  };
  const callback = vi.fn();
  const cleanup = observeTouchSelection(source as unknown as Document, callback);
  const emit = (type: string, event: unknown = {}) => listeners.get(type)?.(event);
  return { callback, cleanup, emit, source };
}

describe('observeTouchSelection', () => {
  it('ignores selection updates without a touch interaction', () => {
    const { emit, callback } = setup();
    emit('selectionchange');
    vi.runAllTimers();
    expect(callback).not.toHaveBeenCalled();
  });

  it('debounces selection handle updates and continues observing after touchend', () => {
    const { emit, callback } = setup();
    const touch = { type: 'touchstart' };
    emit('touchstart', touch);
    emit('touchend');
    emit('selectionchange');
    vi.advanceTimersByTime(50);
    emit('selectionchange');
    vi.advanceTimersByTime(99);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith(touch);
    emit('selectionchange');
    vi.runAllTimers();
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
    expect(source.removeEventListener).toHaveBeenCalledTimes(5);
  });
});
