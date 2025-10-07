/**
 * Sync Queue Database
 * Stores pending sync operations (create, update, delete) for collected items
 */

import Dexie from 'dexie';
import type { Table } from 'dexie';

export type SyncOperation = 'create' | 'update' | 'delete';

export interface SyncQueueItem {
  id?: number; // Auto-increment ID
  itemId: string; // UUID of the collected item
  operation: SyncOperation;
  timestamp: number; // When this operation was queued
  retryCount: number; // Number of sync attempts
  lastError?: string; // Last error message if sync failed
}

class SyncQueueDB extends Dexie {
  queue!: Table<SyncQueueItem, number>;

  private static instance: SyncQueueDB;

  static getInstance() {
    if (!SyncQueueDB.instance) {
      SyncQueueDB.instance = new SyncQueueDB();
    }
    return SyncQueueDB.instance;
  }

  private constructor() {
    super('selectly-sync-queue-db');

    this.version(1).stores({
      queue: '++id, itemId, operation, timestamp',
    });
  }

  /**
   * Add an operation to the sync queue
   */
  async enqueue(itemId: string, operation: SyncOperation) {
    // Check if there's already a pending operation for this item
    const existing = await this.queue.where('itemId').equals(itemId).first();

    if (existing) {
      // Update existing operation
      // If existing is 'create' and new is 'update', keep 'create'
      // If existing is 'create' and new is 'delete', remove from queue (not synced yet)
      // If existing is 'update' and new is 'delete', change to 'delete'
      if (existing.operation === 'create') {
        if (operation === 'delete') {
          // Item was created locally but never synced, just remove from queue
          await this.queue.delete(existing.id!);
        }
        // If update, keep create operation
        return;
      } else if (existing.operation === 'update') {
        if (operation === 'delete') {
          await this.queue.update(existing.id!, {
            operation: 'delete',
            timestamp: Date.now(),
          });
        }
        // If another update, no need to change
        return;
      } else if (existing.operation === 'delete') {
        // Already marked for deletion, no need to change
        return;
      }
    } else {
      // Add new operation
      await this.queue.add({
        itemId,
        operation,
        timestamp: Date.now(),
        retryCount: 0,
      });
    }
  }

  /**
   * Get all pending operations
   */
  async getAll() {
    return this.queue.orderBy('timestamp').toArray();
  }

  /**
   * Remove an operation from the queue (after successful sync)
   */
  async dequeue(id: number) {
    await this.queue.delete(id);
  }

  /**
   * Remove all operations for a specific item
   */
  async dequeueByItemId(itemId: string) {
    const items = await this.queue.where('itemId').equals(itemId).toArray();
    const ids = items.map((item) => item.id!).filter((id) => id !== undefined);
    await this.queue.bulkDelete(ids);
  }

  /**
   * Update retry count and error for a failed sync
   */
  async markFailed(id: number, error: string) {
    const item = await this.queue.get(id);
    if (item) {
      await this.queue.update(id, {
        retryCount: item.retryCount + 1,
        lastError: error,
      });
    }
  }

  /**
   * Clear all pending operations
   */
  async clear() {
    await this.queue.clear();
  }

  /**
   * Get count of pending operations
   */
  async count() {
    return this.queue.count();
  }
}

export const syncQueueDB = SyncQueueDB.getInstance();
