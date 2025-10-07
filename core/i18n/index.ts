import { secureStorage } from '../storage/secure-storage';
import { de } from './locales/de';
import { en } from './locales/en';
import { es } from './locales/es';
import { fr } from './locales/fr';
import { ja } from './locales/ja';
import { pt } from './locales/pt';
import { zh } from './locales/zh';
import type { I18nConfig, SupportedLanguage } from './types';

const locales: Record<SupportedLanguage, I18nConfig> = {
  en,
  zh,
  es,
  pt,
  ja,
  de,
  fr,
};

export class I18nManager {
  private static instance: I18nManager;
  private currentLanguage: SupportedLanguage = 'en';
  private config: I18nConfig = en;

  static getInstance(): I18nManager {
    if (!I18nManager.instance) {
      I18nManager.instance = new I18nManager();
    }
    return I18nManager.instance;
  }

  async initialize(): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await secureStorage.get(['userLanguage']);
        if (result.userLanguage && this.isValidLanguage(result.userLanguage)) {
          this.currentLanguage = result.userLanguage;
        } else {
          const browserLang = this.detectBrowserLanguage();
          this.currentLanguage = browserLang;
          await this.setLanguage(browserLang);
        }
      } else {
        this.currentLanguage = this.detectBrowserLanguage();
      }
      this.config = locales[this.currentLanguage];
    } catch (error) {
      console.warn('Failed to initialize i18n:', error);
      this.config = en;
    }
  }

  private detectBrowserLanguage(): SupportedLanguage {
    const browserLang =
      typeof navigator !== 'undefined'
        ? navigator.language || navigator.languages?.[0] || 'en'
        : 'en';

    // Check for exact matches first
    if (browserLang === 'en' || browserLang === 'en-US') return 'en';
    if (browserLang === 'zh' || browserLang === 'zh-CN') return 'zh';
    if (browserLang === 'es' || browserLang === 'es-ES') return 'es';
    if (browserLang === 'pt' || browserLang === 'pt-BR' || browserLang === 'pt-PT') return 'pt';
    if (browserLang === 'ja' || browserLang === 'ja-JP') return 'ja';
    if (browserLang === 'de' || browserLang === 'de-DE') return 'de';
    if (browserLang === 'fr' || browserLang === 'fr-FR') return 'fr';

    // Check for language prefixes
    if (browserLang.startsWith('zh')) return 'zh';
    if (browserLang.startsWith('es')) return 'es';
    if (browserLang.startsWith('pt')) return 'pt';
    if (browserLang.startsWith('ja')) return 'ja';
    if (browserLang.startsWith('de')) return 'de';
    if (browserLang.startsWith('fr')) return 'fr';

    // Default to English
    return 'en';
  }

  private isValidLanguage(lang: string): lang is SupportedLanguage {
    return ['en', 'zh', 'es', 'pt', 'ja', 'de', 'fr'].includes(lang);
  }

  async setLanguage(language: SupportedLanguage): Promise<void> {
    this.currentLanguage = language;
    this.config = locales[language];

    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await secureStorage.set({ userLanguage: language });
      }
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  }

  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  getConfig(): I18nConfig {
    return this.config;
  }

  t(path: string): string {
    const keys = path.split('.');
    let current: any = this.config;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        console.warn(`Translation key not found: ${path}`);
        return path;
      }
    }

    return typeof current === 'string' ? current : path;
  }

  getSupportedLanguages(): Array<{ code: SupportedLanguage; name: string }> {
    return [
      { code: 'en', name: 'English' },
      { code: 'zh', name: '中文' },
      { code: 'es', name: 'Español' },
      { code: 'pt', name: 'Português' },
      { code: 'ja', name: '日本語' },
      { code: 'de', name: 'Deutsch' },
      { code: 'fr', name: 'Français' },
    ];
  }
}

// Create global instance
export const i18n = I18nManager.getInstance();

// Convenient method exports
export const t = (path: string) => i18n.t(path);
