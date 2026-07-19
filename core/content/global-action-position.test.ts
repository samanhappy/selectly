import { describe, expect, it } from 'vitest';

import {
  clampGlobalActionPoint,
  getDefaultGlobalActionPosition,
  getGlobalActionExpandDirection,
  getSnappedPosition,
  isGlobalActionPosition,
  pointToGlobalActionPosition,
  positionToPoint,
} from './global-action-position';

describe('global action position utilities', () => {
  it('defaults near the bottom right of the viewport', () => {
    expect(getDefaultGlobalActionPosition()).toEqual({
      xRatio: 1,
      yRatio: 1,
    });
  });

  it('converts saved ratios to a visible fixed point', () => {
    expect(
      positionToPoint(
        { xRatio: 1, yRatio: 1 },
        { width: 1000, height: 800 },
        { width: 44, height: 44 }
      )
    ).toEqual({
      x: 940,
      y: 740,
    });
  });

  it('clamps fixed points inside the viewport', () => {
    expect(
      clampGlobalActionPoint(
        { x: 990, y: -20 },
        { width: 1000, height: 800 },
        { width: 44, height: 44 }
      )
    ).toEqual({
      x: 940,
      y: 16,
    });
  });

  it('clamps respect a custom padding', () => {
    expect(
      clampGlobalActionPoint(
        { x: 990, y: -20 },
        { width: 1000, height: 800 },
        { width: 44, height: 44 },
        0
      )
    ).toEqual({
      x: 956,
      y: 0,
    });
  });

  it('persists fixed points as viewport ratios', () => {
    expect(
      pointToGlobalActionPosition(
        { x: 500, y: 200 },
        { width: 1000, height: 800 },
        { width: 44, height: 44 }
      )
    ).toEqual({
      xRatio: 0.524,
      yRatio: 0.254,
    });
  });

  it('rejects invalid saved positions', () => {
    expect(isGlobalActionPosition({ xRatio: 0.5, yRatio: 0.5 })).toBe(true);
    expect(isGlobalActionPosition({ xRatio: -0.1, yRatio: 0.5 })).toBe(false);
    expect(isGlobalActionPosition({ xRatio: 0.5, yRatio: 1.2 })).toBe(false);
    expect(isGlobalActionPosition({ xRatio: Number.NaN, yRatio: 0.5 })).toBe(false);
  });

  it('expands away from the nearest vertical edge', () => {
    expect(getGlobalActionExpandDirection({ yRatio: 0.3 })).toBe('down');
    expect(getGlobalActionExpandDirection({ yRatio: 0.7 })).toBe('up');
  });

  describe('getSnappedPosition', () => {
    it('snaps to the close left edge', () => {
      const snapped = getSnappedPosition(
        { x: 10, y: 300 },
        { width: 1000, height: 800 },
        { width: 44, height: 44 }
      );
      expect(snapped.snapEdge).toBe('left');
    });

    it('snaps to the close right edge', () => {
      const snapped = getSnappedPosition(
        { x: 942, y: 300 },
        { width: 1000, height: 800 },
        { width: 44, height: 44 }
      );
      expect(snapped.snapEdge).toBe('right');
    });

    it('forces expansion direction to down when snapped at top', () => {
      expect(getGlobalActionExpandDirection({ yRatio: 0.1, snapEdge: 'top' })).toBe('down');
    });

    it('forces expansion direction to up when snapped at bottom', () => {
      expect(getGlobalActionExpandDirection({ yRatio: 0.9, snapEdge: 'bottom' })).toBe('up');
    });

    it('does not snap if outside threshold', () => {
      const snapped = getSnappedPosition(
        { x: 200, y: 300 },
        { width: 1000, height: 800 },
        { width: 44, height: 44 }
      );
      expect(snapped.snapEdge).toBeNull();
    });
  });
});
