import {
  getDefaultGlobalActionPosition,
  isGlobalActionPosition,
  type GlobalActionPosition,
} from '../content/global-action-position';

export const GLOBAL_ACTION_POSITION_STORAGE_KEY = 'selectlyGlobalActionPosition';

export async function loadGlobalActionPosition(): Promise<GlobalActionPosition> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return getDefaultGlobalActionPosition();
  }

  const result = await chrome.storage.local.get(GLOBAL_ACTION_POSITION_STORAGE_KEY);
  const storedPosition = result[GLOBAL_ACTION_POSITION_STORAGE_KEY];

  return isGlobalActionPosition(storedPosition) ? storedPosition : getDefaultGlobalActionPosition();
}

export async function saveGlobalActionPosition(position: GlobalActionPosition): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return;
  }

  await chrome.storage.local.set({
    [GLOBAL_ACTION_POSITION_STORAGE_KEY]: position,
  });
}
