/**
 * Highlight Sync API Client
 * Handles communication with backend for syncing highlights and fetching aggregates
 */

import { AuthService } from '../auth/auth-service';
import type { HighlightItem } from '../storage/highlight-db';
import type {
  HighlightAggregateFetchResponse,
  HighlightBatchUploadResponse,
  HighlightIncrementalFetchResponse,
} from './highlight-sync-types';

class HighlightSyncAPI {
  private static instance: HighlightSyncAPI;
  private apiBaseUrl: string;
  private authService: AuthService;

  private constructor() {
    this.apiBaseUrl = process.env.PLASMO_PUBLIC_API_URI || 'http://localhost:8472';
    this.authService = AuthService.getInstance();
  }

  static getInstance(): HighlightSyncAPI {
    if (!HighlightSyncAPI.instance) {
      HighlightSyncAPI.instance = new HighlightSyncAPI();
    }
    return HighlightSyncAPI.instance;
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

  async batchUpload(items: HighlightItem[]): Promise<HighlightBatchUploadResponse> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.apiBaseUrl}/api/highlights/batch`, {
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
  }

  async incrementalFetch(since?: number): Promise<HighlightIncrementalFetchResponse> {
    const headers = await this.getAuthHeaders();
    const url = new URL(`${this.apiBaseUrl}/api/highlights`);
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
  }

  async fetchAggregatesByUrl(url: string): Promise<HighlightAggregateFetchResponse> {
    const headers = await this.getAuthHeaders();
    const apiUrl = new URL(`${this.apiBaseUrl}/api/highlights/aggregate`);
    apiUrl.searchParams.set('url', url);

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      throw new Error(`Fetch aggregates failed: ${response.statusText}`);
    }

    return await response.json();
  }
}

export const highlightSyncAPI = HighlightSyncAPI.getInstance();
