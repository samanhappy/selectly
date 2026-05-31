import { describe, expect, it } from 'vitest';

import {
  clampFloatingPosition,
  createSelectionAnchor,
  getPreferredPlacement,
  isVisibleRect,
  translatePointToDocument,
  translateRect,
} from './floating-position';

describe('floating position utilities', () => {
  it('rejects zero-size selection ranges', () => {
    expect(
      isVisibleRect({
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
      })
    ).toBe(false);
  });

  it('translates iframe rects using viewport offsets without adding page scroll', () => {
    expect(
      translateRect(
        {
          left: 20,
          top: 30,
          right: 120,
          bottom: 50,
          width: 100,
          height: 20,
        },
        { x: 300, y: 400 }
      )
    ).toMatchObject({
      left: 320,
      top: 430,
      right: 420,
      bottom: 450,
      width: 100,
      height: 20,
    });
  });

  it('accumulates nested iframe viewport offsets', () => {
    const topDocument = {} as Document;
    const parentDocument = {
      defaultView: {
        frameElement: {
          ownerDocument: topDocument,
          getBoundingClientRect: () => ({ left: 300, top: 400 }),
        },
      },
    } as unknown as Document;
    const childDocument = {
      defaultView: {
        frameElement: {
          ownerDocument: parentDocument,
          getBoundingClientRect: () => ({ left: 20, top: 30 }),
        },
      },
    } as unknown as Document;

    expect(translatePointToDocument({ x: 5, y: 10 }, childDocument, topDocument)).toEqual({
      x: 325,
      y: 440,
    });
  });

  it('anchors text controls to the pointer instead of an unrelated DOM range', () => {
    const input = { tagName: 'TEXTAREA' } as HTMLElement;
    const anchor = createSelectionAnchor({
      target: input,
      pointer: { x: 420, y: 360 },
      targetDocument: {} as Document,
    });

    expect(anchor.getBoundingClientRect()).toMatchObject({
      left: 420,
      top: 360,
      right: 420,
      bottom: 360,
    });
  });

  it('clamps dragged panels using their actual dimensions', () => {
    expect(
      clampFloatingPosition(
        { x: 1100, y: 760 },
        { width: 420, height: 300 },
        { width: 1200, height: 900 }
      )
    ).toEqual({
      x: 770,
      y: 590,
    });
  });

  it('preserves the configured action button side as a floating placement', () => {
    expect(getPreferredPlacement('above')).toBe('top-start');
    expect(getPreferredPlacement('below')).toBe('bottom-start');
  });
});
