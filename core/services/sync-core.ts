import { secureStorage } from '../storage/secure-storage';

export type SyncOperation = 'create' | 'update' | 'delete';

export interface SyncState {
  lastSyncTime: number;
  syncing: boolean;
  lastError?: string;
}

export interface SyncQueueItemBase {
  id?: number;
  itemId: string;
  operation: SyncOperation;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

export interface SyncAdapter<TItem, TQueueItem extends SyncQueueItemBase> {
  name: string;
  syncStateKey: string;
  isSyncEnabled: () => Promise<boolean>;
  getQueue: () => Promise<TQueueItem[]>;
  getItemById: (id: string) => Promise<TItem | undefined>;
  shouldUploadItem?: (item: TItem) => boolean;
  getItemId: (item: TItem) => string | undefined;
  getUpdatedAt: (item: TItem) => number;
  isDeleted: (item: TItem) => boolean;
  upsertLocal: (item: TItem) => Promise<void>;
  updateLocalUserId?: (id: string) => Promise<void>;
  enqueue: (itemId: string, operation: SyncOperation) => Promise<void>;
  dequeue: (queueId: number) => Promise<void>;
  dequeueByItemId: (itemId: string) => Promise<void>;
  markFailed: (queueId: number, error: string) => Promise<void>;
  clearQueue: () => Promise<void>;
  countQueue: () => Promise<number>;
  uploadItems: (items: TItem[]) => Promise<{
    data: {
      synced: string[];
      failed?: Array<{ id: string; error: string }>;
    };
  }>;
  fetchRemote: (since: number) => Promise<{ data: TItem[] }>;
  fetchAll?: () => Promise<{ data: TItem[] }>;
}

export class SyncCore<TItem, TQueueItem extends SyncQueueItemBase> {
  private syncState: SyncState = {
    lastSyncTime: 0,
    syncing: false,
  };
  private syncInterval?: NodeJS.Timeout;
  private initialized = false;

  constructor(
    private readonly adapter: SyncAdapter<TItem, TQueueItem>,
    private readonly intervalMs: number
  ) {}

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const stored = await secureStorage.get(this.adapter.syncStateKey);
    if (stored && stored[this.adapter.syncStateKey]) {
      this.syncState = stored[this.adapter.syncStateKey] as SyncState;
      this.syncState.syncing = false;
    }

    this.initialized = true;
    console.log(
      `[${this.adapter.name}] Initialized with lastSyncTime:`,
      this.syncState.lastSyncTime
    );
  }

