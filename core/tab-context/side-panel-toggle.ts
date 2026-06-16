type Awaitable<T> = T | Promise<T>;

export interface TabAssistantSidePanelApi {
  setOptions(options: { tabId: number; path?: string; enabled: boolean }): Awaitable<void>;
  open(options: { tabId: number }): Awaitable<void>;
  close?(options: { tabId: number }): Awaitable<void>;
}

export type TabAssistantSidePanelToggleResult = {
  action: 'opened' | 'closed';
  tabId: number;
};

export class TabAssistantSidePanelController {
  private readonly openTabIds = new Set<number>();
  private lastKnownTabId: number | null = null;

  constructor(private readonly path: string) {}

  isOpen(tabId: number): boolean {
    return this.openTabIds.has(tabId);
  }

  getLastKnownTabId(): number | null {
    return this.lastKnownTabId;
  }

  async prepare(sidePanel: TabAssistantSidePanelApi, tabId: number): Promise<void> {
    await sidePanel.setOptions({
      tabId,
      path: this.path,
      enabled: true,
    });
  }

  async toggle(
    sidePanel: TabAssistantSidePanelApi,
    tabId: number
  ): Promise<TabAssistantSidePanelToggleResult> {
    return this.isOpen(tabId) ? this.close(sidePanel, tabId) : this.open(sidePanel, tabId);
  }

  async show(
    sidePanel: TabAssistantSidePanelApi,
    tabId: number
  ): Promise<TabAssistantSidePanelToggleResult> {
    return this.open(sidePanel, tabId);
  }

  markOpened(tabId: number): void {
    this.openTabIds.add(tabId);
    this.lastKnownTabId = tabId;
  }

  markClosed(tabId: number): void {
    this.openTabIds.delete(tabId);
    this.lastKnownTabId =
      this.lastKnownTabId === tabId
        ? this.openTabIds.values().next().value ?? null
        : this.lastKnownTabId;
  }

  private async open(
    sidePanel: TabAssistantSidePanelApi,
    tabId: number
  ): Promise<TabAssistantSidePanelToggleResult> {
    const preparePromise = this.prepare(sidePanel, tabId);
    const openPromise = Promise.resolve(sidePanel.open({ tabId }));

    await Promise.all([preparePromise, openPromise]);
    this.markOpened(tabId);
    return { action: 'opened', tabId };
  }

  private async close(
    sidePanel: TabAssistantSidePanelApi,
    tabId: number
  ): Promise<TabAssistantSidePanelToggleResult> {
    if (sidePanel.close) {
      await sidePanel.close({ tabId });
    } else {
      await sidePanel.setOptions({
        tabId,
        enabled: false,
      });
    }

    this.markClosed(tabId);
    return { action: 'closed', tabId };
  }
}
