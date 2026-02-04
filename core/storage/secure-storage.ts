/**
 * Secure Storage Manager
 * Provides encryption and obfuscation for Chrome storage data
 */

import { AdvancedCrypto } from './crypto';

interface StorageData {
  [key: string]: any;
}

interface EncryptedData {
  d: string; // encrypted data
  m: string; // metadata
  v: number; // version
  t: number; // timestamp (for additional entropy)
}

interface ChunkManifest {
  __chunked: true;
  n: number;
}

class SecureStorageManager {
  private static instance: SecureStorageManager;
  private readonly storageVersion = 3;
  private readonly maxSyncItemBytes = 8192;
  private readonly safeSyncItemBytes = 7000;
  private readonly defaultChunkPlaintextBytes = 3000;
  private readonly chunkKeySeparator = '__chunk__';

  // Dynamic key mapping using crypto module
  private keyMap: Record<string, string> = {};
  private reverseKeyMap: Record<string, string> = {};

  constructor() {
    this.initializeKeyMappings();
  }

  private initializeKeyMappings(): void {
    const knownKeys = [
      'userConfig',
      'userLanguage',
      'subscriptionInfo',
      'accessToken',
      'userInfo',
      'dailyUsageLimit',
      'readingProgressSync',
    ];

    knownKeys.forEach((realKey) => {
      const obfuscatedKey = AdvancedCrypto.generateObfuscatedKey(realKey);
      this.keyMap[realKey] = obfuscatedKey;
      this.reverseKeyMap[obfuscatedKey] = realKey;
    });
  }

  static getInstance(): SecureStorageManager {
    if (!SecureStorageManager.instance) {
      SecureStorageManager.instance = new SecureStorageManager();
    }
    return SecureStorageManager.instance;
  }

  /**
   * Encrypt data using advanced crypto
   */
  private encrypt(data: string): { encrypted: string; metadata: string } {
    const masterSeed = this.generateMasterSeed();
    // Use V3 byte-safe encryption to avoid InvalidCharacterError in btoa
    return AdvancedCrypto.encryptDataV3(data, masterSeed);
  }

  /**
   * Decrypt data using advanced crypto
   */
  private decrypt(encryptedData: string, metadata: string, version?: number): string {
    const masterSeed = this.generateMasterSeed();
    // Route based on version for backward compatibility
    try {
      if (!version || version <= 2) {
        return AdvancedCrypto.decryptDataV2(encryptedData, metadata, masterSeed);
      }
      return AdvancedCrypto.decryptDataV3(encryptedData, metadata, masterSeed);
    } catch (e) {
      // Fallback: try the other method in case of mismatched version
      try {
        return version && version >= 3
          ? AdvancedCrypto.decryptDataV2(encryptedData, metadata, masterSeed)
          : AdvancedCrypto.decryptDataV3(encryptedData, metadata, masterSeed);
      } catch (e2) {
        throw e2;
      }
    }
  }

  /**
   * Generate master seed for encryption
   */
  private generateMasterSeed(): string {
    // Use a combination of static and dynamic entropy
    const staticPart = 'Selectly_Secure_Storage_v2_2024';
    const dynamicPart =
      typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime.id : 'fallback';
    return staticPart + dynamicPart;
  }

  /**
   * Get obfuscated key for real key
   */
  private getObfuscatedKey(realKey: string): string {
    return this.keyMap[realKey] || realKey;
  }

  /**
   * Get real key from obfuscated key
   */
  private getRealKey(obfuscatedKey: string): string {
    return this.reverseKeyMap[obfuscatedKey] || obfuscatedKey;
  }

  private isChunkKey(key: string): boolean {
    return key.includes(this.chunkKeySeparator);
  }

  private buildChunkKey(baseKey: string, index: number): string {
    return `${baseKey}${this.chunkKeySeparator}${index}`;
  }

  private isChunkManifest(value: any): value is ChunkManifest {
    return (
      !!value &&
      typeof value === 'object' &&
      value.__chunked === true &&
      typeof value.n === 'number' &&
      Number.isFinite(value.n) &&
      value.n >= 0
    );
  }