  startPeriodicSync(): void {
    if (this.syncInterval) return;

    console.log(`[${this.adapter.name}] Starting periodic sync every`, this.intervalMs, 'ms');
    this.sync().catch(console.error);

    this.syncInterval = setInterval(() => {
      this.sync().catch(console.error);
    }, this.intervalMs);
  }

  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
      console.log(`[${this.adapter.name}] Stopped periodic sync`);
    }
  }

  async sync(): Promise<void> {
    const isEnabled = await this.adapter.isSyncEnabled();
    if (!isEnabled) return;

    if (this.syncState.syncing) {
      console.log(`[${this.adapter.name}] Sync already in progress, skipping`);
      return;
    }

    this.syncState.syncing = true;
    console.log(`[${this.adapter.name}] Starting sync...`);

    try {
      await this.uploadLocalChanges();
      await this.downloadRemoteUpdates();

      this.syncState.lastSyncTime = Date.now();
      this.syncState.lastError = undefined;
      await this.saveSyncState();

      console.log(`[${this.adapter.name}] Sync completed successfully`);
    } catch (error) {
      console.error(`[${this.adapter.name}] Sync failed:`, error);
      this.syncState.lastError = error instanceof Error ? error.message : String(error);
      await this.saveSyncState();
    } finally {
      this.syncState.syncing = false;
    }
  }

  async fullSync(): Promise<void> {
    const isEnabled = await this.adapter.isSyncEnabled();
    if (!isEnabled) return;

    if (this.syncState.syncing) {
      console.log(`[${this.adapter.name}] Sync already in progress, skipping`);
      return;
    }

    this.syncState.syncing = true;
    console.log(`[${this.adapter.name}] Starting full sync...`);

    try {
      const response = this.adapter.fetchAll
        ? await this.adapter.fetchAll()
        : await this.adapter.fetchRemote(0);

      if (response.data?.length) {
        await this.mergeRemoteItems(response.data);
      }

      await this.uploadLocalChanges();

      this.syncState.lastSyncTime = Date.now();
      this.syncState.lastError = undefined;
      await this.saveSyncState();

      console.log(`[${this.adapter.name}] Full sync completed`);
    } catch (error) {
      console.error(`[${this.adapter.name}] Full sync failed:`, error);
      this.syncState.lastError = error instanceof Error ? error.message : String(error);
      await this.saveSyncState();
      throw error;
    } finally {
      this.syncState.syncing = false;
    }
  }

  async queueForSync(itemId: string, operation: SyncOperation): Promise<void> {
    await this.adapter.enqueue(itemId, operation);
    console.log(`[${this.adapter.name}] Queued ${operation} for item: ${itemId}`);
  }

  getSyncStatus(): SyncState {
    return { ...this.syncState };
  }

  async getPendingSyncCount(): Promise<number> {
    return await this.adapter.countQueue();
  }

  async clearSyncState(): Promise<void> {
    this.syncState = {
      lastSyncTime: 0,
      syncing: false,
    };
    await this.saveSyncState();
    await this.adapter.clearQueue();
  }

  private async saveSyncState(): Promise<void> {
    await secureStorage.set({ [this.adapter.syncStateKey]: this.syncState });
  }

  private async uploadLocalChanges(): Promise<void> {
    const queue = await this.adapter.getQueue();
    if (queue.length === 0) {
      console.log(`[${this.adapter.name}] No local changes to upload`);
      return;
    }

    console.log(`[${this.adapter.name}] Uploading ${queue.length} local changes`);

    const itemsToUpload: TItem[] = [];

    for (const queueItem of queue) {
      const item = await this.adapter.getItemById(queueItem.itemId);
      if (item && (this.adapter.shouldUploadItem ? this.adapter.shouldUploadItem(item) : true)) {
        itemsToUpload.push(item);
      } else if (queueItem.operation !== 'delete' && queueItem.id) {
        await this.adapter.dequeue(queueItem.id);
      }
    }

    if (itemsToUpload.length === 0 && queue.every((q) => q.operation === 'delete')) {
      console.log(`[${this.adapter.name}] Only delete operations in queue`);
      for (const queueItem of queue) {
        if (queueItem.id) {
          await this.adapter.dequeue(queueItem.id);
        }
      }
      return;
    }

    if (itemsToUpload.length > 0) {
      try {
        const response = await this.adapter.uploadItems(itemsToUpload);

        for (const itemId of response.data.synced) {
          await this.adapter.dequeueByItemId(itemId);
          if (this.adapter.updateLocalUserId) {
            await this.adapter.updateLocalUserId(itemId);
          }
        }

        if (response.data.failed && response.data.failed.length > 0) {
          for (const failed of response.data.failed) {
            const queueItem = queue.find((q) => q.itemId === failed.id);
            if (queueItem?.id) {
              await this.adapter.markFailed(queueItem.id, failed.error);
            }
          }
        }

        console.log(
          `[${this.adapter.name}] Successfully synced ${response.data.synced.length} items`
        );
      } catch (error) {
        console.error(`[${this.adapter.name}] Upload failed:`, error);
        for (const queueItem of queue) {
          if (queueItem.id) {
            await this.adapter.markFailed(
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
    const response = await this.adapter.fetchRemote(this.syncState.lastSyncTime);

    if (!response.data || response.data.length === 0) {
      console.log(`[${this.adapter.name}] No remote updates`);
      return;
    }

    console.log(`[${this.adapter.name}] Received ${response.data.length} remote updates`);
    await this.mergeRemoteItems(response.data);
  }

  private async mergeRemoteItems(remoteItems: TItem[]): Promise<void> {
    for (const remoteItem of remoteItems) {
      const remoteId = this.adapter.getItemId(remoteItem);
      if (!remoteId) continue;

      const localItem = await this.adapter.getItemById(remoteId);

      if (!localItem) {
        await this.adapter.upsertLocal(remoteItem);
        continue;
      }

      const remoteUpdatedAt = this.adapter.getUpdatedAt(remoteItem);
      const localUpdatedAt = this.adapter.getUpdatedAt(localItem);

      if (remoteUpdatedAt > localUpdatedAt) {
        await this.adapter.upsertLocal(remoteItem);
      } else if (remoteUpdatedAt < localUpdatedAt) {
        const operation = this.adapter.isDeleted(localItem) ? 'delete' : 'update';
        await this.adapter.enqueue(remoteId, operation);
      } else {
        if (this.adapter.isDeleted(remoteItem) && !this.adapter.isDeleted(localItem)) {
          await this.adapter.upsertLocal(remoteItem);
        } else if (!this.adapter.isDeleted(remoteItem) && this.adapter.isDeleted(localItem)) {
          await this.adapter.enqueue(remoteId, 'delete');
        }
      }
    }
  }
}
