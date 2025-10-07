/**
 * Advanced Encryption Utilities
 * Provides stronger encryption for sensitive data
 */

export class AdvancedCrypto {
  private static readonly ENTROPY_POOL = [
    'Qx9Zm4Kv8Bp2Ln7Wc3Rf6Tj5Yh1Ng0',
    'Pk8Vf3Rx7Mz2Qw5Bn9Ht4Gj1Ls6Dc0',
    'Nw2Xc6Vb9Rt4Qs1Hj8Gf5Lp3Zk7Mn0',
    'Lp5Jg8Nf1Qr7Vs3Wb6Ht2Zx9Ck4Md0',
  ];

  /**
   * Generate a deterministic but complex encryption key
   */
  static generateEncryptionKey(seed: string, iteration: number = 0): string {
    const entropy = this.ENTROPY_POOL[iteration % this.ENTROPY_POOL.length];
    const combined = seed + entropy + this.reverseString(seed) + iteration.toString();

    // Multiple hash rounds for key stretching
    let hash = this.simpleHash(combined);
    for (let i = 0; i < 1000; i++) {
      hash = this.simpleHash(hash + entropy + i.toString());
    }

    return this.hashToKey(hash);
  }

  /**
   * Multi-round encryption with key rotation
   */
  static encryptData(data: string, masterSeed: string): { encrypted: string; metadata: string } {
    // Legacy alias maintained for compatibility with existing imports.
    // Uses V2 string-based XOR algorithm and Base64 of binary string (for v=2 data).
    const rounds = 3;
    let encrypted = data;
    const metadata = [] as any[];

    for (let round = 0; round < rounds; round++) {
      const key = this.generateEncryptionKey(masterSeed, round);
      encrypted = this.xorCipher(encrypted, key);
      metadata.push(this.generateRoundMetadata(round, masterSeed));
    }

    return {
      encrypted: btoa(encrypted),
      metadata: btoa(JSON.stringify(metadata)),
    };
  }

  /**
   * V3: Byte-safe encryption using UTF-8 and Base64.
   * This avoids InvalidCharacterError by operating on bytes instead of UTF-16 code units.
   */
  static encryptDataV3(data: string, masterSeed: string): { encrypted: string; metadata: string } {
    const rounds = 3;
    let bytes = this.textToBytes(data);
    const metadata = [] as any[];

    for (let round = 0; round < rounds; round++) {
      const key = this.generateEncryptionKey(masterSeed, round);
      bytes = this.xorCipherBytes(bytes, key);
      metadata.push(this.generateRoundMetadata(round, masterSeed));
    }

    return {
      encrypted: this.bytesToBase64(bytes),
      metadata: btoa(JSON.stringify(metadata)),
    };
  }

  /**
   * Multi-round decryption with key rotation
   */
  static decryptData(encryptedData: string, metadata: string, masterSeed: string): string {
    // Legacy V2 decryption kept for compatibility.
    try {
      const meta = JSON.parse(atob(metadata));
      let decrypted = atob(encryptedData);

      // Reverse the encryption rounds
      for (let round = meta.length - 1; round >= 0; round--) {
        const key = this.generateEncryptionKey(masterSeed, round);
        decrypted = this.xorCipher(decrypted, key);
      }

      return decrypted;
    } catch (error) {
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * V2 (legacy): String-based XOR decryption (UTF-16 code units), base64 of binary string.
   */
  static decryptDataV2(encryptedData: string, metadata: string, masterSeed: string): string {
    return this.decryptData(encryptedData, metadata, masterSeed);
  }

  /**
   * V3: Byte-safe decryption to pair with encryptDataV3.
   */
  static decryptDataV3(encryptedData: string, metadata: string, masterSeed: string): string {
    try {
      const meta = JSON.parse(atob(metadata));
      let bytes = this.base64ToBytes(encryptedData);

      for (let round = meta.length - 1; round >= 0; round--) {
        const key = this.generateEncryptionKey(masterSeed, round);
        bytes = this.xorCipherBytes(bytes, key);
      }

      return this.bytesToText(bytes);
    } catch (error) {
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Generate obfuscated storage keys with better collision avoidance
   */
  static generateObfuscatedKey(realKey: string): string {
    // Use a more robust hash that includes key length and character distribution
    const baseHash = this.simpleHash(realKey + 'stable_salt_2024');
    const lengthHash = this.simpleHash(realKey.length.toString() + realKey);
    const reverseHash = this.simpleHash(this.reverseString(realKey) + 'collision_avoid');

    // Combine multiple hash sources for better uniqueness
    const combinedHash = baseHash ^ lengthHash ^ reverseHash;

    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    let workingHash = Math.abs(combinedHash);

    // Generate longer key (12 characters instead of 8) for better collision avoidance
    for (let i = 0; i < 12; i++) {
      const index = (workingHash + i * 37 + realKey.charCodeAt(i % realKey.length)) % chars.length;
      result += chars[index];
      workingHash = Math.floor(workingHash / chars.length) + combinedHash * (i + 1);
    }

    return result;
  }

  /**
   * Simple hash function for internal use
   */
  private static simpleHash(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash);
  }

  /**
   * Convert hash to encryption key
   */
  private static hashToKey(hash: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let key = '';
    let workingHash = hash;

    for (let i = 0; i < 64; i++) {
      key += chars[workingHash % chars.length];
      workingHash = Math.floor(workingHash / chars.length) + hash * (i + 1);
    }

    return key;
  }

  /**
   * XOR cipher implementation
   */
  private static xorCipher(text: string, key: string): string {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const textCode = text.charCodeAt(i);
      const keyCode = key.charCodeAt(i % key.length);
      result += String.fromCharCode(textCode ^ keyCode);
    }
    return result;
  }

  /**
   * XOR cipher operating on bytes
   */
  private static xorCipherBytes(bytes: Uint8Array, key: string): Uint8Array {
    const keyBytes = this.textToBytes(key);
    const out = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      out[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
    }
    return out;
  }

  /**
   * Reverse string utility
   */
  private static reverseString(str: string): string {
    return str.split('').reverse().join('');
  }

  /**
   * Generate round metadata for decryption verification
   */
  private static generateRoundMetadata(round: number, seed: string): any {
    return {
      r: round,
      c: this.simpleHash(seed + round.toString()) % 1000,
    };
  }

  // ---------- Byte/Base64 helpers ----------
  private static textToBytes(str: string): Uint8Array {
    return new TextEncoder().encode(str);
  }

  private static bytesToText(bytes: Uint8Array): string {
    return new TextDecoder().decode(bytes);
  }

  private static bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    const chunkSize = 0x8000; // 32KB chunks to avoid call stack limits
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk) as unknown as number[]);
    }
    return btoa(binary);
  }

  private static base64ToBytes(b64: string): Uint8Array {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
