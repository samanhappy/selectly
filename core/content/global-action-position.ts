export interface GlobalActionPosition {
  xRatio: number;
  yRatio: number;
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

export function isGlobalActionPosition(value: unknown): value is GlobalActionPosition {
  if (!value || typeof value !== 'object') return false;
  const position = value as GlobalActionPosition;
  return isValidRatio(position.xRatio) && isValidRatio(position.yRatio);
}

export function positionToPoint(
  position: GlobalActionPosition,
  viewport: GlobalActionViewport,
  size: GlobalActionSize
): GlobalActionPoint {
  const track = getGlobalActionTrack(viewport, size);
  return clampGlobalActionPoint(
    {
      x: Math.round(VIEWPORT_PADDING + track.width * position.xRatio),
      y: Math.round(VIEWPORT_PADDING + track.height * position.yRatio),
    },
    viewport,
    size
  );
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
  size: GlobalActionSize
): GlobalActionPoint {
  return {
    x: clamp(
      point.x,
      VIEWPORT_PADDING,
      Math.max(VIEWPORT_PADDING, viewport.width - size.width - VIEWPORT_PADDING)
    ),
    y: clamp(
      point.y,
      VIEWPORT_PADDING,
      Math.max(VIEWPORT_PADDING, viewport.height - size.height - VIEWPORT_PADDING)
    ),
  };
}

export function getGlobalActionExpandDirection(
  position: Pick<GlobalActionPosition, 'yRatio'>
): GlobalActionExpandDirection {
  return position.yRatio > 0.5 ? 'up' : 'down';
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
