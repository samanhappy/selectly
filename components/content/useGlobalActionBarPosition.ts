import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getGlobalActionDragPoint,
  isGlobalActionDragGesture,
} from '../../core/content/global-action-drag';
import {
  getDefaultGlobalActionPosition,
  getGlobalActionExpandDirection,
  pointToGlobalActionPosition,
  positionToPoint,
  type GlobalActionExpandDirection,
  type GlobalActionPoint,
  type GlobalActionPosition,
  type GlobalActionSize,
  type GlobalActionViewport,
} from '../../core/content/global-action-position';
import {
  loadGlobalActionPosition,
  saveGlobalActionPosition,
} from '../../core/storage/global-action-position-storage';

interface GlobalActionLayout {
  viewport: GlobalActionViewport;
  size: GlobalActionSize;
}

interface ActiveDrag {
  pointerId: number;
  startPointer: GlobalActionPoint;
  startPoint: GlobalActionPoint;
  lastPoint: GlobalActionPoint;
  layout: GlobalActionLayout;
  dragging: boolean;
}

interface UseGlobalActionBarPositionResult {
  rootRef: React.RefObject<HTMLDivElement>;
  point: GlobalActionPoint | null;
  expandDirection: GlobalActionExpandDirection;
  isDragging: boolean;
  dragTargetProps: {
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
    onPointerMove: (event: React.PointerEvent<HTMLButtonElement>) => void;
    onPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => void;
    onPointerCancel: (event: React.PointerEvent<HTMLButtonElement>) => void;
    onClickCapture: (event: React.MouseEvent<HTMLButtonElement>) => void;
  };
}

export function useGlobalActionBarPosition(layoutKey: unknown): UseGlobalActionBarPositionResult {
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<ActiveDrag | null>(null);
  const savedPositionRef = useRef<GlobalActionPosition>(getDefaultGlobalActionPosition());
  const suppressClickRef = useRef(false);
  const [savedPosition, setSavedPosition] = useState<GlobalActionPosition>(
    getDefaultGlobalActionPosition
  );
  const [point, setPoint] = useState<GlobalActionPoint | null>(null);
  const [expandDirection, setExpandDirection] = useState<GlobalActionExpandDirection>(
    getGlobalActionExpandDirection(savedPosition)
  );
  const [isDragging, setIsDragging] = useState(false);

  const getLayout = useCallback((): GlobalActionLayout | null => {
    if (typeof window === 'undefined') return null;
    const element = rootRef.current;
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      size: {
        width: rect.width || 44,
        height: rect.height || 44,
      },
    };
  }, []);

  const applyPosition = useCallback(
    (position: GlobalActionPosition) => {
      const layout = getLayout();
      if (!layout) return;

      setPoint(positionToPoint(position, layout.viewport, layout.size));
      setExpandDirection(getGlobalActionExpandDirection(position));
    },
    [getLayout]
  );

  useEffect(() => {
    savedPositionRef.current = savedPosition;
  }, [savedPosition]);

  useEffect(() => {
    let active = true;

    loadGlobalActionPosition()
      .then((position) => {
        if (!active) return;
        setSavedPosition(position);
      })
      .catch(() => {
        if (!active) return;
        setSavedPosition(getDefaultGlobalActionPosition());
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    applyPosition(savedPosition);
  }, [applyPosition, layoutKey, savedPosition]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => applyPosition(savedPositionRef.current);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [applyPosition]);

  const updateDragPoint = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>, activeDrag: ActiveDrag): ActiveDrag => {
      const currentPointer = { x: event.clientX, y: event.clientY };
      const layout = getLayout() || activeDrag.layout;
      const nextPoint = getGlobalActionDragPoint({
        startPointer: activeDrag.startPointer,
        currentPointer,
        startPoint: activeDrag.startPoint,
        viewport: layout.viewport,
        size: layout.size,
      });
      const nextPosition = pointToGlobalActionPosition(nextPoint, layout.viewport, layout.size);

      setPoint(nextPoint);
      setExpandDirection(getGlobalActionExpandDirection(nextPosition));

      return {
        ...activeDrag,
        layout,
        lastPoint: nextPoint,
        dragging: true,
      };
    },
    [getLayout]
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0 || !point) return;
      const layout = getLayout();
      if (!layout) return;

      dragRef.current = {
        pointerId: event.pointerId,
        startPointer: { x: event.clientX, y: event.clientY },
        startPoint: point,
        lastPoint: point,
        layout,
        dragging: false,
      };
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [getLayout, point]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const activeDrag = dragRef.current;
      if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;

      const currentPointer = { x: event.clientX, y: event.clientY };
      if (
        !activeDrag.dragging &&
        !isGlobalActionDragGesture(activeDrag.startPointer, currentPointer)
      ) {
        return;
      }

      dragRef.current = updateDragPoint(event, activeDrag);
      setIsDragging(true);
      event.preventDefault();
    },
    [updateDragPoint]
  );

  const finishPointerGesture = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const activeDrag = dragRef.current;
    if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;

    event.currentTarget.releasePointerCapture?.(event.pointerId);
    dragRef.current = null;
    setIsDragging(false);

    if (!activeDrag.dragging) return;

    const nextPosition = pointToGlobalActionPosition(
      activeDrag.lastPoint,
      activeDrag.layout.viewport,
      activeDrag.layout.size
    );
    savedPositionRef.current = nextPosition;
    setSavedPosition(nextPosition);
    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 150);
    void saveGlobalActionPosition(nextPosition).catch(() => {});
    event.preventDefault();
  }, []);

  const handleClickCapture = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (!suppressClickRef.current) return;
    suppressClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return {
    rootRef,
    point,
    expandDirection,
    isDragging,
    dragTargetProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: finishPointerGesture,
      onPointerCancel: finishPointerGesture,
      onClickCapture: handleClickCapture,
    },
  };
}
