/**
 * Collect Sync Service
 * Handles synchronization of collected items between local IndexedDB and cloud
 * Implements Last Write Wins conflict resolution based on updatedAt timestamp
 */

import SubscriptionServiceV2 from '../../core/services/subscription-service-v2';
import { AuthService } from '../auth/auth-service';
import { collectDB, type CollectedItem } from '../storage/collect-db';
import { secureStorage } from '../storage/secure-storage';
import { syncQueueDB } from '../storage/sync-queue-db';
import { collectSyncAPI } from './collect-sync-api';

interface SyncState {
  lastSyncTime: number; // Last successful sync timestamp
  syncing: boolean;
  lastError?: string;
}

export class CollectSyncService {
  private static instance: CollectSyncService;
  private authService: AuthService;
  private subscriptionService: SubscriptionServiceV2 = SubscriptionServiceV2.getInstance();
  private syncState: SyncState = {
    lastSyncTime: 0,
    syncing: false,
  };
  private syncInterval?: NodeJS.Timeout;
  private initialized = false;
  private readonly SYNC_INTERVAL = 60000; // 60 seconds

  private constructor() {
    this.authService = AuthService.getInstance();
  }

  static getInstance(): CollectSyncService {
    if (!CollectSyncService.instance) {
      CollectSyncService.instance = new CollectSyncService();
    }
    return CollectSyncService.instance;
  }

