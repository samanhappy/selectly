import { highlightDB, type HighlightItem } from '../storage/highlight-db';
import { highlightSyncService } from './highlight-sync-service';

export class HighlightService {
  private static instance: HighlightService;

  private constructor() {}

  static getInstance(): HighlightService {
    if (!HighlightService.instance) {
      HighlightService.instance = new HighlightService();
    }
    return HighlightService.instance;
  }

  async addItem(item: HighlightItem): Promise<string> {
    const itemId = await highlightDB.addItem({
      ...item,
      source: 'self',
    });
    await highlightSyncService.queueForSync(itemId, 'create');
    return itemId;
  }

  async deleteItem(id: string): Promise<void> {
    const item = await highlightDB.getById(id);
    if (item?.source === 'others') return;
    await highlightDB.softDelete(id);
    await highlightSyncService.queueForSync(id, 'delete');
  }

  async getAllItems(): Promise<HighlightItem[]> {
    return await highlightDB.getAll();
  }

  async getItemsByUrl(url: string): Promise<HighlightItem[]> {
    return await highlightDB.getByUrl(url);
  }

  async getItemsByUrlWithOthers(url: string): Promise<HighlightItem[]> {
    await highlightSyncService.refreshAggregatesForUrl(url);
    return await highlightDB.getByUrlIncludingOthers(url);
  }

  async sync(): Promise<void> {
    await highlightSyncService.sync();
    await highlightDB.notifyChange();
  }
}

export const highlightService = HighlightService.getInstance();
