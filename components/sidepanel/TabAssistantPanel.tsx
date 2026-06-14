import {
  BookmarkPlus,
  Copy,
  ExternalLink,
  Pin,
  PinOff,
  RefreshCw,
  Send,
  Settings,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ConfigManager, DEFAULT_CONFIG, type UserConfig } from '../../core/config/llm-config';
import { i18n } from '../../core/i18n';
import { collectService } from '../../core/services/collect-service';
import { LLMService } from '../../core/services/llm-service';
import { tabContextService, type ActiveTabInfo } from '../../core/services/tab-context-service';
import { tabChatDB } from '../../core/storage/tab-chat-db';
import { getContextBudget } from '../../core/tab-context/budget';
import { buildTabChatMessages } from '../../core/tab-context/prompt';
import type { TabChatSession, TabContextSnapshot, TabMessage } from '../../core/tab-context/types';
import { normalizePageUrl } from '../../core/tab-context/url';
import { MessageContent } from './MessageContent';

const configManager = ConfigManager.getInstance();
const llmService = LLMService.getInstance();

const format = (template: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce(
    (next, [key, value]) => next.replace(new RegExp(`{{${key}}}`, 'g'), String(value)),
    template
  );

const createUnavailableSnapshot = (tab: ActiveTabInfo | null): TabContextSnapshot => {
  const url = tab?.url || '';
  const normalizedUrl = url ? normalizePageUrl(url) : '';
  let hostname = '';
  try {
    hostname = url ? new URL(url).hostname : '';
  } catch {
    hostname = '';
  }

  return {
    id: `ctx_unavailable_${Date.now()}`,
    url,
    normalizedUrl,
    title: tab?.title || url || 'Current page',
    hostname,
    language: navigator.language || 'en',
    capturedAt: Date.now(),
    extractorVersion: 'tab-context-v1',
    source: 'empty',
    text: '',
    blocks: [],
    stats: {
      totalChars: 0,
      includedChars: 0,
      blockCount: 0,
      frameCount: 0,
      skippedFrameCount: 0,
      truncated: false,
      maxContextChars: getContextBudget({}).maxContextChars,
    },
  };
};

export const TabAssistantPanel = () => {
  const [config, setConfig] = useState<UserConfig>(DEFAULT_CONFIG);
  const [t, setT] = useState(i18n.getConfig());
  const [activeTab, setActiveTab] = useState<ActiveTabInfo | null>(null);
  const [session, setSession] = useState<TabChatSession | null>(null);
  const [context, setContext] = useState<TabContextSnapshot | null>(null);
  const [messages, setMessages] = useState<TabMessage[]>([]);
  const [input, setInput] = useState('');
  const [loadingContext, setLoadingContext] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const [pinned, setPinned] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle');
  const contentRef = useRef<HTMLDivElement | null>(null);

  const labels = t.tabAssistant;
  const isConfigured = llmService.isConfigured();
  const modelLabel = config.llm.defaultModel?.split('/').pop() || 'default';

  const quickPrompts = useMemo(
    () => [
      labels.summarizePage,
      labels.extractKeyPoints,
      labels.listActionItems,
      labels.translatePage,
    ],
    [labels]
  );

  const loadTab = useCallback(async (tab: ActiveTabInfo | null) => {
    if (!tab?.id) return;
    setActiveTab(tab);
    setLoadingContext(true);
    setError('');

    const captured = await tabContextService.capture(tab.id);
    const snapshot = captured || createUnavailableSnapshot(tab);
    const normalizedUrl = snapshot.normalizedUrl || normalizePageUrl(tab.url || '');
    const nextSession = await tabChatDB.upsertContext(normalizedUrl, snapshot);

    setContext(snapshot);
    setSession(nextSession);
    setMessages(nextSession.messages || []);
    setLoadingContext(false);
  }, []);

  const refreshActiveTab = useCallback(async () => {
    const tab = activeTab?.id ? activeTab : await tabContextService.getActiveTab();
    await loadTab(tab);
  }, [activeTab, loadTab]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      await i18n.initialize();
      if (!mounted) return;
      setT(i18n.getConfig());
      const userConfig = await configManager.loadConfig();
      if (!mounted) return;
      setConfig(userConfig);
      await llmService.configure(userConfig.llm);
      const tab = await tabContextService.getActiveTab();
      if (!mounted) return;
      await loadTab(tab);
    };
    init().catch((err) => {
      setError(err?.message || labels.error);
      setLoadingContext(false);
    });

    return () => {
      mounted = false;
    };
  }, [labels.error, loadTab]);

  useEffect(() => {
    const element = contentRef.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [messages, streaming]);

  useEffect(() => {
    const handleActivated = async (activeInfo: chrome.tabs.TabActiveInfo) => {
      if (pinned) return;
      await loadTab({ id: activeInfo.tabId, windowId: activeInfo.windowId });
    };
    const handleUpdated = async (
      tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
      tab: chrome.tabs.Tab
    ) => {
      if (pinned || tabId !== activeTab?.id) return;
      if (changeInfo.url || changeInfo.title || changeInfo.status === 'complete') {
        await loadTab({ id: tabId, title: tab.title, url: tab.url, windowId: tab.windowId });
      }
    };

    chrome.tabs?.onActivated?.addListener(handleActivated);
    chrome.tabs?.onUpdated?.addListener(handleUpdated);
    return () => {
      chrome.tabs?.onActivated?.removeListener(handleActivated);
      chrome.tabs?.onUpdated?.removeListener(handleUpdated);
    };
  }, [activeTab?.id, loadTab, pinned]);

  const sendMessage = async (message: string) => {
    const text = message.trim();
    if (!text || streaming || !session) return;
    if (!isConfigured) {
      setError(labels.configureModel);
      return;
    }

    setInput('');
    setError('');
    setStreaming(true);
    const previousMessages = [...messages];
    const userMessage = await tabChatDB.appendMessage(session.id, {
      role: 'user',
      content: text,
    });
    const assistantMessage: TabMessage = {
      id: `stream_${Date.now()}`,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
    };
    setMessages([...previousMessages, userMessage, assistantMessage]);

    let assistantContent = '';
    try {
      const budget = await tabContextService.getContextBudget();
      const requestMessages = buildTabChatMessages({
        snapshot: context?.source === 'empty' ? null : context,
        history: previousMessages,
        userMessage: text,
        uiLanguage: config.general.language,
        maxHistoryMessages: 8,
      });

      await llmService.chatStream(
        requestMessages.map((item) => ({
          role: item.role as 'system' | 'user' | 'assistant',
          content: String(item.content || ''),
        })),
        (chunk, model) => {
          assistantContent += chunk;
          setMessages((current) =>
            current.map((item) =>
              item.id === assistantMessage.id
                ? { ...item, content: assistantContent, model: model || item.model }
                : item
            )
          );
        },
        config.llm.defaultModel,
        config.llm.defaultModelSettings?.thinkingMode,
        true,
        { maxTokens: budget.maxOutputTokens }
      );

      const savedAssistant = await tabChatDB.appendMessage(session.id, {
        role: 'assistant',
        content: assistantContent,
        model: config.llm.defaultModel,
      });
      setMessages((current) =>
        current.map((item) => (item.id === assistantMessage.id ? savedAssistant : item))
      );
    } catch (err: any) {
      const errorText = err?.message || labels.error;
      setError(errorText);
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantMessage.id ? { ...item, content: errorText, error: true } : item
        )
      );
    } finally {
      setStreaming(false);
    }
  };

  const copyMessage = async (content: string) => {
    await navigator.clipboard.writeText(content);
  };

  const saveMessageToCollections = async (content: string) => {
    if (!content.trim()) return;
    await collectService.addItem({
      text: content.trim(),
      url: context?.url || activeTab?.url || '',
      title: context?.title || activeTab?.title || labels.noPageTitle,
      hostname: context?.hostname || '',
      type: 'page_summary',
      source: 'tab_context',
      conversation_id: session?.id,
    });
    setSaveState('saved');
    window.setTimeout(() => setSaveState('idle'), 1500);
  };

  const openSettings = () => chrome.runtime.openOptionsPage();

  const statusText = loadingContext
    ? labels.loadingContext
    : !context || context.source === 'empty'
      ? labels.noPageContext
      : context.stats.truncated
        ? labels.contextTruncated
        : labels.contextReady;

  const contextMeta =
    context && context.source !== 'empty'
      ? [
          format(labels.contextStats, {
            chars: context.stats.includedChars.toLocaleString(),
            blocks: context.stats.blockCount,
          }),
          context.stats.skippedFrameCount
            ? format(labels.skippedFrames, { count: context.stats.skippedFrameCount })
            : '',
        ]
          .filter(Boolean)
          .join(' · ')
      : labels.ordinaryChat;

  return (
    <div className="selectly-popup flex h-screen min-h-0 flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] font-medium uppercase text-slate-500">
              {context?.source === 'empty' ? labels.noPageContext : labels.sharing}
            </div>
            <h1 className="truncate text-sm font-semibold">
              {context?.title || activeTab?.title || labels.noPageTitle}
            </h1>
            <div className="truncate text-xs text-slate-500">
              {context?.url || activeTab?.url || statusText}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              className="sl-btn sl-btn-ghost !h-8 !w-8 !p-0"
              title={labels.refresh}
              aria-label={labels.refresh}
              onClick={refreshActiveTab}
            >
              <RefreshCw size={14} className={loadingContext ? 'animate-spin' : ''} />
            </button>
            <button
              className="sl-btn sl-btn-ghost !h-8 !w-8 !p-0"
              title={pinned ? labels.unpin : labels.pin}
              aria-label={pinned ? labels.unpin : labels.pin}
              onClick={() => setPinned((value) => !value)}
            >
              {pinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
          <span className="truncate">{contextMeta}</span>
          <span className="shrink-0">
            {labels.model}: {modelLabel}
          </span>
        </div>
      </header>

      <main ref={contentRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {messages.length === 0 && (
          <div className="mb-3 grid grid-cols-2 gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium text-slate-700 hover:border-blue-200 hover:bg-blue-50"
                onClick={() => sendMessage(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`group min-w-0 max-w-[92%] overflow-hidden rounded-lg border px-3 py-2 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'border-blue-200 bg-blue-50 text-slate-900'
                    : message.error
                      ? 'border-red-200 bg-red-50 text-red-900'
                      : 'border-slate-200 bg-white text-slate-800'
                }`}
              >
                <MessageContent content={message.content || (streaming ? '...' : '')} />
                {message.role === 'assistant' && message.content && !streaming && (
                  <div className="mt-2 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      className="sl-btn sl-btn-ghost !h-7 !w-7 !p-0"
                      title={labels.copy}
                      aria-label={labels.copy}
                      onClick={() => copyMessage(message.content)}
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      className="sl-btn sl-btn-ghost !h-7 !w-7 !p-0"
                      title={labels.saveToCollections}
                      aria-label={labels.saveToCollections}
                      onClick={() => saveMessageToCollections(message.content)}
                    >
                      <BookmarkPlus size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {error && (
        <div className="border-t border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
      {saveState === 'saved' && (
        <div className="border-t border-green-100 bg-green-50 px-3 py-2 text-xs text-green-700">
          {labels.saved}
        </div>
      )}

      <footer className="border-t border-slate-200 bg-white p-3">
        {!isConfigured && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <span>{labels.configureModel}</span>
            <button className="sl-btn sl-btn-secondary !px-2 !py-1 text-xs" onClick={openSettings}>
              <Settings size={13} /> {labels.openSettings}
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            className="sl-textarea max-h-32 min-h-[44px] flex-1 resize-none !py-2"
            value={input}
            disabled={streaming}
            placeholder={labels.placeholder}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage(input);
              }
            }}
          />
          <button
            className="sl-btn sl-btn-primary !h-11 !w-11 !p-0"
            disabled={!input.trim() || streaming || !isConfigured}
            title={labels.send}
            aria-label={labels.send}
            onClick={() => sendMessage(input)}
          >
            {streaming ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
          <span>{pinned ? labels.pinned : statusText}</span>
          {context?.url && (
            <a
              className="inline-flex items-center gap-1 hover:text-slate-700"
              href={context.url}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={12} />
              {context.hostname || labels.noPageTitle}
            </a>
          )}
        </div>
      </footer>
    </div>
  );
};
