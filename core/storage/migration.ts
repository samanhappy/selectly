/**
 * Storage Migration Utility
 * Handles migration from old unencrypted storage to new encrypted storage
 */

import { AdvancedCrypto } from './crypto';
import { secureStorage } from './secure-storage';
import { createLogger } from '../../utils/logger';

const logger = createLogger('StorageMigration');

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

      logger.info('Checking for legacy data...');

      // Get all data from legacy storage
      const legacyData = await chrome.storage.sync.get();

      if (!legacyData || Object.keys(legacyData).length === 0) {
        logger.info('No legacy data found');
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
        logger.info('No known legacy keys found');
        return;
      }

      logger.info('Found legacy data for keys:', foundLegacyKeys);

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
        logger.info('Encrypted data already exists, skipping migration');
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
        logger.info('Migrating data to secure storage...');
        await secureStorage.set(dataToMigrate);

        // Remove legacy data after successful migration
        logger.info('Removing legacy data...');
        await chrome.storage.sync.remove(foundLegacyKeys);

        logger.info('Migration completed successfully');
      }
    } catch (error) {
      logger.error('Migration failed:', error);
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
      logger.error('Error checking migration status:', error);
      return false;
    }
  }

  /**
   * Force clear all storage (for testing)
   */
  static async clearAllStorage(): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.sync.clear();
      logger.info('All storage cleared');
    }
  }
}
