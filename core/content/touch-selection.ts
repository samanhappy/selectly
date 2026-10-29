/** Observe stable touch selections, including updates managed by native selection UI. */
export function observeTouchSelection(
  source: Document,
  onSelectionChange: (event: TouchEvent) => void
): () => void {
  let touchEvent: TouchEvent | null = null;
  let previous: unknown[] | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cancelPending = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };
  const reset = () => {
    cancelPending();
    touchEvent = null;
    previous = null;
  };
  const handleTouchStart = (event: TouchEvent) => {
    reset();
    touchEvent = event;
  };
  const schedule = () => {
    // Native selection UI can take over a long press without delivering touchend.
    if (!touchEvent) return;
    cancelPending();
    timer = setTimeout(() => {
      timer = null;
      if (!touchEvent) return;
      const selection = source.getSelection();
      const target = touchEvent.target as HTMLInputElement | null;
      const current = [
        selection?.anchorNode,
        selection?.anchorOffset,
        selection?.focusNode,
        selection?.focusOffset,
        selection?.toString(),
        target?.selectionStart,
        target?.selectionEnd,
      ];
      if (previous && current.every((value, index) => value === previous[index])) return;
      previous = current;
      onSelectionChange(touchEvent);
    }, 100);
  };
  const handleTouchEnd = (event: TouchEvent) => {
    touchEvent = event;
    schedule();
  };
  const handleMouseDown = (event: MouseEvent) => {
    const capabilities = (
      event as MouseEvent & { sourceCapabilities?: { firesTouchEvents: boolean } | null }
    ).sourceCapabilities;
    if (!capabilities?.firesTouchEvents) reset();
  };

  source.addEventListener('touchstart', handleTouchStart, { passive: true, capture: true });
  source.addEventListener('touchend', handleTouchEnd, { passive: true, capture: true });
  source.addEventListener('selectionchange', schedule, true);
  source.addEventListener('mousedown', handleMouseDown, true);
  source.addEventListener('keydown', reset, true);
  // Cancellation ends DOM touch delivery, but native selection may continue updating.
  source.addEventListener('touchcancel', schedule, true);

  return () => {
    reset();
    source.removeEventListener('touchstart', handleTouchStart, true);
    source.removeEventListener('touchend', handleTouchEnd, true);
    source.removeEventListener('selectionchange', schedule, true);
    source.removeEventListener('mousedown', handleMouseDown, true);
    source.removeEventListener('keydown', reset, true);
    source.removeEventListener('touchcancel', schedule, true);
  };
}
