/**
 * Storage Migration Utility
 * Handles migration from old unencrypted storage to new encrypted storage
 */

import { AdvancedCrypto } from './crypto';
import { secureStorage } from './secure-storage';

interface LegacyData {
  userConfig?: any;
  userLanguage?: string;
  subscriptionInfo?: any;
  accessToken?: string;
  userInfo?: any;
}

export class StorageMigration {
  private static hasRunMigration = false;

  /**
   * Check if legacy data exists and migrate to secure storage
   */
  static async migrateIfNeeded(): Promise<void> {
    if (this.hasRunMigration) {
      return;
    }

    this.hasRunMigration = true;

    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        return;
      }

      console.log('[StorageMigration] Checking for legacy data...');

      // Get all data from legacy storage
      const legacyData = await chrome.storage.sync.get();

      if (!legacyData || Object.keys(legacyData).length === 0) {
        console.log('[StorageMigration] No legacy data found');
        return;
      }

      // Check if we have any known legacy keys
      const legacyKeys = [
        'userConfig',
        'userLanguage',
        'subscriptionInfo',
        'accessToken',
        'userInfo',
      ];
      const foundLegacyKeys = legacyKeys.filter((key) => key in legacyData);

      if (foundLegacyKeys.length === 0) {
        console.log('[StorageMigration] No known legacy keys found');
        return;
      }

      console.log('[StorageMigration] Found legacy data for keys:', foundLegacyKeys);

      // Check if data is already encrypted (has our obfuscated key format)
      const obfuscatedKeys = [
        'userConfig',
        'userLanguage',
        'subscriptionInfo',
        'accessToken',
        'userInfo',
      ].map((key) => AdvancedCrypto.generateObfuscatedKey(key));
      const hasEncryptedData = obfuscatedKeys.some((key) => key in legacyData);

      if (hasEncryptedData) {
        console.log('[StorageMigration] Encrypted data already exists, skipping migration');
        return;
      }

      // Migrate legacy data to secure storage
      const dataToMigrate: Record<string, any> = {};

      foundLegacyKeys.forEach((key) => {
        if (legacyData[key] !== undefined) {
          dataToMigrate[key] = legacyData[key];
        }
      });

      if (Object.keys(dataToMigrate).length > 0) {
        console.log('[StorageMigration] Migrating data to secure storage...');
        await secureStorage.set(dataToMigrate);

        // Remove legacy data after successful migration
        console.log('[StorageMigration] Removing legacy data...');
        await chrome.storage.sync.remove(foundLegacyKeys);

        console.log('[StorageMigration] Migration completed successfully');
      }
    } catch (error) {
      console.error('[StorageMigration] Migration failed:', error);
      // Don't throw error - let the app continue with default config
    }
  }

  /**
   * Check if migration is needed (for debugging)
   */
  static async checkMigrationNeeded(): Promise<boolean> {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        return false;
      }

      const legacyData = await chrome.storage.sync.get(['userConfig', 'userLanguage']);
      const legacyKeys = Object.keys(legacyData).filter(
        (key) => ['userConfig', 'userLanguage'].includes(key) && legacyData[key] !== undefined
      );

      // Check if encrypted data exists
      const obfuscatedKeys = ['userConfig', 'userLanguage'].map((key) =>
        AdvancedCrypto.generateObfuscatedKey(key)
      );
      const encryptedData = await chrome.storage.sync.get(obfuscatedKeys);
      const hasEncryptedData = Object.keys(encryptedData).length > 0;

      return legacyKeys.length > 0 && !hasEncryptedData;
    } catch (error) {
      console.error('[StorageMigration] Error checking migration status:', error);
      return false;
    }
  }

  /**
   * Force clear all storage (for testing)
   */
  static async clearAllStorage(): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.sync.clear();
      console.log('[StorageMigration] All storage cleared');
    }
  }
}
