/**
 * OptionsHeader Component
 * Single responsibility: Display header with title and language selector
 */

import { Globe } from 'lucide-react';
import React from 'react';

import { i18n } from '../../core/i18n';
import type { SidebarKey } from './constants';

interface OptionsHeaderProps {
  active: SidebarKey;
  i18nConfig: any;
  t: any;
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
}

export const OptionsHeader: React.FC<OptionsHeaderProps> = ({
  active,
  i18nConfig,
  t,
  currentLanguage,
  onLanguageChange,
}) => {
  const getTitle = () => {
    switch (active) {
      case 'collected':
        return t.options?.collections.collectionGroups || 'Collection Groups';
      case 'dictionary':
        return (t as any).options?.dictionary?.title || 'Dictionary';
      case 'functions':
        return i18nConfig.popup.functions.title;
      case 'general':
        return i18nConfig.popup.general.title;
      case 'llm':
        return i18nConfig.popup.tabs.llm;
      case 'subscription':
        return i18nConfig.popup.tabs.subscription;
      default:
        return '';
    }
  };

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
      <h1 className="text-lg font-semibold text-slate-900">{getTitle()}</h1>
      <div className="flex items-center gap-3">
        {/* Language Selector */}
        <div className="flex items-center gap-2">
          <Globe size={16} className="text-slate-600" />
          <select
            value={currentLanguage}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="px-2 py-1 text-sm border border-slate-200 rounded-md bg-white text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {i18n.getSupportedLanguages().map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};
