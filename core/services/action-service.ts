import type { FunctionConfig } from '../config/llm-config';
import { i18n } from '../i18n';
import { imageGeneratorService } from './image-generator-service';
import { LLMService, processText } from './llm-service';

// IndexedDB writes must happen in extension context to ensure options page can read them.
// We'll send a message to background to persist collected items.

export class ActionService {
  private static instance: ActionService;
  private llmService = LLMService.getInstance();

  static getInstance(): ActionService {
    if (!ActionService.instance) {
      ActionService.instance = new ActionService();
    }
    return ActionService.instance;
  }

  /**
   * Get target language name based on user's current language setting or custom config
   */
  private getTranslationTargetLanguage(config?: FunctionConfig): string {
    // If function has custom target language, use it
    if (config?.targetLanguage) {
      return config.targetLanguage;
    }

    // Otherwise, use user's current language preference
    const userLanguage = i18n.getCurrentLanguage();

    // Language name mapping for AI models
    const languageNames = {
      zh: '中文',
      en: 'English',
    };

    return languageNames[userLanguage] || 'English';
  }

  async executeAction(
    actionKey: string,
    selectedText: string,
    config: FunctionConfig
  ): Promise<void> {
    console.log(`[ActionService] Executing action: ${actionKey}`);

    // Handle non-LLM functions
    if (actionKey === 'search') {
      return this.handleSearch(selectedText);
    }

    if (actionKey === 'copy') {
      return this.handleCopy(selectedText);
    }

    if (actionKey === 'open') {
      return this.handleOpen(selectedText);
    }

    if (actionKey === 'collect') {
      return this.handleCollect(selectedText);
    }

    if (actionKey === 'share') {
      return this.handleShare(selectedText);
    }

    // Handle chat function (dialogue mode)
    if (actionKey === 'chat') {
      return this.handleChat(selectedText, config);
    }

    // Get Selectly instance
    const selectlyInstance = (window as any).selectlyInstance;
    if (!selectlyInstance) {
      return; // Cannot display any result, return directly
    }

    // Calculate result window position (near selected text)
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    const rect = range?.getBoundingClientRect();

    let x = 100,
      y = 100,
      minWidth = 0,
      maxWidth = 0;
    if (rect) {
      x = rect.left;
      y = rect.bottom + 10;
      minWidth = rect.width;
      maxWidth = rect.width;

      // Prevent going beyond screen
      if (x + 300 > window.innerWidth) {
        x = window.innerWidth - 320;
      }
      if (y + 200 > window.innerHeight) {
        y = rect.top - 210;
      }
    }

    // Handle LLM functions
    if (!config.prompt) {
      selectlyInstance.showErrorResult(
        i18n.t('errors.configError'),
        `${i18n.t('errors.missingPromptConfig')}: ${actionKey}`,
        x,
        y,
        actionKey
      );
      return;
    }

    // Show streaming result window
    selectlyInstance.showStreamingResult(config.title, x, y, minWidth, maxWidth, actionKey);

    try {
      // Prepare translation variables for smart language detection
      const variables: Record<string, string> = {};
      const targetLanguage = this.getTranslationTargetLanguage(config);
      variables.targetLanguage = targetLanguage;

      const prompt = processText(selectedText, config.prompt, variables);

      // Send as system + user messages so system prompt stays separate
      await this.llmService.chatStream(
        [
          {
            role: 'system',
            content: processText(selectedText, config.prompt, variables),
          },
          { role: 'user', content: prompt },
        ],
        (chunk: string, model: string) => {
          const updateFn = (window as any).updateStreamingResult;
          if (updateFn) {
            updateFn(chunk, model, false);
          }
        },
        config.model
      );

      // Mark as complete
      const updateFn = (window as any).updateStreamingResult;
      if (updateFn) {
        updateFn('', '', true);
      }
    } catch (error: any) {
      // When error occurs, use unified result window to display error
      const updateFn = (window as any).updateStreamingResult;
      if (updateFn) {
        updateFn(error.message || i18n.t('errors.unknownError'), '', true, true);
      }
    }
  }

  private async handleCollect(text: string): Promise<void> {
    try {
      const url = window.location.href;
      const title = document.title || url;
      const hostname = window.location.hostname;

      if (!text?.trim()) return;

      const payload = {
        text: text.trim(),
        url,
        title,
        hostname,
        createdAt: Date.now(),
      };

      const res = await chrome.runtime.sendMessage({
        action: 'collectItem',
        payload,
      });
      if (!res?.success) {
        throw new Error(res?.error || 'Failed to save');
      }

      const selectlyInstance = (window as any).selectlyInstance;
      if (selectlyInstance && selectlyInstance.notifyCollectSuccess) {
        selectlyInstance.notifyCollectSuccess();
      }
    } catch (e) {
      console.error('Failed to collect:', e);
      const selectlyInstance = (window as any).selectlyInstance;
      if (selectlyInstance && selectlyInstance.notifyCollectError) {
        selectlyInstance.notifyCollectError();
      }
    }
  }

