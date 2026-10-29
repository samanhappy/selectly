import { afterEach, describe, expect, it, vi } from 'vitest';

import { Selectly } from './Selectly';
import { observeTouchSelection } from './touch-selection';

vi.mock('../services/llm-service', () => ({
  LLMService: { getInstance: () => ({}) },
  processText: vi.fn(),
}));
vi.mock('../../components/content/ActionButtons', () => ({ ActionButtons: vi.fn() }));
vi.mock('../../components/content/GlobalActionBar', () => ({ GlobalActionBar: vi.fn() }));
vi.mock('../../components/content/SharePreview', () => ({ SharePreview: vi.fn() }));
vi.mock('../../components/content/StreamingResult', () => ({ StreamingResult: vi.fn() }));

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function setup() {
  vi.useFakeTimers();
  let selectedText = '';
  const selection = { toString: () => selectedText };
  const listeners = new Map<string, (event: unknown) => void>();
  const source = {
    getSelection: () => selection,
    addEventListener: (type: string, listener: (event: unknown) => void) =>
      listeners.set(type, listener),
    removeEventListener: vi.fn(),
  };
  const target = { tagName: 'P', ownerDocument: source };
  vi.stubGlobal('document', source);
  // Exercise the real event handler without extension startup or UI rendering.
  const instance = Object.create(Selectly.prototype) as any;
  instance.logger = { debug: vi.fn(), info: vi.fn() };
  instance.isEventFromOurComponents = () => false;
  instance.calculateAbsolutePosition = () => null;
  instance.extractSelectedText = async (value: typeof selection) => value.toString();
  instance.hideButtons = vi.fn();
  instance.showSelectionButtons = vi.fn();
  const cleanup = observeTouchSelection(
    source as unknown as Document,
    instance.handleTextSelection.bind(instance)
  );
  const emit = (type: string) => listeners.get(type)?.({ type, target, touches: [] });
  return {
    instance,
    cleanup,
    emit,
    selection,
    target,
    select: (text: string) => {
      selectedText = text;
    },
  };
}

describe('touch selection timing regression', () => {
  it('shows a selection completed after release without another touchend', async () => {
    const { instance, emit, select, cleanup, target, selection } = setup();
    emit('touchstart');
    emit('touchend');
    await vi.advanceTimersByTimeAsync(100);
    expect(instance.hideButtons).toHaveBeenCalledOnce();
    select('Selected on Android');
    emit('selectionchange');
    await vi.advanceTimersByTimeAsync(500);
    expect(instance.showSelectionButtons).toHaveBeenCalledOnce();
    expect(instance.showSelectionButtons).toHaveBeenCalledWith(
      target,
      selection,
      'Selected on Android'
    );
    cleanup();
  });

  it('handles a held selection and its release only once', async () => {
    const { instance, emit, select, cleanup } = setup();
    emit('touchstart');
    select('Held selection');
    emit('selectionchange');
    await vi.advanceTimersByTimeAsync(500);
    expect(instance.showSelectionButtons).not.toHaveBeenCalled();
    emit('touchend');
    await vi.advanceTimersByTimeAsync(100);
    expect(instance.showSelectionButtons).toHaveBeenCalledOnce();
    emit('selectionchange');
    await vi.advanceTimersByTimeAsync(500);
    expect(instance.showSelectionButtons).toHaveBeenCalledOnce();
    cleanup();
  });
});
