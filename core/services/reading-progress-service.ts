import { readingProgressDB, type ReadingProgressRecord } from '../storage/reading-progress-db';

const MAX_ENTRIES = 300;

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

  private async pruneExpired(maxAgeMs?: number): Promise<void> {
    if (!maxAgeMs || maxAgeMs <= 0) return;
    const cutoff = Date.now() - maxAgeMs;
    await readingProgressDB.records.where('updatedAt').below(cutoff).delete();
  }

  private async capDbSize(): Promise<void> {
    const count = await readingProgressDB.records.count();
    if (count <= MAX_ENTRIES) return;
    const keys = await readingProgressDB.records
      .orderBy('updatedAt')
      .reverse()
      .offset(MAX_ENTRIES)
      .primaryKeys();
    if (keys.length > 0) {
      await readingProgressDB.records.bulkDelete(keys as string[]);
    }
  }

  async getProgress(url: string, maxAgeMs?: number): Promise<ReadingProgressRecord | null> {
    const key = this.buildPageKey(url);
    await this.pruneExpired(maxAgeMs);
    const record = await readingProgressDB.records.get(key);
    return record || null;
  }

  async saveProgress(
    url: string,
    record: Omit<ReadingProgressRecord, 'updatedAt' | 'key'> & { updatedAt?: number },
    options: { local?: boolean; sync?: boolean } = { local: true, sync: true },
    maxAgeMs?: number
  ): Promise<void> {
    void options;
    const key = this.buildPageKey(url);
    const payload: ReadingProgressRecord = {
      ...record,
      key,
      updatedAt: record.updatedAt || Date.now(),
    };

    await this.pruneExpired(maxAgeMs);
    await readingProgressDB.records.put(payload);
    await this.capDbSize();
  }

  async deleteProgress(
    url: string,
    options: { local?: boolean; sync?: boolean } = { local: true, sync: true }
  ): Promise<void> {
    void options;
    const key = this.buildPageKey(url);
    await readingProgressDB.records.delete(key);
  }
}

export const readingProgressService = ReadingProgressService.getInstance();
