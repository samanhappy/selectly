import { Globe, MousePointer } from 'lucide-react';
import React from 'react';

import type { GeneralConfig, UserConfig } from '../../../core/config/llm-config';
import type { SupportedLanguage } from '../../../core/i18n/types';

interface GeneralSettingsFormProps {
  userConfig: UserConfig;
  i18n: any;
  onChange: (field: keyof GeneralConfig, value: any) => void;
  onClose: () => void;
}

export const GeneralSettingsForm: React.FC<GeneralSettingsFormProps> = ({
  userConfig,
  i18n,
  onChange,
  onClose,
}) => {
  const config = i18n.getConfig();
  return (
    <div className="sl-drawer-body">
      <h3 style={{ margin: '0 0 24px 0', fontSize: 18, fontWeight: 600, display: 'flex', gap: 8 }}>
        {config?.popup?.general?.title || 'General Settings'}
      </h3>
      <div className="sl-field">
        <label className="sl-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <MousePointer size={16} /> {config?.popup?.general?.buttonPosition || 'Button Position'}
        </label>
        <select
          className="sl-select"
          value={userConfig.general?.buttonPosition || 'above'}
          onChange={(e) => onChange('buttonPosition', e.target.value as 'above' | 'below')}
        >
          <option value="above">{config?.popup?.general?.buttonPositionAbove || 'Above'}</option>
          <option value="below">{config?.popup?.general?.buttonPositionBelow || 'Below'}</option>
        </select>
      </div>
      <div className="sl-field">
        <label className="sl-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Globe size={16} />
          {config?.popup?.general?.readingProgressTitle || 'Reading Progress'}
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label className="sl-checkbox" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={userConfig.general?.showReadingProgressBar !== false}
              onChange={(e) => onChange('showReadingProgressBar', e.target.checked)}
            />
            {config?.popup?.general?.showReadingProgressBar || 'Show progress bar'}
          </label>
          <label className="sl-checkbox" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={userConfig.general?.autoSaveReadingProgress !== false}
              onChange={(e) => onChange('autoSaveReadingProgress', e.target.checked)}
            />
            {config?.popup?.general?.autoSaveReadingProgress || 'Auto save reading progress'}
          </label>
          <label className="sl-checkbox" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={userConfig.general?.autoRestoreReadingProgress !== false}
              onChange={(e) => onChange('autoRestoreReadingProgress', e.target.checked)}
            />
            {config?.popup?.general?.autoRestoreReadingProgress || 'Restore last position on load'}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {config?.popup?.general?.readingProgressBarColor || 'Progress bar color'}
            </span>
            <input
              className="sl-input"
              type="color"
              value={userConfig.general?.readingProgressBarColor || '#60a5fa'}
              onChange={(e) => onChange('readingProgressBarColor', e.target.value)}
              style={{ width: 44, height: 28, padding: 0, border: 'none', background: 'none' }}
            />
          </div>
        </div>
      </div>
      <div className="sl-actions">
        <button className="sl-btn sl-btn-primary" onClick={onClose}>
          {config?.common?.close || 'Close'}
        </button>
      </div>
    </div>
  );
};
