import {
  autoUpdate,
  computePosition,
  flip,
  inline,
  offset,
  shift,
  type Placement,
  type VirtualElement,
} from '@floating-ui/dom';

export interface Point {
  x: number;
  y: number;
}

export interface RectLike {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

interface Size {
  width: number;
  height: number;
}

interface Viewport {
  width: number;
  height: number;
}

export interface FloatingPosition {
  x: number;
  y: number;
}

export interface FloatingAnchor extends VirtualElement {
  pointer?: Point;
}

interface SelectionAnchorOptions {
  range?: Range | null;
  target?: HTMLElement | null;
  pointer?: Point | null;
  targetDocument: Document;
}

interface ObserveAnchoredPositionOptions {
  anchor: FloatingAnchor;
  floatingElement: HTMLElement;
  placement: Placement;
  onPosition: (position: FloatingPosition) => void;
}

const DEFAULT_POINT = { x: 100, y: 100 };
const FLOATING_GAP = 10;
const VIEWPORT_PADDING = 10;

function createRect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    x: left,
    y: top,
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    toJSON: () => ({ left, top, right: left + width, bottom: top + height, width, height }),
  } as DOMRect;
}

export function isVisibleRect(rect?: RectLike | null): rect is RectLike {
  return !!rect && (rect.width > 0 || rect.height > 0);
}

export function translateRect(rect: RectLike, offset: Point): DOMRect {
  return createRect(rect.left + offset.x, rect.top + offset.y, rect.width, rect.height);
}

export function translatePoint(point: Point, offset: Point): Point {
  return {
    x: point.x + offset.x,
    y: point.y + offset.y,
  };
}

function getDocumentViewportOffset(
  sourceDocument: Document,
  targetDocument: Document
): Point | null {
  let currentDocument = sourceDocument;
  let x = 0;
  let y = 0;

  while (currentDocument !== targetDocument) {
    const frameElement = currentDocument.defaultView?.frameElement;
    if (!frameElement || typeof frameElement.getBoundingClientRect !== 'function') {
      return null;
    }

    const frameRect = frameElement.getBoundingClientRect();
    x += frameRect.left;
    y += frameRect.top;
    currentDocument = frameElement.ownerDocument;
  }

  return { x, y };
}

export function translatePointToDocument(
  point: Point,
  sourceDocument: Document,
  targetDocument: Document
): Point {
  const offset = getDocumentViewportOffset(sourceDocument, targetDocument);
  return offset ? translatePoint(point, offset) : point;
}

function translateRectToDocument(
  rect: RectLike,
  sourceDocument: Document,
  targetDocument: Document
): DOMRect {
  const offset = getDocumentViewportOffset(sourceDocument, targetDocument);
  return offset
    ? translateRect(rect, offset)
    : createRect(rect.left, rect.top, rect.width, rect.height);
}

function getElementRect(element: Element, targetDocument: Document): DOMRect {
  return translateRectToDocument(
    element.getBoundingClientRect(),
    element.ownerDocument,
    targetDocument
  );
}

function getRangeContextElement(range: Range): Element | undefined {
  const node = range.commonAncestorContainer;
  return node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement || undefined;
}

export function createPointAnchor(point: Point, contextElement?: Element | null): FloatingAnchor {
  return {
    contextElement: contextElement || undefined,
    pointer: point,
    getBoundingClientRect: () => createRect(point.x, point.y, 0, 0),
  };
}

function createElementAnchor(element: Element, targetDocument: Document): FloatingAnchor {
  return {
    contextElement: element,
    getBoundingClientRect: () => getElementRect(element, targetDocument),
  };
}

function createRangeAnchor(
  range: Range,
  targetDocument: Document,
  pointer?: Point | null
): FloatingAnchor {
  const sourceDocument = range.startContainer.ownerDocument || targetDocument;
  const getFallbackRect = () =>
    pointer
      ? createRect(pointer.x, pointer.y, 0, 0)
      : createRect(DEFAULT_POINT.x, DEFAULT_POINT.y, 0, 0);

  return {
    contextElement: getRangeContextElement(range),
    pointer: pointer || undefined,
    getBoundingClientRect: () => {
      try {
        return translateRectToDocument(
          range.getBoundingClientRect(),
          sourceDocument,
          targetDocument
        );
      } catch {
        return getFallbackRect();
      }
    },
    getClientRects: () => {
      try {
        return Array.from(range.getClientRects()).map((rect) =>
          translateRectToDocument(rect, sourceDocument, targetDocument)
        );
      } catch {
        return [getFallbackRect()];
      }
    },
  };
}

function isTextControl(target?: HTMLElement | null): boolean {
  return target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';
}

export function createSelectionAnchor({
  range,
  target,
  pointer,
  targetDocument,
}: SelectionAnchorOptions): FloatingAnchor {
  if (isTextControl(target)) {
    return pointer
      ? createPointAnchor(pointer, target)
      : createElementAnchor(target as HTMLElement, targetDocument);
  }

  if (range) {
    const rangeAnchor = createRangeAnchor(range, targetDocument, pointer);
    if (isVisibleRect(rangeAnchor.getBoundingClientRect())) {
      return rangeAnchor;
    }
  }

  if (pointer) {
    return createPointAnchor(pointer, target);
  }

  if (target) {
    return createElementAnchor(target, targetDocument);
  }

  return createPointAnchor(DEFAULT_POINT);
}

export function getPreferredPlacement(position: 'above' | 'below'): Placement {
  return position === 'above' ? 'top-start' : 'bottom-start';
}

export async function computeAnchoredPosition(
  anchor: FloatingAnchor,
  floatingElement: HTMLElement,
  placement: Placement
): Promise<FloatingPosition> {
  const { x, y } = await computePosition(anchor, floatingElement, {
    placement,
    strategy: 'fixed',
    middleware: [
      inline(anchor.pointer ? { x: anchor.pointer.x, y: anchor.pointer.y } : undefined),
      offset(FLOATING_GAP),
      flip({ padding: VIEWPORT_PADDING }),
      shift({ padding: VIEWPORT_PADDING }),
    ],
  });

  return { x, y };
}

export function observeAnchoredPosition({
  anchor,
  floatingElement,
  placement,
  onPosition,
}: ObserveAnchoredPositionOptions): () => void {
  let active = true;
  const update = () => {
    void computeAnchoredPosition(anchor, floatingElement, placement)
      .then((position) => {
        if (active) {
          onPosition(position);
        }
      })
      .catch(() => {});
  };

  const cleanup = autoUpdate(anchor, floatingElement, update);

  return () => {
    active = false;
    cleanup();
  };
}

export function clampFloatingPosition(
  position: FloatingPosition,
  floatingSize: Size,
  viewport: Viewport,
  padding = VIEWPORT_PADDING
): FloatingPosition {
  return {
    x: Math.max(padding, Math.min(position.x, viewport.width - floatingSize.width - padding)),
    y: Math.max(padding, Math.min(position.y, viewport.height - floatingSize.height - padding)),
  };
}
