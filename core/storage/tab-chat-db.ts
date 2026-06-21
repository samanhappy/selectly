import { v4 as uuidv4 } from '@lukeed/uuid';
import Dexie from 'dexie';
import type { Table } from 'dexie';

import { getTabSessionModel, normalizeTabSessionModel } from '../tab-context/session-model';
import type { TabChatSession, TabContextSnapshot, TabMessage } from '../tab-context/types';

export const TAB_CHAT_RETENTION_DAYS = 30;
const TAB_CHAT_RETENTION_MS = TAB_CHAT_RETENTION_DAYS * 24 * 60 * 60 * 1000;

class TabChatDB extends Dexie {
  sessions!: Table<TabChatSession, string>;

  private static instance: TabChatDB;

  static getInstance() {
    if (!TabChatDB.instance) {
      TabChatDB.instance = new TabChatDB();
    }
    return TabChatDB.instance;
  }

  private constructor() {
    super('selectly-tab-chat-db');

    this.version(1).stores({
      sessions: 'id, normalizedUrl, url, hostname, createdAt, updatedAt, expiresAt',
    });
  }

  private getExpiresAt(now = Date.now()) {
    return now + TAB_CHAT_RETENTION_MS;
  }

  async cleanupExpired(now = Date.now()) {
    await this.sessions.where('expiresAt').below(now).delete();
  }

  async getLatestByNormalizedUrl(normalizedUrl: string): Promise<TabChatSession | undefined> {
    await this.cleanupExpired();
    const sessions = await this.sessions.where('normalizedUrl').equals(normalizedUrl).toArray();
    return sessions.sort((a, b) => b.updatedAt - a.updatedAt)[0];
  }

  async listByNormalizedUrl(normalizedUrl: string): Promise<TabChatSession[]> {
    await this.cleanupExpired();
    const sessions = await this.sessions.where('normalizedUrl').equals(normalizedUrl).toArray();
    return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async createSession(context: TabContextSnapshot | null, model?: string): Promise<TabChatSession> {
    const now = Date.now();
    const session: TabChatSession = {
      id: uuidv4(),
      normalizedUrl: context?.normalizedUrl || '',
      url: context?.url || '',
      title: context?.title || 'Untitled',
      hostname: context?.hostname || '',
      createdAt: now,
      updatedAt: now,
      expiresAt: this.getExpiresAt(now),
      model: normalizeTabSessionModel(model),
      context,
      messages: [],
    };
    await this.sessions.add(session);
    return session;
  }

  async upsertContext(
    normalizedUrl: string,
    context: TabContextSnapshot | null,
    model?: string
  ): Promise<TabChatSession> {
    const existing = await this.getLatestByNormalizedUrl(normalizedUrl);
    const now = Date.now();
    if (!existing) {
      return this.createSession(context, model);
    }

    const sessionModel = getTabSessionModel(existing, model);
    const updates: Partial<TabChatSession> = {
      normalizedUrl,
      url: context?.url || existing.url,
      title: context?.title || existing.title,
      hostname: context?.hostname || existing.hostname,
      model: sessionModel,
      context,
      updatedAt: now,
      expiresAt: this.getExpiresAt(now),
    };
    await this.sessions.update(existing.id, updates);
    return { ...existing, ...updates };
  }

  async setSessionModel(sessionId: string, model: string) {
    const now = Date.now();
    await this.sessions.update(sessionId, {
      model: normalizeTabSessionModel(model),
      updatedAt: now,
      expiresAt: this.getExpiresAt(now),
    });
  }

  async updateContext(sessionId: string, context: TabContextSnapshot | null) {
    const now = Date.now();
    await this.sessions.update(sessionId, {
      context,
      updatedAt: now,
      expiresAt: this.getExpiresAt(now),
    });
  }

  async appendMessage(sessionId: string, message: Omit<TabMessage, 'id' | 'createdAt'>) {
    const session = await this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Tab chat session not found');
    }

    const now = Date.now();
    const nextMessage: TabMessage = {
      ...message,
      id: uuidv4(),
      createdAt: now,
    };
    const messages = [...session.messages, nextMessage];
    await this.sessions.update(sessionId, {
      messages,
      updatedAt: now,
      expiresAt: this.getExpiresAt(now),
    });
    return nextMessage;
  }

  async updateMessage(sessionId: string, messageId: string, updates: Partial<TabMessage>) {
    const session = await this.sessions.get(sessionId);
    if (!session) return;
    const now = Date.now();
    const messages = session.messages.map((message) =>
      message.id === messageId ? { ...message, ...updates } : message
    );
    await this.sessions.update(sessionId, {
      messages,
      updatedAt: now,
      expiresAt: this.getExpiresAt(now),
    });
  }

  async clearAll() {
    await this.sessions.clear();
  }
}

export const tabChatDB = TabChatDB.getInstance();
