import Dexie, { type Table } from 'dexie';

export interface ReadingProgressRecord {
  key: string;
  url: string;
  title?: string;
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  updatedAt: number;
  isManual?: boolean;
}

class ReadingProgressDB extends Dexie {
  records!: Table<ReadingProgressRecord, string>;

  private static instance: ReadingProgressDB;

  static getInstance() {
    if (!ReadingProgressDB.instance) {
      ReadingProgressDB.instance = new ReadingProgressDB();
    }
    return ReadingProgressDB.instance;
  }

  private constructor() {
    super('selectly-reading-progress-db-v1');

    this.version(1).stores({
      records: 'key, updatedAt',
    });

    this.records.mapToClass(Object);
  }
}

export const readingProgressDB = ReadingProgressDB.getInstance();
