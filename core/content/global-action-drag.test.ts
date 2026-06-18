import { describe, expect, it } from 'vitest';

import {
  getGlobalActionDragPoint,
  GLOBAL_ACTION_DRAG_THRESHOLD,
  isGlobalActionDragGesture,
} from './global-action-drag';

describe('global action drag utilities', () => {
  it('does not treat tiny pointer movement as a drag', () => {
    expect(
      isGlobalActionDragGesture(
        { x: 100, y: 100 },
        { x: 100 + GLOBAL_ACTION_DRAG_THRESHOLD - 1, y: 100 }
      )
    ).toBe(false);
  });

  it('treats movement past the threshold as a drag', () => {
    expect(
      isGlobalActionDragGesture(
        { x: 100, y: 100 },
        { x: 100 + GLOBAL_ACTION_DRAG_THRESHOLD, y: 100 }
      )
    ).toBe(true);
  });

  it('moves from the initial fixed point and clamps inside the viewport', () => {
    expect(
      getGlobalActionDragPoint({
        startPointer: { x: 100, y: 100 },
        currentPointer: { x: 1200, y: -200 },
        startPoint: { x: 500, y: 300 },
        viewport: { width: 1000, height: 800 },
        size: { width: 44, height: 44 },
      })
    ).toEqual({
      x: 940,
      y: 16,
    });
  });
});
