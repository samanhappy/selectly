/** Observe released touch selections, including native updates arriving after touchend. */
export function observeTouchSelection(
  source: Document,
  onSelectionChange: (event: TouchEvent) => void
): () => void {
  let touchEvent: TouchEvent | null = null;
  let touching = false;
  let previous: unknown[] | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cancelPending = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };
  const reset = () => {
    cancelPending();
    touchEvent = null;
    touching = false;
    previous = null;
  };
  const handleTouchStart = (event: TouchEvent) => {
    reset();
    touchEvent = event;
    touching = true;
  };
  const schedule = () => {
    if (!touchEvent || touching) return;
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
    touching = false;
    schedule();
  };

  source.addEventListener('touchstart', handleTouchStart, { passive: true, capture: true });
  source.addEventListener('touchend', handleTouchEnd, { passive: true });
  source.addEventListener('selectionchange', schedule, true);
  source.addEventListener('mousedown', reset, true);
  source.addEventListener('keydown', reset, true);
  source.addEventListener('touchcancel', reset, true);

  return () => {
    reset();
    source.removeEventListener('touchstart', handleTouchStart, true);
    source.removeEventListener('touchend', handleTouchEnd);
    source.removeEventListener('selectionchange', schedule, true);
    source.removeEventListener('mousedown', reset, true);
    source.removeEventListener('keydown', reset, true);
    source.removeEventListener('touchcancel', reset, true);
  };
}
