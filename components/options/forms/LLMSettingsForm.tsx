import { Settings } from 'lucide-react';
import React, { useMemo } from 'react';

import type { LLMConfig, LLMProvider } from '../../../core/config/llm-config';
import { EnhancedModelSelector } from './EnhancedModelSelector';
import { ProviderManager } from './ProviderManager';

interface LLMSettingsFormProps {
  llm: LLMConfig;
  i18n: any;
  palette: any;
  onChange: (config: Partial<LLMConfig>) => void;
  onOpenDrawer: (type: 'configure' | 'add', provider?: LLMProvider) => void;
}

export const LLMSettingsForm: React.FC<LLMSettingsFormProps> = ({
  llm,
  i18n,
  palette,
  onChange,
  onOpenDrawer,
}) => {
  const enabledProviders = useMemo(() => {
    return Object.values(llm.providers).filter((p) => p.enabled);
  }, [llm.providers]);

  const handleProviderUpdate = (provider: LLMProvider) => {
    if (!provider.enabled && llm.defaultModel.startsWith(provider.id)) {
      onChange({
        providers: {
          ...llm.providers,
          [provider.id]: provider,
        },
        defaultModel: '',
      });
    } else {
      onChange({
        providers: {
          ...llm.providers,
          [provider.id]: provider,
        },
      });
    }
  };

  const handleProviderRemove = (providerId: string) => {
    const { [providerId]: removed, ...remainingProviders } = llm.providers;
    if (llm.defaultModel.startsWith(providerId)) {
      onChange({
        providers: remainingProviders,
        defaultModel: '',
      });
    } else {
      onChange({
        providers: remainingProviders,
      });
    }
  };

  const handleProviderAdd = (provider: LLMProvider) => {
    onChange({
      providers: {
        ...llm.providers,
        [provider.id]: provider,
      },
    });
  };

  const handleDefaultModelChange = (model: string) => {
    onChange({
      defaultModel: model,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Default Model Selection */}
      <div
        style={{
          background: palette.surface,
          border: `1px solid ${palette.border}`,
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h3
          style={{
            margin: '0 0 16px 0',
            fontSize: 18,
            fontWeight: 600,
            display: 'flex',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <Settings size={18} /> {i18n.popup.models.defaultModelTitle}
        </h3>
        <EnhancedModelSelector
          selectedModel={llm.defaultModel}
          enabledProviders={enabledProviders}
          defaultModel={llm.defaultModel}
          i18n={i18n}
          palette={palette}
          onChange={handleDefaultModelChange}
          label={i18n.popup.models.defaultModel}
        />

        {/* {enabledProviders.length === 0 && (
          <div style={{
            marginTop: 16,
            padding: 12,
            background: palette.warningSoft,
            border: `1px solid ${palette.warning}40`,
            borderRadius: 8,
            fontSize: 13,
            color: palette.warning
          }}>
            {i18n.popup.models.noProvidersWarning}
          </div>
        )} */}
      </div>

      {/* Provider Management */}
      <ProviderManager
        providers={llm.providers}
        i18n={i18n}
        palette={palette}
        onProviderUpdate={handleProviderUpdate}
        onProviderRemove={handleProviderRemove}
        onProviderAdd={handleProviderAdd}
        onOpenDrawer={onOpenDrawer}
      />
    </div>
  );
};
