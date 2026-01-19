import { createRoot } from 'react-dom/client';

import SubscriptionServiceV2 from '~core/services/subscription-service-v2';

import { ActionButtons } from '../../components/content/ActionButtons';
import { SharePreview } from '../../components/content/SharePreview';
import { StreamingResult } from '../../components/content/StreamingResult';
import {
  ConfigManager,
  DEFAULT_CONFIG,
  type FunctionConfig,
  type UserConfig,
} from '../config/llm-config';
import { i18n } from '../i18n';
import { ActionService } from '../services/action-service';
import { LLMService, processText } from '../services/llm-service';
import { secureStorage } from '../storage/secure-storage';
import { contentStyles } from './content-styles';

/**
 * Main content script logic
 * Handles text selection, UI rendering, and LLM integration
 *
 * iframe Support:
 * - Automatically detects and monitors dynamically created iframes
 * - Attaches event listeners to same-origin iframe documents
 * - Cross-origin iframes handled via Chrome's auto-injection (all_frames: true)
 * - Translates coordinates from iframe context to parent document for accurate positioning
 */
export class Selectly {
  private container: HTMLDivElement | null = null;
  private root: any = null;
  private streamingContainer: HTMLDivElement | null = null;
  private streamingRoot: any = null;
  private streamingCleanup: ((force?: boolean) => boolean) | null = null;
  private buttonsHost: HTMLDivElement | null = null;
  private streamingHost: HTMLDivElement | null = null;
  private sharePreviewHost: HTMLDivElement | null = null;
  private sharePreviewContainer: HTMLDivElement | null = null;
  private sharePreviewRoot: any = null;
  private isShowingButtons = false;
  private userConfig: UserConfig = DEFAULT_CONFIG;
  private configManager = ConfigManager.getInstance();
  private llmService = LLMService.getInstance();
  private subscriptionService = SubscriptionServiceV2.getInstance();
  private styleContent = '';
  private currentSelection: Selection | null = null;
  private currentTarget: HTMLElement | null = null;
  private inputSelectionStart: number | null = null;
  private inputSelectionEnd: number | null = null;
  private contentEditableRange: Range | null = null;
  private lastMousePosition: { x: number; y: number } | null = null;
  // iframe support
  private trackedIframes: WeakSet<HTMLIFrameElement> = new WeakSet();
  private iframeObserver: MutationObserver | null = null;

  constructor() {
    this.init();
  }

  private createXPath(node: Node): string {
    const segments: string[] = [];
    let current: Node | null = node;

    while (current && current.nodeType !== Node.DOCUMENT_NODE) {
      if (current.nodeType === Node.TEXT_NODE) {
        const parent = current.parentNode;
        if (!parent) break;
        const siblings = Array.from(parent.childNodes).filter(
          (n) => n.nodeType === Node.TEXT_NODE
        ) as ChildNode[];
        const index = Math.max(1, siblings.indexOf(current as ChildNode) + 1);
        segments.unshift(`text()[${index}]`);
        current = parent;
        continue;
      }

      if (current.nodeType === Node.ELEMENT_NODE) {
        const el = current as Element;
        const tag = el.tagName.toLowerCase();
        const siblings = Array.from(el.parentElement?.children || []).filter(
          (s) => s.tagName === el.tagName
        ) as ChildNode[];
        const index = Math.max(1, siblings.indexOf(el as ChildNode) + 1);
        segments.unshift(`${tag}[${index}]`);
        current = el.parentNode;
        continue;
      }

      current = current.parentNode;
    }

    return '/' + segments.join('/');
  }

  private resolveXPath(path: string, doc: Document): Node | null {
    try {
      const result = doc.evaluate(path, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return result.singleNodeValue;
    } catch {
      return null;
    }
  }

  private isInSelectlyUI(node: Node): boolean {
    const el = node.parentElement || (node as any);
    if (!el || !(el as HTMLElement).closest) return false;
    return !!(el as HTMLElement).closest(
      '#selectly-buttons-host, #selectly-streaming-host, #selectly-share-preview-host, .selectly-buttons, .selectly-streaming-result, .selectly-highlight'
    );
  }

  private serializeSelection(
    selectedText: string,
    selection: Selection
  ): {
    startXPath: string;
    startOffset: number;
    endXPath: string;
    endOffset: number;
    text: string;
    prefix?: string;
    suffix?: string;
  } | null {
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    const startNode = range.startContainer;
    const endNode = range.endContainer;
    const startXPath = this.createXPath(startNode);
    const endXPath = this.createXPath(endNode);
    const startText = startNode.textContent || '';
    const endText = endNode.textContent || '';
    const prefixStart = Math.max(0, range.startOffset - 20);
    const suffixEnd = Math.min(endText.length, range.endOffset + 20);

    return {
      startXPath,
      startOffset: range.startOffset,
      endXPath,
      endOffset: range.endOffset,
      text: selectedText,
      prefix: startText.slice(prefixStart, range.startOffset),
      suffix: endText.slice(range.endOffset, suffixEnd),
    };
  }

  private wrapTextSegment(
    node: Text,
    start: number,
    end: number,
    highlightId: string,
    color: string
  ) {
    if (start >= end) return;
    const parent = node.parentNode;
    if (!parent) return;
    const text = node.textContent || '';
    const before = text.slice(0, start);
    const middle = text.slice(start, end);
    const after = text.slice(end);

    const span = document.createElement('span');
    span.className = 'selectly-highlight';
    span.dataset.selectlyHighlightId = highlightId;
    span.style.backgroundColor = color;
    span.style.padding = '0 2px';
    span.style.borderRadius = '2px';
    span.style.boxShadow = 'inset 0 -1px 0 rgba(0, 0, 0, 0.15)';
    span.textContent = middle;

    const frag = document.createDocumentFragment();
    if (before) frag.appendChild(document.createTextNode(before));
    frag.appendChild(span);
    if (after) frag.appendChild(document.createTextNode(after));

    parent.replaceChild(frag, node);
  }

  private collectTextNodesInRange(range: Range): Text[] {
    const nodes: Text[] = [];
    const root = range.commonAncestorContainer;
    if (root.nodeType === Node.TEXT_NODE) {
      const textNode = root as Text;
      if (textNode.textContent?.trim() && !this.isInSelectlyUI(textNode)) {
        const parent = textNode.parentElement;
        if (!parent || !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) {
          nodes.push(textNode);
        }
      }
      return nodes;
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        if (!(node as Text).textContent?.trim()) return NodeFilter.FILTER_REJECT;
        if (this.isInSelectlyUI(node)) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (parent && ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        try {
          return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        } catch {
          return NodeFilter.FILTER_REJECT;
        }
      },
    });

    let node: Node | null;
    while ((node = walker.nextNode())) {
      nodes.push(node as Text);
    }
    return nodes;
  }

