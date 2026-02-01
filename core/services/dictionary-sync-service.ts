/**
 * Dictionary Sync Service
 * Handles synchronization of dictionary entries between local IndexedDB and cloud
 */

import SubscriptionServiceV2 from '../../core/services/subscription-service-v2';
import { AuthService } from '../auth/auth-service';
import { dictionaryDB, type DictionaryEntry } from '../storage/dictionary-db';
import {
  dictionarySyncQueueDB,
  type DictionarySyncQueueItem,
} from '../storage/dictionary-sync-queue-db';
import { dictionarySyncAPI } from './dictionary-sync-api';
import { SyncCore, type SyncAdapter, type SyncState } from './sync-core';

export class DictionarySyncService {
  private static instance: DictionarySyncService;
  private authService: AuthService;
  private subscriptionService: SubscriptionServiceV2 = SubscriptionServiceV2.getInstance();
  private syncCore: SyncCore<DictionaryEntry, DictionarySyncQueueItem>;
  private initialized = false;
  private readonly SYNC_INTERVAL = 60000;

  private constructor() {
    this.authService = AuthService.getInstance();

    const adapter: SyncAdapter<DictionaryEntry, DictionarySyncQueueItem> = {
      name: 'DictionarySync',
      syncStateKey: 'dictionarySyncState',
      isSyncEnabled: async () => {
        const isAuthenticated = await this.authService.isAuthenticated();
        const isSubscribed = await this.subscriptionService.isSubscriptionActive();
        return isAuthenticated && isSubscribed;
      },
      getQueue: () => dictionarySyncQueueDB.getAll(),
      getItemById: (id) => dictionaryDB.getById(id),
      getItemId: (item) => item.id,
      getUpdatedAt: (item) => item.updatedAt || item.createdAt || 0,
      isDeleted: (item) => Boolean(item.deletedAt),
      upsertLocal: (item) => dictionaryDB.upsert(item),
      updateLocalUserId: (id) => dictionaryDB.updateUserId(id),
      enqueue: (itemId, operation) => dictionarySyncQueueDB.enqueue(itemId, operation),
      dequeue: (queueId) => dictionarySyncQueueDB.dequeue(queueId),
      dequeueByItemId: (itemId) => dictionarySyncQueueDB.dequeueByItemId(itemId),
      markFailed: (queueId, error) => dictionarySyncQueueDB.markFailed(queueId, error),
      clearQueue: () => dictionarySyncQueueDB.clear(),
      countQueue: () => dictionarySyncQueueDB.count(),
      uploadItems: (items) => dictionarySyncAPI.batchUpload(items),
      fetchRemote: (since) => dictionarySyncAPI.incrementalFetch(since),
      fetchAll: () => dictionarySyncAPI.fetchAll(),
    };

    this.syncCore = new SyncCore(adapter, this.SYNC_INTERVAL);
  }

  static getInstance(): DictionarySyncService {
    if (!DictionarySyncService.instance) {
      DictionarySyncService.instance = new DictionarySyncService();
    }
    return DictionarySyncService.instance;
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

  async fullSync(): Promise<void> {
    await this.syncCore.fullSync();
  }

  async queueForSync(itemId: string, operation: 'create' | 'update' | 'delete'): Promise<void> {
    await this.syncCore.queueForSync(itemId, operation);
  }

  getSyncStatus(): SyncState {
    return this.syncCore.getSyncStatus();
  }

  async getPendingSyncCount(): Promise<number> {
    return await this.syncCore.getPendingSyncCount();
  }

  async clearSyncState(): Promise<void> {
    await this.syncCore.clearSyncState();
  }
}

export const dictionarySyncService = DictionarySyncService.getInstance();