  /**
   * Initialize sync service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Load last sync time from storage
    const stored = await secureStorage.get('collectSyncState');
    if (stored && stored.collectSyncState) {
      this.syncState = stored.collectSyncState as SyncState;
    }

    this.initialized = true;
    console.log('[CollectSync] Initialized with lastSyncTime:', this.syncState.lastSyncTime);
  }

  /**
   * Start periodic sync
   */
  startPeriodicSync(): void {
    if (this.syncInterval) {
      return; // Already running
    }

    console.log('[CollectSync] Starting periodic sync every', this.SYNC_INTERVAL, 'ms');

    // Sync immediately on start
    this.sync().catch(console.error);

    // Then sync periodically
    this.syncInterval = setInterval(() => {
      this.sync().catch(console.error);
    }, this.SYNC_INTERVAL);
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
      console.log('[CollectSync] Stopped periodic sync');
    }
  }

  /**
   * Main sync function - uploads local changes and downloads remote updates
   */
  async sync(): Promise<void> {
    const isAuthenticated = await this.authService.isAuthenticated();
    const isSubscribed = await this.subscriptionService.isSubscriptionActive();
    if (!isAuthenticated || !isSubscribed) {
      return;
    }

    if (this.syncState.syncing) {
      console.log('[CollectSync] Sync already in progress, skipping');
      return;
    }

    this.syncState.syncing = true;
    console.log('[CollectSync] Starting sync...');

    try {
      // Step 1: Upload local changes
      await this.uploadLocalChanges();

      // Step 2: Download remote updates
      await this.downloadRemoteUpdates();

      // Update last sync time
      this.syncState.lastSyncTime = Date.now();
      this.syncState.lastError = undefined;
      await this.saveSyncState();

      console.log('[CollectSync] Sync completed successfully');
    } catch (error) {
      console.error('[CollectSync] Sync failed:', error);
      this.syncState.lastError = error instanceof Error ? error.message : String(error);
      await this.saveSyncState();
    } finally {
      this.syncState.syncing = false;
    }
  }

  /**
   * Upload local changes to server
   */
  private async uploadLocalChanges(): Promise<void> {
    const queue = await syncQueueDB.getAll();
    if (queue.length === 0) {
      console.log('[CollectSync] No local changes to upload');
      return;
    }

    console.log(`[CollectSync] Uploading ${queue.length} local changes`);

    // Group items by operation
    const itemsToUpload: CollectedItem[] = [];

    for (const queueItem of queue) {
      const item = await collectDB.getById(queueItem.itemId);
      if (item) {
        itemsToUpload.push(item);
      } else if (queueItem.operation !== 'delete') {
        // Item doesn't exist and it's not a delete operation, remove from queue
        await syncQueueDB.dequeue(queueItem.id!);
      }
    }

    if (itemsToUpload.length === 0 && queue.every((q) => q.operation === 'delete')) {
      // Only deletes remain, handle them separately if needed
      console.log('[CollectSync] Only delete operations in queue');
      for (const queueItem of queue) {
        await syncQueueDB.dequeue(queueItem.id!);
      }
      return;
    }

    if (itemsToUpload.length > 0) {
      try {
        console.log('[CollectSync] Uploading items:', itemsToUpload);
        const response = await collectSyncAPI.batchUpload(itemsToUpload);
        console.log('[CollectSync] Upload response:', response);

        // Remove successfully synced items from queue
        for (const itemId of response.data.synced) {
          await syncQueueDB.dequeueByItemId(itemId);
          await collectDB.updateUserId(itemId);
        }

        // Mark failed items
        if (response.data.failed && response.data.failed.length > 0) {
          for (const failed of response.data.failed) {
            const queueItem = queue.find((q) => q.itemId === failed.id);
            if (queueItem && queueItem.id) {
              await syncQueueDB.markFailed(queueItem.id, failed.error);
            }
          }
        }

        console.log(`[CollectSync] Successfully synced ${response.data.synced.length} items`);
      } catch (error) {
        console.error('[CollectSync] Upload failed:', error);
        // Mark all items as failed
        for (const queueItem of queue) {
          if (queueItem.id) {
            await syncQueueDB.markFailed(
              queueItem.id,
              error instanceof Error ? error.message : String(error)
            );
          }
        }
        throw error;
      }
    }
  }

  /**
   * Download remote updates from server
   */
  private async downloadRemoteUpdates(): Promise<void> {
    try {
      const response = await collectSyncAPI.incrementalFetch(this.syncState.lastSyncTime);
      console.log('[CollectSync] Download response:', response);

      if (response.data.length === 0) {
        console.log('[CollectSync] No remote updates');
        return;
      }

      console.log(`[CollectSync] Received ${response.data.length} remote updates`);

      // Merge remote items with local items
      await this.mergeRemoteItems(response.data);

      console.log('[CollectSync] Remote updates merged successfully');
    } catch (error) {
      console.error('[CollectSync] Download failed:', error);
      throw error;
    }
  }

  /**
   * Merge remote items with local items using Last Write Wins strategy
   */
  private async mergeRemoteItems(remoteItems: CollectedItem[]): Promise<void> {
    for (const remoteItem of remoteItems) {
      const localItem = await collectDB.getById(remoteItem.id);

      if (!localItem) {
        // New item from server, add it locally
        await collectDB.upsert(remoteItem);
        console.log(`[CollectSync] Added new item from server: ${remoteItem.id}`);
        continue;
      }

      // Compare timestamps - Last Write Wins
      if (remoteItem.updated_at > localItem.updated_at) {
        // Remote is newer, update local
        await collectDB.upsert(remoteItem);
        console.log(`[CollectSync] Updated local item with remote: ${remoteItem.id}`);
      } else if (remoteItem.updated_at < localItem.updated_at) {
        // Local is newer, enqueue for upload
        const operation = remoteItem.deleted_at ? 'delete' : 'update';
        await syncQueueDB.enqueue(localItem.id, operation);
        console.log(`[CollectSync] Local item is newer, queued for upload: ${localItem.id}`);
      } else {
        // Same timestamp, check deletedAt
        if (remoteItem.deleted_at && !localItem.deleted_at) {
          // Remote deleted, apply deletion locally
          await collectDB.upsert(remoteItem);
          console.log(`[CollectSync] Applied remote deletion: ${remoteItem.id}`);
        } else if (!remoteItem.deleted_at && localItem.deleted_at) {
          // Local deleted, enqueue for upload
          await syncQueueDB.enqueue(localItem.id, 'delete');
          console.log(`[CollectSync] Local deletion queued for upload: ${localItem.id}`);
        }
        // Otherwise, items are identical
      }
    }
  }

  /**
   * Force full sync - downloads all items from server and merges
   */
  async fullSync(): Promise<void> {
    console.log('[CollectSync] Starting full sync...');
    const isAuthenticated = await this.authService.isAuthenticated();
    const isSubscribed = await this.subscriptionService.isSubscriptionActive();
    if (!isAuthenticated || !isSubscribed) {
      return;
    }

    try {
      this.syncState.syncing = true;

      // Download all items from server
      const response = await collectSyncAPI.fetchAll();
      console.log(`[CollectSync] Full sync received ${response.data.length} items`);

      // Merge with local items
      await this.mergeRemoteItems(response.data);

      // Upload local changes
      await this.uploadLocalChanges();

      this.syncState.lastSyncTime = Date.now();
      this.syncState.lastError = undefined;
      await this.saveSyncState();

      console.log('[CollectSync] Full sync completed');
    } catch (error) {
      console.error('[CollectSync] Full sync failed:', error);
      this.syncState.lastError = error instanceof Error ? error.message : String(error);
      await this.saveSyncState();
      throw error;
    } finally {
      this.syncState.syncing = false;
    }
  }

  /**
   * Add item to sync queue
   */
  async queueForSync(itemId: string, operation: 'create' | 'update' | 'delete'): Promise<void> {
    await syncQueueDB.enqueue(itemId, operation);
    console.log(`[CollectSync] Queued ${operation} for item: ${itemId}`);
  }

  /**
   * Get sync status
   */
  getSyncStatus(): SyncState {
    return { ...this.syncState };
  }

  /**
   * Get pending sync count
   */
  async getPendingSyncCount(): Promise<number> {
    return await syncQueueDB.count();
  }

  /**
   * Save sync state to storage
   */
  private async saveSyncState(): Promise<void> {
    await secureStorage.set({ collectSyncState: this.syncState });
  }

  /**
   * Clear all sync state and queue
   */
  async clearSyncState(): Promise<void> {
    this.syncState = {
      lastSyncTime: 0,
      syncing: false,
    };
    await this.saveSyncState();
    await syncQueueDB.clear();
    console.log('[CollectSync] Sync state cleared');
  }
}

export const collectSyncService = CollectSyncService.getInstance();
