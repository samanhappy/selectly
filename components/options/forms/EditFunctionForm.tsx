import { Trash2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import type { FunctionConfig } from '../../../core/config/llm-config';
import { ConfigManager, DEFAULT_HIGHLIGHT_COLOR } from '../../../core/config/llm-config';
import { getActionIcon } from '../../../utils/icon-utils';
import { EnhancedModelSelector } from './EnhancedModelSelector';
import { parseColorToRgba, rgbaToHex, rgbaToString, type RgbaColor } from './highlight-color-utils';
import { IconSelector } from './IconSelector';

interface EditFunctionFormProps {
  functionKey: string;
  config: FunctionConfig;
  i18n: any;
  palette: any;
  onChange: (field: keyof FunctionConfig, value: any) => void;
  onRemove: () => void;
  onClose: () => void;
  allowRemove: boolean;
}

export const EditFunctionForm: React.FC<EditFunctionFormProps> = ({
  functionKey,
  config,
  i18n,
  palette,
  onChange,
  onRemove,
  onClose,
  allowRemove,
}) => {
  const [localPrompt, setLocalPrompt] = useState(config.prompt || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const saveTimer = useRef<number | null>(null);

  const highlightFallback: RgbaColor = { r: 255, g: 204, b: 0, a: 0.24 };
  const highlightColorValue = config.highlightColor || DEFAULT_HIGHLIGHT_COLOR;
  const currentHighlight = parseColorToRgba(highlightColorValue, highlightFallback);
  const currentHighlightHex = rgbaToHex(currentHighlight);
  const currentHighlightOpacity = currentHighlight.a;

  const presetLabel = i18n.popup?.functions?.labels?.highlightColorPresets || 'Preset colors';
  const customLabel = i18n.popup?.functions?.labels?.highlightColorCustom || 'Custom color';
  const opacityLabel = i18n.popup?.functions?.labels?.highlightColorOpacity || 'Opacity';

  const presetColors = [
    { id: 'sun', name: 'Sunshine', color: DEFAULT_HIGHLIGHT_COLOR },
    { id: 'mint', name: 'Mint', color: 'rgba(16, 185, 129, 0.22)' },
    { id: 'sky', name: 'Sky', color: 'rgba(56, 189, 248, 0.22)' },
    { id: 'lavender', name: 'Lavender', color: 'rgba(139, 92, 246, 0.22)' },
    { id: 'rose', name: 'Rose', color: 'rgba(244, 63, 94, 0.2)' },
    { id: 'peach', name: 'Peach', color: 'rgba(251, 146, 60, 0.22)' },
  ];

  const configManager = ConfigManager.getInstance();
  const userConfig = configManager.getConfig();
  const enabledProviders = configManager.getEnabledProviders();

  useEffect(() => {
    setLocalPrompt(config.prompt || '');
  }, [config.prompt]);

  const scheduleSave = (value: string) => {
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
    }
    saveTimer.current = window.setTimeout(() => {
      onChange('prompt', value);
    }, 300);
  };

  return (
    <div className="sl-drawer-body">
      {' '}
      <div>
        <div style={{ marginBottom: 24 }}>
          <div className="sl-field">
            <label className="sl-label">{i18n.popup.functions.labels.title}</label>
            <input
              className="sl-input"
              value={config.title || ''}
              onChange={(e) => onChange('title', e.target.value)}
              placeholder={i18n.popup.functions.title}
              disabled={config.isBuiltIn}
            />
          </div>

          <div className="sl-field">
            <label className="sl-label">{i18n.popup.functions.description}</label>
            <input
              className="sl-input"
              value={config.description || ''}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder={i18n.popup.functions.description}
              disabled={config.isBuiltIn}
            />
          </div>

          {functionKey === 'highlight' && (
            <div className="sl-field">
              <label className="sl-label">
                {i18n.popup.functions.labels.highlightColor || 'Highlight Color'}
              </label>
              <div className="flex flex-col gap-3">
                <div className="text-xs font-medium text-slate-600">{presetLabel}</div>
                <div className="flex flex-wrap gap-2">
                  {presetColors.map((preset) => {
                    const isSelected =
                      rgbaToString(parseColorToRgba(preset.color, currentHighlight)) ===
                      rgbaToString(currentHighlight);
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => onChange('highlightColor', preset.color)}
                        className={`h-7 w-7 rounded border border-slate-200 transition-shadow ${
                          isSelected ? 'ring-2 ring-slate-400' : 'hover:ring-2 hover:ring-slate-200'
                        }`}
                        style={{ backgroundColor: preset.color }}
                        title={preset.name}
                        aria-label={preset.name}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs font-medium text-slate-600">{customLabel}</div>
                  <div className="flex items-center gap-2">
                    <input
                      className="sl-input !h-8 !w-10 !p-0"
                      type="color"
                      value={currentHighlightHex}
                      onChange={(e) => {
                        const next = parseColorToRgba(e.target.value, currentHighlight);
                        onChange(
                          'highlightColor',
                          rgbaToString({ ...next, a: currentHighlight.a })
                        );
                      }}
                      aria-label={customLabel}
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{opacityLabel}</span>
                      <input
                        type="range"
                        min={0.05}
                        max={0.6}
                        step={0.01}
                        value={currentHighlightOpacity}
                        onChange={(e) =>
                          onChange(
                            'highlightColor',
                            rgbaToString({
                              ...currentHighlight,
                              a: Number(e.target.value),
                            })
                          )
                        }
                        aria-label={opacityLabel}
                      />
                      <span className="text-xs text-slate-500 w-10">
                        {Math.round(currentHighlightOpacity * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {i18n.popup.functions.labels.highlightColorHelp && (
                <div className="sl-helper">{i18n.popup.functions.labels.highlightColorHelp}</div>
              )}
            </div>
          )}

          {config.isBuiltIn && (
            <div className="sl-field">
              <label className="sl-label">
                {i18n.popup.functions.labels.icon}
                {(() => {
                  const Icon = getActionIcon(config.icon);
                  return <Icon size={16} style={{ display: 'inline-block', marginLeft: 8 }} />;
                })()}
              </label>
            </div>
          )}

          {!config.isBuiltIn && (
            <IconSelector
              label={i18n.popup.functions.labels.icon}
              value={config.icon || 'sparkles'}
              onChange={(v) => onChange('icon', v)}
            />
          )}

          {config.requiresAI !== false && (
            <div className="sl-field">
              <EnhancedModelSelector
                selectedModel={config.model || 'default'}
                enabledProviders={enabledProviders}
                defaultModel={userConfig.llm.defaultModel}
                i18n={i18n}
                palette={palette}
                onChange={(model) => onChange('model', model)}
                label={i18n.popup.functions.labels.aiModel}
                showDefault={true}
              />
            </div>
          )}

          {config.requiresAI !== false && (
            <div className="sl-field">
              <label className="sl-label">{i18n.popup.functions.labels.promptTemplate}</label>
              <textarea
                className="sl-textarea"
                value={localPrompt}
                onChange={(e) => {
                  const v = e.target.value;
                  setLocalPrompt(v);
                  scheduleSave(v);
                }}
                onBlur={() => onChange('prompt', localPrompt)}
                rows={5}
              />
              <div className="sl-helper">{i18n.popup.functions.labels.promptHelp}</div>
            </div>
          )}

          {functionKey === 'search' && i18n.popup.functions.searchEngines && (
            <div className="sl-field">
              <label className="sl-label">
                {i18n.popup.functions.labels.searchEngine || 'Search Engine'}
              </label>
              <select
                className="sl-input"
                value={config.searchEngine || 'google'}
                onChange={(e) => onChange('searchEngine', e.target.value)}
              >
                <option value="google">{i18n.popup.functions.searchEngines.google}</option>
                <option value="bing">{i18n.popup.functions.searchEngines.bing}</option>
                <option value="baidu">{i18n.popup.functions.searchEngines.baidu}</option>
              </select>
              {i18n.popup.functions.labels.searchEngineHelp && (
                <div className="sl-helper">{i18n.popup.functions.labels.searchEngineHelp}</div>
              )}
            </div>
          )}
        </div>

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
              <label className="sl-switch-row">
                <input
                  className="sl-checkbox"
                  type="checkbox"
                  checked={config.autoExecute || false}
                  onChange={(e) => onChange('autoExecute', e.target.checked)}
                />
                <div>
                  <div className="sl-switch-text">{i18n.popup.functions.labels.autoExecute}</div>
                  <div className="sl-switch-desc">
                    {i18n.popup.functions.labels.autoExecuteHelp}
                  </div>
                </div>
              </label>

              {config.autoExecute && (
                <div className="sl-field">
                  <label className="sl-label">
                    {i18n.popup.functions.labels.autoExecuteDomains}
                  </label>
                  <input
                    className="sl-input"
                    value={(config.autoExecuteDomains || []).join(', ')}
                    onChange={(e) =>
                      onChange(
                        'autoExecuteDomains',
                        e.target.value
                          .split(',')
                          .map((s: string) => s.trim())
                          .filter(Boolean)
                      )
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
                  checked={config.autoCloseButtons ?? true}
                  onChange={(e) => onChange('autoCloseButtons', e.target.checked)}
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
                  checked={config.autoCloseResult || false}
                  onChange={(e) => onChange('autoCloseResult', e.target.checked)}
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

              <label className="sl-switch-row">
                <input
                  className="sl-checkbox"
                  type="checkbox"
                  checked={config.collapsed || false}
                  onChange={(e) => onChange('collapsed', e.target.checked)}
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
                  value={(config.displayDomains || []).join(', ')}
                  onChange={(e) =>
                    onChange(
                      'displayDomains',
                      e.target.value
                        .split(',')
                        .map((s: string) => s.trim())
                        .filter(Boolean)
                    )
                  }
                  placeholder={i18n.popup.functions.placeholders.displayDomains}
                />
                <div className="sl-helper">{i18n.popup.functions.labels.displayDomainsHelp}</div>
              </div>
            </div>
          )}
        </div>

        <div className="sl-actions">
          <button className="sl-btn sl-btn-ghost" onClick={onClose}>
            {i18n.common.close}
          </button>
          {allowRemove && (
            <button
              className="sl-btn sl-btn-danger"
              onClick={onRemove}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Trash2 size={14} /> {i18n.common.delete}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