  private async handleChat(selectedText: string, config: FunctionConfig): Promise<void> {
    // Get Selectly instance
    const selectlyInstance = (window as any).selectlyInstance;
    if (!selectlyInstance) {
      return;
    }

    // Calculate result window position (near selected text)
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    const rect = range?.getBoundingClientRect();

    let x = 100,
      y = 100; // Default position
    if (rect) {
      x = rect.left;
      y = rect.bottom + 10;

      // Prevent going beyond screen
      if (x + 300 > window.innerWidth) {
        x = window.innerWidth - 320;
      }
      if (y + 200 > window.innerHeight) {
        y = rect.top - 210;
      }
    }

    // Check LLM configuration
    // if (!this.llmService.isConfigured()) {
    //   selectlyInstance.showErrorResult(
    //     i18n.t("errors.llmNotConfigured"),
    //     i18n.t("errors.pleaseConfigureApiKey"),
    //     x,
    //     y,
    //     "chat"
    //   )
    //   return
    // }

    if (!config.prompt) {
      selectlyInstance.showErrorResult(
        i18n.t('errors.configError'),
        `${i18n.t('errors.missingPromptConfig')}: chat`,
        x,
        y,
        'chat'
      );
      return;
    }

    // Show dialogue streaming result window
    selectlyInstance.showDialogueResult(config.description, x, y, selectedText, config);
  }

  private async handleSearch(text: string): Promise<void> {
    // Get the search function config to determine which search engine to use
    const configManager = (await import('../config/llm-config')).ConfigManager.getInstance();
    const userConfig = configManager.getConfig();
    const searchConfig = userConfig.functions['search'];
    const searchEngine = searchConfig?.searchEngine || 'google';

    // Build search URL based on configured search engine
    let url: string;
    switch (searchEngine) {
      case 'bing':
        url = `https://www.bing.com/search?q=${encodeURIComponent(text)}`;
        break;
      case 'baidu':
        url = `https://www.baidu.com/s?wd=${encodeURIComponent(text)}`;
        break;
      case 'google':
      default:
        url = `https://www.google.com/search?q=${encodeURIComponent(text)}`;
        break;
    }

    window.open(url, '_blank');
  }

