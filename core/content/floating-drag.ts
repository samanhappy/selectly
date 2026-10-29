import type { PointerEvent as ReactPointerEvent } from 'react';

import type { FloatingPosition } from './floating-position';

type DragEvent = ReactPointerEvent<HTMLDivElement>;

export interface FloatingDragOptions {
  enabled: boolean;
  isDialogue: boolean;
  position: FloatingPosition | null;
  onMove: (position: FloatingPosition) => void;
  onDraggingChange: (dragging: boolean) => void;
}

/** Pointer capture keeps a drag attached to the panel outside its bounds. */
export function createFloatingDragHandlers(getOptions: () => FloatingDragOptions) {
  let active: { pointerId: number; offset: FloatingPosition } | null = null;
  const finish = (event: DragEvent) => {
    if (active?.pointerId !== event.pointerId) return;
    active = null;
    getOptions().onDraggingChange(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return {
    onPointerDown(event: DragEvent) {
      const { enabled, isDialogue, position } = getOptions();
      const target = event.target as HTMLElement;
      if (!enabled || !position || active || !event.isPrimary || event.button !== 0) return;
      if (
        target.closest(
          'input, textarea, button, a, select, [contenteditable], .glass-button, .send-btn'
        )
      )
        return;
      if (isDialogue && target.closest('.sl-message-bubble')) return;
      if (event.pointerType !== 'mouse' && !target.closest('.header-draggable')) return;
      active = {
        pointerId: event.pointerId,
        offset: { x: event.clientX - position.x, y: event.clientY - position.y },
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      getOptions().onDraggingChange(true);
      event.preventDefault();
    },
    onPointerMove(event: DragEvent) {
      if (active?.pointerId !== event.pointerId) return;
      if (!getOptions().enabled) {
        finish(event);
        return;
      }
      getOptions().onMove({
        x: event.clientX - active.offset.x,
        y: event.clientY - active.offset.y,
      });
      event.preventDefault();
    },
    onPointerUp: finish,
    onPointerCancel: finish,
    onLostPointerCapture: finish,
  };
}
