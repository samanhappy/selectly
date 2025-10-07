import { Bot, Plus } from 'lucide-react';
import React, { useState } from 'react';

import type { LLMProvider } from '../../../core/config/llm-config';
import { ProviderCard } from './ProviderCard';

interface ProviderManagerProps {
  providers: Record<string, LLMProvider>;
  i18n: any;
  palette: any;
  onProviderUpdate: (provider: LLMProvider) => void;
  onProviderRemove: (providerId: string) => void;
  onProviderAdd: (provider: LLMProvider) => void;
  onOpenDrawer: (type: 'configure' | 'add', provider?: LLMProvider) => void;
}

export const ProviderManager: React.FC<ProviderManagerProps> = ({
  providers,
  i18n,
  palette,
  onProviderUpdate,
  onProviderRemove,
  onProviderAdd,
  onOpenDrawer,
}) => {
  const handleProviderToggle = (provider: LLMProvider, enabled: boolean) => {
    onProviderUpdate({ ...provider, enabled });
  };

  const handleProviderConfigure = (provider: LLMProvider) => {
    onOpenDrawer('configure', provider);
  };

  const handleAddProvider = () => {
    onOpenDrawer('add');
  };

  return (
    <div
      style={{
        background: palette.surface,
        border: `1px solid ${palette.border}`,
        borderRadius: 12,
        padding: 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            display: 'flex',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <Bot size={18} /> {i18n.popup.providers.title}
        </h3>
        <button
          className="sl-btn sl-btn-secondary"
          onClick={handleAddProvider}
          style={{ padding: '8px 12px', fontSize: 12 }}
        >
          <Plus size={14} /> {i18n.popup.providers.addCustom}
        </button>
      </div>

      {/* Provider List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Object.values(providers).map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            palette={palette}
            i18n={i18n}
            onToggle={(enabled) => handleProviderToggle(provider, enabled)}
            onConfigure={() => handleProviderConfigure(provider)}
          />
        ))}

        {Object.values(providers).length === 0 && (
          <div
            style={{
              padding: 32,
              textAlign: 'center',
              color: palette.textSecondary,
              background: palette.background,
              border: `1px dashed ${palette.border}`,
              borderRadius: 8,
            }}
          >
            <Bot size={32} style={{ margin: '0 auto 12px', color: palette.textTertiary }} />
            <p style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 500 }}>
              {i18n.popup.providers.noProviders}
            </p>
            <p style={{ margin: 0, fontSize: 14 }}>{i18n.popup.providers.addCustomHint}</p>
          </div>
        )}
      </div>
    </div>
  );
};
