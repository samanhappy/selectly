/**
 * Dictionary Service
 * Single responsibility: coordinate local storage and cloud sync for dictionary entries
 */

import { dictionaryDB, type DictionaryEntry } from '../storage/dictionary-db';
import { dictionarySyncService } from './dictionary-sync-service';

export class DictionaryService {
  private static instance: DictionaryService;

  private constructor() {}

  static getInstance(): DictionaryService {
    if (!DictionaryService.instance) {
      DictionaryService.instance = new DictionaryService();
    }
    return DictionaryService.instance;
  }

  async addEntry(entry: Omit<DictionaryEntry, 'id'>): Promise<string> {
    const entryId = await dictionaryDB.addItem(entry);
    await dictionarySyncService.queueForSync(entryId, 'create');
    return entryId;
  }

  async deleteEntry(id: string): Promise<void> {
    await dictionaryDB.softDelete(id);
    await dictionarySyncService.queueForSync(id, 'delete');
  }

  async clearAll(): Promise<void> {
    const entries = await dictionaryDB.getAll();
    for (const entry of entries) {
      if (entry.id) {
        await this.deleteEntry(entry.id);
      }
    }
  }

  async getAllEntries(): Promise<DictionaryEntry[]> {
    return await dictionaryDB.getAll();
  }

  async sync(): Promise<void> {
    await dictionarySyncService.sync();
  }

  getSyncStatus() {
    return dictionarySyncService.getSyncStatus();
  }

  async getPendingSyncCount(): Promise<number> {
    return await dictionarySyncService.getPendingSyncCount();
  }
}

export const dictionaryService = DictionaryService.getInstance();
