import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

import {
  observeAnchoredPosition,
  type FloatingPosition,
} from '../../core/content/floating-position';
import { PALETTE } from '../options/constants';

interface ActionOverflowMenuProps {
  label: string;
  children: ReactNode;
}

/** Click-operated overflow actions, positioned independently of the toolbar's width. */
export function ActionOverflowMenu({ label, children }: ActionOverflowMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<FloatingPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !menuRef.current) return;
    return observeAnchoredPosition({
      anchor: triggerRef.current,
      floatingElement: menuRef.current,
      placement: 'bottom-end',
      gap: 6,
      onPosition: setPosition,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const document = triggerRef.current?.ownerDocument;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    };
    // Toolbar pointer presses preserve the page selection instead of moving focus.
    document?.addEventListener('keydown', handleEscape, true);
    return () => document?.removeEventListener('keydown', handleEscape, true);
  }, [open]);

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        className="action-btn"
        title={label}
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => {
          setPosition(null);
          setOpen((previous) => !previous);
        }}
      >
        ⋯
      </button>
      {open && (
        <div
          id={menuId}
          ref={menuRef}
          role="group"
          aria-label={label}
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('button')) setOpen(false);
          }}
          style={{
            position: 'fixed',
            left: position?.x || 0,
            top: position?.y || 0,
            visibility: position ? 'visible' : 'hidden',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 4,
            padding: 8,
            width: 158,
            maxWidth: 'calc(100vw - 20px)',
            maxHeight: 'calc(100dvh - 20px)',
            overflowY: 'auto',
            boxSizing: 'border-box',
            borderRadius: 12,
            background: PALETTE.surface,
            border: `1px solid ${PALETTE.border}`,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
