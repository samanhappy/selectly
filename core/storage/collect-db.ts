import { v4 as uuidv4 } from '@lukeed/uuid';
import Dexie from 'dexie';
import type { Table } from 'dexie';

import { authService } from '~core/auth/auth-service';

export interface CollectedItem {
  id?: string;
  user_id?: string;
  text: string;
  url: string;
  hostname: string;
  title: string;
  created_at?: number;
  updated_at?: number;
  deleted_at?: number;
}

class CollectDB extends Dexie {
  items!: Table<CollectedItem, string>;

  private static instance: CollectDB;

  static getInstance() {
    if (!CollectDB.instance) {
      CollectDB.instance = new CollectDB();
    }
    return CollectDB.instance;
  }

  private constructor() {
    super('selectly-collect-db-v2'); // New database name to avoid migration conflicts

    // Version 1: Use UUID strings as primary key from the start
    this.version(1).stores({
      items: 'id, hostname, url, created_at, updated_at, deleted_at',
    });

    // Define indices to enable sorting operations
    this.items.mapToClass(Object);
  }

  /**
   * Migrate data from old database (if exists)
   * This should be called once after initialization
   */
  async migrateFromOldDatabase() {
    try {
      // Try to open the old database
      const oldDB = new Dexie('selectly-collect-db');
      oldDB.version(1).stores({ items: '++id, hostname, url, createdAt' });
      oldDB.version(2).stores({
        items: '++id, remoteId, hostname, url, createdAt, updatedAt, syncStatus, syncedAt',
      });

      await oldDB.open();
      const oldItems = await oldDB.table('items').toArray();

      if (oldItems.length > 0) {
        // Check if we've already migrated
        const existingCount = await this.items.count();
        if (existingCount === 0) {
          // Migrate all items to new database with UUIDs
          for (const item of oldItems) {
            const newItem = {
              ...item,
              id: uuidv4(), // Generate new UUID for each migrated item
            };
            await this.items.add(newItem);
          }
          console.log(`Migrated ${oldItems.length} items to new UUID-based database`);
        }
      }

      // Close and optionally delete old database
      oldDB.close();
      // Uncomment to delete old database after successful migration
      await Dexie.delete('selectly-collect-db');
    } catch (error) {
      // Old database doesn't exist or migration already completed
      console.log('No old database to migrate or migration already completed');
    }
  }

  notifyChange() {
    try {
      const channel = new BroadcastChannel('selectly-collect-changes');
      channel.postMessage('changed');
      channel.close();
    } catch (e) {
      // BroadcastChannel not available, ignore
    }
  }

  async addItem(item: CollectedItem) {
    const now = Date.now();
    const itemWithId: CollectedItem = {
      ...item,
      id: uuidv4(),
      created_at: now,
      updated_at: now,
    };
    await this.items.add(itemWithId);
    this.notifyChange();
    return itemWithId.id;
  }

  async updateItem(id: string, updates: CollectedItem) {
    const now = Date.now();
    await this.items.update(id, {
      ...updates,
      updated_at: now,
    });
    this.notifyChange();
  }

  async updateUserId(id: string) {
    const user_id = authService.getState()?.user?.uuid;
    if (!user_id) return;

    const item = await this.items.get(id);
    if (!item || user_id === item.user_id) return;

    await this.items.update(id, { user_id });
  }

  // order by created_at descending, filter out deleted items
  async getAll() {
    await authService.initialize();
    const user_id = authService.getState()?.user?.uuid;
    console.log('CollectDB.getAll user_id:', user_id);
    return this.items
      .filter((item) => !item.deleted_at && (!user_id || !item.user_id || item.user_id === user_id))
      .sortBy('created_at')
      .then((items) => items.reverse());
  }

  async getAllIncludingDeleted() {
    return this.items.orderBy('created_at').reverse().toArray();
  }

  async getById(id: string) {
    return this.items.get(id);
  }

  async softDelete(id: string) {
    const now = Date.now();
    await this.items.update(id, {
      deleted_at: now,
      updated_at: now,
    });
    this.notifyChange();
  }

  async remove(id: string) {
    const result = await this.items.delete(id);
    this.notifyChange();
    return result;
  }

  async clearAll() {
    const result = await this.items.clear();
    this.notifyChange();
    return result;
  }

  /**
   * Upsert item (insert or update based on id)
   * Used for syncing from server
   */
  async upsert(item: CollectedItem) {
    await this.items.put(item);
    this.notifyChange();
  }

  /**
   * Batch upsert items
   */
  async batchUpsert(items: CollectedItem[]) {
    await this.items.bulkPut(items);
    this.notifyChange();
  }

  /**
   * Get items modified after a timestamp
   */
  async getModifiedSince(timestamp: number) {
    return this.items.filter((item) => item.updated_at > timestamp).toArray();
  }
}

export const collectDB = CollectDB.getInstance();
