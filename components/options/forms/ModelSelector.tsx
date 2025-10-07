import { ChevronDown, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import type { LLMProvider } from '../../../core/config/llm-config';
import type { ModelInfo } from '../../../core/services/model-service';
import { modelService } from '../../../core/services/model-service';

interface ModelSelectorProps {
  selectedModel: string; // Format: "providerId/modelName" or "default"
  enabledProviders: LLMProvider[];
  defaultModel: string;
  i18n: any;
  palette: any;
  onChange: (model: string) => void;
  label?: string;
  showDefault?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  enabledProviders,
  defaultModel,
  i18n,
  palette,
  onChange,
  label,
  showDefault = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [providerModels, setProviderModels] = useState<
    Array<{
      provider: LLMProvider;
      models: ModelInfo[];
    }>
  >([]);

  useEffect(() => {
    loadModels();
  }, [enabledProviders]);

  const loadModels = async () => {
    if (enabledProviders.length === 0) return;

    setLoading(true);
    try {
      const results = await modelService.getAllAvailableModels(enabledProviders);
      setProviderModels(results);
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayText = (modelString: string): string => {
    if (modelString === 'default') {
      return `${i18n.popup.models.default}`;
    }

    const parts = modelString.split('/');
    if (parts.length !== 2) return modelString;

    const [providerId, modelName] = parts;
    const provider = enabledProviders.find((p) => p.id === providerId);
    const providerData = providerModels.find((pm) => pm.provider.id === providerId);
    const model = providerData?.models.find((m) => m.id === modelName);

    return `${provider?.name || providerId} / ${model?.name || modelName}`;
  };

  const handleSelect = (modelString: string) => {
    onChange(modelString);
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      {label && (
        <label className="sl-label" style={{ marginBottom: 8, display: 'block' }}>
          {label}
        </label>
      )}

      <button
        className="sl-input"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          background: palette.background,
          textAlign: 'left',
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {getDisplayText(selectedModel)}
        </span>
        <ChevronDown
          size={16}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: palette.surface,
            border: `1px solid ${palette.border}`,
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            maxHeight: 300,
            overflowY: 'auto',
            zIndex: 1000,
            marginTop: 4,
          }}
        >
          {loading ? (
            <div style={{ padding: 16, textAlign: 'center', color: palette.textSecondary }}>
              <Loader2 size={16} style={{ animation: 'sl-spin 1s linear infinite' }} />
              <span style={{ marginLeft: 8 }}>{i18n.popup.models.loading}</span>
            </div>
          ) : (
            <>
              {/* Default Option */}
              {showDefault && (
                <>
                  <button
                    onClick={() => handleSelect('default')}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      textAlign: 'left',
                      background: selectedModel === 'default' ? palette.primarySoft : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderBottom: `1px solid ${palette.border}`,
                      color: selectedModel === 'default' ? palette.primary : palette.text,
                    }}
                  >
                    <div style={{ fontWeight: 500 }}>{i18n.popup.models.default}</div>
                  </button>
                </>
              )}

              {/* Provider Models */}
              {providerModels.map(({ provider, models }) => (
                <div key={provider.id}>
                  <div
                    style={{
                      padding: '8px 16px',
                      background: palette.background,
                      borderBottom: `1px solid ${palette.border}`,
                      fontSize: 12,
                      fontWeight: 600,
                      color: palette.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {provider.name}
                  </div>
                  {models.map((model) => {
                    const modelString = `${provider.id}/${model.id}`;
                    const isSelected = selectedModel === modelString;

                    return (
                      <button
                        key={model.id}
                        onClick={() => handleSelect(modelString)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          textAlign: 'left',
                          background: isSelected ? palette.primarySoft : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: isSelected ? palette.primary : palette.text,
                        }}
                      >
                        <div style={{ fontWeight: 500 }}>{model.name}</div>
                        {model.description && model.description !== model.name && (
                          <div style={{ fontSize: 12, color: palette.textSecondary, marginTop: 2 }}>
                            {model.description}
                          </div>
                        )}
                        {model.contextWindow && (
                          <div style={{ fontSize: 11, color: palette.textSecondary, marginTop: 2 }}>
                            {i18n.popup.models.contextWindow}:{' '}
                            {model.contextWindow.toLocaleString()}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}

              {enabledProviders.length === 0 && (
                <div style={{ padding: 16, textAlign: 'center', color: palette.textSecondary }}>
                  {i18n.popup.models.noProvidersEnabled}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
