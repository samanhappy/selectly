import type { TabChatSession } from './types';

export const tabChatSessionHasMessages = (session: Pick<TabChatSession, 'messages'>) =>
  session.messages.length > 0;

export const getVisibleTabChatHistorySessions = (
  sessions: TabChatSession[],
  currentSessionId?: string
) =>
  sessions
    .filter((session) => session.id === currentSessionId || tabChatSessionHasMessages(session))
    .sort((a, b) => b.updatedAt - a.updatedAt);

export const getTabChatHistoryTitle = (
  session: Pick<TabChatSession, 'messages'>,
  fallbackTitle: string
) => {
  const firstUserMessage = session.messages.find((message) => message.role === 'user');
  return firstUserMessage?.content.trim() || fallbackTitle;
};
