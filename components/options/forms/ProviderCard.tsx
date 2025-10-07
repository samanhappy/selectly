import { Bot, Check, ExternalLink, Settings, X } from 'lucide-react';
import React from 'react';

import type { LLMProvider } from '../../../core/config/llm-config';
import { ProviderLogo } from './ProviderLogo';

interface ProviderCardProps {
  provider: LLMProvider;
  palette: any;
  onToggle: (enabled: boolean) => void;
  onConfigure: () => void;
  i18n?: any;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  palette,
  onToggle,
  onConfigure,
  i18n,
}) => {
  const hasApiKey = Boolean(provider.apiKey);
  const canEnable = hasApiKey && provider.testStatus === 'success';

  const handleToggle = (enabled: boolean) => {
    if (enabled && !canEnable) {
      return;
    }
    onToggle(enabled);
  };

  const handleOpenWebsite = () => {
    if (provider.websiteURL) {
      window.open(provider.websiteURL, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="sl-fn-card">
      {/* Provider Icon */}
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          background: palette.primarySoft,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 6,
        }}
      >
        <ProviderLogo providerId={provider.id} size={20} />
      </div>

      {/* Provider Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{provider.name}</div>
          {provider.websiteURL && (
            <button
              onClick={handleOpenWebsite}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '2px',
                cursor: 'pointer',
                color: palette.textSecondary,
                display: 'flex',
                alignItems: 'center',
                borderRadius: '4px',
              }}
              title={i18n?.popup?.providers?.getApiKey || 'Get API Key'}
            >
              <ExternalLink size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Enable Switch */}
        <label
          style={{
            position: 'relative',
            display: 'inline-block',
            width: 44,
            height: 24,
            opacity: canEnable ? 1 : 0.5,
            cursor: canEnable ? 'pointer' : 'not-allowed',
          }}
        >
          <input
            type="checkbox"
            checked={provider.enabled}
            onChange={(e) => handleToggle(e.target.checked)}
            disabled={!canEnable}
            style={{ opacity: 0, width: 0, height: 0 }}
          />
          <span
            style={{
              position: 'absolute',
              cursor: canEnable ? 'pointer' : 'not-allowed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: provider.enabled ? palette.primary : palette.border,
              transition: '0.3s',
              borderRadius: 24,
            }}
          >
            <span
              style={{
                position: 'absolute',
                content: '',
                height: 18,
                width: 18,
                left: provider.enabled ? 23 : 3,
                bottom: 3,
                backgroundColor: 'white',
                transition: '0.3s',
                borderRadius: '50%',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            />
          </span>
        </label>

        {/* Configure Button */}
        <button
          className="sl-btn sl-btn-ghost"
          onClick={onConfigure}
          style={{
            padding: '8px',
          }}
        >
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
};
