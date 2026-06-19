import { FileText, History, MessageSquarePlus, RefreshCw, Send, Settings } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ConfigManager, DEFAULT_CONFIG, type UserConfig } from '../../core/config/llm-config';
import { i18n } from '../../core/i18n';
import { collectService } from '../../core/services/collect-service';
import { isLLMModelUsable } from '../../core/services/llm-config-state';
import { LLMService } from '../../core/services/llm-service';
import { buildModelChoices, type ModelChoice } from '../../core/services/model-options';
import { modelService } from '../../core/services/model-service';
import { tabContextService, type ActiveTabInfo } from '../../core/services/tab-context-service';
import { tabChatDB } from '../../core/storage/tab-chat-db';
import { getContextBudget } from '../../core/tab-context/budget';
import { buildTabChatMessages, getTabChatPromptSnapshot } from '../../core/tab-context/prompt';
import {
  mergeSelectedTextIntoSnapshot,
  removeSelectedTextFromSnapshot,
  type TabSelectionContext,
} from '../../core/tab-context/selection-context';
import {
  getCurrentSessionForTab,
  getNormalizedTabUrl,
  mergeActiveTabInfo,
  selectPreservedSession,
  shouldCaptureTabUpdate,
} from '../../core/tab-context/session-loader';
import { getTabSessionModel, normalizeTabSessionModel } from '../../core/tab-context/session-model';
import type { TabChatSession, TabContextSnapshot, TabMessage } from '../../core/tab-context/types';
import { normalizePageUrl } from '../../core/tab-context/url';
import { ContextPreviewModal } from './ContextPreviewModal';
import { SelectedTextPreview } from './SelectedTextPreview';
import { TabChatHistoryModal } from './TabChatHistoryModal';
import { TabChatMessage } from './TabChatMessage';
import { TabModelPicker } from './TabModelPicker';

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
  const [contextPreviewOpen, setContextPreviewOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historySessions, setHistorySessions] = useState<TabChatSession[]>([]);
  const [selectedTextPreviewExpanded, setSelectedTextPreviewExpanded] = useState(false);
  const [modelChoices, setModelChoices] = useState<ModelChoice[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const activeTabRef = useRef<ActiveTabInfo | null>(null);
  const sessionRef = useRef<TabChatSession | null>(null);
  const loadRequestIdRef = useRef(0);

  const labels = t.tabAssistant;
  const selectedModel = getTabSessionModel(session, config.llm.defaultModel);
  const isConfigured = isLLMModelUsable(config, selectedModel);
  const canStartNewChat = !!session && messages.length > 0 && !streaming;

  const quickPrompts = useMemo(() => [labels.summarizePage, labels.translatePage], [labels]);
  const selectedTextPreview = context?.selectedText?.trim() || '';

  const loadModelChoices = useCallback(async (requiredModel?: string) => {
    const model = normalizeTabSessionModel(
      requiredModel || configManager.getConfig().llm.defaultModel
    );
    setLoadingModels(true);
    try {
      const providerModels = await modelService.getAllAvailableModels(
        configManager.getEnabledProviders()
      );
      setModelChoices(buildModelChoices(providerModels, model));
    } finally {
      setLoadingModels(false);
    }
  }, []);

  const loadTab = useCallback(
    async (tab: ActiveTabInfo | null) => {
      if (!tab?.id) return;
      const previousTab = activeTabRef.current;
      const requestedTab = mergeActiveTabInfo(tab, previousTab);
      const currentSession = getCurrentSessionForTab(requestedTab, previousTab, sessionRef.current);
      const requestId = loadRequestIdRef.current + 1;
      loadRequestIdRef.current = requestId;

      activeTabRef.current = requestedTab;
      setActiveTab(requestedTab);
      setLoadingContext(true);
      setError('');

      const defaultModel = configManager.getConfig().llm.defaultModel;

      try {
        const pendingSelection = await tabContextService.getPendingSelection(requestedTab.id);
        const captured = await tabContextService.capture(requestedTab.id);
        if (loadRequestIdRef.current !== requestId) return;

        if (!captured) {
          const normalizedUrl = getNormalizedTabUrl(requestedTab, currentSession);
          const storedSession = normalizedUrl
            ? await tabChatDB.getLatestByNormalizedUrl(normalizedUrl)
            : null;
          if (loadRequestIdRef.current !== requestId) return;

          const preservedSession = selectPreservedSession({
            normalizedUrl,
            currentSession,
            storedSession,
          });

          if (preservedSession) {
            const preservedContext =
              preservedSession.context ||
              createUnavailableSnapshot({
                ...requestedTab,
                title: preservedSession.title || requestedTab.title,
                url: preservedSession.url || requestedTab.url,
              });
            const contextWithSelection = mergeSelectedTextIntoSnapshot(
              preservedContext,
              pendingSelection
            );
            const sessionWithSelection = {
              ...preservedSession,
              context: contextWithSelection,
            };
            sessionRef.current = sessionWithSelection;
            setContext(contextWithSelection);
            setSession(sessionWithSelection);
            setMessages(preservedSession.messages || []);
            void loadModelChoices(getTabSessionModel(preservedSession, defaultModel));
            return;
          }
        }

        const snapshot = mergeSelectedTextIntoSnapshot(
          captured || createUnavailableSnapshot(requestedTab),
          pendingSelection
        );
        const normalizedUrl = snapshot.normalizedUrl || normalizePageUrl(requestedTab.url || '');
        const nextSession = await tabChatDB.upsertContext(normalizedUrl, snapshot, defaultModel);
        if (loadRequestIdRef.current !== requestId) return;

        sessionRef.current = nextSession;
        setContext(snapshot);
        setSession(nextSession);
        setMessages(nextSession.messages || []);
        void loadModelChoices(getTabSessionModel(nextSession, defaultModel));
      } catch (err: any) {
        if (loadRequestIdRef.current === requestId) {
          setError(err?.message || labels.error);
        }
      } finally {
        if (loadRequestIdRef.current === requestId) {
          setLoadingContext(false);
        }
      }
    },
    [labels.error, loadModelChoices]
  );

  const refreshActiveTab = useCallback(async () => {
    const tab = activeTab?.id ? activeTab : await tabContextService.getActiveTab();
    await loadTab(tab);
  }, [activeTab, loadTab]);

  const getCurrentHistoryNormalizedUrl = useCallback(() => {
    const currentSession = sessionRef.current;
    const currentTab = activeTabRef.current;
    return (
      currentSession?.normalizedUrl ||
      context?.normalizedUrl ||
      (currentTab ? getNormalizedTabUrl(currentTab, currentSession) : '')
    );
  }, [context?.normalizedUrl]);

  const loadHistorySessions = useCallback(async () => {
    const normalizedUrl = getCurrentHistoryNormalizedUrl();
    const currentSession = sessionRef.current;
    const sessions = normalizedUrl ? await tabChatDB.listByNormalizedUrl(normalizedUrl) : [];
    if (currentSession && !sessions.some((item) => item.id === currentSession.id)) {
      sessions.unshift(currentSession);
    }
    setHistorySessions(sessions);
  }, [getCurrentHistoryNormalizedUrl]);

  const openHistory = useCallback(async () => {
    if (streaming || !session) return;
    try {
      await loadHistorySessions();
      setHistoryOpen(true);
    } catch (err: any) {
      setError(err?.message || labels.error);
    }
  }, [labels.error, loadHistorySessions, session, streaming]);

  const clearSelectedTextContext = useCallback(() => {
    const currentTab = activeTabRef.current;
    const currentSession = sessionRef.current;
    const nextContext = removeSelectedTextFromSnapshot(currentSession?.context || context);

    setSelectedTextPreviewExpanded(false);
    setContext((current) => removeSelectedTextFromSnapshot(current));
    setSession((current) =>
      current
        ? {
            ...current,
            context: removeSelectedTextFromSnapshot(current.context),
          }
        : current
    );

    if (currentSession?.id) {
      void tabChatDB.updateContext(currentSession.id, nextContext);
    }
    if (currentTab?.id) {
      void tabContextService.clearPendingSelection(currentTab.id);
    }
  }, [context]);

  const startNewChat = useCallback(async () => {
    const currentSession = sessionRef.current;
    if (!canStartNewChat || !currentSession) return;

    const currentTab = activeTabRef.current;
    const baseContext =
      context ||
      currentSession.context ||
      (currentTab ? createUnavailableSnapshot(currentTab) : null);
    const nextContext = removeSelectedTextFromSnapshot(baseContext);

    try {
      if (currentSession.id) {
        await tabChatDB.updateContext(currentSession.id, nextContext);
      }
      if (currentTab?.id) {
        await tabContextService.clearPendingSelection(currentTab.id);
      }

      const nextSession = await tabChatDB.createSession(nextContext, selectedModel);
      sessionRef.current = nextSession;
      setSession(nextSession);
      setContext(nextContext);
      setMessages([]);
      setInput('');
      setError('');
      setSelectedTextPreviewExpanded(false);
      setContextPreviewOpen(false);
      setHistoryOpen(false);
      setHistorySessions((current) => [
        nextSession,
        ...current.filter((item) => item.id !== nextSession.id),
      ]);
      inputRef.current?.focus();
    } catch (err: any) {
      setError(err?.message || labels.error);
    }
  }, [canStartNewChat, context, labels.error, selectedModel]);

  const selectHistorySession = useCallback(
    (nextSession: TabChatSession) => {
      if (streaming || nextSession.id === sessionRef.current?.id) return;

      const currentTab = activeTabRef.current;
      const fallbackTab: ActiveTabInfo = currentTab
        ? {
            ...currentTab,
            title: nextSession.title || currentTab.title,
            url: nextSession.url || currentTab.url,
          }
        : {
            id: 0,
            title: nextSession.title,
            url: nextSession.url,
          };
      const nextContext = nextSession.context || createUnavailableSnapshot(fallbackTab);
      const nextSessionWithContext = { ...nextSession, context: nextContext };

      sessionRef.current = nextSessionWithContext;
      setSession(nextSessionWithContext);
      setContext(nextContext);
      setMessages(nextSessionWithContext.messages || []);
      setInput('');
      setError('');
      setSelectedTextPreviewExpanded(false);
      setHistoryOpen(false);
      void loadModelChoices(
        getTabSessionModel(nextSessionWithContext, configManager.getConfig().llm.defaultModel)
      );
      inputRef.current?.focus();
    },
    [loadModelChoices, streaming]
  );

  const applySelectionContext = useCallback((selection: TabSelectionContext | null) => {
    if (!selection?.selectedText) return;
    const currentTab = activeTabRef.current;
    if (!currentTab?.id || currentTab.id !== selection.tabId) return;

    setSelectedTextPreviewExpanded(false);
    setContext((current) => {
      const nextContext = mergeSelectedTextIntoSnapshot(
        current || createUnavailableSnapshot(currentTab),
        selection
      );
      return nextContext;
    });
    setSession((current) =>
      current?.context
        ? {
            ...current,
            context: mergeSelectedTextIntoSnapshot(current.context, selection),
          }
        : current
    );
    inputRef.current?.focus();
  }, []);

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
      await loadModelChoices(userConfig.llm.defaultModel);
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
  }, [labels.error, loadModelChoices, loadTab]);

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.onMessage) {
      return;
    }

    const handleRuntimeMessage = (request: any) => {
      if (request?.action !== 'tabContext:selectedTextUpdated') {
        return false;
      }

      applySelectionContext(request.selection || null);
      return false;
    };

    chrome.runtime?.onMessage?.addListener(handleRuntimeMessage);
    return () => {
      chrome.runtime?.onMessage?.removeListener(handleRuntimeMessage);
    };
  }, [applySelectionContext]);

  useEffect(() => {
    const element = contentRef.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [messages, streaming]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    if (selectedTextPreview) {
      inputRef.current?.focus();
    }
  }, [selectedTextPreview]);

  useEffect(() => {
    if (streaming) {
      setHistoryOpen(false);
    }
  }, [streaming]);

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
      if (pinned || tabId !== activeTabRef.current?.id) return;
      if (changeInfo.url || changeInfo.title) {
        setActiveTab((current) => {
          const nextTab = mergeActiveTabInfo(
            { id: tabId, title: tab.title, url: tab.url, windowId: tab.windowId },
            current
          );
          activeTabRef.current = nextTab;
          return nextTab;
        });
      }
      if (shouldCaptureTabUpdate(changeInfo)) {
        await loadTab({ id: tabId, title: tab.title, url: tab.url, windowId: tab.windowId });
      }
    };

    chrome.tabs?.onActivated?.addListener(handleActivated);
    chrome.tabs?.onUpdated?.addListener(handleUpdated);
    return () => {
      chrome.tabs?.onActivated?.removeListener(handleActivated);
      chrome.tabs?.onUpdated?.removeListener(handleUpdated);
    };
  }, [loadTab, pinned]);

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
    const modelForRequest = selectedModel;
    const contextForRequest = getTabChatPromptSnapshot(context);
    const shouldClearSelectedTextAfterSend = !!contextForRequest?.selectedText?.trim();
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
    if (shouldClearSelectedTextAfterSend) {
      clearSelectedTextContext();
    }

    let assistantContent = '';
    try {
      const budget = await tabContextService.getContextBudget(modelForRequest);
      const requestMessages = buildTabChatMessages({
        snapshot: contextForRequest,
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
        modelForRequest,
        config.llm.defaultModelSettings?.thinkingMode,
        true,
        { maxTokens: budget.maxOutputTokens }
      );

      const savedAssistant = await tabChatDB.appendMessage(session.id, {
        role: 'assistant',
        content: assistantContent,
        model: modelForRequest,
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
    try {
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
    } catch (err: any) {
      setError(err?.message || labels.error);
    }
  };

  const openSettings = () => chrome.runtime.openOptionsPage();

  const copyContextText = async () => {
    if (!context?.text.trim()) return;
    await copyMessage(context.text);
  };

  const selectModel = async (model: string) => {
    if (!session) return;
    const nextModel = normalizeTabSessionModel(model);
    const nextConfig: UserConfig = {
      ...config,
      llm: {
        ...config.llm,
        defaultModel: nextModel,
      },
    };

    await tabChatDB.setSessionModel(session.id, nextModel);
    await configManager.saveConfig({ llm: nextConfig.llm });
    const savedConfig = configManager.getConfig();
    setConfig(savedConfig);
    await llmService.configure(savedConfig.llm);
    setSession((current) =>
      current?.id === session.id ? { ...current, model: nextModel } : current
    );
    void loadModelChoices(nextModel);
  };

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
  const canViewContext = !!context && context.source !== 'empty' && !!context.text.trim();

  return (
    <div className="selectly-popup flex h-screen min-h-0 flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {/* <div className="text-[11px] font-medium uppercase text-slate-500">
              {context?.source === 'empty' ? labels.noPageContext : labels.sharing}
            </div> */}
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
              disabled={!canStartNewChat}
              title={labels.newChat}
              aria-label={labels.newChat}
              onClick={startNewChat}
            >
              <MessageSquarePlus size={14} />
            </button>
            <button
              className="sl-btn sl-btn-ghost !h-8 !w-8 !p-0"
              disabled={!session || streaming}
              title={labels.chatHistory}
              aria-label={labels.chatHistory}
              onClick={openHistory}
            >
              <History size={14} />
            </button>
            <button
              className="sl-btn sl-btn-ghost !h-8 !w-8 !p-0"
              disabled={!canViewContext}
              title={canViewContext ? labels.viewContext : labels.noPageContext}
              aria-label={canViewContext ? labels.viewContext : labels.noPageContext}
              onClick={() => setContextPreviewOpen(true)}
            >
              <FileText size={14} />
            </button>
          </div>
          {/* <div className="flex shrink-0 items-center gap-1">
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
          </div> */}
        </div>
        {/* <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
          <span className="truncate">{contextMeta}</span>
        </div> */}
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
            <TabChatMessage
              key={message.id}
              message={message}
              streaming={streaming}
              labels={{
                copy: labels.copy,
                saveToCollections: labels.saveToCollections,
              }}
              onCopy={copyMessage}
              onSave={saveMessageToCollections}
            />
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
        <SelectedTextPreview
          selectedText={selectedTextPreview}
          expanded={selectedTextPreviewExpanded}
          labels={{
            selectedText: labels.selectedText,
            expandSelectedText: labels.expandSelectedText,
            collapseSelectedText: labels.collapseSelectedText,
            removeSelectedText: labels.removeSelectedText,
          }}
          onToggle={() => setSelectedTextPreviewExpanded((value) => !value)}
          onRemove={clearSelectedTextContext}
        />
        {!isConfigured && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <span>{labels.configureModel}</span>
            <button className="sl-btn sl-btn-secondary !px-2 !py-1 text-xs" onClick={openSettings}>
              <Settings size={13} /> {labels.openSettings}
            </button>
          </div>
        )}
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm transition focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100">
          <textarea
            ref={inputRef}
            className="max-h-32 min-h-[72px] w-full resize-none bg-transparent px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
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
          <div className="flex items-center justify-end gap-2 px-2 pb-2">
            <TabModelPicker
              choices={modelChoices}
              selectedModel={selectedModel}
              disabled={streaming || !session}
              loading={loadingModels}
              labels={{
                chooseModel: labels.chooseModel,
                loadingModels: labels.loadingModels,
                noModelsAvailable: labels.noModelsAvailable,
                selectedModel: labels.selectedModel,
              }}
              onSelect={selectModel}
            />
            <button
              className="sl-btn sl-btn-primary !h-9 !w-9 !rounded-full !p-0"
              disabled={!input.trim() || streaming || !isConfigured}
              title={labels.send}
              aria-label={labels.send}
              onClick={() => sendMessage(input)}
            >
              {streaming ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        </div>
      </footer>
      <ContextPreviewModal
        context={context}
        labels={{
          title: labels.contextPreviewTitle,
          preview: labels.contextPreview,
          blocks: labels.contextBlocks,
          source: labels.contextSource,
          frame: labels.contextFrame,
          blockChars: labels.contextBlockChars,
          copyContext: labels.copyContext,
          contextCopied: labels.contextCopied,
          close: labels.closeContextPreview,
          contextReady: labels.contextReady,
          contextTruncated: labels.contextTruncated,
          noPageContext: labels.noPageContext,
          contextStats: labels.contextStats,
          skippedFrames: labels.skippedFrames,
        }}
        open={contextPreviewOpen}
        onClose={() => setContextPreviewOpen(false)}
        onCopy={copyContextText}
      />
      <TabChatHistoryModal
        sessions={historySessions}
        currentSessionId={session?.id}
        labels={{
          title: labels.chatHistory,
          currentChat: labels.currentChat,
          newChat: labels.newChat,
          noPreviousChats: labels.noPreviousChats,
          messageCount: labels.messageCount,
          updatedAt: labels.updatedAt,
          close: labels.closeChatHistory,
        }}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelectSession={selectHistorySession}
      />
    </div>
  );
};
