import { highlightDB, type HighlightItem } from '../storage/highlight-db';

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
    return await highlightDB.addItem(item);
  }

  async deleteItem(id: string): Promise<void> {
    await highlightDB.softDelete(id);
  }

  async getAllItems(): Promise<HighlightItem[]> {
    return await highlightDB.getAll();
  }

  async getItemsByUrl(url: string): Promise<HighlightItem[]> {
    return await highlightDB.getByUrl(url);
  }
}

export const highlightService = HighlightService.getInstance();
