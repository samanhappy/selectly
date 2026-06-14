export type TabContextSource = 'readability' | 'dom' | 'empty';

export interface TabContextBlock {
  id: string;
  order: number;
  text: string;
  charCount: number;
  heading?: string;
  frameUrl?: string;
}

export interface TabContextStats {
  totalChars: number;
  includedChars: number;
  blockCount: number;
  frameCount: number;
  skippedFrameCount: number;
  truncated: boolean;
  maxContextChars: number;
  maxContextTokens?: number;
  contextWindow?: number;
}

export interface TabContextSnapshot {
  id: string;
  url: string;
  normalizedUrl: string;
  title: string;
  hostname: string;
  language: string;
  capturedAt: number;
  extractorVersion: string;
  source: TabContextSource;
  text: string;
  blocks: TabContextBlock[];
  stats: TabContextStats;
  selectedText?: string;
}

export type TabMessageRole = 'user' | 'assistant';

export interface TabMessage {
  id: string;
  role: TabMessageRole;
  content: string;
  createdAt: number;
  model?: string;
  error?: boolean;
}

export interface TabChatSession {
  id: string;
  normalizedUrl: string;
  url: string;
  title: string;
  hostname: string;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  context: TabContextSnapshot | null;
  messages: TabMessage[];
}

export interface ModelMetadataOverride {
  contextWindow?: number;
}

export interface ModelContextBudget {
  maxContextChars: number;
  maxContextTokens?: number;
  maxHistoryTokens?: number;
  maxOutputTokens?: number;
}
