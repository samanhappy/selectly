import { createLogger } from '../../utils/logger';
import { isCloudEnabled } from '../config/feature-gates';

const LOCAL_MIGRATION_KEY = '__selectly_local_storage_v1';
const MIGRATION_ACTION = 'storage:ensureLocalMigration';
const logger = createLogger('StorageArea');
// Each context awaits readiness; only the background coordinator performs migration writes.
let migration: Promise<void> | undefined;
let isCoordinator = false;

export const getStorageNamespace = () => (isCloudEnabled() ? 'sync' : 'local');

/** Create the background router handler before services access storage. */
export function createStorageMigrationCoordinator() {
  isCoordinator = true;
  return (request: unknown, sendResponse: (response: { success: boolean }) => void): boolean => {
    if ((request as { action?: unknown })?.action !== MIGRATION_ACTION) return false;
    getStorageArea().then(
      () => sendResponse({ success: true }),
      () => sendResponse({ success: false })
    );
    return true;
  };
}

async function migrateLocalStorage(): Promise<void> {
  const local = await chrome.storage.local.get();
  if (local[LOCAL_MIGRATION_KEY]) return;
  const previous = await chrome.storage.sync.get();
  const missing = Object.fromEntries(Object.entries(previous).filter(([key]) => !(key in local)));
  await chrome.storage.local.set({ ...missing, [LOCAL_MIGRATION_KEY]: true });
}

async function requestMigration(): Promise<void> {
  const response = await chrome.runtime.sendMessage({ action: MIGRATION_ACTION });
  if (!response?.success) throw new Error('Local storage migration is not ready');
}

/** Preserve encrypted settings; never write to sync while migrating to local storage. */
export async function getStorageArea(): Promise<chrome.storage.StorageArea> {
  if (isCloudEnabled()) return chrome.storage.sync;

  if (!migration) {
    migration = (isCoordinator ? migrateLocalStorage() : requestMigration()).catch((error) => {
      migration = undefined;
      logger.warn('Could not copy existing sync settings to local storage:', error);
      throw error;
    });
  }
  await migration;
  return chrome.storage.local;
}

export async function clearStorageArea(): Promise<void> {
  const area = await getStorageArea();
  await area.clear();
  // A deliberate local reset must not re-import the old synced copy on the next launch.
  if (!isCloudEnabled()) await area.set({ [LOCAL_MIGRATION_KEY]: true });
}
