import { afterEach, describe, expect, it, vi } from 'vitest';

import { getDefaultGlobalActionPosition } from '../content/global-action-position';
import {
  GLOBAL_ACTION_POSITION_STORAGE_KEY,
  loadGlobalActionPosition,
  saveGlobalActionPosition,
} from './global-action-position-storage';

describe('global action position storage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('falls back to the default position when local storage is unavailable', async () => {
    vi.stubGlobal('chrome', { storage: {} });

    await expect(loadGlobalActionPosition()).resolves.toEqual(getDefaultGlobalActionPosition());
  });

  it('loads valid positions from local storage', async () => {
    const storedPosition = { xRatio: 0.25, yRatio: 0.75 };
    const get = vi.fn().mockResolvedValue({
      [GLOBAL_ACTION_POSITION_STORAGE_KEY]: storedPosition,
    });
    vi.stubGlobal('chrome', {
      storage: {
        local: { get },
      },
    });

    await expect(loadGlobalActionPosition()).resolves.toEqual(storedPosition);
    expect(get).toHaveBeenCalledWith(GLOBAL_ACTION_POSITION_STORAGE_KEY);
  });

  it('rejects invalid stored positions', async () => {
    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get: vi.fn().mockResolvedValue({
            [GLOBAL_ACTION_POSITION_STORAGE_KEY]: { xRatio: 2, yRatio: 0.5 },
          }),
        },
      },
    });

    await expect(loadGlobalActionPosition()).resolves.toEqual(getDefaultGlobalActionPosition());
  });

  it('saves positions to local storage', async () => {
    const set = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('chrome', {
      storage: {
        local: { set },
      },
    });

    await saveGlobalActionPosition({ xRatio: 0.2, yRatio: 0.4 });

    expect(set).toHaveBeenCalledWith({
      [GLOBAL_ACTION_POSITION_STORAGE_KEY]: { xRatio: 0.2, yRatio: 0.4 },
    });
  });
});