  private getByteLength(value: string): number {
    return new TextEncoder().encode(value).length;
  }

  private isEncryptedItemWithinLimit(encrypted: EncryptedData): boolean {
    const payloadSize = this.getByteLength(JSON.stringify(encrypted));
    return payloadSize <= this.safeSyncItemBytes;
  }

  private splitStringByBytes(value: string, maxBytes: number): string[] {
    if (this.getByteLength(value) <= maxBytes) {
      return [value];
    }

    const chunks: string[] = [];
    let current = '';

    for (const char of value) {
      const next = current + char;
      if (this.getByteLength(next) > maxBytes) {
        if (current.length === 0) {
          chunks.push(char);
          current = '';
        } else {
          chunks.push(current);
          current = char;
        }
      } else {
        current = next;
      }
    }

    if (current.length > 0) {
      chunks.push(current);
    }

    return chunks;
  }

  private ensureChunkFitsLimit(chunk: string): string[] {
    const encryptionResult = this.encrypt(chunk);
    const encryptedItem: EncryptedData = {
      d: encryptionResult.encrypted,
      m: encryptionResult.metadata,
      v: this.storageVersion,
      t: Date.now(),
    };

    if (this.isEncryptedItemWithinLimit(encryptedItem)) {
      return [chunk];
    }

    if (chunk.length <= 1) {
      throw new Error('Chunk too large to store in sync storage');
    }

    const mid = Math.floor(chunk.length / 2);
    return [
      ...this.ensureChunkFitsLimit(chunk.slice(0, mid)),
      ...this.ensureChunkFitsLimit(chunk.slice(mid)),
    ];
  }

