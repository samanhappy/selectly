import { authService } from './core/auth/auth-service';
import { DEFAULT_CONFIG, getDefaultConfig } from './core/config/llm-config';
import { i18n } from './core/i18n';
import { collectService } from './core/services/collect-service';
import { collectSyncService } from './core/services/collect-sync-service';
import { dictionaryService } from './core/services/dictionary-service';
import { dictionarySyncService } from './core/services/dictionary-sync-service';
import { highlightService } from './core/services/highlight-service';
import { highlightSyncService } from './core/services/highlight-sync-service';
import { readingProgressService } from './core/services/reading-progress-service';
import SubscriptionServiceV2 from './core/services/subscription-service-v2';
import { collectDB } from './core/storage/collect-db';
import { dictionaryDB } from './core/storage/dictionary-db';
import { StorageMigration } from './core/storage/migration';
import { secureStorage } from './core/storage/secure-storage';
import {
  createTabSelectionContext,
  isSelectionContextFresh,
  mergeSelectedTextIntoSnapshot,
  type TabSelectionContext,
} from './core/tab-context/selection-context';
import {
  TabAssistantSidePanelController,
  type TabAssistantSidePanelApi,
} from './core/tab-context/side-panel-toggle';
import { createLogger } from './utils/logger';

const logger = createLogger('Background');
const TAB_ASSISTANT_SIDE_PANEL_PATH = 'tabs/tab-assistant.html';
const tabAssistantSidePanelController = new TabAssistantSidePanelController(
  TAB_ASSISTANT_SIDE_PANEL_PATH
);
const pendingTabSelections = new Map<number, TabSelectionContext>();

type TabAssistantSidePanelEvents = TabAssistantSidePanelApi & {
  onOpened?: {
    addListener(callback: (info: { tabId?: number; path: string }) => void): void;
  };
  onClosed?: {
    addListener(callback: (info: { tabId?: number; path: string }) => void): void;
  };
};

const getTabAssistantSidePanel = (): TabAssistantSidePanelEvents | null =>
  (chrome.sidePanel as unknown as TabAssistantSidePanelEvents | undefined) ?? null;

const enableTabAssistantSidePanel = (tabId: number) => {
  const sidePanel = getTabAssistantSidePanel();
  if (!sidePanel?.setOptions) {
    return Promise.reject(new Error('Side panel options are not available in this browser'));
  }
  return tabAssistantSidePanelController.prepare(sidePanel, tabId);
};

const savePendingTabSelection = (tabId: number, selectedText: unknown) => {
  const selection = createTabSelectionContext(tabId, selectedText);
  if (!selection) return null;

  pendingTabSelections.set(tabId, selection);
  return selection;
};

const getPendingTabSelection = (tabId: number): TabSelectionContext | null => {
  const selection = pendingTabSelections.get(tabId);
  if (!selection) return null;

  if (!isSelectionContextFresh(selection)) {
    pendingTabSelections.delete(tabId);
    return null;
  }

  return selection;
};

const broadcastPendingTabSelection = async (selection: TabSelectionContext) => {
  try {
    await chrome.runtime.sendMessage({
      action: 'tabContext:selectedTextUpdated',
      selection,
    });
  } catch {
    // The side panel may not be mounted yet; it will consume the pending selection on capture.
  }
};

// Initialize extension on installation
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Initialize internationalization
    await i18n.initialize();

    // Set default configuration
    const defaultConfig = await getDefaultConfig();
    await secureStorage.set({
      userConfig: defaultConfig,
    });

    // On install, also initialize subscription cache and perform one check
    const subscriptionService = SubscriptionServiceV2.getInstance();
    await subscriptionService.initialize();
    subscriptionService.enableAutoRefresh();
    await subscriptionService.refreshOnceAtStartup();

    logger.info('Extension installed successfully');
  } else if (details.reason === 'update') {
    // Migrate databases from old schema to UUID-based schema on update
    try {
      await collectDB.migrateFromOldDatabase();
      await dictionaryDB.migrateFromOldDatabase();
      logger.info('Database migration to UUID completed after update');
    } catch (error) {
      logger.warn('Database migration failed:', error);
    }
  }
});

