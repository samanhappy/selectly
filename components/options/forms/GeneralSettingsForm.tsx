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
      <div className="sl-actions">
        <button className="sl-btn sl-btn-primary" onClick={onClose}>
          {config?.common?.close || 'Close'}
        </button>
      </div>
    </div>
  );
};
