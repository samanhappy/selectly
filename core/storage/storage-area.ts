import { createLogger } from '../../utils/logger';
import { isCloudEnabled } from '../config/feature-gates';

const LOCAL_MIGRATION_KEY = '__selectly_local_storage_v1';
const logger = createLogger('StorageArea');
let migration: Promise<void> | undefined;

export const getStorageNamespace = () => (isCloudEnabled() ? 'sync' : 'local');

/** Preserve existing encrypted settings without writing or deleting anything in sync storage. */
export async function getStorageArea(): Promise<chrome.storage.StorageArea> {
  if (isCloudEnabled()) return chrome.storage.sync;

  if (!migration) {
    migration = (async () => {
      const local = await chrome.storage.local.get();
      if (local[LOCAL_MIGRATION_KEY]) return;
      const previous = await chrome.storage.sync.get();
      const missing = Object.fromEntries(
        Object.entries(previous).filter(([key]) => !(key in local))
      );
      await chrome.storage.local.set({ ...missing, [LOCAL_MIGRATION_KEY]: true });
    })().catch((error) => {
      migration = undefined;
      logger.warn('Could not copy existing sync settings to local storage:', error);
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