  private async cleanupExistingChunks(obfuscatedKey: string): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      return;
    }

    const existing = await chrome.storage.sync.get([obfuscatedKey]);
    const existingValue = existing[obfuscatedKey];

    if (!existingValue || !this.isEncryptedData(existingValue)) {
      return;
    }

    try {
      const decrypted = this.decrypt(existingValue.d, existingValue.m, (existingValue as any).v);
      const parsed = JSON.parse(decrypted);
      if (this.isChunkManifest(parsed)) {
        const chunkKeys = Array.from({ length: parsed.n }, (_, i) =>
          this.buildChunkKey(obfuscatedKey, i)
        );
        if (chunkKeys.length > 0) {
          await chrome.storage.sync.remove(chunkKeys);
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup existing chunks:', error);
    }
  }

  /**
   * Store encrypted data in Chrome storage
   */
  async set(data: StorageData): Promise<void> {
    // console.log("Storing data securely:", data)
    try {
      const encryptedData: Record<string, EncryptedData> = {};

      for (const [realKey, value] of Object.entries(data)) {
        const obfuscatedKey = this.getObfuscatedKey(realKey);
        const jsonString = JSON.stringify(value);
        await this.cleanupExistingChunks(obfuscatedKey);

        const encryptionResult = this.encrypt(jsonString);
        const encryptedItem: EncryptedData = {
          d: encryptionResult.encrypted,
          m: encryptionResult.metadata,
          v: this.storageVersion,
          t: Date.now(),
        };

        if (this.isEncryptedItemWithinLimit(encryptedItem)) {
          encryptedData[obfuscatedKey] = encryptedItem;
          continue;
        }

        const initialChunks = this.splitStringByBytes(jsonString, this.defaultChunkPlaintextBytes);
        const finalChunks: string[] = [];

        for (const chunk of initialChunks) {
          finalChunks.push(...this.ensureChunkFitsLimit(chunk));
        }

        const manifest: ChunkManifest = { __chunked: true, n: finalChunks.length };
        const manifestEncryption = this.encrypt(JSON.stringify(manifest));
        encryptedData[obfuscatedKey] = {
          d: manifestEncryption.encrypted,
          m: manifestEncryption.metadata,
          v: this.storageVersion,
          t: Date.now(),
        };

        finalChunks.forEach((chunk, index) => {
          const chunkEncryption = this.encrypt(chunk);
          encryptedData[this.buildChunkKey(obfuscatedKey, index)] = {
            d: chunkEncryption.encrypted,
            m: chunkEncryption.metadata,
            v: this.storageVersion,
            t: Date.now(),
          };
        });
      }

      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.sync.set(encryptedData);
      }
    } catch (error) {
      console.error('Failed to encrypt and store data:', error);
      throw error;
    }
  }

  /**
   * Retrieve and decrypt data from Chrome storage
   */
  async get(keys?: string | string[]): Promise<StorageData> {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        return {};
      }

      let obfuscatedKeys: string[] = [];

      let encryptedData: Record<string, any> = {};

      if (typeof keys === 'string') {
        obfuscatedKeys = [this.getObfuscatedKey(keys)];
        encryptedData = await chrome.storage.sync.get(obfuscatedKeys);
      } else if (Array.isArray(keys)) {
        obfuscatedKeys = keys.map((key) => this.getObfuscatedKey(key));
        encryptedData = await chrome.storage.sync.get(obfuscatedKeys);
      } else {
        // Get all data
        encryptedData = await chrome.storage.sync.get();
        obfuscatedKeys = Object.keys(encryptedData);
      }

      const decryptedData: StorageData = {};
      const chunkManifests: Array<{ realKey: string; baseKey: string; manifest: ChunkManifest }> =
        [];

      for (const [obfuscatedKey, encryptedValue] of Object.entries(encryptedData)) {
        if (this.isChunkKey(obfuscatedKey)) {
          continue;
        }

        try {
          const realKey = this.getRealKey(obfuscatedKey);

          if (this.isEncryptedData(encryptedValue)) {
            const decrypted = this.decrypt(
              encryptedValue.d,
              encryptedValue.m,
              (encryptedValue as any).v
            );
            const parsed = JSON.parse(decrypted);
            if (this.isChunkManifest(parsed)) {
              chunkManifests.push({ realKey, baseKey: obfuscatedKey, manifest: parsed });
            } else {
              decryptedData[realKey] = parsed;
            }
          } else if (encryptedValue !== undefined) {
            // Handle legacy unencrypted data
            decryptedData[realKey] = encryptedValue;
          }
        } catch (error) {
          console.warn(`Failed to decrypt data for key ${obfuscatedKey}:`, error);
          // Skip corrupted data
        }
      }

      for (const { realKey, baseKey, manifest } of chunkManifests) {
        const chunkKeys = Array.from({ length: manifest.n }, (_, i) =>
          this.buildChunkKey(baseKey, i)
        );
        const chunkSource =
          typeof keys === 'undefined' ? encryptedData : await chrome.storage.sync.get(chunkKeys);

        let combined = '';
        let failed = false;

        for (const chunkKey of chunkKeys) {
          const chunkValue = (chunkSource as any)[chunkKey];
          if (!chunkValue || !this.isEncryptedData(chunkValue)) {
            console.warn(`Missing chunk data for key ${chunkKey}`);
            failed = true;
            break;
          }

          try {
            const decryptedChunk = this.decrypt(chunkValue.d, chunkValue.m, (chunkValue as any).v);
            combined += decryptedChunk;
          } catch (error) {
            console.warn(`Failed to decrypt chunk data for key ${chunkKey}:`, error);
            failed = true;
            break;
          }
        }

        if (!failed) {
          try {
            decryptedData[realKey] = JSON.parse(combined);
          } catch (error) {
            console.warn(`Failed to parse chunked data for key ${realKey}:`, error);
          }
        }
      }

      return decryptedData;
    } catch (error) {
      console.error('Failed to retrieve and decrypt data:', error);
      return {};
    }
  }

  /**
   * Remove data from storage
   */
  async remove(keys: string | string[]): Promise<void> {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        return;
      }

      let obfuscatedKeys: string[];

      if (typeof keys === 'string') {
        obfuscatedKeys = [this.getObfuscatedKey(keys)];
      } else {
        obfuscatedKeys = keys.map((key) => this.getObfuscatedKey(key));
      }

      const keysToRemove = new Set<string>();

      for (const obfuscatedKey of obfuscatedKeys) {
        keysToRemove.add(obfuscatedKey);

        try {
          const existing = await chrome.storage.sync.get([obfuscatedKey]);
          const existingValue = existing[obfuscatedKey];

          if (existingValue && this.isEncryptedData(existingValue)) {
            const decrypted = this.decrypt(
              existingValue.d,
              existingValue.m,
              (existingValue as any).v
            );
            const parsed = JSON.parse(decrypted);
            if (this.isChunkManifest(parsed)) {
              const chunkKeys = Array.from({ length: parsed.n }, (_, i) =>
                this.buildChunkKey(obfuscatedKey, i)
              );
              chunkKeys.forEach((chunkKey) => keysToRemove.add(chunkKey));
            }
          }
        } catch (error) {
          console.warn('Failed to resolve chunk keys for removal:', error);
        }
      }

      await chrome.storage.sync.remove(Array.from(keysToRemove));
    } catch (error) {
      console.error('Failed to remove data:', error);
      throw error;
    }
  }

  /**
   * Clear all storage data
   */
  async clear(): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.sync.clear();
      }
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }

  /**
   * Check if data is in encrypted format
   */
  private isEncryptedData(data: any): data is EncryptedData {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.d === 'string' &&
      typeof data.m === 'string' &&
      typeof data.v === 'number'
    );
  }

  /**
   * Listen for storage changes
   */
  onChanged(callback: (changes: Record<string, { oldValue?: any; newValue?: any }>) => void): void {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener(async (changes, namespace) => {
        if (namespace === 'sync') {
          const realChanges: Record<string, { oldValue?: any; newValue?: any }> = {};

          for (const [obfuscatedKey, change] of Object.entries(changes)) {
            if (this.isChunkKey(obfuscatedKey)) {
              continue;
            }
            const realKey = this.getRealKey(obfuscatedKey);

            try {
              let oldValue, newValue;

              if (change.oldValue && this.isEncryptedData(change.oldValue)) {
                const decrypted = this.decrypt(
                  change.oldValue.d,
                  change.oldValue.m,
                  (change.oldValue as any).v
                );
                const parsed = JSON.parse(decrypted);
                if (this.isChunkManifest(parsed)) {
                  oldValue = undefined;
                } else {
                  oldValue = parsed;
                }
              } else if (change.oldValue) {
                oldValue = change.oldValue;
              }

              if (change.newValue && this.isEncryptedData(change.newValue)) {
                const decrypted = this.decrypt(
                  change.newValue.d,
                  change.newValue.m,
                  (change.newValue as any).v
                );
                const parsed = JSON.parse(decrypted);
                if (this.isChunkManifest(parsed)) {
                  const resolved = await this.get(realKey);
                  newValue = resolved[realKey];
                } else {
                  newValue = parsed;
                }
              } else if (change.newValue) {
                newValue = change.newValue;
              }

              realChanges[realKey] = { oldValue, newValue };
            } catch (error) {
              console.warn(`Failed to decrypt change data for key ${obfuscatedKey}:`, error);
            }
          }

          callback(realChanges);
        }
      });
    }
  }

  /**
   * Export all configuration data as JSON string
   * Returns decrypted data for backup purposes
   */
  async exportAllData(): Promise<string> {
    try {
      const allData = await this.get();
      const exportData = {
        version: this.storageVersion,
        timestamp: Date.now(),
        data: allData,
      };
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      throw new Error('Failed to export configuration data');
    }
  }

  /**
   * Import configuration data from JSON string
   * Validates and encrypts data before storing
   */
  async importAllData(jsonString: string): Promise<void> {
    try {
      const importData = JSON.parse(jsonString);

      // Validate import data structure
      if (!importData || typeof importData !== 'object') {
        throw new Error('Invalid import data format');
      }

      if (!importData.data || typeof importData.data !== 'object') {
        throw new Error('Missing or invalid data in import file');
      }

      // Import the data (will be encrypted by set method)
      await this.set(importData.data);

      console.log('Configuration data imported successfully');
    } catch (error) {
      console.error('Failed to import data:', error);
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format in import file');
      }
      throw new Error('Failed to import configuration data: ' + (error as Error).message);
    }
  }
}

export const secureStorage = SecureStorageManager.getInstance();
