import type { ActiveTabInfo } from '../services/tab-context-service';
import type { TabChatSession } from './types';
import { normalizePageUrl } from './url';

export const mergeActiveTabInfo = (
  incoming: ActiveTabInfo,
  previous?: ActiveTabInfo | null
): ActiveTabInfo => ({
  id: incoming.id,
  title: incoming.title || (previous?.id === incoming.id ? previous.title : undefined),
  url: incoming.url || (previous?.id === incoming.id ? previous.url : undefined),
  windowId: incoming.windowId ?? (previous?.id === incoming.id ? previous.windowId : undefined),
});

export const shouldCaptureTabUpdate = (changeInfo: chrome.tabs.TabChangeInfo) =>
  changeInfo.status === 'complete';

export const getNormalizedTabUrl = (tab: ActiveTabInfo, currentSession?: TabChatSession | null) => {
  const url = tab.url || currentSession?.url || '';
  return url ? normalizePageUrl(url) : '';
};

export const getCurrentSessionForTab = (
  tab: ActiveTabInfo,
  previousTab?: ActiveTabInfo | null,
  currentSession?: TabChatSession | null
) => (previousTab?.id === tab.id ? currentSession || null : null);

export const selectPreservedSession = ({
  normalizedUrl,
  currentSession,
  storedSession,
}: {
  normalizedUrl: string;
  currentSession?: TabChatSession | null;
  storedSession?: TabChatSession | null;
}) => {
  if (storedSession) return storedSession;
  if (!currentSession) return null;
  if (!normalizedUrl || currentSession.normalizedUrl === normalizedUrl) return currentSession;
  return null;
};
