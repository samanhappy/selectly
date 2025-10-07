/**
 * Security Test Utilities for Secure Storage
 * Used for testing and validating encryption/decryption
 */

import { AdvancedCrypto } from './crypto';
import { secureStorage } from './secure-storage';

export class SecurityTestUtils {
  /**
   * Test encryption and decryption functionality
   */
  static async testEncryptionRoundTrip(): Promise<boolean> {
    try {
      const testData = {
        userConfig: {
          general: { language: 'en', buttonPosition: 'above' },
          llm: { defaultModel: 'openai/gpt-4' },
          functions: { translate: { enabled: true } },
        },
        userLanguage: 'zh',
        testArray: [1, 2, 3, 'test'],
        testObject: { nested: { value: 'secret' } },
      };

      console.log('[SecurityTest] Original data:', testData);

      // Store data
      await secureStorage.set(testData);
      console.log('[SecurityTest] Data stored successfully');

      // Retrieve data
      const retrievedData = await secureStorage.get(Object.keys(testData));
      console.log('[SecurityTest] Retrieved data:', retrievedData);

      // Compare
      const isEqual = JSON.stringify(testData) === JSON.stringify(retrievedData);
      console.log('[SecurityTest] Round trip test:', isEqual ? 'PASSED' : 'FAILED');

      return isEqual;
    } catch (error) {
      console.error('[SecurityTest] Encryption test failed:', error);
      return false;
    }
  }

  /**
   * Test key obfuscation
   */
  static testKeyObfuscation(): void {
    const testKeys = ['userConfig', 'userLanguage', 'subscriptionInfo', 'accessToken', 'userInfo'];

    console.log('[SecurityTest] Key obfuscation test:');
    testKeys.forEach((key) => {
      const obfuscated = AdvancedCrypto.generateObfuscatedKey(key);
      console.log(`  ${key} -> ${obfuscated}`);

      // Test consistency
      const obfuscated2 = AdvancedCrypto.generateObfuscatedKey(key);
      if (obfuscated !== obfuscated2) {
        console.error(`  ERROR: Inconsistent obfuscation for ${key}`);
      }
    });
  }

  /**
   * Inspect current storage state
   */
  static async inspectStorage(): Promise<void> {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.log('[SecurityTest] Chrome storage not available');
        return;
      }

      const allData = await chrome.storage.sync.get();
      console.log('[SecurityTest] Raw storage data:');

      Object.entries(allData).forEach(([key, value]) => {
        console.log(
          `  ${key}:`,
          typeof value === 'object' ? JSON.stringify(value).substring(0, 100) + '...' : value
        );
      });

      // Check for unencrypted sensitive data
      const sensitivePatterns = ['apiKey', 'token', 'password', 'secret', 'key'];
      const potentialLeaks = [];

      Object.entries(allData).forEach(([key, value]) => {
        const valueStr = JSON.stringify(value).toLowerCase();
        sensitivePatterns.forEach((pattern) => {
          if (valueStr.includes(pattern)) {
            potentialLeaks.push({ key, pattern, preview: valueStr.substring(0, 50) });
          }
        });
      });

      if (potentialLeaks.length > 0) {
        console.warn('[SecurityTest] Potential sensitive data found:');
        potentialLeaks.forEach((leak) => {
          console.warn(`  Key: ${leak.key}, Pattern: ${leak.pattern}, Preview: ${leak.preview}...`);
        });
      } else {
        console.log('[SecurityTest] No obvious sensitive data patterns found');
      }
    } catch (error) {
      console.error('[SecurityTest] Failed to inspect storage:', error);
    }
  }

  /**
   * Generate security report
   */
  static async generateSecurityReport(): Promise<void> {
    console.log('==========================================');
    console.log('         SECURITY TEST REPORT');
    console.log('==========================================');

    // Test 1: Key obfuscation
    console.log('\n1. Key Obfuscation Test:');
    this.testKeyObfuscation();

    // Test 2: Encryption round trip
    console.log('\n2. Encryption Round Trip Test:');
    const encryptionPassed = await this.testEncryptionRoundTrip();

    // Test 3: Storage inspection
    console.log('\n3. Storage Inspection:');
    await this.inspectStorage();

    // Summary
    console.log('\n==========================================');
    console.log('                SUMMARY');
    console.log('==========================================');
    console.log(`Encryption Test: ${encryptionPassed ? 'PASSED' : 'FAILED'}`);
    console.log('Key Obfuscation: IMPLEMENTED');
    console.log('Storage Inspection: COMPLETED');
    console.log('==========================================');
  }

  /**
   * Clear all test data
   */
  static async clearTestData(): Promise<void> {
    try {
      await secureStorage.clear();
      console.log('[SecurityTest] All test data cleared');
    } catch (error) {
      console.error('[SecurityTest] Failed to clear test data:', error);
    }
  }
}

// Export for console testing
if (typeof window !== 'undefined') {
  (window as any).SecurityTestUtils = SecurityTestUtils;
}
