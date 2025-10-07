/**
 * Type definitions for Collect Sync
 * Centralized exports for sync-related types
 */

// Re-export from collect-db
export type { CollectedItem } from '../storage/collect-db';

// Re-export from sync-queue-db
export type { SyncQueueItem, SyncOperation } from '../storage/sync-queue-db';

// Sync state interface
export interface SyncState {
  lastSyncTime: number;
  syncing: boolean;
  lastError?: string;
}

// API request/response types
export interface BatchUploadRequest {
  items: import('../storage/collect-db').CollectedItem[];
}

export interface BatchUploadResponse {
  success: boolean;
  synced: string[];
  failed?: Array<{
    id: string;
    error: string;
  }>;
}

export interface IncrementalFetchRequest {
  since?: number;
}

export interface IncrementalFetchResponse {
  items: import('../storage/collect-db').CollectedItem[];
  timestamp: number;
}

// Service status types
export interface CollectServiceStatus {
  syncStatus: SyncState;
  pendingSyncCount: number;
  lastSyncSuccess: boolean;
}
