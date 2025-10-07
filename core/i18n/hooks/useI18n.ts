import { useEffect, useState } from 'react';

import { i18n } from '../index';
import type { I18nConfig } from '../types';

export const useI18n = () => {
  const [config, setConfig] = useState<I18nConfig>(i18n.getConfig());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeI18n = async () => {
      try {
        await i18n.initialize();
        setConfig(i18n.getConfig());
      } catch (error) {
        console.error('Failed to initialize i18n:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeI18n();
  }, []);

  const updateLanguage = async (language: string) => {
    try {
      if (language === 'zh' || language === 'en') {
        await i18n.setLanguage(language);
        setConfig(i18n.getConfig());
      }
    } catch (error) {
      console.error('Failed to update language:', error);
    }
  };

  return {
    config,
    isLoading,
    currentLanguage: i18n.getCurrentLanguage(),
    supportedLanguages: i18n.getSupportedLanguages(),
    updateLanguage,
    t: (path: string) => i18n.t(path),
  };
};
