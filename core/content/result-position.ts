interface RectLike {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

interface Viewport {
  width: number;
  height: number;
}

interface CalculateResultPositionOptions {
  selectionRect?: RectLike | null;
  fallbackRect?: RectLike | null;
  pointer?: Point | null;
  viewport: Viewport;
}

export interface ResultPosition {
  x: number;
  y: number;
  minWidth: number;
  maxWidth: number;
}

const DEFAULT_POSITION = 100;
const RESULT_GAP = 10;
const RESULT_ESTIMATED_WIDTH = 300;
const RESULT_RIGHT_EDGE_OFFSET = 320;
const RESULT_ESTIMATED_HEIGHT = 200;
const RESULT_ABOVE_OFFSET = 210;

export function isVisibleRect(rect?: RectLike | null): rect is RectLike {
  return !!rect && (rect.width > 0 || rect.height > 0);
}

export function calculateResultPosition({
  selectionRect,
  fallbackRect,
  pointer,
  viewport,
}: CalculateResultPositionOptions): ResultPosition {
  const visibleSelectionRect = isVisibleRect(selectionRect) ? selectionRect : null;
  const visibleFallbackRect = isVisibleRect(fallbackRect) ? fallbackRect : null;

  let x = DEFAULT_POSITION;
  let y = DEFAULT_POSITION;
  let top = DEFAULT_POSITION;

  if (visibleSelectionRect) {
    x = visibleSelectionRect.left;
    y = visibleSelectionRect.bottom + RESULT_GAP;
    top = visibleSelectionRect.top;
  } else if (pointer) {
    x = pointer.x;
    y = pointer.y + RESULT_GAP;
    top = pointer.y;
  } else if (visibleFallbackRect) {
    x = visibleFallbackRect.left;
    y = visibleFallbackRect.bottom + RESULT_GAP;
    top = visibleFallbackRect.top;
  }

  if (x + RESULT_ESTIMATED_WIDTH > viewport.width) {
    x = Math.max(RESULT_GAP, viewport.width - RESULT_RIGHT_EDGE_OFFSET);
  }
  if (y + RESULT_ESTIMATED_HEIGHT > viewport.height) {
    y = Math.max(RESULT_GAP, top - RESULT_ABOVE_OFFSET);
  }

  const width = visibleSelectionRect?.width || 0;

  return {
    x,
    y,
    minWidth: width,
    maxWidth: width,
  };
}
