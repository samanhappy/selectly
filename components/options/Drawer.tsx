import React, { useEffect } from 'react';

interface DrawerProps {
  open: boolean;
  title: React.ReactNode;
  onClose: () => void;
  closeLabel: string;
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({ open, title, onClose, closeLabel, children }) => {
  // Lock background scroll when drawer is open
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;
  return (
    <>
      <div className="sl-drawer-overlay" onClick={onClose} />
      <div className="sl-drawer" style={{ overflowY: 'auto' }} role="dialog" aria-modal="true">
        <div className="sl-drawer-header">
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, minWidth: 0 }}>{title}</h2>
          <button type="button" className="sl-close-btn" aria-label={closeLabel} onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </>
  );
};
