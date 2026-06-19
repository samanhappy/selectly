import { Bookmark, MessageCircle, Sparkles } from 'lucide-react';
import React, { useState } from 'react';

import { useGlobalActionBarPosition } from './useGlobalActionBarPosition';

interface GlobalActionBarProps {
  onOpenTabAssistant?: () => Promise<void>;
  onSaveProgress?: () => Promise<void>;
  showTabAssistant?: boolean;
  showSaveProgress?: boolean;
  labels: {
    askPage: string;
    saveProgress: string;
    progressSaved: string;
  };
}

export const GlobalActionBar = ({
  onOpenTabAssistant,
  onSaveProgress,
  showTabAssistant = true,
  showSaveProgress = false,
  labels,
}: GlobalActionBarProps) => {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [expanded, setExpanded] = useState(false);

  const handleSave = async () => {
    if (status === 'saving' || !onSaveProgress) return;
    setStatus('saving');
    try {
      await onSaveProgress();
      setStatus('saved');
      window.setTimeout(() => setStatus('idle'), 1500);
    } catch {
      setStatus('idle');
    }
  };

  const actions = [
    showTabAssistant
      ? {
          id: 'tab-assistant',
          label: labels.askPage,
          icon: <MessageCircle size={16} />,
          onClick: () => onOpenTabAssistant?.(),
        }
      : null,
    showSaveProgress
      ? {
          id: 'save-progress',
          label: status === 'saved' ? labels.progressSaved : labels.saveProgress,
          icon: <Bookmark size={16} />,
          onClick: handleSave,
          className: status === 'saved' ? 'is-saved' : '',
        }
      : null,
  ].filter(Boolean) as Array<{
    id: string;
    label: string;
    icon: JSX.Element;
    onClick: () => void;
    className?: string;
  }>;
  const { rootRef, point, expandDirection, isDragging, dragTargetProps } =
    useGlobalActionBarPosition(actions.length);

  if (actions.length === 0) return null;

  const rootClassName = [
    'selectly-global-actions',
    `is-expand-${expandDirection}`,
    isDragging ? 'is-dragging' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const rootStyle: React.CSSProperties = {
    left: `${point?.x || 0}px`,
    top: `${point?.y || 0}px`,
    right: 'auto',
    bottom: 'auto',
    visibility: point ? 'visible' : 'hidden',
  };

  if (actions.length === 1) {
    const [action] = actions;
    return (
      <div ref={rootRef} className={rootClassName} style={rootStyle}>
        <button
          className={`selectly-global-action-btn selectly-global-action-drag-target ${
            action.className || ''
          }`.trim()}
          onClick={action.onClick}
          title={action.label}
          aria-label={action.label}
          {...dragTargetProps}
        >
          {action.icon}
        </button>
      </div>
    );
  }

  const menuLabel = actions.map((action) => action.label).join(' / ');

  return (
    <div ref={rootRef} className={rootClassName} style={rootStyle}>
      <div
        className={`selectly-global-action-cluster ${expanded ? 'is-expanded' : ''}`}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        onFocus={() => setExpanded(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setExpanded(false);
          }
        }}
      >
        <div className="selectly-global-action-menu" role="menu" aria-hidden={!expanded}>
          {actions.map((action) => (
            <button
              key={action.id}
              className={`selectly-global-action-btn ${action.className || ''}`.trim()}
              onClick={action.onClick}
              title={action.label}
              aria-label={action.label}
              role="menuitem"
              tabIndex={expanded ? 0 : -1}
            >
              {action.icon}
            </button>
          ))}
        </div>
        <button
          className="selectly-global-action-btn selectly-global-action-trigger selectly-global-action-drag-target"
          onClick={() => setExpanded((value) => !value)}
          title={menuLabel}
          aria-label={menuLabel}
          aria-haspopup="menu"
          aria-expanded={expanded}
          {...dragTargetProps}
        >
          <Sparkles size={16} />
        </button>
      </div>
    </div>
  );
};