  private applyHighlightRange(range: Range, highlightId: string, color: string) {
    const textNodes = this.collectTextNodesInRange(range);
    for (const node of textNodes) {
      if (this.isInSelectlyUI(node)) continue;
      const text = node.textContent || '';
      let start = 0;
      let end = text.length;
      if (node === range.startContainer) {
        start = range.startOffset;
      }
      if (node === range.endContainer) {
        end = range.endOffset;
      }
      this.wrapTextSegment(node, start, end, highlightId, color);
    }
  }

  private getClosestHighlightElement(node: Node | null): HTMLElement | null {
    if (!node) return null;
    const el = node instanceof HTMLElement ? node : node.parentElement;
    if (!el || !el.closest) return null;
    const highlightEl = el.closest('.selectly-highlight') as HTMLElement | null;
    return highlightEl || null;
  }

  private getHighlightIdsInRange(range: Range): Set<string> {
    const ids = new Set<string>();

    const startHighlight = this.getClosestHighlightElement(range.startContainer);
    if (startHighlight?.dataset?.selectlyHighlightId) {
      ids.add(startHighlight.dataset.selectlyHighlightId);
    }

    const endHighlight = this.getClosestHighlightElement(range.endContainer);
    if (endHighlight?.dataset?.selectlyHighlightId) {
      ids.add(endHighlight.dataset.selectlyHighlightId);
    }

    const rootNode =
      range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (range.commonAncestorContainer as Element)
        : range.commonAncestorContainer.parentElement || document.body;

    const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (node) => {
        if (!(node instanceof HTMLElement)) return NodeFilter.FILTER_SKIP;
        if (!node.classList.contains('selectly-highlight')) return NodeFilter.FILTER_SKIP;
        try {
          return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        } catch {
          return NodeFilter.FILTER_SKIP;
        }
      },
    });

    let node: Node | null;
    while ((node = walker.nextNode())) {
      const el = node as HTMLElement;
      const id = el.dataset?.selectlyHighlightId;
      if (id) ids.add(id);
    }

    return ids;
  }

  private unwrapHighlightElement(element: HTMLElement) {
    const parent = element.parentNode;
    if (!parent) return;
    const textNode = document.createTextNode(element.textContent || '');
    parent.replaceChild(textNode, element);
    parent.normalize();
  }

  private async removeHighlightsByIds(highlightIds: Set<string>) {
    if (highlightIds.size === 0) return;

    highlightIds.forEach((id) => {
      const nodes = document.querySelectorAll(`[data-selectly-highlight-id="${id}"]`);
      nodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          this.unwrapHighlightElement(node);
        }
      });
    });

    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) return;

    const deleteIds = Array.from(highlightIds).filter((id) => !id.startsWith('local-'));
    await Promise.all(
      deleteIds.map((id) =>
        chrome.runtime.sendMessage({
          action: 'deleteHighlight',
          id,
        })
      )
    );
  }

  private findTextRange(text: string): Range | null {
    if (!text) return null;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        if (!(node as Text).textContent?.trim()) return NodeFilter.FILTER_REJECT;
        if (this.isInSelectlyUI(node)) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (parent && ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let node: Node | null;
    while ((node = walker.nextNode())) {
      const content = node.textContent || '';
      const idx = content.indexOf(text);
      if (idx !== -1) {
        const range = document.createRange();
        range.setStart(node, idx);
        range.setEnd(node, idx + text.length);
        return range;
      }
    }
    return null;
  }

  /**
   * Extract text from a Range object by traversing its contents
   * This works when selection.toString() fails
   */
  private extractTextFromRange(range: Range): string {
    try {
      console.debug('[Selectly] extractTextFromRange - attempting multiple methods');

      // Method 1: Try cloneContents and get textContent
      const fragment = range.cloneContents();
      const tempDiv = document.createElement('div');
      tempDiv.appendChild(fragment);
      const fragmentText = tempDiv.textContent || tempDiv.innerText || '';
      console.debug('[Selectly] Method 1 (cloneContents):', {
        length: fragmentText.length,
        text: fragmentText.substring(0, 50),
      });
      if (fragmentText.trim()) {
        return fragmentText.trim();
      }

      // Method 2: Get text from common ancestor if it's a text node
      const container = range.commonAncestorContainer;
      console.debug('[Selectly] Method 2 (common ancestor):', {
        nodeType: container.nodeType,
        nodeName: container.nodeName,
        isTextNode: container.nodeType === Node.TEXT_NODE,
      });

      if (container.nodeType === Node.TEXT_NODE) {
        const textContent = container.textContent || '';
        const extracted = textContent.substring(range.startOffset, range.endOffset).trim();
        console.debug('[Selectly] Method 2 extracted:', {
          length: extracted.length,
          text: extracted.substring(0, 50),
        });
        if (extracted) {
          return extracted;
        }
      }

      // Method 3: Walk through the range and collect text nodes
      console.debug('[Selectly] Method 3 (TreeWalker): starting traversal');
      const walker = document.createTreeWalker(
        range.commonAncestorContainer,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const nodeRange = document.createRange();
            nodeRange.selectNodeContents(node);
            return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
          },
        }
      );

      let collectedText = '';
      let nodeCount = 0;
      let node: Node | null;
      while ((node = walker.nextNode())) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent || '';
          collectedText += text;
          nodeCount++;
          console.debug('[Selectly] Method 3 - collected node:', {
            nodeCount,
            textLength: text.length,
            text: text.substring(0, 30),
          });
        }
      }
      console.debug('[Selectly] Method 3 total:', {
        nodeCount,
        totalLength: collectedText.length,
        text: collectedText.substring(0, 50),
      });

      if (collectedText.trim()) {
        return collectedText.trim();
      }

      // Method 4: Try to get all text content from range boundaries
      console.debug('[Selectly] Method 4 (range boundaries): attempting');
      const startContainer = range.startContainer;
      const endContainer = range.endContainer;

      if (startContainer === endContainer) {
        const text = startContainer.textContent || '';
        const extracted = text.substring(range.startOffset, range.endOffset).trim();
        console.debug('[Selectly] Method 4 (same container):', {
          length: extracted.length,
          text: extracted.substring(0, 50),
        });
        if (extracted) {
          return extracted;
        }
      }

      console.debug('[Selectly] extractTextFromRange - all methods failed');
      return '';
    } catch (e) {
      console.warn('[Selectly] Error extracting text from range:', e);
      return '';
    }
  }

  /**
   * Try to extract selected text using clipboard API
   * This is a last resort for sites with custom selection mechanisms
   */
  private async tryClipboardExtraction(): Promise<string> {
    try {
      // Check if we have clipboard read permission
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        return '';
      }

      // Read current clipboard content
      const clipboardText = await navigator.clipboard.readText();
      return clipboardText.trim();
    } catch (e) {
      // Clipboard access denied or not supported
      return '';
    }
  }

  /**
   * Extract text from a specific Range more aggressively
   */
  private extractTextFromRangeAggressive(range: Range): string {
    try {
      const startContainer = range.startContainer;
      const endContainer = range.endContainer;
      const startOffset = range.startOffset;
      const endOffset = range.endOffset;

      // Single text node case
      if (startContainer === endContainer && startContainer.nodeType === Node.TEXT_NODE) {
        const text = startContainer.textContent || '';
        return text.substring(startOffset, endOffset).trim();
      }

      // Multiple nodes case - collect all text between start and end
      let extractedText = '';
      const startNode =
        startContainer.nodeType === Node.TEXT_NODE
          ? startContainer
          : startContainer.childNodes[startOffset];
      const endNode =
        endContainer.nodeType === Node.TEXT_NODE
          ? endContainer
          : endContainer.childNodes[endOffset - 1];

      if (startNode && endNode) {
        // Get common ancestor
        const commonAncestor = range.commonAncestorContainer;
        const walker = document.createTreeWalker(commonAncestor, NodeFilter.SHOW_TEXT, null);

        let currentNode: Node | null = walker.currentNode;
        let started = false;
        let ended = false;

        while (currentNode && !ended) {
          if (currentNode === startNode || currentNode.contains(startNode) || started) {
            started = true;
            if (currentNode.nodeType === Node.TEXT_NODE) {
              let text = currentNode.textContent || '';
              if (currentNode === startNode) {
                text = text.substring(startOffset);
              }
              if (currentNode === endNode) {
                text = text.substring(0, endOffset);
                ended = true;
              }
              extractedText += text;
            }
          }
          currentNode = walker.nextNode();
        }
      }

      return extractedText.trim();
    } catch (e) {
      console.warn('[Selectly] Error in extractTextFromRangeAggressive:', e);
      return '';
    }
  }

  /**
   * Extract selected text using multiple fallback strategies
   * This handles special websites where selection.toString() fails
   */
  private async extractSelectedText(selection: Selection | null): Promise<string> {
    if (!selection) {
      console.debug('[Selectly] No selection object provided');
      return '';
    }

    // Log selection details for debugging
    console.debug('[Selectly] Selection details:', {
      type: selection.type,
      rangeCount: selection.rangeCount,
      isCollapsed: selection.isCollapsed,
      anchorNode: selection.anchorNode?.nodeName,
      focusNode: selection.focusNode?.nodeName,
      anchorOffset: selection.anchorOffset,
      focusOffset: selection.focusOffset,
    });

    try {
      // Strategy 1: Standard selection.toString() (most common)
      const standardText = selection.toString().trim();
      if (standardText) {
        console.debug(
          '[Selectly] ✓ Strategy 1: Extracted via selection.toString()',
          standardText.substring(0, 50)
        );
        return standardText;
      }
      console.debug('[Selectly] ✗ Strategy 1: selection.toString() returned empty');

      // Strategy 2: Extract from Range if available
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        console.debug('[Selectly] Range info:', {
          collapsed: range.collapsed,
          startContainer: range.startContainer.nodeName,
          endContainer: range.endContainer.nodeName,
          startOffset: range.startOffset,
          endOffset: range.endOffset,
        });

        const rangeText = this.extractTextFromRange(range);
        if (rangeText) {
          console.debug(
            '[Selectly] ✓ Strategy 2: Extracted via Range traversal',
            rangeText.substring(0, 50)
          );
          return rangeText;
        }
        console.debug('[Selectly] ✗ Strategy 2: Range traversal returned empty');
      } else {
        console.debug('[Selectly] ✗ Strategy 2: No ranges available');
      }

      // Strategy 3: Try to get text from the anchor and focus nodes
      if (selection.anchorNode && selection.focusNode) {
        const anchorText = selection.anchorNode.textContent || '';
        const focusText = selection.focusNode.textContent || '';

        console.debug('[Selectly] Anchor/Focus text lengths:', {
          anchor: anchorText.length,
          focus: focusText.length,
          sameNode: selection.anchorNode === selection.focusNode,
        });

        if (selection.anchorNode === selection.focusNode) {
          // Same node - extract substring
          const start = Math.min(selection.anchorOffset, selection.focusOffset);
          const end = Math.max(selection.anchorOffset, selection.focusOffset);
          const extractedText = anchorText.substring(start, end).trim();
          if (extractedText) {
            console.debug(
              '[Selectly] ✓ Strategy 3: Extracted via anchor/focus nodes',
              extractedText.substring(0, 50)
            );
            return extractedText;
          }
          console.debug('[Selectly] ✗ Strategy 3: Anchor/focus substring empty', {
            start,
            end,
            textLength: anchorText.length,
          });
        } else {
          // Different nodes - try to get text between them
          const anchorOffset = selection.anchorOffset;
          const focusOffset = selection.focusOffset;

          // Try to extract from anchor node
          if (anchorText) {
            const fromAnchor = anchorText.substring(anchorOffset).trim();
            if (fromAnchor) {
              console.debug(
                '[Selectly] ✓ Strategy 3: Extracted from anchor node',
                fromAnchor.substring(0, 50)
              );
              return fromAnchor;
            }
          }

          // Try to extract from focus node
          if (focusText) {
            const fromFocus = focusText.substring(0, focusOffset).trim();
            if (fromFocus) {
              console.debug(
                '[Selectly] ✓ Strategy 3: Extracted from focus node',
                fromFocus.substring(0, 50)
              );
              return fromFocus;
            }
          }
          console.debug('[Selectly] ✗ Strategy 3: Different nodes extraction failed');
        }
      } else {
        console.debug('[Selectly] ✗ Strategy 3: No anchor or focus nodes');
      }

      // Strategy 4: Check for INPUT/TEXTAREA with selection
      if (selection.anchorNode && selection.anchorNode.parentElement) {
        const parent = selection.anchorNode.parentElement;
        if (parent.tagName === 'INPUT' || parent.tagName === 'TEXTAREA') {
          const input = parent as HTMLInputElement | HTMLTextAreaElement;
          const start = input.selectionStart || 0;
          const end = input.selectionEnd || 0;
          const inputText = input.value.substring(start, end).trim();
          if (inputText) {
            console.debug(
              '[Selectly] ✓ Strategy 4: Extracted from input element',
              inputText.substring(0, 50)
            );
            return inputText;
          }
          console.debug('[Selectly] ✗ Strategy 4: Input element selection empty');
        }
      }

      console.warn(
        '[Selectly] ❌ All text extraction strategies failed. Selection object:',
        selection
      );
      return '';
    } catch (e) {
      console.error('[Selectly] Error in extractSelectedText:', e);
      return '';
    }
  }

  private getSelectionContext(): { selectedText: string; sentence: string } {
    try {
      const sel = window.getSelection();
      const selectedText = (sel?.toString() || '').trim();
      if (!sel || sel.rangeCount === 0 || !selectedText) {
        return { selectedText: '', sentence: '' };
      }
      const range = sel.getRangeAt(0);
      // Find a reasonable block ancestor
      const blockAncestor = ((): HTMLElement => {
        let node: Node | null = range.commonAncestorContainer;
        const isBlock = (el: HTMLElement) => {
          const tag = el.tagName;
          return /^(P|DIV|LI|SECTION|ARTICLE|BLOCKQUOTE|H[1-6])$/.test(tag);
        };
        while (node && !(node instanceof HTMLElement)) node = node.parentNode;
        let el: HTMLElement = (node as HTMLElement) || document.body;
        while (el && !isBlock(el) && el.parentElement) {
          el = el.parentElement;
        }
        return el || document.body;
      })();

      // Build a range from start of block to selection start to compute index
      const preRange = document.createRange();
      preRange.selectNodeContents(blockAncestor);
      preRange.setEnd(range.startContainer, range.startOffset);
      const beforeText = preRange.toString();
      const fullText = (blockAncestor.innerText || blockAncestor.textContent || '')
        .replace(/\s+/g, ' ')
        .trim();

      // Fallback if we can't locate substring reliably
      let startIdx = beforeText.replace(/\s+/g, ' ').trim().length;
      if (startIdx < 0 || startIdx > fullText.length) startIdx = fullText.indexOf(selectedText);
      if (startIdx < 0) startIdx = 0;
      const boundaryChars = /[\.\!\?。！？]/;
      // Find left boundary
      let left = startIdx;
      while (left > 0 && !boundaryChars.test(fullText[left - 1])) left--;
      // Skip leading spaces/punct
      while (left < fullText.length && /[\s\-–—\(\[\{\"\'“”‘’]/.test(fullText[left])) left++;
      // Find right boundary from end index
      const endIdx = startIdx + selectedText.length;
      let right = endIdx;
      while (right < fullText.length && !boundaryChars.test(fullText[right])) right++;
      // Include the boundary char if present
      if (right < fullText.length) right++;
      const sentence = fullText.slice(left, right).trim();
      return { selectedText, sentence };
    } catch {
      return { selectedText: '', sentence: '' };
    }
  }

  private async init() {
    await i18n.initialize();

    await this.loadConfig();

    await this.llmService.configure(this.userConfig.llm);

    this.addStyles();

    await this.restoreHighlights();

    document.addEventListener('mouseup', this.handleTextSelection.bind(this));
    document.addEventListener('touchend', this.handleTextSelection.bind(this));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideButtons();
        this.hideStreamingResult();
      }
    });

    this.listenForConfigUpdates();

    // Monitor and attach listeners to iframes
    this.setupIframeMonitoring();
  }

  public async applyHighlight(selectedText: string, config: FunctionConfig) {
    if (!selectedText?.trim()) return;
    const selection = this.currentSelection || window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    if (this.currentTarget && this.isEditableElement(this.currentTarget)) return;

    const range = selection.getRangeAt(0).cloneRange();
    const highlightIdsInRange = this.getHighlightIdsInRange(range);
    if (highlightIdsInRange.size > 0) {
      await this.removeHighlightsByIds(highlightIdsInRange);
      return;
    }
    const anchor = this.serializeSelection(selectedText.trim(), selection);
    if (!anchor) return;

    const url = window.location.href;
    const title = document.title || url;
    const hostname = window.location.hostname;
    const color = this.getHighlightColor(config);

    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      this.applyHighlightRange(range, `local-${Date.now()}`, color);
      return;
    }

    const res = await chrome.runtime.sendMessage({
      action: 'addHighlight',
      payload: {
        text: selectedText.trim(),
        url,
        title,
        hostname,
        anchor,
        createdAt: Date.now(),
      },
    });

    if (!res?.success) {
      console.warn('[Selectly] Failed to persist highlight:', res?.error);
      return;
    }

    const highlightId = res?.id || `highlight-${Date.now()}`;
    this.applyHighlightRange(range, highlightId, color);
  }

  private async restoreHighlights() {
    try {
      if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) return;
      const res = await chrome.runtime.sendMessage({
        action: 'getHighlightsForUrl',
        url: window.location.href,
      });
      if (!res?.success || !Array.isArray(res.items)) return;

      for (const item of res.items) {
        if (!item?.id || document.querySelector(`[data-selectly-highlight-id="${item.id}"]`)) {
          continue;
        }

        const anchor = item.anchor;
        const color = this.getHighlightColor();
        let range: Range | null = null;
        if (anchor?.startXPath && anchor?.endXPath) {
          const startNode = this.resolveXPath(anchor.startXPath, document);
          const endNode = this.resolveXPath(anchor.endXPath, document);
          if (startNode && endNode) {
            try {
              range = document.createRange();
              range.setStart(startNode, anchor.startOffset || 0);
              range.setEnd(endNode, anchor.endOffset || 0);
            } catch {
              range = null;
            }
          }
        }

        if (!range && anchor?.text) {
          range = this.findTextRange(anchor.text);
        }

        if (range) {
          this.applyHighlightRange(range, item.id, color);
        }
      }
    } catch (e) {
      console.warn('[Selectly] Failed to restore highlights:', e);
    }
  }

  private async loadConfig() {
    try {
      this.userConfig = await this.configManager.loadConfig();
    } catch (error) {
      console.warn('Failed to load config:', error);
      this.userConfig = DEFAULT_CONFIG;
    }
  }

  private listenForConfigUpdates() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      secureStorage.onChanged(async (changes) => {
        if (changes.userConfig || changes.userInfo) {
          await this.loadConfig();
          await this.llmService.configure(this.userConfig.llm);
          this.refreshHighlightColors();
        }
      });
    }
  }

  private addStyles() {
    if (this.styleContent) return;
    this.styleContent = contentStyles;
  }

  private getHighlightColor(config?: FunctionConfig): string {
    return (
      config?.highlightColor || this.userConfig?.functions?.highlight?.highlightColor || '#fff59d'
    );
  }

  private refreshHighlightColors() {
    const color = this.getHighlightColor();
    const nodes = document.querySelectorAll('.selectly-highlight');
    nodes.forEach((node) => {
      if (node instanceof HTMLElement) {
        node.style.backgroundColor = color;
      }
    });
  }

  private handleTextSelection(event: MouseEvent | TouchEvent) {
    console.log('Text selection event:', event);
    if (this.isEventFromOurComponents(event)) {
      return;
    }

    // Calculate absolute position considering iframe offset
    const absolutePosition = this.calculateAbsolutePosition(event);

    // Track mouse position (now with iframe offset considered)
    if (absolutePosition) {
      this.lastMousePosition = absolutePosition;
    } else if ('clientX' in event && 'clientY' in event) {
      this.lastMousePosition = {
        x: event.clientX,
        y: event.clientY,
      };
    } else if ('touches' in event && event.touches.length > 0) {
      this.lastMousePosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    }

    setTimeout(async () => {
      // Get selection from the appropriate document context
      const doc = (event.target as HTMLElement)?.ownerDocument || document;
      const selection = doc.getSelection();

      console.log('[Selectly] Selection event triggered');
      console.log('[Selectly] Event target:', {
        tagName: (event.target as HTMLElement)?.tagName,
        className: (event.target as HTMLElement)?.className,
        id: (event.target as HTMLElement)?.id,
      });
      console.log('[Selectly] Selection object:', {
        exists: !!selection,
        type: selection?.type,
        rangeCount: selection?.rangeCount,
        isCollapsed: selection?.isCollapsed,
        toString: selection?.toString(),
      });

      // Use robust text extraction with multiple fallback strategies
      const selectedText = await this.extractSelectedText(selection);
      console.log(
        '[Selectly] Final extracted text:',
        selectedText
          ? `"${selectedText.substring(0, 100)}${selectedText.length > 100 ? '...' : ''}"`
          : '(empty)'
      );

      if (selectedText && selectedText.length > 0) {
        const target = event.target as HTMLElement;
        if (this.shouldIgnoreElement(target)) {
          return;
        }

        this.currentSelection = selection;
        this.currentTarget = target;
        this.cacheCurrentSelection();
        this.showButtons(selectedText, event);
      } else {
        this.hideButtons();
        if (this.streamingHost) {
          const actionKey = (this.streamingHost as any).actionKey;
          if (this.userConfig.functions[actionKey]?.autoCloseResult) {
            this.hideStreamingResult();
          }
        }
      }
    }, 100);
  }

  private shouldIgnoreElement(element: HTMLElement): boolean {
    const ignoreTags = ['SELECT'];
    const ignoreClasses = ['selectly-buttons', 'selectly-notification'];

    if (ignoreTags.includes(element.tagName)) {
      return true;
    }

    for (const className of ignoreClasses) {
      if (element.closest(`.${className}`)) {
        return true;
      }
    }

    return false;
  }

  private isEditableElement(element: HTMLElement): boolean {
    const editableTags = ['INPUT', 'TEXTAREA'];

    if (editableTags.includes(element.tagName)) {
      return true;
    }

    if (element.contentEditable === 'true') {
      return true;
    }

    let parent = element.parentElement;
    while (parent) {
      if (parent.contentEditable === 'true') {
        return true;
      }
      parent = parent.parentElement;
    }

    return false;
  }

  private cacheCurrentSelection() {
    try {
      if (!this.currentTarget) return;
      if (this.currentTarget.tagName === 'INPUT' || this.currentTarget.tagName === 'TEXTAREA') {
        const input = this.currentTarget as HTMLInputElement | HTMLTextAreaElement;
        this.inputSelectionStart = input.selectionStart;
        this.inputSelectionEnd = input.selectionEnd;
      } else if (this.isEditableElement(this.currentTarget)) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          this.contentEditableRange = sel.getRangeAt(0).cloneRange();
        }
      }
    } catch (e) {}
  }

  public restoreFocusSelection() {
    try {
      if (!this.currentTarget) return;
      if (this.currentTarget.tagName === 'INPUT' || this.currentTarget.tagName === 'TEXTAREA') {
        const input = this.currentTarget as HTMLInputElement | HTMLTextAreaElement;
        input.focus();
        const start = this.inputSelectionStart ?? input.selectionStart ?? 0;
        const end = this.inputSelectionEnd ?? input.selectionEnd ?? start;
        input.setSelectionRange(start, end);
      } else if (this.isEditableElement(this.currentTarget)) {
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          if (this.contentEditableRange) {
            sel.addRange(this.contentEditableRange);
          }
        }
        (this.currentTarget as HTMLElement).focus({ preventScroll: true });
      }
    } catch (e) {}
  }

  public updateCachedSelection() {
    // Update the cached selection to current selection state
    // This ensures restoreFocusSelection() will restore the current selection, not the original one
    this.cacheCurrentSelection();
  }

  private replaceSelectedText(newText: string) {
    if (!this.currentSelection || !this.currentTarget) {
      console.warn('[Selectly] No current selection to replace');
      return;
    }

    try {
      if (this.currentTarget.tagName === 'INPUT' || this.currentTarget.tagName === 'TEXTAREA') {
        const input = this.currentTarget as HTMLInputElement | HTMLTextAreaElement;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const value = input.value;

        input.value = value.substring(0, start) + newText + value.substring(end);

        const newPosition = start + newText.length;
        input.setSelectionRange(newPosition, newPosition);

        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);
      } else if (this.isEditableElement(this.currentTarget)) {
        if (this.currentSelection.rangeCount > 0) {
          const range = this.currentSelection.getRangeAt(0);
          range.deleteContents();

          const textNode = document.createTextNode(newText);
          range.insertNode(textNode);

          range.setStartAfter(textNode);
          range.setEndAfter(textNode);
          this.currentSelection.removeAllRanges();
          this.currentSelection.addRange(range);

          const event = new Event('input', { bubbles: true });
          this.currentTarget.dispatchEvent(event);
        }
      }
    } catch (error) {
      console.error('[Selectly] Error replacing text:', error);
    }
  }

  private isEventFromOurComponents(event: MouseEvent | TouchEvent): boolean {
    const target = event.target as HTMLElement;

    if (this.buttonsHost && (target === this.buttonsHost || this.buttonsHost.contains(target))) {
      return true;
    }

    if (
      this.streamingHost &&
      (target === this.streamingHost || this.streamingHost.contains(target))
    ) {
      return true;
    }

    if ('composedPath' in event && typeof event.composedPath === 'function') {
      const path = event.composedPath();
      for (const element of path) {
        if (element === this.buttonsHost || element === this.streamingHost) {
          return true;
        }
        if (element instanceof HTMLElement) {
          if (
            element.closest('#selectly-buttons-host') ||
            element.closest('#selectly-streaming-host') ||
            element.classList.contains('selectly-buttons') ||
            element.classList.contains('selectly-streaming-result') ||
            element.classList.contains('action-btn')
          ) {
            return true;
          }
        }
      }
    }

    const checkElement = (el: HTMLElement): boolean => {
      if (!el) return false;

      if (
        el.id === 'selectly-buttons-host' ||
        el.id === 'selectly-streaming-host' ||
        el.classList.contains('selectly-buttons') ||
        el.classList.contains('selectly-streaming-result') ||
        el.classList.contains('action-btn') ||
        el.classList.contains('glass-button')
      ) {
        return true;
      }

      if (el.parentElement) {
        return checkElement(el.parentElement);
      }

      return false;
    };

    return checkElement(target);
  }

  private calculateButtonPosition(): { x: number; y: number } | null {
    let rect: DOMRect | null = null;

    // Try to use current selection
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const currentRect = range.getBoundingClientRect();

      // Check if current selection rect is valid
      if (currentRect.width > 0 || currentRect.height > 0) {
        rect = currentRect;
      }
    }

    // If it's an input field, try calculating based on input position
    if (
      !rect &&
      this.currentTarget &&
      (this.currentTarget.tagName === 'INPUT' || this.currentTarget.tagName === 'TEXTAREA')
    ) {
      const inputRect = this.currentTarget.getBoundingClientRect();
      if (inputRect.width > 0 || inputRect.height > 0) {
        rect = inputRect;
      }
    }

    // If selection rect is invalid, use last mouse position
    if (!rect && this.lastMousePosition) {
      const mouseX = this.lastMousePosition.x;
      const mouseY = this.lastMousePosition.y;

      // Calculate button dimensions
      const enabledFunctions = Object.values(this.userConfig.functions).filter((f) => f.enabled);
      const buttonWidth = enabledFunctions.length * 32 + 8;
      const buttonHeight = 32;
      const buttonPosition = this.userConfig.general?.buttonPosition || 'above';

      // Use mouse position as reference
      let x = mouseX; // Left-aligned
      let y: number;

      // Determine vertical position based on configured button position
      if (buttonPosition === 'below') {
        y = mouseY + 15; // 在鼠标下方
      } else {
        y = mouseY - buttonHeight - 15; // Above mouse
      }

      // Handle boundaries
      if (x + buttonWidth > window.innerWidth) {
        x = window.innerWidth - buttonWidth - 10;
      }
      if (x < 10) {
        x = 10;
      }

      // Handle Y boundary and switch position if needed
      if (buttonPosition === 'above' && y < 10) {
        y = mouseY + 15; // 切换到鼠标下方
      } else if (buttonPosition === 'below' && y + buttonHeight > window.innerHeight) {
        y = mouseY - buttonHeight - 15; // 切换到鼠标上方
      }

      return { x, y };
    }

    // If all methods fail, return null
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      console.warn(
        '[Selectly] No valid selection rect or mouse position found, skipping button positioning'
      );
      return null;
    }

    // Calculate button width and height
    const enabledFunctions = Object.values(this.userConfig.functions).filter((f) => f.enabled);
    const buttonWidth = enabledFunctions.length * 32 + 8;
    const buttonHeight = 32;
    const buttonPosition = this.userConfig.general?.buttonPosition || 'above';

    // Use left edge of selected text rect as X coordinate reference (left-aligned)
    let x = rect.left;
    if (this.lastMousePosition) {
      x = this.lastMousePosition.x;
      if (x > rect.right) {
        x = rect.right;
      } else if (x < rect.left) {
        x = rect.left;
      }
    }

    // Vertical position: closer to selected text
    let y: number;
    if (buttonPosition === 'below') {
      y = rect.bottom + 10; // 在选中文字正下方，只留10px间距
    } else {
      y = rect.top - buttonHeight - 10; // 在选中文字正上方，只留10px间距
    }

    // Handle X boundary (ensure button doesn't exceed left/right screen edges)
    if (x + buttonWidth > window.innerWidth) {
      x = window.innerWidth - buttonWidth - 10;
    }
    if (x < 10) {
      x = 10;
    }

    // Handle Y boundary (screen top/bottom edges, switch to opposite position if needed)
    if (buttonPosition === 'above' && y < 10) {
      y = rect.bottom + 10; // 切换到下方
    } else if (buttonPosition === 'below' && y + buttonHeight > window.innerHeight) {
      y = rect.top - buttonHeight - 10; // 切换到上方
    }

    return { x, y };
  }

  private handleSelectionUpdate = (newSelectedText: string) => {
    // Update current selection and target element
    const selection = window.getSelection();
    if (selection) {
      this.currentSelection = selection;
    }

    // Use unified position calculation method
    const position = this.calculateButtonPosition();
    if (!position) {
      return;
    }

    // Re-render button component with new selected text and calculated position
    if (this.root && this.isShowingButtons) {
      this.root.render(
        <ActionButtons
          selectedText={newSelectedText}
          x={position.x}
          y={position.y}
          onClose={() => this.hideButtons()}
          onSelectionUpdate={this.handleSelectionUpdate}
          userConfig={this.userConfig}
        />
      );
    }
  };

  private showButtons(selectedText: string, event: MouseEvent | TouchEvent) {
    this.hideButtons();

    const host = window.location.hostname.toLowerCase();
    const domainMatch = (list?: string[]) => {
      if (!list || list.length === 0) return true;
      return list.some((d) => {
        const domain = d.toLowerCase().trim();
        if (!domain) return false;
        if (domain.startsWith('.')) {
          return host.endsWith(domain) && host !== domain.slice(1);
        }
        return host === domain || host.endsWith('.' + domain);
      });
    };
    const autoExecuteFunctions = Object.entries(this.userConfig.functions).filter(
      ([_, config]) =>
        config.enabled && config.autoExecute && domainMatch(config.autoExecuteDomains)
    );

    // Use unified position calculation method based on window.getSelection()
    const position = this.calculateButtonPosition();
    if (!position) {
      return;
    }

    this.buttonsHost = document.createElement('div');
    this.buttonsHost.id = 'selectly-buttons-host';
    const shadow = this.buttonsHost.attachShadow({ mode: 'open' });
    document.body.appendChild(this.buttonsHost);

    const styleEl = document.createElement('style');
    styleEl.textContent = this.styleContent;
    shadow.appendChild(styleEl);

    this.container = document.createElement('div');
    shadow.appendChild(this.container);

    this.root = createRoot(this.container);
    this.root.render(
      <ActionButtons
        selectedText={selectedText}
        x={position.x}
        y={position.y}
        onClose={() => this.hideButtons()}
        onSelectionUpdate={this.handleSelectionUpdate}
        userConfig={this.userConfig}
      />
    );

    this.isShowingButtons = true;

    // Trigger auto-execution after the buttons have mounted so UI callbacks are registered
    if (autoExecuteFunctions.length > 0) {
      const [actionKey, functionConfig] = autoExecuteFunctions[0];

      // Check if we should skip auto-execution for copy function in editable elements
      const shouldSkipAutoExecution =
        this.currentTarget && this.isEditableElement(this.currentTarget) && actionKey === 'copy';

      if (!shouldSkipAutoExecution) {
        // Defer to next macrotask to allow React effects (notify handlers) to run
        setTimeout(() => {
          try {
            const actionService = ActionService.getInstance();
            actionService.executeAction(actionKey, selectedText, functionConfig);
          } catch (e) {
            // noop
          }
        }, 0);
      }
    }
  }

  private hideButtons() {
    if (this.root) {
      try {
        this.root.unmount();
      } catch {}
    }
    if (this.container) {
      this.container.remove();
    }
    if (this.buttonsHost) {
      this.buttonsHost.remove();
    }
    this.container = null;
    this.root = null;
    this.buttonsHost = null;
    this.isShowingButtons = false;
  }

  private mountStreamingHost(actionKey?: string) {
    const streamingHost = document.createElement('div');
    streamingHost.id = 'selectly-streaming-host';
    if (actionKey) {
      (streamingHost as any).actionKey = actionKey;
    }
    const shadow = streamingHost.attachShadow({ mode: 'open' });
    document.body.appendChild(streamingHost);

    const styleEl = document.createElement('style');
    styleEl.textContent = this.styleContent;
    shadow.appendChild(styleEl);

    const streamingContainer = document.createElement('div');
    shadow.appendChild(streamingContainer);

    const streamingRoot = createRoot(streamingContainer);

    let pinned = false;

    const cleanup = (force = false) => {
      if (pinned && !force) {
        return false;
      }

      const isActiveInstance = this.streamingRoot === streamingRoot;
      const globalAny = window as any;
      let preservedUpdate: any;
      let preservedAppend: any;
      let preservedMeta: any;
      let preservedPinnedFn: any;
      let preservedPinnedValue: any;
      const hasPreservedUpdate =
        !isActiveInstance &&
        Object.prototype.hasOwnProperty.call(globalAny, 'updateStreamingResult');
      const hasPreservedAppend =
        !isActiveInstance &&
        Object.prototype.hasOwnProperty.call(globalAny, 'appendToConversation');
      const hasPreservedMeta =
        !isActiveInstance && Object.prototype.hasOwnProperty.call(globalAny, 'updateStreamingMeta');
      const hasPreservedPinnedFn =
        !isActiveInstance &&
        Object.prototype.hasOwnProperty.call(globalAny, 'isStreamingResultPinned');
      const hasPreservedPinnedValue =
        !isActiveInstance &&
        Object.prototype.hasOwnProperty.call(globalAny, 'selectlyStreamingPinned');

      if (hasPreservedUpdate) preservedUpdate = globalAny.updateStreamingResult;
      if (hasPreservedAppend) preservedAppend = globalAny.appendToConversation;
      if (hasPreservedMeta) preservedMeta = globalAny.updateStreamingMeta;
      if (hasPreservedPinnedFn) preservedPinnedFn = globalAny.isStreamingResultPinned;
      if (hasPreservedPinnedValue) preservedPinnedValue = globalAny.selectlyStreamingPinned;

      try {
        streamingRoot.unmount();
      } catch {}

      if (isActiveInstance) {
        this.streamingRoot = null;
        this.currentSelection = null;
        this.currentTarget = null;
        this.inputSelectionStart = null;
        this.inputSelectionEnd = null;
        this.contentEditableRange = null;
        delete globalAny.updateStreamingResult;
        delete globalAny.appendToConversation;
        delete globalAny.updateStreamingMeta;
        delete globalAny.isStreamingResultPinned;
        delete globalAny.selectlyStreamingPinned;
        this.hideSharePreview();
      } else {
        if (hasPreservedUpdate) globalAny.updateStreamingResult = preservedUpdate;
        if (hasPreservedAppend) globalAny.appendToConversation = preservedAppend;
        if (hasPreservedMeta) globalAny.updateStreamingMeta = preservedMeta;
        if (hasPreservedPinnedFn) globalAny.isStreamingResultPinned = preservedPinnedFn;
        if (hasPreservedPinnedValue) globalAny.selectlyStreamingPinned = preservedPinnedValue;
      }

      if (this.streamingContainer === streamingContainer) {
        this.streamingContainer = null;
      }
      streamingContainer.remove();

      if (this.streamingHost === streamingHost) {
        this.streamingHost = null;
      }
      streamingHost.remove();

      if (this.streamingCleanup === cleanup) {
        this.streamingCleanup = null;
      }

      return true;
    };

    this.streamingHost = streamingHost;
    this.streamingContainer = streamingContainer;
    this.streamingRoot = streamingRoot;
    this.streamingCleanup = cleanup;

    return {
      root: streamingRoot,
      cleanup,
      setPinned: (value: boolean) => {
        pinned = value;
      },
    };
  }

  showStreamingResult(
    title: string,
    x: number,
    y: number,
    minWidth: number,
    maxWidth: number,
    actionKey?: string
  ) {
    this.hideStreamingResult();
    const { selectedText: ctxSelectedText, sentence: ctxSentence } = this.getSelectionContext();

    const canPaste = this.currentTarget ? this.isEditableElement(this.currentTarget) : false;
    const shouldAutoFocus = !(this.currentTarget && canPaste);
    const { root, setPinned, cleanup } = this.mountStreamingHost(actionKey);

    root.render(
      <StreamingResult
        title={title}
        x={x}
        y={y}
        minWidth={minWidth}
        maxWidth={maxWidth}
        actionKey={actionKey}
        selectedText={ctxSelectedText}
        selectedSentence={ctxSentence}
        canPaste={canPaste}
        autoFocusInput={shouldAutoFocus}
        onPaste={
          canPaste
            ? (content: string) => {
                this.replaceSelectedText(content);
                cleanup(true);
              }
            : undefined
        }
        onPinChange={setPinned}
        onClose={() => cleanup(true)}
      />
    );
  }

  showDialogueResult(title: string, x: number, y: number, selectedText: string, config: any) {
    this.hideStreamingResult();
    const canPaste = this.currentTarget ? this.isEditableElement(this.currentTarget) : false;
    const shouldAutoFocus = !(this.currentTarget && canPaste);

    const { root, setPinned, cleanup } = this.mountStreamingHost('chat');

    const conversationContext: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> =
      [];
    if (config?.prompt) {
      const variables: Record<string, string> = {};
      conversationContext.push({
        role: 'system',
        content: processText(selectedText, config.prompt, variables),
      });
    }

    root.render(
      <StreamingResult
        title={title}
        x={x}
        y={y}
        minWidth={420}
        maxWidth={600}
        actionKey="chat"
        canPaste={canPaste}
        isDialogue={true}
        selectedText={selectedText}
        autoFocusInput={shouldAutoFocus}
        onSendMessage={(message: string) => {
          this.handleDialogueMessage(message, config, conversationContext, selectedText);
        }}
        onPaste={
          canPaste
            ? (content: string) => {
                this.replaceSelectedText(content);
                cleanup(true);
              }
            : undefined
        }
        onPinChange={setPinned}
        onClose={() => cleanup(true)}
      />
    );
  }

  private async handleDialogueMessage(
    message: string,
    config: any,
    conversationContext: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    selectedText?: string
  ) {
    const llmService = LLMService.getInstance();

    conversationContext.push({ role: 'user', content: message });

    const appendFn = (window as any).appendToConversation;
    if (appendFn) {
      appendFn('user', message);
    }

    try {
      let assistantResponse = '';

      await llmService.chatStream(
        conversationContext.map((m) => ({ role: m.role, content: m.content })),
        (chunk: string, model: string) => {
          assistantResponse += chunk;
          const updateFn = (window as any).updateStreamingResult;
          if (updateFn) {
            updateFn(chunk, model, false, false, false);
          }
        },
        config.model
      );

      conversationContext.push({ role: 'assistant', content: assistantResponse });

      const updateFn = (window as any).updateStreamingResult;
      if (updateFn) {
        updateFn('', '', true, false, false);
      }
    } catch (error: any) {
      const updateFn = (window as any).updateStreamingResult;
      if (updateFn) {
        updateFn(error.message || 'Unknown error', '', true, true, false);
      }
    }
  }

  showErrorResult(title: string, message: string, x?: number, y?: number, actionKey?: string) {
    this.hideStreamingResult();
    const defaultX = x || 100;
    const defaultY = y || 100;

    const canPaste = false;
    const { root, setPinned, cleanup } = this.mountStreamingHost(actionKey);

    root.render(
      <StreamingResult
        title={title}
        x={defaultX}
        y={defaultY}
        canPaste={canPaste}
        onPinChange={setPinned}
        onClose={() => cleanup(true)}
      />
    );

    setTimeout(() => {
      const updateFn = (window as any).updateStreamingResult;
      if (updateFn) {
        updateFn(message, '', true, true);
      }
    }, 100);
  }

  showSharePreview(imageBlob: Blob, selectedText: string) {
    this.hideSharePreview();

    this.sharePreviewHost = document.createElement('div');
    this.sharePreviewHost.id = 'selectly-share-preview-host';
    const shadow = this.sharePreviewHost.attachShadow({ mode: 'open' });
    document.body.appendChild(this.sharePreviewHost);

    const styleEl = document.createElement('style');
    styleEl.textContent = this.styleContent;
    shadow.appendChild(styleEl);

    this.sharePreviewContainer = document.createElement('div');
    shadow.appendChild(this.sharePreviewContainer);

    this.sharePreviewRoot = createRoot(this.sharePreviewContainer);
    this.sharePreviewRoot.render(
      <SharePreview
        imageBlob={imageBlob}
        selectedText={selectedText}
        onClose={() => this.hideSharePreview()}
      />
    );
  }

  hideSharePreview() {
    if (this.sharePreviewRoot) {
      try {
        this.sharePreviewRoot.unmount();
      } catch {}
      this.sharePreviewRoot = null;
    }
    if (this.sharePreviewContainer) {
      this.sharePreviewContainer.remove();
      this.sharePreviewContainer = null;
    }
    if (this.sharePreviewHost) {
      this.sharePreviewHost.remove();
      this.sharePreviewHost = null;
    }
  }

  hideStreamingResult(forceClose = false) {
    if (!this.streamingCleanup) {
      return;
    }

    this.streamingCleanup(forceClose);
  }

  /**
   * Setup iframe monitoring to detect dynamically added iframes
   * and attach event listeners to their content documents
   */
  private setupIframeMonitoring() {
    // Process existing iframes
    const existingIframes = document.querySelectorAll('iframe');
    existingIframes.forEach((iframe) => this.attachIframeListeners(iframe));

    // Watch for new iframes
    this.iframeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLIFrameElement) {
            this.attachIframeListeners(node);
          } else if (node instanceof HTMLElement) {
            // Check descendants for iframes
            const iframes = node.querySelectorAll('iframe');
            iframes.forEach((iframe) => this.attachIframeListeners(iframe));
          }
        });
      });
    });

    // Observe the entire document for iframe additions
    this.iframeObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Attach event listeners to an iframe's content document
   * Handles both immediate attachment and waiting for iframe load
   */
  private attachIframeListeners(iframe: HTMLIFrameElement) {
    // Skip if already tracked
    if (this.trackedIframes.has(iframe)) {
      return;
    }

    const tryAttach = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) {
          // Cross-origin iframe or not yet loaded
          return false;
        }

        // Same-origin iframe - attach listeners
        this.trackedIframes.add(iframe);

        const boundHandler = this.handleTextSelection.bind(this);
        iframeDoc.addEventListener('mouseup', boundHandler);
        iframeDoc.addEventListener('touchend', boundHandler);

        console.debug('[Selectly] Attached listeners to iframe:', iframe.src || 'about:blank');
        return true;
      } catch (e) {
        // Cross-origin access denied - content script will be injected by Chrome
        // due to "all_frames: true" in manifest
        console.debug(
          '[Selectly] Cross-origin iframe detected (content script will handle):',
          iframe.src
        );
        this.trackedIframes.add(iframe); // Mark as processed to avoid retries
        return true;
      }
    };

    // Try immediate attachment
    if (!tryAttach()) {
      // Wait for iframe to load
      const loadHandler = () => {
        tryAttach();
        iframe.removeEventListener('load', loadHandler);
      };
      iframe.addEventListener('load', loadHandler);
    }
  }

  /**
   * Calculate absolute position considering iframe offset
   * Translates coordinates from iframe context to top-level document
   */
  private calculateAbsolutePosition(
    event: MouseEvent | TouchEvent
  ): { x: number; y: number } | null {
    try {
      let clientX: number, clientY: number;

      if ('clientX' in event && 'clientY' in event) {
        clientX = event.clientX;
        clientY = event.clientY;
      } else if ('touches' in event && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else {
        return null;
      }

      const target = event.target as HTMLElement;
      const doc = target.ownerDocument;

      // If selection is in an iframe, calculate offset
      if (doc !== document) {
        // Find the iframe element that contains this document
        const iframes = Array.from(document.querySelectorAll('iframe'));
        const containingIframe = iframes.find((iframe) => {
          try {
            return iframe.contentDocument === doc || iframe.contentWindow?.document === doc;
          } catch {
            return false;
          }
        });

        if (containingIframe) {
          const iframeRect = containingIframe.getBoundingClientRect();
          return {
            x: clientX + iframeRect.left + window.scrollX,
            y: clientY + iframeRect.top + window.scrollY,
          };
        }
      }

      // Not in iframe or couldn't find iframe - use direct coordinates
      return { x: clientX, y: clientY };
    } catch (e) {
      console.warn('[Selectly] Error calculating absolute position:', e);
      return null;
    }
  }
}
