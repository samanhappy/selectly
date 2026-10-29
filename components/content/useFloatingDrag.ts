import { useMemo, useRef } from 'react';

import {
  createFloatingDragHandlers,
  type FloatingDragOptions,
} from '../../core/content/floating-drag';

/** Keep the gesture alive across position updates while reading current props. */
export function useFloatingDrag(options: FloatingDragOptions) {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  return useMemo(() => createFloatingDragHandlers(() => optionsRef.current), []);
}
