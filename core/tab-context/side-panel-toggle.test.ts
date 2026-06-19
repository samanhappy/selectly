import { describe, expect, it, vi } from 'vitest';

import {
  TabAssistantSidePanelController,
  type TabAssistantSidePanelApi,
} from './side-panel-toggle';

const createSidePanel = (): TabAssistantSidePanelApi => ({
  setOptions: vi.fn(() => Promise.resolve()),
  open: vi.fn(() => Promise.resolve()),
  close: vi.fn(() => Promise.resolve()),
});

describe('TabAssistantSidePanelController', () => {
  it('opens the tab assistant side panel on the first toggle for a tab', async () => {
    const sidePanel = createSidePanel();
    const controller = new TabAssistantSidePanelController('tabs/tab-assistant.html');

    await expect(controller.toggle(sidePanel, 7)).resolves.toEqual({
      action: 'opened',
      tabId: 7,
    });

    expect(sidePanel.setOptions).toHaveBeenCalledWith({
      tabId: 7,
      path: 'tabs/tab-assistant.html',
      enabled: true,
    });
    expect(sidePanel.open).toHaveBeenCalledWith({ tabId: 7 });
    expect(controller.isOpen(7)).toBe(true);
  });

  it('closes an already-open tab assistant side panel on the next toggle', async () => {
    const sidePanel = createSidePanel();
    const controller = new TabAssistantSidePanelController('tabs/tab-assistant.html');

    await controller.toggle(sidePanel, 7);
    vi.clearAllMocks();

    await expect(controller.toggle(sidePanel, 7)).resolves.toEqual({
      action: 'closed',
      tabId: 7,
    });

    expect(sidePanel.close).toHaveBeenCalledWith({ tabId: 7 });
    expect(sidePanel.open).not.toHaveBeenCalled();
    expect(controller.isOpen(7)).toBe(false);
  });

  it('keeps an already-open tab assistant side panel open when opened directly', async () => {
    const sidePanel = createSidePanel();
    const controller = new TabAssistantSidePanelController('tabs/tab-assistant.html');

    await controller.toggle(sidePanel, 7);
    vi.clearAllMocks();

    await expect(controller.open(sidePanel, 7)).resolves.toEqual({
      action: 'opened',
      tabId: 7,
    });

    expect(sidePanel.setOptions).toHaveBeenCalledWith({
      tabId: 7,
      path: 'tabs/tab-assistant.html',
      enabled: true,
    });
    expect(sidePanel.open).toHaveBeenCalledWith({ tabId: 7 });
    expect(sidePanel.close).not.toHaveBeenCalled();
    expect(controller.isOpen(7)).toBe(true);
  });

  it('falls back to disabling the tab side panel when close is unavailable', async () => {
    const sidePanel = createSidePanel();
    delete sidePanel.close;
    const controller = new TabAssistantSidePanelController('tabs/tab-assistant.html');

    await controller.toggle(sidePanel, 7);
    vi.clearAllMocks();

    await controller.toggle(sidePanel, 7);

    expect(sidePanel.setOptions).toHaveBeenCalledWith({
      tabId: 7,
      enabled: false,
    });
    expect(controller.isOpen(7)).toBe(false);
  });

  it('tracks opened state per tab', async () => {
    const sidePanel = createSidePanel();
    const controller = new TabAssistantSidePanelController('tabs/tab-assistant.html');

    await controller.toggle(sidePanel, 7);
    await controller.toggle(sidePanel, 8);
    vi.clearAllMocks();

    await controller.toggle(sidePanel, 7);

    expect(sidePanel.close).toHaveBeenCalledWith({ tabId: 7 });
    expect(controller.isOpen(7)).toBe(false);
    expect(controller.isOpen(8)).toBe(true);
  });

  it('clears tracked state when a tab is closed externally', async () => {
    const sidePanel = createSidePanel();
    const controller = new TabAssistantSidePanelController('tabs/tab-assistant.html');

    await controller.toggle(sidePanel, 7);
    controller.markClosed(7);
    vi.clearAllMocks();

    await controller.toggle(sidePanel, 7);

    expect(sidePanel.open).toHaveBeenCalledWith({ tabId: 7 });
  });
});
