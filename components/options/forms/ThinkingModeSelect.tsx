import React from 'react';

import type { ThinkingMode } from '../../../core/config/llm-config';
import type { I18nConfig } from '../../../core/i18n/types';

interface ThinkingModeSelectProps {
  value?: ThinkingMode;
  i18n: I18nConfig;
  onChange: (thinkingMode: ThinkingMode) => void;
}

export const ThinkingModeSelect: React.FC<ThinkingModeSelectProps> = ({
  value = 'auto',
  i18n,
  onChange,
}) => (
  <div className="sl-field">
    <label className="sl-label">{i18n.popup.functions.labels.thinkingMode}</label>
    <select
      className="sl-input"
      value={value}
      onChange={(event) => onChange(event.target.value as ThinkingMode)}
    >
      <option value="auto">{i18n.popup.functions.labels.thinkingModeAuto}</option>
      <option value="enabled">{i18n.popup.functions.labels.thinkingModeEnabled}</option>
      <option value="disabled">{i18n.popup.functions.labels.thinkingModeDisabled}</option>
    </select>
    <div className="sl-helper">{i18n.popup.functions.labels.thinkingModeHelp}</div>
  </div>
);
