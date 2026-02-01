/**
 * Dictionary Sync API Client
 * Handles communication with backend for syncing dictionary entries
 */

import { AuthService } from '../auth/auth-service';
import type { DictionaryEntry } from '../storage/dictionary-db';

export interface DictionaryBatchUploadResponse {
  success: boolean;
  data: {
    synced: string[];
    failed?: Array<{ id: string; error: string }>;
  };
}

export interface DictionaryIncrementalFetchResponse {
  data: DictionaryEntry[];
  timestamp: number;
}

class DictionarySyncAPI {
  private static instance: DictionarySyncAPI;
  private apiBaseUrl: string;
  private authService: AuthService;

  private constructor() {
    this.apiBaseUrl = process.env.PLASMO_PUBLIC_API_URI || 'http://localhost:8472';
    this.authService = AuthService.getInstance();
  }

  static getInstance(): DictionarySyncAPI {
    if (!DictionarySyncAPI.instance) {
      DictionarySyncAPI.instance = new DictionarySyncAPI();
    }
    return DictionarySyncAPI.instance;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await this.authService.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  private toServerItem(item: DictionaryEntry) {
    return {
      id: item.id,
      source: item.source,
      translation: item.translation,
      sentence: item.sentence || null,
      url: item.url,
      title: item.title,
      hostname: item.hostname,
      created_at: item.createdAt,
      updated_at: item.updatedAt || item.createdAt,
      deleted_at: item.deletedAt || null,
    };
  }

  private fromServerItem(item: any): DictionaryEntry {
    return {
      id: item.id,
      user_id: item.user_id,
      source: item.source,
      translation: item.translation,
      sentence: item.sentence || '',
      url: item.url,
      title: item.title,
      hostname: item.hostname,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      deletedAt: item.deleted_at || undefined,
    };
  }

  async batchUpload(items: DictionaryEntry[]): Promise<DictionaryBatchUploadResponse> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.apiBaseUrl}/api/dictionary/batch`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ items: items.map((item) => this.toServerItem(item)) }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async incrementalFetch(since?: number): Promise<DictionaryIncrementalFetchResponse> {
    const headers = await this.getAuthHeaders();
    const url = new URL(`${this.apiBaseUrl}/api/dictionary`);
    if (since !== undefined) {
      url.searchParams.set('since', since.toString());
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      throw new Error(`Fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    const items = Array.isArray(data?.data)
      ? data.data.map((item: any) => this.fromServerItem(item))
      : [];
    return {
      ...data,
      data: items,
    };
  }

  async fetchAll(): Promise<DictionaryIncrementalFetchResponse> {
    return this.incrementalFetch();
  }
}

export const dictionarySyncAPI = DictionarySyncAPI.getInstance();
