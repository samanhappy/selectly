import {
  clampGlobalActionPoint,
  type GlobalActionPoint,
  type GlobalActionSize,
  type GlobalActionViewport,
} from './global-action-position';

export const GLOBAL_ACTION_DRAG_THRESHOLD = 6;

interface DragPointInput {
  startPointer: GlobalActionPoint;
  currentPointer: GlobalActionPoint;
  startPoint: GlobalActionPoint;
  viewport: GlobalActionViewport;
  size: GlobalActionSize;
}

export function isGlobalActionDragGesture(
  startPointer: GlobalActionPoint,
  currentPointer: GlobalActionPoint
): boolean {
  const deltaX = currentPointer.x - startPointer.x;
  const deltaY = currentPointer.y - startPointer.y;
  return Math.hypot(deltaX, deltaY) >= GLOBAL_ACTION_DRAG_THRESHOLD;
}

export function getGlobalActionDragPoint(input: DragPointInput): GlobalActionPoint {
  const deltaX = input.currentPointer.x - input.startPointer.x;
  const deltaY = input.currentPointer.y - input.startPointer.y;

  return clampGlobalActionPoint(
    {
      x: input.startPoint.x + deltaX,
      y: input.startPoint.y + deltaY,
    },
    input.viewport,
    input.size
  );
}
