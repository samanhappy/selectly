import React, { useState } from 'react';

import { ConfigManager } from '../../../core/config/llm-config';
import { EnhancedModelSelector } from './EnhancedModelSelector';
import { IconSelector } from './IconSelector';

interface NewFunctionFormState {
  key: string;
  config: {
    title: string;
    description: string;
    icon: string;
    model: string;
    prompt: string;
    autoExecute: boolean;
    autoExecuteDomains?: string[];
    autoCloseButtons: boolean;
    autoCloseResult: boolean;
    collapsed?: boolean;
    enabled: boolean;
    displayDomains?: string[];
    isPremium?: boolean;
    requiresAI?: boolean;
    isBuiltIn?: boolean;
  };
}

interface AddFunctionFormProps {
  state: NewFunctionFormState;
  i18n: any;
  palette: any;
  onChange: (update: NewFunctionFormState) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export const AddFunctionForm: React.FC<AddFunctionFormProps> = ({
  state,
  i18n,
  palette,
  onChange,
  onSubmit,
  onCancel,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const configManager = ConfigManager.getInstance();
  const config = configManager.getConfig();
  const enabledProviders = configManager.getEnabledProviders();

  const disabled = !state.config.title || !state.config.prompt;

  return (
    <div className="sl-drawer-body">
      <div>
        <div style={{ marginBottom: 24 }}>
          <div className="sl-field">
            <label className="sl-label">{i18n.popup.functions.labels.title}</label>
            <input
              className="sl-input"
              value={state.config.title}
              onChange={(e) =>
                onChange({ ...state, config: { ...state.config, title: e.target.value } })
              }
              placeholder={i18n.popup.functions.placeholders.title}
            />
          </div>

          <div className="sl-field">
            <label className="sl-label">{i18n.popup.functions.description}</label>
            <input
              className="sl-input"
              value={state.config.description}
              onChange={(e) =>
                onChange({ ...state, config: { ...state.config, description: e.target.value } })
              }
              placeholder={i18n.popup.functions.placeholders.description}
            />
          </div>

          <IconSelector
            label={i18n.popup.functions.labels.icon}
            value={state.config.icon}
            onChange={(icon) => onChange({ ...state, config: { ...state.config, icon } })}
          />

          {state.config.requiresAI !== false && (
            <div className="sl-field">
              <EnhancedModelSelector
                selectedModel={state.config.model}
                enabledProviders={enabledProviders}
                defaultModel={config.llm.defaultModel}
                i18n={i18n}
                palette={palette}
                onChange={(model) => onChange({ ...state, config: { ...state.config, model } })}
                label={i18n.popup.functions.labels.aiModel}
                showDefault={true}
              />
            </div>
          )}

          <div className="sl-field">
            <label className="sl-label">{i18n.popup.functions.labels.promptTemplate}</label>
            <textarea
              className="sl-textarea"
              value={state.config.prompt}
              onChange={(e) =>
                onChange({ ...state, config: { ...state.config, prompt: e.target.value } })
              }
              placeholder={i18n.popup.functions.placeholders.prompt}
              rows={4}
            />
            <div className="sl-helper">{i18n.popup.functions.labels.promptHelp}</div>
          </div>
        </div>

        {/* Advanced settings */}
        <div style={{ marginBottom: 24 }}>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              margin: '0 0 16px 0',
              fontSize: 14,
              fontWeight: 600,
              color: '#666',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            >
              ▶
            </span>
            {i18n.popup.functions.labels.advancedSettings}
          </button>

          {showAdvanced && (
            <div>
              {/* Execution behavior settings */}
              <label className="sl-switch-row">
                <input
                  className="sl-checkbox"
                  type="checkbox"
                  checked={state.config.autoExecute}
                  onChange={(e) =>
                    onChange({
                      ...state,
                      config: { ...state.config, autoExecute: e.target.checked },
                    })
                  }
                />
                <div>
                  <div className="sl-switch-text">{i18n.popup.functions.labels.autoExecute}</div>
                  <div className="sl-switch-desc">
                    {i18n.popup.functions.labels.autoExecuteHelp}
                  </div>
                </div>
              </label>

              {/* Auto-execute domain settings */}
              {state.config.autoExecute && (
                <div className="sl-field">
                  <label className="sl-label">
                    {i18n.popup.functions.labels.autoExecuteDomains}
                  </label>
                  <input
                    className="sl-input"
                    value={(state.config.autoExecuteDomains || []).join(', ')}
                    onChange={(e) =>
                      onChange({
                        ...state,
                        config: {
                          ...state.config,
                          autoExecuteDomains: e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        },
                      })
                    }
                    placeholder={
                      i18n.popup.functions.placeholders.autoExecuteDomains ||
                      i18n.popup.functions.placeholders.displayDomains
                    }
                  />
                  <div className="sl-helper">
                    {i18n.popup.functions.labels.autoExecuteDomainsHelp}
                  </div>
                </div>
              )}

              <label className="sl-switch-row">
                <input
                  className="sl-checkbox"
                  type="checkbox"
                  checked={state.config.autoCloseButtons}
                  onChange={(e) =>
                    onChange({
                      ...state,
                      config: { ...state.config, autoCloseButtons: e.target.checked },
                    })
                  }
                />
                <div>
                  <div className="sl-switch-text">
                    {i18n.popup.functions.labels.autoCloseButtons}
                  </div>
                  <div className="sl-switch-desc">
                    {i18n.popup.functions.labels.autoCloseButtonsHelp}
                  </div>
                </div>
              </label>

              <label className="sl-switch-row">
                <input
                  className="sl-checkbox"
                  type="checkbox"
                  checked={state.config.autoCloseResult || false}
                  onChange={(e) =>
                    onChange({
                      ...state,
                      config: { ...state.config, autoCloseResult: e.target.checked },
                    })
                  }
                />
                <div>
                  <div className="sl-switch-text">
                    {i18n.popup.functions.labels.autoCloseResult}
                  </div>
                  <div className="sl-switch-desc">
                    {i18n.popup.functions.labels.autoCloseResultHelp}
                  </div>
                </div>
              </label>

              {/* Display settings */}
              <label className="sl-switch-row">
                <input
                  className="sl-checkbox"
                  type="checkbox"
                  checked={state.config.collapsed || false}
                  onChange={(e) =>
                    onChange({ ...state, config: { ...state.config, collapsed: e.target.checked } })
                  }
                />
                <div>
                  <div className="sl-switch-text">{i18n.popup.functions.labels.collapsed}</div>
                  <div className="sl-switch-desc">{i18n.popup.functions.labels.collapsedHelp}</div>
                </div>
              </label>

              <div className="sl-field">
                <label className="sl-label">{i18n.popup.functions.labels.displayDomains}</label>
                <input
                  className="sl-input"
                  value={(state.config.displayDomains || []).join(', ')}
                  onChange={(e) =>
                    onChange({
                      ...state,
                      config: {
                        ...state.config,
                        displayDomains: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      },
                    })
                  }
                  placeholder={i18n.popup.functions.placeholders.displayDomains}
                />
                <div className="sl-helper">{i18n.popup.functions.labels.displayDomainsHelp}</div>
              </div>
            </div>
          )}
        </div>

        <div className="sl-actions">
          <button className="sl-btn sl-btn-ghost" onClick={onCancel}>
            {i18n.common.cancel}
          </button>
          <button className="sl-btn sl-btn-primary" disabled={disabled} onClick={onSubmit}>
            {i18n.common.add}
          </button>
        </div>
      </div>
    </div>
  );
};
