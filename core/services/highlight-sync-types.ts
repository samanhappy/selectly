/**
 * Type definitions for Highlight Sync
 */

import type { HighlightAnchor, HighlightItem } from '../storage/highlight-db';

export type { HighlightItem } from '../storage/highlight-db';

export interface HighlightAggregate {
  aggregate_id: string;
  url: string;
  hostname: string;
  title: string;
  text: string;
  anchor?: HighlightAnchor;
  count: number;
  updated_at?: number;
}

export interface HighlightBatchUploadResponse {
  success: boolean;
  data: {
    synced: string[];
    failed?: Array<{ id: string; error: string }>;
  };
}

export interface HighlightIncrementalFetchResponse {
  data: HighlightItem[];
  timestamp: number;
}

export interface HighlightAggregateFetchResponse {
  data: HighlightAggregate[];
  timestamp: number;
}

export interface HighlightSyncState {
  lastSyncTime: number;
  syncing: boolean;
  lastError?: string;
}
