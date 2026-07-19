export interface GlobalActionPosition {
  xRatio: number;
  yRatio: number;
  snapEdge?: 'left' | 'right' | 'top' | 'bottom' | null;
}

export interface GlobalActionPoint {
  x: number;
  y: number;
}

export interface GlobalActionSize {
  width: number;
  height: number;
}

export interface GlobalActionViewport {
  width: number;
  height: number;
}

export type GlobalActionExpandDirection = 'up' | 'down';

const VIEWPORT_PADDING = 16;
const RATIO_PRECISION = 1000;

export function getDefaultGlobalActionPosition(): GlobalActionPosition {
  return { xRatio: 1, yRatio: 1 };
}

export const GLOBAL_ACTION_SNAP_THRESHOLD = 15;

export function isGlobalActionPosition(value: unknown): value is GlobalActionPosition {
  if (!value || typeof value !== 'object') return false;
  const position = value as GlobalActionPosition;
  return (
    isValidRatio(position.xRatio) &&
    isValidRatio(position.yRatio) &&
    (position.snapEdge === undefined ||
      position.snapEdge === null ||
      ['left', 'right', 'top', 'bottom'].includes(position.snapEdge))
  );
}

export function positionToPoint(
  position: GlobalActionPosition,
  viewport: GlobalActionViewport,
  size: GlobalActionSize
): GlobalActionPoint {
  const track = getGlobalActionTrack(viewport, size);
  let x = Math.round(VIEWPORT_PADDING + track.width * position.xRatio);
  let y = Math.round(VIEWPORT_PADDING + track.height * position.yRatio);

  if (position.snapEdge === 'left') {
    x = 0;
  } else if (position.snapEdge === 'right') {
    x = viewport.width - size.width;
  }

  if (position.snapEdge === 'top') {
    y = 0;
  } else if (position.snapEdge === 'bottom') {
    y = viewport.height - size.height;
  }

  return {
    x: Math.max(0, Math.min(viewport.width - size.width, x)),
    y: Math.max(0, Math.min(viewport.height - size.height, y)),
  };
}

export function pointToGlobalActionPosition(
  point: GlobalActionPoint,
  viewport: GlobalActionViewport,
  size: GlobalActionSize
): GlobalActionPosition {
  const clamped = clampGlobalActionPoint(point, viewport, size);
  const track = getGlobalActionTrack(viewport, size);

  return {
    xRatio: track.width === 0 ? 0 : roundRatio((clamped.x - VIEWPORT_PADDING) / track.width),
    yRatio: track.height === 0 ? 0 : roundRatio((clamped.y - VIEWPORT_PADDING) / track.height),
  };
}

export function clampGlobalActionPoint(
  point: GlobalActionPoint,
  viewport: GlobalActionViewport,
  size: GlobalActionSize,
  padding = VIEWPORT_PADDING
): GlobalActionPoint {
  return {
    x: clamp(
      point.x,
      padding,
      Math.max(padding, viewport.width - size.width - padding)
    ),
    y: clamp(
      point.y,
      padding,
      Math.max(padding, viewport.height - size.height - padding)
    ),
  };
}

export function getGlobalActionExpandDirection(
  position: Pick<GlobalActionPosition, 'yRatio' | 'snapEdge'>
): GlobalActionExpandDirection {
  if (position.snapEdge === 'top') return 'down';
  if (position.snapEdge === 'bottom') return 'up';
  return position.yRatio > 0.5 ? 'up' : 'down';
}

export function getSnappedPosition(
  point: GlobalActionPoint,
  viewport: GlobalActionViewport,
  size: GlobalActionSize,
  snapThreshold = GLOBAL_ACTION_SNAP_THRESHOLD
): GlobalActionPosition {
  const distLeft = point.x;
  const distRight = viewport.width - (point.x + size.width);
  const distTop = point.y;
  const distBottom = viewport.height - (point.y + size.height);

  const minDist = Math.min(distLeft, distRight, distTop, distBottom);

  let snapEdge: 'left' | 'right' | 'top' | 'bottom' | null = null;
  if (minDist <= snapThreshold) {
    if (minDist === distLeft) {
      snapEdge = 'left';
    } else if (minDist === distRight) {
      snapEdge = 'right';
    } else if (minDist === distTop) {
      snapEdge = 'top';
    } else if (minDist === distBottom) {
      snapEdge = 'bottom';
    }
  }

  const basePosition = pointToGlobalActionPosition(point, viewport, size);

  return {
    ...basePosition,
    snapEdge,
  };
}

function getGlobalActionTrack(
  viewport: GlobalActionViewport,
  size: GlobalActionSize
): GlobalActionSize {
  return {
    width: Math.max(0, viewport.width - size.width - VIEWPORT_PADDING * 2),
    height: Math.max(0, viewport.height - size.height - VIEWPORT_PADDING * 2),
  };
}

function isValidRatio(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

function roundRatio(value: number): number {
  return Math.round(clamp(value, 0, 1) * RATIO_PRECISION) / RATIO_PRECISION;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
