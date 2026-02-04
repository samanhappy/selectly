/**
 * Dictionary Sync Queue Database
 * Stores pending sync operations (create, update, delete) for dictionary entries
 */

import Dexie from 'dexie';
import type { Table } from 'dexie';

export type DictionarySyncOperation = 'create' | 'update' | 'delete';

export interface DictionarySyncQueueItem {
  id?: number;
  itemId: string;
  operation: DictionarySyncOperation;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

class DictionarySyncQueueDB extends Dexie {
  queue!: Table<DictionarySyncQueueItem, number>;

  private static instance: DictionarySyncQueueDB;

  static getInstance() {
    if (!DictionarySyncQueueDB.instance) {
      DictionarySyncQueueDB.instance = new DictionarySyncQueueDB();
    }
    return DictionarySyncQueueDB.instance;
  }

  private constructor() {
    super('selectly-dictionary-sync-queue-db');

    this.version(1).stores({
      queue: '++id, itemId, operation, timestamp',
    });
  }

  async enqueue(itemId: string, operation: DictionarySyncOperation) {
    const existing = await this.queue.where('itemId').equals(itemId).first();

    if (existing) {
      if (existing.operation === 'create') {
        if (operation === 'delete') {
          await this.queue.delete(existing.id!);
        }
        return;
      } else if (existing.operation === 'update') {
        if (operation === 'delete') {
          await this.queue.update(existing.id!, {
            operation: 'delete',
            timestamp: Date.now(),
          });
        }
        return;
      } else if (existing.operation === 'delete') {
        return;
      }
    } else {
      await this.queue.add({
        itemId,
        operation,
        timestamp: Date.now(),
        retryCount: 0,
      });
    }
  }

  async getAll() {
    return this.queue.orderBy('timestamp').toArray();
  }

  async dequeue(id: number) {
    await this.queue.delete(id);
  }

  async dequeueByItemId(itemId: string) {
    const items = await this.queue.where('itemId').equals(itemId).toArray();
    const ids = items.map((item) => item.id!).filter((id) => id !== undefined);
    await this.queue.bulkDelete(ids);
  }

  async markFailed(id: number, error: string) {
    const item = await this.queue.get(id);
    if (item) {
      await this.queue.update(id, {
        retryCount: item.retryCount + 1,
        lastError: error,
      });
    }
  }

  async clear() {
    await this.queue.clear();
  }

  async count() {
    return this.queue.count();
  }
}

export const dictionarySyncQueueDB = DictionarySyncQueueDB.getInstance();
