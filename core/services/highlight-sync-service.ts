/**
 * Highlight Sync Service
 * Handles synchronization of highlight items and fetching public aggregates
 */

import SubscriptionServiceV2 from '../../core/services/subscription-service-v2';
import { AuthService } from '../auth/auth-service';
import { highlightDB, type HighlightItem } from '../storage/highlight-db';
import { highlightSyncQueueDB } from '../storage/highlight-sync-queue-db';
import { secureStorage } from '../storage/secure-storage';
import { highlightSyncAPI } from './highlight-sync-api';
import type { HighlightSyncState } from './highlight-sync-types';

export class HighlightSyncService {
  private static instance: HighlightSyncService;
  private authService: AuthService;
  private subscriptionService: SubscriptionServiceV2 = SubscriptionServiceV2.getInstance();
  private syncState: HighlightSyncState = {
    lastSyncTime: 0,
    syncing: false,
  };
  private syncInterval?: NodeJS.Timeout;
  private initialized = false;
  private readonly SYNC_INTERVAL = 60000;

  private constructor() {
    this.authService = AuthService.getInstance();
  }

  static getInstance(): HighlightSyncService {
    if (!HighlightSyncService.instance) {
      HighlightSyncService.instance = new HighlightSyncService();
    }
    return HighlightSyncService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const stored = await secureStorage.get('highlightSyncState');
    if (stored && stored.highlightSyncState) {
      this.syncState = stored.highlightSyncState as HighlightSyncState;
    }

    this.initialized = true;
    console.log('[HighlightSync] Initialized with lastSyncTime:', this.syncState.lastSyncTime);
  }

  startPeriodicSync(): void {
    if (this.syncInterval) return;

    console.log('[HighlightSync] Starting periodic sync every', this.SYNC_INTERVAL, 'ms');
    this.sync().catch(console.error);

    this.syncInterval = setInterval(() => {
      this.sync().catch(console.error);
    }, this.SYNC_INTERVAL);
  }

  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
      console.log('[HighlightSync] Stopped periodic sync');
    }
  }

  async sync(): Promise<void> {
    const isAuthenticated = await this.authService.isAuthenticated();
    const isSubscribed = await this.subscriptionService.isSubscriptionActive();
    if (!isAuthenticated || !isSubscribed) return;

    if (this.syncState.syncing) {
      console.log('[HighlightSync] Sync already in progress, skipping');
      return;
    }

    this.syncState.syncing = true;
    console.log('[HighlightSync] Starting sync...');

    try {
      await this.uploadLocalChanges();
      await this.downloadRemoteUpdates();

      this.syncState.lastSyncTime = Date.now();
      this.syncState.lastError = undefined;
      await this.saveSyncState();

      console.log('[HighlightSync] Sync completed successfully');
    } catch (error) {
      console.error('[HighlightSync] Sync failed:', error);
      this.syncState.lastError = error instanceof Error ? error.message : String(error);
      await this.saveSyncState();
    } finally {
      this.syncState.syncing = false;
    }
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

  private async uploadLocalChanges(): Promise<void> {
    const queue = await highlightSyncQueueDB.getAll();
    if (queue.length === 0) {
      console.log('[HighlightSync] No local changes to upload');
      return;
    }

    console.log(`[HighlightSync] Uploading ${queue.length} local changes`);

    const itemsToUpload: HighlightItem[] = [];

    for (const queueItem of queue) {
      const item = await highlightDB.getById(queueItem.itemId);
      if (item && item.source !== 'others') {
        itemsToUpload.push(item);
      } else if (queueItem.operation !== 'delete') {
        await highlightSyncQueueDB.dequeue(queueItem.id!);
      }
    }

    if (itemsToUpload.length === 0 && queue.every((q) => q.operation === 'delete')) {
      console.log('[HighlightSync] Only delete operations in queue');
      for (const queueItem of queue) {
        await highlightSyncQueueDB.dequeue(queueItem.id!);
      }
      return;
    }

    if (itemsToUpload.length > 0) {
      try {
        const response = await highlightSyncAPI.batchUpload(itemsToUpload);

        for (const itemId of response.data.synced) {
          await highlightSyncQueueDB.dequeueByItemId(itemId);
          await highlightDB.updateUserId(itemId);
        }

        if (response.data.failed && response.data.failed.length > 0) {
          for (const failed of response.data.failed) {
            const queueItem = queue.find((q) => q.itemId === failed.id);
            if (queueItem && queueItem.id) {
              await highlightSyncQueueDB.markFailed(queueItem.id, failed.error);
            }
          }
        }

        console.log(`[HighlightSync] Successfully synced ${response.data.synced.length} items`);
      } catch (error) {
        console.error('[HighlightSync] Upload failed:', error);
        for (const queueItem of queue) {
          if (queueItem.id) {
            await highlightSyncQueueDB.markFailed(
              queueItem.id,
              error instanceof Error ? error.message : String(error)
            );
          }
        }
        throw error;
      }
    }
  }

  private async downloadRemoteUpdates(): Promise<void> {
    const response = await highlightSyncAPI.incrementalFetch(this.syncState.lastSyncTime);

    if (!response.data || response.data.length === 0) {
      console.log('[HighlightSync] No remote updates');
      return;
    }

    console.log(`[HighlightSync] Received ${response.data.length} remote updates`);
    await this.mergeRemoteItems(response.data);
  }

  private async mergeRemoteItems(remoteItems: HighlightItem[]): Promise<void> {
    for (const remoteItem of remoteItems) {
      const localItem = remoteItem.id ? await highlightDB.getById(remoteItem.id) : undefined;

      if (!localItem) {
        await highlightDB.upsert(remoteItem);
        continue;
      }

      if ((remoteItem.updated_at || 0) > (localItem.updated_at || 0)) {
        await highlightDB.upsert(remoteItem);
      } else if ((remoteItem.updated_at || 0) < (localItem.updated_at || 0)) {
        const operation = remoteItem.deleted_at ? 'delete' : 'update';
        await highlightSyncQueueDB.enqueue(localItem.id!, operation);
      } else {
        if (remoteItem.deleted_at && !localItem.deleted_at) {
          await highlightDB.upsert(remoteItem);
        } else if (!remoteItem.deleted_at && localItem.deleted_at) {
          await highlightSyncQueueDB.enqueue(localItem.id!, 'delete');
        }
      }
    }
  }

  async queueForSync(itemId: string, operation: 'create' | 'update' | 'delete'): Promise<void> {
    await highlightSyncQueueDB.enqueue(itemId, operation);
    console.log(`[HighlightSync] Queued ${operation} for item: ${itemId}`);
  }

  getSyncStatus(): HighlightSyncState {
    return { ...this.syncState };
  }

  async getPendingSyncCount(): Promise<number> {
    return await highlightSyncQueueDB.count();
  }

  private async saveSyncState(): Promise<void> {
    await secureStorage.set({ highlightSyncState: this.syncState });
  }

  async clearSyncState(): Promise<void> {
    this.syncState = {
      lastSyncTime: 0,
      syncing: false,
    };
    await this.saveSyncState();
    await highlightSyncQueueDB.clear();
  }
}

export const highlightSyncService = HighlightSyncService.getInstance();
