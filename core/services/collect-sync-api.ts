/**
 * Collect Sync API Client
 * Handles communication with Next.js backend for syncing collected items
 */

import { AuthService } from '../auth/auth-service';
import type { CollectedItem } from '../storage/collect-db';

export interface BatchUploadRequest {
  items: CollectedItem[];
}

export interface BatchUploadResponse {
  success: boolean;
  data: {
    synced: string[]; // Array of item IDs that were successfully synced
    failed?: Array<{
      id: string;
      error: string;
    }>;
  };
}

export interface IncrementalFetchRequest {
  since?: number; // Timestamp in milliseconds
}

export interface IncrementalFetchResponse {
  data: CollectedItem[];
  timestamp: number; // Server timestamp for next fetch
}

class CollectSyncAPI {
  private static instance: CollectSyncAPI;
  private apiBaseUrl: string;
  private authService: AuthService;

  private constructor() {
    this.apiBaseUrl = process.env.PLASMO_PUBLIC_API_URI || 'http://localhost:8472';
    this.authService = AuthService.getInstance();
  }

  static getInstance(): CollectSyncAPI {
    if (!CollectSyncAPI.instance) {
      CollectSyncAPI.instance = new CollectSyncAPI();
    }
    return CollectSyncAPI.instance;
  }

  /**
   * Get authorization header
   */
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

  /**
   * Upload batch of items to server
   */
  async batchUpload(items: CollectedItem[]): Promise<BatchUploadResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.apiBaseUrl}/api/items/batch`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Batch upload error:', error);
      throw error;
    }
  }

  /**
   * Fetch items modified after a specific timestamp
   */
  async incrementalFetch(since?: number): Promise<IncrementalFetchResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const url = new URL(`${this.apiBaseUrl}/api/items`);
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

      return await response.json();
    } catch (error) {
      console.error('Incremental fetch error:', error);
      throw error;
    }
  }

  /**
   * Get all items from server (full sync)
   */
  async fetchAll(): Promise<IncrementalFetchResponse> {
    return this.incrementalFetch();
  }

  /**
   * Delete item on server
   */
  async deleteItem(id: string): Promise<{ success: boolean }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.apiBaseUrl}/api/items/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error(`Delete failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Delete item error:', error);
      throw error;
    }
  }
}

export const collectSyncAPI = CollectSyncAPI.getInstance();
