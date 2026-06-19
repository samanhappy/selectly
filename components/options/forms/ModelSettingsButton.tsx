import { Settings } from 'lucide-react';
import React, { useState } from 'react';

import type { ModelCallSettings } from '../../../core/config/llm-config';
import type { ModelMetadataOverride } from '../../../core/tab-context/types';
import { ThinkingModeSelect } from './ThinkingModeSelect';

interface ModelSettingsButtonProps {
  settings?: ModelCallSettings;
  modelMetadata?: ModelMetadataOverride;
  i18n: any;
  palette: any;
  onChange: (settings: ModelCallSettings) => void;
  onModelMetadataChange?: (metadata: ModelMetadataOverride) => void;
}

export const ModelSettingsButton: React.FC<ModelSettingsButtonProps> = ({
  settings = { thinkingMode: 'auto' },
  modelMetadata,
  i18n,
  palette,
  onChange,
  onModelMetadataChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'flex', flex: '0 0 auto' }}>
      <button
        type="button"
        aria-label={i18n.popup.functions.labels.configuration}
        title={i18n.popup.functions.labels.configuration}
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((value) => !value);
        }}
        style={{
          aspectRatio: '1 / 1',
          width: 'auto',
          minWidth: 'auto',
          height: '100%',
          padding: 0,
          boxSizing: 'border-box',
          border: `1px solid ${palette.border}`,
          borderRadius: 8,
          background: palette.background,
          color: palette.textSecondary,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Settings size={16} />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label={i18n.popup.functions.labels.configuration}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            width: 280,
            padding: 12,
            background: palette.surface,
            border: `1px solid ${palette.border}`,
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.16)',
            zIndex: 1100,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <ThinkingModeSelect
            value={settings.thinkingMode}
            i18n={i18n}
            onChange={(thinkingMode) => onChange({ ...settings, thinkingMode })}
          />
          {onModelMetadataChange && (
            <label className="sl-field" style={{ marginTop: 12 }}>
              <span className="sl-label">{i18n.popup.models.contextWindow}</span>
              <input
                className="sl-input"
                type="number"
                min={1}
                step={1024}
                value={modelMetadata?.contextWindow || ''}
                placeholder={i18n.popup.models.contextWindowPlaceholder}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  onModelMetadataChange({
                    contextWindow: Number.isFinite(value) && value > 0 ? value : undefined,
                  });
                }}
              />
              <div className="sl-helper">{i18n.popup.models.contextWindowHelp}</div>
            </label>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            style={{
              width: '100%',
              marginTop: 8,
              padding: '6px 12px',
              background: 'transparent',
              border: `1px solid ${palette.border}`,
              borderRadius: 6,
              cursor: 'pointer',
              color: palette.textSecondary,
            }}
          >
            {i18n.common.close}
          </button>
        </div>
      )}
    </div>
  );
};
