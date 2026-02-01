/**
 * Highlight Sync Service
 * Handles synchronization of highlight items and fetching public aggregates
 */

import SubscriptionServiceV2 from '../../core/services/subscription-service-v2';
import { AuthService } from '../auth/auth-service';
import { highlightDB, type HighlightItem } from '../storage/highlight-db';
import {
  highlightSyncQueueDB,
  type HighlightSyncQueueItem,
} from '../storage/highlight-sync-queue-db';
import { highlightSyncAPI } from './highlight-sync-api';
import type { HighlightSyncState } from './highlight-sync-types';
import { SyncCore, type SyncAdapter } from './sync-core';

export class HighlightSyncService {
  private static instance: HighlightSyncService;
  private authService: AuthService;
  private subscriptionService: SubscriptionServiceV2 = SubscriptionServiceV2.getInstance();
  private syncCore: SyncCore<HighlightItem, HighlightSyncQueueItem>;
  private initialized = false;
  private readonly SYNC_INTERVAL = 60000;

  private constructor() {
    this.authService = AuthService.getInstance();

    const adapter: SyncAdapter<HighlightItem, HighlightSyncQueueItem> = {
      name: 'HighlightSync',
      syncStateKey: 'highlightSyncState',
      isSyncEnabled: async () => {
        const isAuthenticated = await this.authService.isAuthenticated();
        const isSubscribed = await this.subscriptionService.isSubscriptionActive();
        return isAuthenticated && isSubscribed;
      },
      getQueue: () => highlightSyncQueueDB.getAll(),
      getItemById: (id) => highlightDB.getById(id),
      shouldUploadItem: (item) => item.source !== 'others',
      getItemId: (item) => item.id,
      getUpdatedAt: (item) => item.updated_at || 0,
      isDeleted: (item) => Boolean(item.deleted_at),
      upsertLocal: (item) => highlightDB.upsert(item),
      updateLocalUserId: (id) => highlightDB.updateUserId(id),
      enqueue: (itemId, operation) => highlightSyncQueueDB.enqueue(itemId, operation),
      dequeue: (queueId) => highlightSyncQueueDB.dequeue(queueId),
      dequeueByItemId: (itemId) => highlightSyncQueueDB.dequeueByItemId(itemId),
      markFailed: (queueId, error) => highlightSyncQueueDB.markFailed(queueId, error),
      clearQueue: () => highlightSyncQueueDB.clear(),
      countQueue: () => highlightSyncQueueDB.count(),
      uploadItems: (items) => highlightSyncAPI.batchUpload(items),
      fetchRemote: (since) => highlightSyncAPI.incrementalFetch(since),
    };

    this.syncCore = new SyncCore(adapter, this.SYNC_INTERVAL);
  }

  static getInstance(): HighlightSyncService {
    if (!HighlightSyncService.instance) {
      HighlightSyncService.instance = new HighlightSyncService();
    }
    return HighlightSyncService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.syncCore.initialize();

    this.initialized = true;
  }

  startPeriodicSync(): void {
    this.syncCore.startPeriodicSync();
  }

  stopPeriodicSync(): void {
    this.syncCore.stopPeriodicSync();
  }

  async sync(): Promise<void> {
    await this.syncCore.sync();
  }

  async refreshAggregatesForUrl(url: string): Promise<void> {
    const isAuthenticated = await this.authService.isAuthenticated();
    const isSubscribed = await this.subscriptionService.isSubscriptionActive();
    if (!isAuthenticated || !isSubscribed) return;

    try {
      const response = await highlightSyncAPI.fetchAggregatesByUrl(url);
      const aggregates = response.data || [];

      const items: HighlightItem[] = aggregates
        .filter((agg) => agg.count > 1)
        .map((agg) => ({
          id: `agg-${agg.aggregate_id}`,
          aggregate_id: agg.aggregate_id,
          source: 'others',
          others_count: agg.count,
          text: agg.text,
          url: agg.url,
          hostname: agg.hostname,
          title: agg.title,
          anchor: agg.anchor || {
            startXPath: '',
            startOffset: 0,
            endXPath: '',
            endOffset: 0,
            text: agg.text,
          },
          created_at: agg.updated_at || Date.now(),
          updated_at: agg.updated_at || Date.now(),
        }));

      await highlightDB.replaceAggregatesForUrl(url, items);
    } catch (error) {
      console.warn('[HighlightSync] Failed to refresh aggregates:', error);
    }
  }

  async queueForSync(itemId: string, operation: 'create' | 'update' | 'delete'): Promise<void> {
    await this.syncCore.queueForSync(itemId, operation);
  }

  getSyncStatus(): HighlightSyncState {
    return this.syncCore.getSyncStatus();
  }

  async getPendingSyncCount(): Promise<number> {
    return await this.syncCore.getPendingSyncCount();
  }

  async clearSyncState(): Promise<void> {
    await this.syncCore.clearSyncState();
  }
}

export const highlightSyncService = HighlightSyncService.getInstance();