  private async handleOpen(text: string): Promise<void> {
    // Check if text contains valid URL
    const urlPattern = /^(https?:\/\/|ftp:\/\/|www\.)/i;
    const urlMatch =
      text.match(/https?:\/\/[^\s]+/i) ||
      text.match(/www\.[^\s]+/i) ||
      text.match(/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*/i);

    let url = text.trim();

    if (urlMatch) {
      // If URL pattern is found, use matched content
      url = urlMatch[0];
    }

    // If no protocol, add https://
    if (!url.match(/^https?:\/\//i)) {
      if (url.match(/^www\./i)) {
        url = 'https://' + url;
      } else if (url.match(/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)) {
        url = 'https://' + url;
      } else {
        // If doesn't look like a URL, search in Google
        url = `https://www.google.com/search?q=${encodeURIComponent(text)}`;
      }
    }

    window.open(url, '_blank');
  }

  private async handleCopy(text: string): Promise<void> {
    const selectlyInstance = (window as any).selectlyInstance;

    try {
      await navigator.clipboard.writeText(text);
      if (selectlyInstance && selectlyInstance.notifyCopySuccess) {
        selectlyInstance.notifyCopySuccess();
      }
      if (selectlyInstance && typeof selectlyInstance.restoreFocusSelection === 'function') {
        selectlyInstance.restoreFocusSelection();
      }
    } catch (error) {
      console.warn('Clipboard API failed, trying no-blur fallbacks');

      // We must avoid blurring complex editors (e.g., DIV-based editors that toggle editability on blur).
      // Strategy:
      // 1) Intercept a 'copy' event and set clipboardData without changing focus/selection.
      // 2) If that fails, temporarily select an invisible span via Range (no focus) and execCommand('copy'),
      //    then restore the original selection and (only if needed) focus.

      // 1) Copy-event interception (no focus, no selection changes)
      let copied = false;
      try {
        const onCopy = (e: ClipboardEvent) => {
          e.preventDefault();
          e.clipboardData?.setData('text/plain', text);
          copied = true;
        };
        document.addEventListener('copy', onCopy, true);
        const execOk = document.execCommand('copy');
        document.removeEventListener('copy', onCopy, true);

        if (execOk && copied) {
          if (selectlyInstance && selectlyInstance.notifyCopySuccess) {
            selectlyInstance.notifyCopySuccess();
          }
          if (selectlyInstance && typeof selectlyInstance.restoreFocusSelection === 'function') {
            // No focus/selection changes occurred, but let the host restore if it tracks state
            selectlyInstance.restoreFocusSelection();
          }
          return;
        }
      } catch (e1) {
        console.warn('Copy-event interception failed', e1);
        // proceed to next fallback
      }

      // 2) Range-based temporary selection (no focus on any element)
      const currentSelection = window.getSelection();
      const savedRanges: Range[] = [];
      if (currentSelection && currentSelection.rangeCount > 0) {
        for (let i = 0; i < currentSelection.rangeCount; i++) {
          savedRanges.push(currentSelection.getRangeAt(i).cloneRange());
        }
      }
      const previouslyActive = document.activeElement as HTMLElement | null;

      const span = document.createElement('span');
      span.textContent = text;
      // Make it selectable but invisible and non-interactive
      span.style.whiteSpace = 'pre';
      span.style.position = 'fixed';
      span.style.top = '0';
      span.style.left = '0';
      span.style.opacity = '0';
      span.style.pointerEvents = 'none';
      span.style.userSelect = 'text';
      document.body.appendChild(span);

      try {
        const range = document.createRange();
        range.selectNodeContents(span);
        currentSelection?.removeAllRanges();
        currentSelection?.addRange(range);

        const execOk2 = document.execCommand('copy');
        if (execOk2) {
          if (selectlyInstance && selectlyInstance.notifyCopySuccess) {
            selectlyInstance.notifyCopySuccess();
          }
        } else {
          if (selectlyInstance && selectlyInstance.notifyCopyError) {
            selectlyInstance.notifyCopyError();
          }
        }
      } catch (e2) {
        console.warn('Range-based copy failed', e2);
        if (selectlyInstance && selectlyInstance.notifyCopyError) {
          selectlyInstance.notifyCopyError();
        }
      } finally {
        // Clean up temp span
        if (span.parentNode) {
          span.parentNode.removeChild(span);
        }

        // Restore original selection ranges
        if (currentSelection) {
          currentSelection.removeAllRanges();
          if (savedRanges.length > 0) {
            for (const r of savedRanges) {
              currentSelection.addRange(r);
            }
          }
        }

        // Best-effort: only restore focus if it changed
        if (
          previouslyActive &&
          document.activeElement !== previouslyActive &&
          typeof previouslyActive.focus === 'function'
        ) {
          // Attempt not to scroll to avoid UX jumps
          try {
            previouslyActive.focus({ preventScroll: true });
          } catch {}
        }

        if (selectlyInstance && typeof selectlyInstance.restoreFocusSelection === 'function') {
          selectlyInstance.restoreFocusSelection();
        }
      }
    }
  }

  private async handleShare(text: string): Promise<void> {
    try {
      // Get page information
      const pageTitle = document.title || 'Untitled Page';
      const pageUrl = window.location.href;

      // Generate share image
      const imageBlob = await imageGeneratorService.generateShareImage({
        selectedText: text,
        pageTitle: pageTitle,
        pageUrl: pageUrl,
      });

      // Show share preview instead of direct download
      const selectlyInstance = (window as any).selectlyInstance;
      if (selectlyInstance && selectlyInstance.showSharePreview) {
        selectlyInstance.showSharePreview(imageBlob, text);
      } else {
        // Fallback to direct download if preview is not available
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        const filename = `selectly-share-${timestamp}.png`;
        await imageGeneratorService.downloadImage(imageBlob, filename);
      }

      // Notify success
      if (selectlyInstance && selectlyInstance.notifyShareSuccess) {
        selectlyInstance.notifyShareSuccess();
      }

      if (selectlyInstance && typeof selectlyInstance.restoreFocusSelection === 'function') {
        selectlyInstance.restoreFocusSelection();
      }
    } catch (error) {
      console.error('Share failed:', error);

      // Notify error
      const selectlyInstance = (window as any).selectlyInstance;
      if (selectlyInstance && selectlyInstance.notifyShareError) {
        selectlyInstance.notifyShareError();
      }
    }
  }
}

export const actionService = ActionService.getInstance();
