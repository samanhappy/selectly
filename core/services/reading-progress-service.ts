import { secureStorage } from '../storage/secure-storage';

export interface ReadingProgressRecord {
  url: string;
  title?: string;
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  updatedAt: number;
}

type ReadingProgressMap = Record<string, ReadingProgressRecord>;

const LOCAL_KEY = 'readingProgressLocal';
const SYNC_KEY = 'readingProgressSync';
const MAX_ENTRIES = 200;

class ReadingProgressService {
  private static instance: ReadingProgressService;

  static getInstance(): ReadingProgressService {
    if (!ReadingProgressService.instance) {
      ReadingProgressService.instance = new ReadingProgressService();
    }
    return ReadingProgressService.instance;
  }

  private buildPageKey(url: string): string {
    try {
      const u = new URL(url);
      u.hash = '';
      return `${u.origin}${u.pathname}${u.search}`;
    } catch {
      return url.split('#')[0];
    }
  }

  private capMapSize(map: ReadingProgressMap): ReadingProgressMap {
    const entries = Object.entries(map);
    if (entries.length <= MAX_ENTRIES) return map;

    const sorted = entries.sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0));
    return Object.fromEntries(sorted.slice(0, MAX_ENTRIES));
  }

  private pruneExpired(
    map: ReadingProgressMap,
    maxAgeMs?: number
  ): { map: ReadingProgressMap; changed: boolean } {
    if (!maxAgeMs || maxAgeMs <= 0) return { map, changed: false };
    const now = Date.now();
    let changed = false;
    const next: ReadingProgressMap = {};

    for (const [key, record] of Object.entries(map)) {
      const updatedAt = record?.updatedAt || 0;
      if (now - updatedAt <= maxAgeMs) {
        next[key] = record;
      } else {
        changed = true;
      }
    }

    return { map: next, changed };
  }

  private async getLocalMap(): Promise<ReadingProgressMap> {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) return {};
    const result = await chrome.storage.local.get(LOCAL_KEY);
    return (result?.[LOCAL_KEY] as ReadingProgressMap) || {};
  }

  private async getSyncMap(): Promise<ReadingProgressMap> {
    if (typeof chrome === 'undefined' || !chrome.storage) return {};
    const result = await secureStorage.get([SYNC_KEY]);
    return (result?.[SYNC_KEY] as ReadingProgressMap) || {};
  }

  private async saveLocalMap(map: ReadingProgressMap): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) return;
    const capped = this.capMapSize(map);
    await chrome.storage.local.set({ [LOCAL_KEY]: capped });
  }

  private async saveSyncMap(map: ReadingProgressMap): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.storage) return;
    const capped = this.capMapSize(map);
    await secureStorage.set({ [SYNC_KEY]: capped });
  }

  async getProgress(url: string, maxAgeMs?: number): Promise<ReadingProgressRecord | null> {
    if (typeof chrome === 'undefined' || !chrome.storage) return null;

    const key = this.buildPageKey(url);
    const localMapRaw = await this.getLocalMap();
    const localPruned = this.pruneExpired(localMapRaw, maxAgeMs);
    if (localPruned.changed) {
      await this.saveLocalMap(localPruned.map);
    }
    let record = localPruned.map[key] || null;

    if (!record) {
      const syncMapRaw = await this.getSyncMap();
      const syncPruned = this.pruneExpired(syncMapRaw, maxAgeMs);
      if (syncPruned.changed) {
        await this.saveSyncMap(syncPruned.map);
      }
      record = syncPruned.map[key] || null;
      if (record) {
        await this.saveLocalMap({ ...localPruned.map, [key]: record });
      }
    }

    return record;
  }

  async saveProgress(
    url: string,
    record: Omit<ReadingProgressRecord, 'updatedAt'> & { updatedAt?: number },
    options: { local?: boolean; sync?: boolean } = { local: true, sync: true },
    maxAgeMs?: number
  ): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.storage) return;

    const key = this.buildPageKey(url);
    const payload: ReadingProgressRecord = {
      ...record,
      updatedAt: record.updatedAt || Date.now(),
    };

    if (options.local) {
      const localMapRaw = await this.getLocalMap();
      const localPruned = this.pruneExpired(localMapRaw, maxAgeMs);
      localPruned.map[key] = payload;
      await this.saveLocalMap(localPruned.map);
    }

    if (options.sync) {
      const syncMapRaw = await this.getSyncMap();
      const syncPruned = this.pruneExpired(syncMapRaw, maxAgeMs);
      syncPruned.map[key] = payload;
      await this.saveSyncMap(syncPruned.map);
    }
  }

  async deleteProgress(
    url: string,
    options: { local?: boolean; sync?: boolean } = { local: true, sync: true }
  ): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.storage) return;

    const key = this.buildPageKey(url);

    if (options.local) {
      const localMap = await this.getLocalMap();
      if (localMap[key]) {
        delete localMap[key];
        await this.saveLocalMap(localMap);
      }
    }

    if (options.sync) {
      const syncMap = await this.getSyncMap();
      if (syncMap[key]) {
        delete syncMap[key];
        await this.saveSyncMap(syncMap);
      }
    }
  }
}

export const readingProgressService = ReadingProgressService.getInstance();
