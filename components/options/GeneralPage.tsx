/**
 * GeneralPage Component
 * Single responsibility: Display and manage general settings (data import/export)
 */

import { Download, Upload } from 'lucide-react';
import React from 'react';

import type { GeneralConfig, UserConfig } from '../../core/config/llm-config';
import { secureStorage } from '../../core/storage/secure-storage';
import { COLOR_PRESETS } from './color-presets';
import { PALETTE } from './constants';
import {
  parseColorToRgba,
  rgbaToHex,
  rgbaToString,
  type RgbaColor,
} from './forms/highlight-color-utils';

interface GeneralPageProps {
  t: any; // i18n translations
  onReload: () => Promise<void>;
  userConfig: UserConfig;
  onChange: (field: keyof GeneralConfig, value: any) => void;
}

export const GeneralPage: React.FC<GeneralPageProps> = ({ t, onReload, userConfig, onChange }) => {
  const progressFallback: RgbaColor = { r: 96, g: 165, b: 250, a: 1 };
  const progressColorValue = userConfig.general?.readingProgressBarColor || '#60a5fa';
  const currentProgress = parseColorToRgba(progressColorValue, progressFallback);
  const currentProgressHex = rgbaToHex(currentProgress);
  const progressPresets = COLOR_PRESETS.map((preset) => ({
    id: preset.id,
    name: preset.name,
    color: preset.solidColor,
  }));
  const progressPresetLabel = t.popup?.general?.readingProgressBarColorPresets || 'Preset colors';
  const progressCustomLabel = t.popup?.general?.readingProgressBarColorCustom || 'Custom color';
  const listMode = userConfig.general?.readingProgressListMode || 'whitelist';

  const exportConfiguration = async () => {
    try {
      const jsonData = await secureStorage.exportAllData();
      const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `selectly-config-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert(t.options?.general?.exportSuccess || 'Configuration exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert(t.options?.general?.exportError || 'Failed to export configuration. Please try again.');
    }
  };

  const importConfiguration = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        await secureStorage.importAllData(text);
        alert(
          t.options?.general?.importSuccess ||
            'Configuration imported successfully! The page will reload.'
        );
        // Reload config to reflect changes
        await onReload();
        window.location.reload();
      } catch (error) {
        console.error('Import failed:', error);
        alert(
          `${t.options?.general?.importError || 'Failed to import configuration'}: ${(error as Error).message}`
        );
      }
    };
    input.click();
  };

  return (
    <div style={{ padding: '12px', minHeight: '100%' }}>
      <div className="sl-card" style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            {t.popup?.general?.readingProgressTitle || 'Reading Progress'}
          </h3>
        </div>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            className="sl-fn-card"
            style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}
          >
            <label className="sl-switch-row" style={{ margin: 0 }}>
              <input
                className="sl-checkbox"
                type="checkbox"
                checked={userConfig.general?.showReadingProgressBar !== false}
                onChange={(e) => onChange('showReadingProgressBar', e.target.checked)}
              />
              <span className="sl-switch-text">
                {t.popup?.general?.showReadingProgressBar || 'Show progress bar'}
              </span>
            </label>
            <label className="sl-switch-row" style={{ margin: 0 }}>
              <input
                className="sl-checkbox"
                type="checkbox"
                checked={userConfig.general?.autoSaveReadingProgress !== false}
                onChange={(e) => onChange('autoSaveReadingProgress', e.target.checked)}
              />
              <span className="sl-switch-text">
                {t.popup?.general?.autoSaveReadingProgress || 'Auto save reading progress'}
              </span>
            </label>
            <label className="sl-switch-row" style={{ margin: 0 }}>
              <input
                className="sl-checkbox"
                type="checkbox"
                checked={userConfig.general?.autoRestoreReadingProgress !== false}
                onChange={(e) => onChange('autoRestoreReadingProgress', e.target.checked)}
              />
              <span className="sl-switch-text">
                {t.popup?.general?.autoRestoreReadingProgress || 'Restore last position on load'}
              </span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                {t.popup?.general?.readingProgressBarColor || 'Progress bar color'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-600">{progressCustomLabel}</span>
                <input
                  className="sl-input"
                  type="color"
                  value={currentProgressHex}
                  onChange={(e) => onChange('readingProgressBarColor', e.target.value)}
                  style={{ width: 48, height: 30, padding: 0, border: 'none', background: 'none' }}
                  aria-label={progressCustomLabel}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-xs font-medium text-slate-600">{progressPresetLabel}</div>
              <div className="flex flex-wrap gap-2">
                {progressPresets.map((preset) => {
                  const isSelected =
                    rgbaToString(parseColorToRgba(preset.color, currentProgress)) ===
                    rgbaToString(currentProgress);
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onChange('readingProgressBarColor', preset.color)}
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
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                {t.popup?.general?.readingProgressMode || 'Domain list mode'}
              </div>
              <select
                className="sl-input"
                value={listMode}
                onChange={(e) => onChange('readingProgressListMode', e.target.value)}
              >
                <option value="blacklist">
                  {t.popup?.general?.readingProgressModeBlacklist || 'Blacklist'}
                </option>
                <option value="whitelist">
                  {t.popup?.general?.readingProgressModeWhitelist || 'Whitelist'}
                </option>
              </select>
            </div>
            <label className="sl-switch-row" style={{ margin: 0 }}>
              <input
                className="sl-checkbox"
                type="checkbox"
                checked={userConfig.general?.useSystemReadingProgressBlacklist !== false}
                onChange={(e) => onChange('useSystemReadingProgressBlacklist', e.target.checked)}
              />
              <span className="sl-switch-text">
                {t.popup?.general?.readingProgressUseSystemBlacklist || 'Use system blacklist'}
              </span>
            </label>
            <label className="sl-switch-row" style={{ margin: 0 }}>
              <input
                className="sl-checkbox"
                type="checkbox"
                checked={userConfig.general?.useSystemReadingProgressWhitelist !== false}
                onChange={(e) => onChange('useSystemReadingProgressWhitelist', e.target.checked)}
              />
              <span className="sl-switch-text">
                {t.popup?.general?.readingProgressUseSystemWhitelist || 'Use system whitelist'}
              </span>
            </label>
            {listMode === 'blacklist' ? (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  {t.popup?.general?.readingProgressBlacklist ||
                    'Blacklisted Domains (One per line)'}
                </div>
                <textarea
                  className="sl-input"
                  style={{
                    width: '100%',
                    height: 100,
                    fontFamily: 'monospace',
                    fontSize: 12,
                    resize: 'vertical',
                  }}
                  value={(userConfig.general?.readingProgressBlacklist || []).join('\n')}
                  onChange={(e) => {
                    const val = e.target.value
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean);
                    onChange('readingProgressBlacklist', val);
                  }}
                  placeholder="example.com\nx.com"
                />
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                  {t.popup?.general?.readingProgressBlacklistDesc ||
                    'Progress will not be saved or restored for these domains. System defaults (e.g. x.com, youtube.com) are also applied automatically.'}
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  {t.popup?.general?.readingProgressWhitelist ||
                    'Whitelisted Domains (One per line)'}
                </div>
                <textarea
                  className="sl-input"
                  style={{
                    width: '100%',
                    height: 100,
                    fontFamily: 'monospace',
                    fontSize: 12,
                    resize: 'vertical',
                  }}
                  value={(userConfig.general?.readingProgressWhitelist || []).join('\n')}
                  onChange={(e) => {
                    const val = e.target.value
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean);
                    onChange('readingProgressWhitelist', val);
                  }}
                  placeholder="example.com\nread.example"
                />
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                  {t.popup?.general?.readingProgressWhitelistDesc ||
                    'Progress will only be saved or restored for these domains. You can also enable system whitelist defaults.'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="sl-card" style={{ marginTop: 12 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            {t.options?.general?.dataManagement || 'Data Management'}
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="sl-fn-card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flex: '1 1 0%',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                  {t.options?.general?.exportConfig || 'Export Configuration'}
                </div>
                <div style={{ fontSize: 12, color: PALETTE.textSecondary }}>
                  {t.options?.general?.exportConfigDesc ||
                    'Download all settings and data as JSON file'}
                </div>
              </div>
              <button
                className="sl-btn sl-btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                onClick={exportConfiguration}
              >
                <Download size={16} />
                {t.options?.general?.export || 'Export'}
              </button>
            </div>
          </div>
          <div className="sl-fn-card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flex: '1 1 0%',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                  {t.options?.general?.importConfig || 'Import Configuration'}
                </div>
                <div style={{ fontSize: 12, color: PALETTE.textSecondary }}>
                  {t.options?.general?.importConfigDesc ||
                    'Restore settings and data from JSON file'}
                </div>
              </div>
              <button
                className="sl-btn sl-btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                onClick={importConfiguration}
              >
                <Upload size={16} />
                {t.options?.general?.import || 'Import'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
