import { v4 as uuidv4 } from '@lukeed/uuid';
import Dexie from 'dexie';
import type { Table } from 'dexie';

import { authService } from '~core/auth/auth-service';

export interface HighlightAnchor {
  startXPath: string;
  startOffset: number;
  endXPath: string;
  endOffset: number;
  text: string;
  prefix?: string;
  suffix?: string;
}

export interface HighlightItem {
  id?: string;
  user_id?: string;
  text: string;
  url: string;
  hostname: string;
  title: string;
  color: string;
  anchor: HighlightAnchor;
  created_at?: number;
  updated_at?: number;
  deleted_at?: number;
}

class HighlightDB extends Dexie {
  items!: Table<HighlightItem, string>;

  private static instance: HighlightDB;

  static getInstance() {
    if (!HighlightDB.instance) {
      HighlightDB.instance = new HighlightDB();
    }
    return HighlightDB.instance;
  }

  private constructor() {
    super('selectly-highlight-db-v1');

    this.version(1).stores({
      items: 'id, url, hostname, created_at, updated_at, deleted_at',
    });

    this.items.mapToClass(Object);
  }

  notifyChange() {
    try {
      const channel = new BroadcastChannel('selectly-highlight-changes');
      channel.postMessage('changed');
      channel.close();
    } catch (e) {
      // BroadcastChannel not available, ignore
    }
  }

  async addItem(item: HighlightItem) {
    const now = Date.now();
    const itemWithId: HighlightItem = {
      ...item,
      id: uuidv4(),
      created_at: now,
      updated_at: now,
    };
    await this.items.add(itemWithId);
    this.notifyChange();
    return itemWithId.id;
  }

  async updateItem(id: string, updates: HighlightItem) {
    const now = Date.now();
    await this.items.update(id, {
      ...updates,
      updated_at: now,
    });
    this.notifyChange();
  }

  async updateUserId(id: string) {
    const user_id = authService.getState()?.user?.id;
    if (!user_id) return;

    const item = await this.items.get(id);
    if (!item || user_id === item.user_id) return;

    await this.items.update(id, { user_id });
  }

  async getAll() {
    await authService.initialize();
    const user_id = authService.getState()?.user?.uuid;
    return this.items
      .filter((item) => !item.deleted_at && (!user_id || !item.user_id || item.user_id === user_id))
      .sortBy('created_at')
      .then((items) => items.reverse());
  }

  async getByUrl(url: string) {
    await authService.initialize();
    const user_id = authService.getState()?.user?.uuid;
    return this.items
      .filter(
        (item) =>
          !item.deleted_at &&
          item.url === url &&
          (!user_id || !item.user_id || item.user_id === user_id)
      )
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
}

export const highlightDB = HighlightDB.getInstance();
