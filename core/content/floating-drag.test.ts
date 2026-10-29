import type { PointerEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { createFloatingDragHandlers } from './floating-drag';

function setup() {
  const capture = new Set<number>();
  const options = {
    enabled: true,
    isDialogue: true,
    position: { x: 100, y: 100 },
    onMove: vi.fn(),
    onDraggingChange: vi.fn(),
  };
  const handlers = createFloatingDragHandlers(() => options);
  const event = (overrides = {}, matches: string[] = ['.header-draggable']) =>
    ({
      pointerId: 1,
      pointerType: 'touch',
      isPrimary: true,
      button: 0,
      clientX: 120,
      clientY: 130,
      preventDefault: vi.fn(),
      target: {
        closest: (selector: string) =>
          matches.some((match) => selector.split(', ').includes(match)) ? {} : null,
      },
      currentTarget: {
        setPointerCapture: (id: number) => capture.add(id),
        hasPointerCapture: (id: number) => capture.has(id),
        releasePointerCapture: (id: number) => capture.delete(id),
      },
      ...overrides,
    }) as unknown as PointerEvent<HTMLDivElement>;
  return { options, handlers, event, capture };
}

describe('floating panel pointer dragging', () => {
  it('moves a touch drag from the header and captures its pointer', () => {
    const { handlers, options, event, capture } = setup();
    handlers.onPointerDown(event());
    handlers.onPointerMove(event({ clientX: 170, clientY: 200 }));
    expect(options.onMove).toHaveBeenCalledWith({ x: 150, y: 170 });
    expect(capture.has(1)).toBe(true);
  });
  it.each(['onPointerUp', 'onPointerCancel', 'onLostPointerCapture'] as const)(
    'ends dragging on %s',
    (name) => {
      const { handlers, options, event, capture } = setup();
      handlers.onPointerDown(event());
      handlers[name](event());
      handlers.onPointerMove(event());
      expect(options.onMove).not.toHaveBeenCalled();
      expect(options.onDraggingChange).toHaveBeenLastCalledWith(false);
      expect(capture.size).toBe(0);
    }
  );
  it.each(['button', 'input', 'textarea', 'a', '.sl-message-bubble'])(
    'preserves interaction with %s',
    (target) => {
      const { handlers, options, event } = setup();
      handlers.onPointerDown(event({}, ['.header-draggable', target]));
      expect(options.onDraggingChange).not.toHaveBeenCalled();
    }
  );
  it('preserves touch scrolling in the body but allows mouse dragging there', () => {
    const { handlers, options, event } = setup();
    handlers.onPointerDown(event({}, []));
    expect(options.onDraggingChange).not.toHaveBeenCalled();
    handlers.onPointerDown(event({ pointerType: 'mouse' }, []));
    expect(options.onDraggingChange).toHaveBeenCalledWith(true);
  });
  it('ignores secondary pointers and unrelated pointer endings', () => {
    const { handlers, options, event } = setup();
    handlers.onPointerDown(event());
    handlers.onPointerDown(event({ pointerId: 2, isPrimary: false }));
    handlers.onPointerMove(event({ pointerId: 2 }));
    handlers.onPointerUp(event({ pointerId: 2 }));
    expect(options.onMove).not.toHaveBeenCalled();
    handlers.onPointerMove(event());
    expect(options.onMove).toHaveBeenCalledOnce();
  });
  it('does not drag a docked panel or use a secondary mouse button', () => {
    const { handlers, options, event } = setup();
    handlers.onPointerDown(event({ button: 2 }));
    options.enabled = false;
    handlers.onPointerDown(event());
    expect(options.onDraggingChange).not.toHaveBeenCalled();
  });
});
