export type TabAssistantLaunchIntentSource = 'selection';

export interface TabAssistantLaunchIntent {
  id: string;
  tabId: number;
  source: TabAssistantLaunchIntentSource;
  selectedText: string;
  pageTitle?: string;
  pageUrl?: string;
  createdAt: number;
  autoSend: boolean;
}

const INTENT_TTL_MS = 2 * 60 * 1000;

export const createSelectionLaunchIntent = ({
  tabId,
  selectedText,
  pageTitle,
  pageUrl,
}: {
  tabId: number;
  selectedText: string;
  pageTitle?: string;
  pageUrl?: string;
}): TabAssistantLaunchIntent => ({
  id: `selection_${tabId}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
  tabId,
  source: 'selection',
  selectedText: selectedText.trim(),
  pageTitle,
  pageUrl,
  createdAt: Date.now(),
  autoSend: true,
});

export const isLaunchIntentExpired = (
  intent: TabAssistantLaunchIntent,
  now = Date.now()
): boolean => now - intent.createdAt > INTENT_TTL_MS;
