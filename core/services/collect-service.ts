/**
 * Collect Service
 * High-level API for managing collected items with automatic sync
 * Single responsibility: coordinate local storage and cloud sync for collected items
 */

import { collectDB, type CollectedItem } from '../storage/collect-db';
import { collectSyncService } from './collect-sync-service';

export class CollectService {
  private static instance: CollectService;

  private constructor() {}

  static getInstance(): CollectService {
    if (!CollectService.instance) {
      CollectService.instance = new CollectService();
    }
    return CollectService.instance;
  }

  /**
   * Add a new collected item
   */
  async addItem(item: CollectedItem): Promise<string> {
    const itemId = await collectDB.addItem(item);
    await collectSyncService.queueForSync(itemId, 'create');
    return itemId;
  }

  /**
   * Update an existing collected item
   */
  async updateItem(id: string, updates: CollectedItem): Promise<void> {
    await collectDB.updateItem(id, updates);
    await collectSyncService.queueForSync(id, 'update');
  }

  /**
   * Delete a collected item (soft delete)
   */
  async deleteItem(id: string): Promise<void> {
    await collectDB.softDelete(id);
    await collectSyncService.queueForSync(id, 'delete');
  }

  /**
   * Get all collected items (excluding soft-deleted)
   */
  async getAllItems(): Promise<CollectedItem[]> {
    return await collectDB.getAll();
  }

  /**
   * Get all items including deleted ones
   */
  async getAllItemsIncludingDeleted(): Promise<CollectedItem[]> {
    return await collectDB.getAllIncludingDeleted();
  }

  /**
   * Get a specific item by ID
   */
  async getItemById(id: string): Promise<CollectedItem | undefined> {
    return await collectDB.getById(id);
  }

  /**
   * Clear all items (soft delete all)
   */
  async clearAll(): Promise<void> {
    const items = await collectDB.getAll();
    for (const item of items) {
      await this.deleteItem(item.id);
    }
  }

  /**
   * Trigger immediate sync
   */
  async sync(): Promise<void> {
    await collectSyncService.sync();
    await collectDB.notifyChange();
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return collectSyncService.getSyncStatus();
  }

  /**
   * Get pending sync count
   */
  async getPendingSyncCount(): Promise<number> {
    return await collectSyncService.getPendingSyncCount();
  }
}

export const collectService = CollectService.getInstance();