// Run migration on startup to handle existing users
chrome.runtime.onStartup.addListener(async () => {
  logger.info('Extension starting up');
  await StorageMigration.migrateIfNeeded();

  // Migrate databases from old schema to UUID-based schema
  try {
    await collectDB.migrateFromOldDatabase();
    await dictionaryDB.migrateFromOldDatabase();
    logger.info('Database migration to UUID completed');
  } catch (error) {
    logger.warn('Database migration failed:', error);
  }

  const subscriptionService = SubscriptionServiceV2.getInstance();
  await subscriptionService.initialize();
  subscriptionService.enableAutoRefresh();
  await subscriptionService.refreshOnceAtStartup();

  // Initialize and trigger collect sync once
  try {
    await collectSyncService.initialize();
    void collectSyncService.sync();
    logger.info('Collect sync service initialized and sync triggered');
  } catch (error) {
    logger.warn('Collect sync service initialization failed:', error);
  }

  // Initialize and trigger highlight sync once
  try {
    await highlightSyncService.initialize();
    void highlightSyncService.sync();
    logger.info('Highlight sync service initialized and sync triggered');
  } catch (error) {
    logger.warn('Highlight sync service initialization failed:', error);
  }

  // Initialize and trigger dictionary sync once
  try {
    await dictionarySyncService.initialize();
    void dictionarySyncService.sync();
    logger.info('Dictionary sync service initialized and sync triggered');
  } catch (error) {
    logger.warn('Dictionary sync service initialization failed:', error);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabAssistantSidePanelController.markClosed(tabId);
  pendingTabSelections.delete(tabId);
});

const sidePanelEvents = getTabAssistantSidePanel();
sidePanelEvents?.onOpened?.addListener((info) => {
  if (info.path === TAB_ASSISTANT_SIDE_PANEL_PATH && info.tabId != null) {
    tabAssistantSidePanelController.markOpened(info.tabId);
  }
});
sidePanelEvents?.onClosed?.addListener((info) => {
  if (info.path === TAB_ASSISTANT_SIDE_PANEL_PATH && info.tabId != null) {
    tabAssistantSidePanelController.markClosed(info.tabId);
  }
});

// Also run migration when extension is enabled/reloaded
(async () => {
  logger.info('Extension loaded');
  await StorageMigration.migrateIfNeeded();

  // Initialize auth service once at startup to avoid repeated init calls from polling UIs
  try {
    await authService.initialize();
  } catch (e) {
    // Non-fatal; continue startup
    logger.warn('Auth service init at startup failed (non-fatal):', e);
  }
  // In case onStartup is not triggered in some scenarios, ensure single startup refresh guarded internally
  const subscriptionService = SubscriptionServiceV2.getInstance();
  await subscriptionService.initialize();
  subscriptionService.enableAutoRefresh();
  await subscriptionService.refreshOnceAtStartup();

  // Initialize and trigger collect sync once
  try {
    await collectSyncService.initialize();
    void collectSyncService.sync();
    logger.info('Collect sync service initialized and sync triggered on load');
  } catch (error) {
    logger.warn('Collect sync service initialization failed on load:', error);
  }

  // Initialize and trigger highlight sync once
  try {
    await highlightSyncService.initialize();
    void highlightSyncService.sync();
    logger.info('Highlight sync service initialized and sync triggered on load');
  } catch (error) {
    logger.warn('Highlight sync service initialization failed on load:', error);
  }

  // Initialize and trigger dictionary sync once
  try {
    await dictionarySyncService.initialize();
    void dictionarySyncService.sync();
    logger.info('Dictionary sync service initialized and sync triggered on load');
  } catch (error) {
    logger.warn('Dictionary sync service initialization failed on load:', error);
  }
})();

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const resolvedAction =
    typeof request === 'string'
      ? request
      : request?.action?.type || request?.action || request?.type || request?.event;

  switch (resolvedAction) {
    case 'authenticate': {
      // Handle authentication request from popup
      (async () => {
        try {
          logger.info('Received authentication request');
          await authService.initialize();
          await authService.signIn();
          logger.info('Authentication completed successfully');
          sendResponse({ success: true });
        } catch (error) {
          logger.error('Authentication failed:', error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Authentication failed',
          });
        }
      })();
      return true; // Keep message channel open for async response
    }

    case 'signOut': {
      // Handle sign out request from popup
      (async () => {
        try {
          logger.info('Received sign out request');
          await authService.signOut();
          logger.info('Sign out completed successfully');
          sendResponse({ success: true });
        } catch (error) {
          logger.error('Sign out failed:', error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Sign out failed',
          });
        }
      })();
      return true; // Keep message channel open for async response
    }

    case 'getAuthState': {
      // Handle auth state request from popup
      (async () => {
        try {
          await authService.initialize();
          const state = authService.getState();
          sendResponse({
            success: true,
            authState: {
              isAuthenticated: state.isAuthenticated,
              loading: state.loading,
              error: state.error,
              user: state.user,
            },
          });
        } catch (error) {
          logger.error('Failed to get auth state:', error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get auth state',
          });
        }
      })();
      return true; // Keep message channel open for async response
    }

    case 'collectItem': {
      // Persist a collected item from content script in the extension's origin
      // so that options page (extension context) can see the same IndexedDB
      const payload = request.payload as {
        text: string;
        url: string;
        title: string;
        hostname: string;
        createdAt: number;
      };
      (async () => {
        try {
          if (!payload || !payload.text?.trim()) {
            sendResponse({ success: false, error: 'Empty payload' });
            return;
          }
          await collectService.addItem({
            text: payload.text.trim(),
            url: payload.url,
            title: payload.title,
            hostname: payload.hostname,
          });
          sendResponse({ success: true });
        } catch (err: any) {
          logger.error('Failed to save collect item:', err);
          sendResponse({
            success: false,
            error: err?.message || 'Unknown error',
          });
        }
      })();
      return true; // Keep message channel open for async response
    }
    case 'addHighlight': {
      const payload = request.payload as {
        text: string;
        url: string;
        title: string;
        hostname: string;
        anchor: {
          startXPath: string;
          startOffset: number;
          endXPath: string;
          endOffset: number;
          text: string;
          prefix?: string;
          suffix?: string;
        };
        createdAt?: number;
      };
      (async () => {
        try {
          if (!payload || !payload.text?.trim()) {
            sendResponse({ success: false, error: 'Empty payload' });
            return;
          }
          const id = await highlightService.addItem({
            text: payload.text.trim(),
            url: payload.url,
            title: payload.title,
            hostname: payload.hostname,
            anchor: payload.anchor,
            created_at: payload.createdAt || Date.now(),
          } as any);
          sendResponse({ success: true, id });
        } catch (err: any) {
          logger.error('Failed to save highlight:', err);
          sendResponse({ success: false, error: err?.message || 'Unknown error' });
        }
      })();
      return true;
    }
    case 'getHighlightsForUrl': {
      (async () => {
        try {
          const url = request.url as string;
          if (!url) {
            sendResponse({ success: false, error: 'Missing url' });
            return;
          }
          // const items = await highlightService.getItemsByUrlWithOthers(url);
          const items = await highlightService.getItemsByUrl(url);
          sendResponse({ success: true, items });
        } catch (err: any) {
          logger.error('Failed to load highlights:', err);
          sendResponse({ success: false, error: err?.message || 'Unknown error', items: [] });
        }
      })();
      return true;
    }
    case 'deleteHighlight': {
      (async () => {
        try {
          const id = request.id as string;
          if (!id) {
            sendResponse({ success: false, error: 'Missing id' });
            return;
          }
          await highlightService.deleteItem(id);
          sendResponse({ success: true });
        } catch (err: any) {
          logger.error('Failed to delete highlight:', err);
          sendResponse({ success: false, error: err?.message || 'Unknown error' });
        }
      })();
      return true;
    }
    case 'addDictionaryEntry': {
      const payload = request.payload as {
        source: string;
        translation: string;
        sentence?: string;
        url: string;
        title: string;
        hostname: string;
        createdAt: number;
      };
      (async () => {
        try {
          if (!payload || !payload.source?.trim() || !payload.translation?.trim()) {
            sendResponse({ success: false, error: 'Empty payload' });
            return;
          }
          await dictionaryService.addEntry({
            source: payload.source.trim(),
            translation: payload.translation.trim(),
            sentence: payload.sentence?.trim() || '',
            url: payload.url,
            title: payload.title,
            hostname: payload.hostname,
            createdAt: payload.createdAt || Date.now(),
          });
          sendResponse({ success: true });
        } catch (err: any) {
          logger.error('Failed to save dictionary entry:', err);
          sendResponse({
            success: false,
            error: err?.message || 'Unknown error',
          });
        }
      })();
      return true;
    }
    case 'readingProgress:get': {
      (async () => {
        try {
          const url = request.url as string;
          const maxAgeMs = request.maxAgeMs as number | undefined;
          if (!url) {
            sendResponse({ success: false, error: 'Missing url' });
            return;
          }
          const record = await readingProgressService.getProgress(url, maxAgeMs);
          sendResponse({ success: true, record });
        } catch (err: any) {
          logger.error('Failed to get reading progress:', err);
          sendResponse({ success: false, error: err?.message || 'Unknown error' });
        }
      })();
      return true;
    }
    case 'readingProgress:save': {
      (async () => {
        try {
          const url = request.url as string;
          const payload = request.record as any;
          const maxAgeMs = request.maxAgeMs as number | undefined;
          if (!url || !payload) {
            sendResponse({ success: false, error: 'Missing payload' });
            return;
          }
          await readingProgressService.saveProgress(
            url,
            payload,
            { local: true, sync: true },
            maxAgeMs
          );
          sendResponse({ success: true });
        } catch (err: any) {
          logger.error('Failed to save reading progress:', err);
          sendResponse({ success: false, error: err?.message || 'Unknown error' });
        }
      })();
      return true;
    }
    case 'readingProgress:delete': {
      (async () => {
        try {
          const url = request.url as string;
          if (!url) {
            sendResponse({ success: false, error: 'Missing url' });
            return;
          }
          await readingProgressService.deleteProgress(url, { local: true, sync: true });
          sendResponse({ success: true });
        } catch (err: any) {
          logger.error('Failed to delete reading progress:', err);
          sendResponse({ success: false, error: err?.message || 'Unknown error' });
        }
      })();
      return true;
    }
    case 'tabContext:openSidePanel':
    case 'tabContext:toggleSidePanel': {
      const tabId = sender.tab?.id;
      if (!tabId) {
        sendResponse({ success: false, error: 'Missing tab id' });
        return true;
      }

      const sidePanel = getTabAssistantSidePanel();
      if (!sidePanel?.open) {
        sendResponse({ success: false, error: 'Side panel is not available in this browser' });
        return true;
      }
      if (!sidePanel.setOptions) {
        sendResponse({
          success: false,
          error: 'Side panel options are not available in this browser',
        });
        return true;
      }

      const selection = savePendingTabSelection(tabId, request.selectedText);
      const sidePanelAction =
        request.action === 'tabContext:toggleSidePanel'
          ? tabAssistantSidePanelController.toggle(sidePanel, tabId)
          : tabAssistantSidePanelController.open(sidePanel, tabId);

      Promise.resolve(sidePanelAction)
        .then((result) => {
          if (selection) {
            void broadcastPendingTabSelection(selection);
          }
          sendResponse({ success: true, tabId, action: result.action });
        })
        .catch((err: any) => {
          logger.error('Failed to toggle side panel:', err);
          sendResponse({ success: false, error: err?.message || 'Failed to toggle side panel' });
        });
      return true;
    }
    case 'tabContext:prepareSidePanel': {
      (async () => {
        try {
          const tabId = sender.tab?.id;
          if (!tabId) {
            sendResponse({ success: false, error: 'Missing tab id' });
            return;
          }

          await enableTabAssistantSidePanel(tabId);
          sendResponse({ success: true, tabId });
        } catch (err: any) {
          logger.warn('Failed to prepare tab assistant side panel:', err);
          sendResponse({ success: false, error: err?.message || 'Failed to prepare side panel' });
        }
      })();
      return true;
    }
    case 'tabContext:getActiveTab': {
      (async () => {
        const lastSidePanelTabId = tabAssistantSidePanelController.getLastKnownTabId();
        try {
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          const tab = tabs[0];
          sendResponse({
            success: true,
            tab: tab
              ? {
                  id: tab.id,
                  title: tab.title,
                  url: tab.url,
                  windowId: tab.windowId,
                }
              : lastSidePanelTabId
                ? { id: lastSidePanelTabId }
                : null,
          });
        } catch (err: any) {
          logger.warn('Failed to get active tab:', err);
          sendResponse({
            success: false,
            error: err?.message || 'Failed to get active tab',
            tab: lastSidePanelTabId ? { id: lastSidePanelTabId } : null,
          });
        }
      })();
      return true;
    }
    case 'tabContext:getPendingSelection': {
      const tabId = request.tabId as number | undefined;
      if (!tabId) {
        sendResponse({ success: false, error: 'Missing tab id', selection: null });
        return true;
      }

      sendResponse({
        success: true,
        selection: getPendingTabSelection(tabId),
      });
      return true;
    }
    case 'tabContext:clearPendingSelection': {
      const tabId = request.tabId as number | undefined;
      if (!tabId) {
        sendResponse({ success: false, error: 'Missing tab id' });
        return true;
      }

      pendingTabSelections.delete(tabId);
      sendResponse({ success: true });
      return true;
    }
    case 'tabContext:capture': {
      (async () => {
        try {
          const tabId = request.tabId as number | undefined;
          if (!tabId) {
            sendResponse({ success: false, error: 'Missing tab id' });
            return;
          }

          const res = await chrome.tabs.sendMessage(
            tabId,
            {
              action: 'tabContext:capturePage',
              budget: request.budget,
            },
            { frameId: 0 }
          );
          const selection = getPendingTabSelection(tabId);
          sendResponse({
            ...res,
            snapshot:
              res?.success && res.snapshot
                ? mergeSelectedTextIntoSnapshot(res.snapshot, selection)
                : res?.snapshot,
          });
        } catch (err: any) {
          logger.warn('Failed to capture tab context:', err);
          sendResponse({
            success: false,
            error: err?.message || 'This page cannot be read',
          });
        }
      })();
      return true;
    }
    case 'open':
      chrome.tabs.create({ url: request.url });
      sendResponse({ success: true });
      break;

    case 'getConfig':
      secureStorage
        .get(['userConfig'])
        .then((result) => {
          sendResponse({
            userConfig: result.userConfig || DEFAULT_CONFIG,
          });
        })
        .catch((error) => {
          logger.error('Failed to get config:', error);
          sendResponse({
            userConfig: DEFAULT_CONFIG,
          });
        });
      return true; // Keep message channel open

    case 'showNotification':
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/icon.png',
        title: request.title || 'Selectly',
        message: request.message,
      });
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ error: 'Unknown action', action: resolvedAction });
  }
});

export {};
