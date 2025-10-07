/**
 * LLMPage Component
 * Single responsibility: Display LLM settings form
 */

import React from 'react';

import type { LLMConfig, LLMProvider } from '../../core/config/llm-config';
import { PALETTE } from './constants';
import { LLMSettingsForm } from './forms/LLMSettingsForm';

interface LLMPageProps {
  llm: LLMConfig;
  i18nConfig: any;
  onChange: (config: Partial<LLMConfig>) => void;
  onOpenDrawer: (type: 'configure' | 'add', provider?: LLMProvider) => void;
}

export const LLMPage: React.FC<LLMPageProps> = ({ llm, i18nConfig, onChange, onOpenDrawer }) => {
  return (
    <div style={{ padding: '12px', background: PALETTE.surfaceAlt, minHeight: '100%' }}>
      <LLMSettingsForm
        llm={llm}
        i18n={i18nConfig}
        onChange={onChange}
        palette={PALETTE}
        onOpenDrawer={onOpenDrawer}
      />
    </div>
  );
};
