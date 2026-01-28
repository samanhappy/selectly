import { authService } from './core/auth/auth-service';
import { DEFAULT_CONFIG, getDefaultConfig } from './core/config/llm-config';
import { i18n } from './core/i18n';
import { collectService } from './core/services/collect-service';
import { collectSyncService } from './core/services/collect-sync-service';
import { highlightService } from './core/services/highlight-service';
import { highlightSyncService } from './core/services/highlight-sync-service';
import SubscriptionServiceV2 from './core/services/subscription-service-v2';
import { collectDB } from './core/storage/collect-db';
import { dictionaryDB } from './core/storage/dictionary-db';
import { StorageMigration } from './core/storage/migration';
import { secureStorage } from './core/storage/secure-storage';

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

    console.log('Selectly extension installed successfully!');
  } else if (details.reason === 'update') {
    // Migrate databases from old schema to UUID-based schema on update
    try {
      await collectDB.migrateFromOldDatabase();
      await dictionaryDB.migrateFromOldDatabase();
      console.log('Database migration to UUID completed after update');
    } catch (error) {
      console.warn('Database migration failed:', error);
    }
  }
});

// Run migration on startup to handle existing users
chrome.runtime.onStartup.addListener(async () => {
  console.log('Selectly extension starting up...');
  await StorageMigration.migrateIfNeeded();

  // Migrate databases from old schema to UUID-based schema
  try {
    await collectDB.migrateFromOldDatabase();
    await dictionaryDB.migrateFromOldDatabase();
    console.log('Database migration to UUID completed');
  } catch (error) {
    console.warn('Database migration failed:', error);
  }

  const subscriptionService = SubscriptionServiceV2.getInstance();
  await subscriptionService.initialize();
  subscriptionService.enableAutoRefresh();
  await subscriptionService.refreshOnceAtStartup();

  // Initialize and start collect sync service
  try {
    await collectSyncService.initialize();
    collectSyncService.startPeriodicSync();
    console.log('Collect sync service started');
  } catch (error) {
    console.warn('Collect sync service initialization failed:', error);
  }

  // Initialize and start highlight sync service
  try {
    await highlightSyncService.initialize();
    highlightSyncService.startPeriodicSync();
    console.log('Highlight sync service started');
  } catch (error) {
    console.warn('Highlight sync service initialization failed:', error);
  }
});

// Also run migration when extension is enabled/reloaded
(async () => {
  console.log('Selectly extension loaded...');
  await StorageMigration.migrateIfNeeded();

  // Initialize auth service once at startup to avoid repeated init calls from polling UIs
  try {
    await authService.initialize();
  } catch (e) {
    // Non-fatal; continue startup
    console.warn('Auth service init at startup failed (non-fatal):', e);
  }
  // In case onStartup is not triggered in some scenarios, ensure single startup refresh guarded internally
  const subscriptionService = SubscriptionServiceV2.getInstance();
  await subscriptionService.initialize();
  subscriptionService.enableAutoRefresh();
  await subscriptionService.refreshOnceAtStartup();

  // Initialize and start collect sync service
  try {
    await collectSyncService.initialize();
    collectSyncService.startPeriodicSync();
    console.log('Collect sync service started on load');
  } catch (error) {
    console.warn('Collect sync service initialization failed on load:', error);
  }

  // Initialize and start highlight sync service
  try {
    await highlightSyncService.initialize();
    highlightSyncService.startPeriodicSync();
    console.log('Highlight sync service started on load');
  } catch (error) {
    console.warn('Highlight sync service initialization failed on load:', error);
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
          console.log('Background: Received authentication request');
          await authService.initialize();
          await authService.signIn();
          console.log('Background: Authentication completed successfully');
          sendResponse({ success: true });
        } catch (error) {
          console.error('Background: Authentication failed:', error);
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
          console.log('Background: Received sign out request');
          await authService.signOut();
          console.log('Background: Sign out completed successfully');
          sendResponse({ success: true });
        } catch (error) {
          console.error('Background: Sign out failed:', error);
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
          console.error('Background: Failed to get auth state:', error);
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
          console.error('Failed to save collect item:', err);
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
          console.error('Failed to save highlight:', err);
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
          console.error('Failed to load highlights:', err);
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
          console.error('Failed to delete highlight:', err);
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
          await dictionaryDB.addItem({
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
          console.error('Failed to save dictionary entry:', err);
          sendResponse({
            success: false,
            error: err?.message || 'Unknown error',
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
          console.error('Failed to get config:', error);
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
