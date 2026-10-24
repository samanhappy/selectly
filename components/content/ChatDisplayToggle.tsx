import { AppWindow, PanelRight } from 'lucide-react';
import React from 'react';

import { PALETTE } from '../options/constants';

interface ChatDisplayToggleProps {
  sidebar: boolean;
  labels: { switchToSidebar: string; switchToFloating: string };
  onToggle: () => void;
}

export const ChatDisplayToggle = ({ sidebar, labels, onToggle }: ChatDisplayToggleProps) => {
  const label = sidebar ? labels.switchToFloating : labels.switchToSidebar;
  const Icon = sidebar ? AppWindow : PanelRight;

  return (
    <button
      type="button"
      className="glass-button sl-chat-display-toggle"
      aria-label={label}
      title={label}
      onClick={onToggle}
      style={{ color: PALETTE.textSecondary }}
    >
      <Icon size={14} aria-hidden="true" />
    </button>
  );
};
