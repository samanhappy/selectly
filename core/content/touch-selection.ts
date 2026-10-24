/** Observe native selection updates that can arrive after touchend on mobile. */
export function observeTouchSelection(
  source: Document,
  onSelectionChange: (event: TouchEvent) => void
): () => void {
  let touchEvent: TouchEvent | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cancelPending = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };
  const reset = () => {
    cancelPending();
    touchEvent = null;
  };
  const handleTouchStart = (event: TouchEvent) => {
    cancelPending();
    touchEvent = event;
  };
  const handleSelectionChange = () => {
    if (!touchEvent) return;
    cancelPending();
    timer = setTimeout(() => {
      timer = null;
      if (touchEvent) onSelectionChange(touchEvent);
    }, 100);
  };

  source.addEventListener('touchstart', handleTouchStart, { passive: true, capture: true });
  source.addEventListener('selectionchange', handleSelectionChange, true);
  source.addEventListener('mousedown', reset, true);
  source.addEventListener('keydown', reset, true);
  source.addEventListener('touchcancel', reset, true);

  return () => {
    reset();
    source.removeEventListener('touchstart', handleTouchStart, true);
    source.removeEventListener('selectionchange', handleSelectionChange, true);
    source.removeEventListener('mousedown', reset, true);
    source.removeEventListener('keydown', reset, true);
    source.removeEventListener('touchcancel', reset, true);
  };
}
