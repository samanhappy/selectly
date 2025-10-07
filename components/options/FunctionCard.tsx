import { Settings } from 'lucide-react';
import React from 'react';

import type { FunctionConfig } from '../../core/config/llm-config';
import { getActionIcon, isValidIconKey } from '../../utils/icon-utils';
import { PremiumCrown } from '../shared/PremiumCrown';

interface FunctionCardProps {
  functionKey: string;
  config: FunctionConfig;
  title: string;
  modelLabel: string;
  getIcon: (key: string) => React.ReactNode;
  onToggle: (key: string, enabled: boolean) => void;
  onEdit: (key: string) => void;
  isSubscribed?: boolean;
  onPremiumClick?: () => void;
}

export const FunctionCard: React.FC<FunctionCardProps> = ({
  functionKey,
  config,
  title,
  onToggle,
  onEdit,
  isSubscribed = true,
}) => {
  const isPremium = config.isPremium === true;

  const handleToggle = (enabled: boolean) => {
    onToggle(functionKey, enabled);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(functionKey);
  };

  return (
    <div className="sl-fn-card">
      <input
        type="checkbox"
        className="sl-checkbox"
        style={{ marginRight: 16 }}
        checked={config.enabled}
        onChange={(e) => handleToggle(e.target.checked)}
      />
      <div className="sl-fn-icon">
        {/* Prefer configured icon if valid, otherwise fall back to functionKey mapping via util */}
        {(() => {
          const Icon = isValidIconKey(config.icon)
            ? getActionIcon(config.icon)
            : getActionIcon(functionKey);
          return <Icon size={18} />;
        })()}
      </div>
      <div className="sl-fn-meta">
        <div className="sl-fn-title">
          {title}
          {isPremium && (
            <PremiumCrown
              active={isSubscribed}
              size={14}
              style={{ marginLeft: 6 }}
              ariaLabel={isSubscribed ? 'Premium feature enabled' : 'Premium feature locked'}
            />
          )}
        </div>
        <div className="sl-fn-sub"></div>
      </div>
      <button
        type="button"
        className="sl-btn sl-btn-ghost"
        style={{ padding: '8px 8px', fontSize: 12 }}
        onClick={handleEdit}
      >
        <Settings size={16} />
      </button>
    </div>
  );
};
