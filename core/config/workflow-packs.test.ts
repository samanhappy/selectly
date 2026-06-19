import { describe, expect, it } from 'vitest';

import { getDefaultConfig } from './llm-config';
import {
  createWorkflowFunctionKey,
  getWorkflowPackInstallState,
  installWorkflowPack,
  WORKFLOW_PACKS,
} from './workflow-packs';

describe('workflow packs', () => {
  it('ships the developer, research, and marketing/PM packs', () => {
    expect(WORKFLOW_PACKS.map((pack) => pack.id)).toEqual([
      'developer',
      'research',
      'marketing-pm',
    ]);
    expect(WORKFLOW_PACKS.every((pack) => pack.actions.length >= 4)).toBe(true);
  });

  it('installs all pack actions for subscribed users with stable custom action keys', async () => {
    const config = await getDefaultConfig();
    const pack = WORKFLOW_PACKS[0];

    const result = installWorkflowPack(config, pack, { isSubscribed: true });
    const firstActionKey = createWorkflowFunctionKey(pack.id, pack.actions[0].id);

    expect(result.installedCount).toBe(pack.actions.length);
    expect(result.blockedCount).toBe(0);
    expect(result.nextConfig.functions[firstActionKey]).toMatchObject({
      title: pack.actions[0].title.en,
      icon: pack.actions[0].icon,
      isBuiltIn: false,
      requiresAI: true,
      model: 'default',
    });
    expect(result.nextConfig.functionOrder?.slice(-pack.actions.length)).toEqual(
      pack.actions.map((action) => createWorkflowFunctionKey(pack.id, action.id))
    );
  });

  it('uses localized action titles when installing with a locale', async () => {
    const config = await getDefaultConfig();
    const pack = WORKFLOW_PACKS[2];

    const result = installWorkflowPack(config, pack, { isSubscribed: true, locale: 'zh' });
    const firstActionKey = createWorkflowFunctionKey(pack.id, pack.actions[0].id);

    expect(result.nextConfig.functions[firstActionKey].title).toBe(pack.actions[0].title.zh);
    expect(result.nextConfig.functions[firstActionKey].description).toBe(
      pack.actions[0].description.zh
    );
  });

  it('installs only the free remaining slots when a free user installs a pack', async () => {
    const config = await getDefaultConfig();
    const pack = WORKFLOW_PACKS[0];

    const result = installWorkflowPack(config, pack, { isSubscribed: false });

    expect(result.installedCount).toBe(3);
    expect(result.blockedCount).toBe(pack.actions.length - 3);
    expect(getWorkflowPackInstallState(result.nextConfig.functions, pack)).toEqual({
      installedCount: 3,
      totalCount: pack.actions.length,
      isComplete: false,
    });
  });

  it('does not duplicate already installed pack actions', async () => {
    const config = await getDefaultConfig();
    const pack = WORKFLOW_PACKS[1];

    const firstInstall = installWorkflowPack(config, pack, { isSubscribed: true });
    const secondInstall = installWorkflowPack(firstInstall.nextConfig, pack, {
      isSubscribed: true,
    });

    expect(secondInstall.installedCount).toBe(0);
    expect(secondInstall.skippedCount).toBe(pack.actions.length);
    expect(secondInstall.nextConfig.functionOrder).toEqual(firstInstall.nextConfig.functionOrder);
  });
});
