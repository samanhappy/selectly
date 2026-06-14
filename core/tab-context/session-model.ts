import type { TabChatSession, TabMessage } from './types';

export const CLOUD_DEFAULT_TAB_MODEL = 'cloud/default';

export const normalizeTabSessionModel = (model?: string) =>
  model?.trim() || CLOUD_DEFAULT_TAB_MODEL;

const getFirstMessageModel = (messages: TabMessage[] = []) =>
  messages.find((message) => message.model?.trim())?.model;

export const getTabSessionModel = (
  session: Pick<TabChatSession, 'model' | 'messages'> | null | undefined,
  fallbackModel?: string
) =>
  normalizeTabSessionModel(
    session?.model || getFirstMessageModel(session?.messages) || fallbackModel
  );
