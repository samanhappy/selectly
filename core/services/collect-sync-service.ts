/**
 * Collect Sync Service
 * Handles synchronization of collected items between local IndexedDB and cloud
 * Implements Last Write Wins conflict resolution based on updatedAt timestamp
 */

import SubscriptionServiceV2 from '../../core/services/subscription-service-v2';
import { AuthService } from '../auth/auth-service';
import { collectDB, type CollectedItem } from '../storage/collect-db';
import { syncQueueDB, type SyncQueueItem } from '../storage/sync-queue-db';
import { collectSyncAPI } from './collect-sync-api';
import { SyncCore, type SyncAdapter, type SyncState } from './sync-core';

export class CollectSyncService {
  private static instance: CollectSyncService;
  private authService: AuthService;
  private subscriptionService: SubscriptionServiceV2 = SubscriptionServiceV2.getInstance();
  private syncCore: SyncCore<CollectedItem, SyncQueueItem>;
  private initialized = false;
  private readonly SYNC_INTERVAL = 60000; // 60 seconds

  private constructor() {
    this.authService = AuthService.getInstance();

    const adapter: SyncAdapter<CollectedItem, SyncQueueItem> = {
      name: 'CollectSync',
      syncStateKey: 'collectSyncState',
      isSyncEnabled: async () => {
        const isAuthenticated = await this.authService.isAuthenticated();
        const isSubscribed = await this.subscriptionService.isSubscriptionActive();
        return isAuthenticated && isSubscribed;
      },
      getQueue: () => syncQueueDB.getAll(),
      getItemById: (id) => collectDB.getById(id),
      getItemId: (item) => item.id,
      getUpdatedAt: (item) => item.updated_at || 0,
      isDeleted: (item) => Boolean(item.deleted_at),
      upsertLocal: (item) => collectDB.upsert(item),
      updateLocalUserId: (id) => collectDB.updateUserId(id),
      enqueue: (itemId, operation) => syncQueueDB.enqueue(itemId, operation),
      dequeue: (queueId) => syncQueueDB.dequeue(queueId),
      dequeueByItemId: (itemId) => syncQueueDB.dequeueByItemId(itemId),
      markFailed: (queueId, error) => syncQueueDB.markFailed(queueId, error),
      clearQueue: () => syncQueueDB.clear(),
      countQueue: () => syncQueueDB.count(),
      uploadItems: (items) => collectSyncAPI.batchUpload(items),
      fetchRemote: (since) => collectSyncAPI.incrementalFetch(since),
      fetchAll: () => collectSyncAPI.fetchAll(),
    };

    this.syncCore = new SyncCore(adapter, this.SYNC_INTERVAL);
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

    await this.syncCore.initialize();

    this.initialized = true;
  }

  /**
   * Start periodic sync
   */
  startPeriodicSync(): void {
    this.syncCore.startPeriodicSync();
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync(): void {
    this.syncCore.stopPeriodicSync();
  }

  /**
   * Main sync function - uploads local changes and downloads remote updates
   */
  async sync(): Promise<void> {
    await this.syncCore.sync();
  }

  async fullSync(): Promise<void> {
    await this.syncCore.fullSync();
  }

  /**
   * Add item to sync queue
   */
  async queueForSync(itemId: string, operation: 'create' | 'update' | 'delete'): Promise<void> {
    await this.syncCore.queueForSync(itemId, operation);
  }

  /**
   * Get sync status
   */
  getSyncStatus(): SyncState {
    return this.syncCore.getSyncStatus();
  }

  /**
   * Get pending sync count
   */
  async getPendingSyncCount(): Promise<number> {
    return await this.syncCore.getPendingSyncCount();
  }

  async clearSyncState(): Promise<void> {
    await this.syncCore.clearSyncState();
  }
}

export const collectSyncService = CollectSyncService.getInstance();
