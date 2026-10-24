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

describe('touch selection timing regression', () => {
  it('shows a selection completed after 100ms without another touchend', async () => {
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
    const touchEnd = { type: 'touchend', target, touches: [] };
    const cleanup = observeTouchSelection(
      source as unknown as Document,
      instance.handleTextSelection.bind(instance)
    );
    listeners.get('touchstart')?.({ ...touchEnd, type: 'touchstart' });

    instance.handleTextSelection(touchEnd);
    await vi.advanceTimersByTimeAsync(100);
    expect(instance.hideButtons).toHaveBeenCalledOnce();

    // Simulate the native selection becoming available after the one-time read.
    selectedText = 'Selected on Android';
    listeners.get('selectionchange')?.({ target: source });
    await vi.advanceTimersByTimeAsync(500);
    expect(instance.showSelectionButtons).toHaveBeenCalledWith(target, selection, selectedText);
    cleanup();
  });
});
