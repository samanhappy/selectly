import { v4 as uuidv4 } from '@lukeed/uuid';
import Dexie, { type Table } from 'dexie';

export interface DictionaryEntry {
  id?: string;
  /** The original selected text */
  source: string;
  /** The translated result text */
  translation: string;
  /** The full sentence containing the selection */
  sentence?: string;
  /** Page URL context */
  url: string;
  /** Page title for reference */
  title: string;
  /** Hostname for quick filtering (not used for grouping) */
  hostname: string;
  createdAt: number;
}

class DictionaryDB extends Dexie {
  entries!: Table<DictionaryEntry, string>;

  private static instance: DictionaryDB;

  static getInstance() {
    if (!DictionaryDB.instance) {
      DictionaryDB.instance = new DictionaryDB();
    }
    return DictionaryDB.instance;
  }

  private constructor() {
    super('selectly-dictionary-db-v2'); // New database name to avoid migration conflicts

    // Version 1: Use UUID strings as primary key from the start
    this.version(1).stores({
      entries: 'id, remoteId, hostname, url, createdAt, updatedAt, syncStatus, syncedAt',
    });
  }

  /**
   * Migrate data from old database (if exists)
   * This should be called once after initialization
   */
  async migrateFromOldDatabase() {
    try {
      // Try to open the old database
      const oldDB = new Dexie('selectly-dictionary-db');
      oldDB.version(1).stores({ entries: '++id, hostname, url, createdAt' });
      oldDB.version(2).stores({
        entries: '++id, remoteId, hostname, url, createdAt, updatedAt, syncStatus, syncedAt',
      });

      await oldDB.open();
      const oldEntries = await oldDB.table('entries').toArray();

      if (oldEntries.length > 0) {
        // Check if we've already migrated
        const existingCount = await this.entries.count();
        if (existingCount === 0) {
          // Migrate all entries to new database with UUIDs
          for (const entry of oldEntries) {
            const newEntry = {
              ...entry,
              id: uuidv4(), // Generate new UUID for each migrated entry
            };
            await this.entries.add(newEntry);
          }
          console.log(`Migrated ${oldEntries.length} entries to new UUID-based database`);
        }
      }

      // Close and optionally delete old database
      oldDB.close();
      // Uncomment to delete old database after successful migration
      await Dexie.delete('selectly-dictionary-db');
    } catch (error) {
      // Old database doesn't exist or migration already completed
      console.log('No old database to migrate or migration already completed');
    }
  }

  private notifyChange() {
    try {
      const channel = new BroadcastChannel('selectly-dictionary-changes');
      channel.postMessage('changed');
      channel.close();
    } catch (e) {
      // BroadcastChannel not available, ignore
    }
  }

  async addItem(item: Omit<DictionaryEntry, 'id'>) {
    // Generate UUID for new items
    const itemWithId: DictionaryEntry = {
      ...item,
      id: uuidv4(),
    };
    await this.entries.add(itemWithId);
    this.notifyChange();
    return itemWithId.id;
  }

  async getAll() {
    return this.entries.orderBy('createdAt').reverse().toArray();
  }

  async remove(id: string) {
    const result = await this.entries.delete(id);
    this.notifyChange();
    return result;
  }

  async clearAll() {
    const result = await this.entries.clear();
    this.notifyChange();
    return result;
  }
}

export const dictionaryDB = DictionaryDB.getInstance();
