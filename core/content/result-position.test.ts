import { describe, expect, it } from 'vitest';

import { calculateResultPosition } from './result-position';

const viewport = {
  width: 1200,
  height: 900,
};

describe('calculateResultPosition', () => {
  it('ignores a zero-size range and anchors an editable selection result to the pointer', () => {
    expect(
      calculateResultPosition({
        selectionRect: {
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          width: 0,
          height: 0,
        },
        fallbackRect: {
          left: 300,
          top: 500,
          right: 1100,
          bottom: 800,
          width: 800,
          height: 300,
        },
        pointer: { x: 420, y: 360 },
        viewport,
      })
    ).toEqual({
      x: 420,
      y: 370,
      minWidth: 0,
      maxWidth: 0,
    });
  });

  it('falls back to the editable element rect when the pointer is unavailable', () => {
    expect(
      calculateResultPosition({
        selectionRect: null,
        fallbackRect: {
          left: 300,
          top: 500,
          right: 1100,
          bottom: 800,
          width: 800,
          height: 300,
        },
        pointer: null,
        viewport,
      })
    ).toEqual({
      x: 300,
      y: 290,
      minWidth: 0,
      maxWidth: 0,
    });
  });

  it('preserves the selected text width for a visible DOM range', () => {
    expect(
      calculateResultPosition({
        selectionRect: {
          left: 300,
          top: 320,
          right: 450,
          bottom: 340,
          width: 150,
          height: 20,
        },
        fallbackRect: null,
        pointer: null,
        viewport,
      })
    ).toEqual({
      x: 300,
      y: 350,
      minWidth: 150,
      maxWidth: 150,
    });
  });
});
