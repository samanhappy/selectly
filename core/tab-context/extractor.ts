import { Readability } from '@mozilla/readability';

import { estimateTokensFromChars } from './budget';
import type {
  ModelContextBudget,
  TabContextBlock,
  TabContextSnapshot,
  TabContextSource,
} from './types';
import { normalizePageUrl } from './url';

export const TAB_CONTEXT_EXTRACTOR_VERSION = 'tab-context-v1';

export const TAB_CONTEXT_BLOCK_SELECTOR = [
  'h1',
  'h2',
  'h3',
  'h4',
  'p',
  'li',
  'blockquote',
  'pre',
  'td',
  'th',
  'textarea',
  'input:not([type])',
  'input[type="email"]',
  'input[type="number"]',
  'input[type="search"]',
  'input[type="tel"]',
  'input[type="text"]',
  'input[type="url"]',
  '[contenteditable="true"]',
  '[contenteditable="plaintext-only"]',
  '[role="textbox"]',
].join(',');

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'CANVAS']);
const TEXT_INPUT_TYPES = new Set(['', 'email', 'number', 'search', 'tel', 'text', 'url']);
const DEFAULT_MIN_BLOCK_CHARS = 24;
const COMPACT_CONTENT_MIN_CHARS = 4;

const createId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const normalizeText = (text: string): string => text.replace(/\s+/g, ' ').trim();

const isElementVisible = (element: Element): boolean => {
  if (!(element instanceof HTMLElement)) return true;
  if (element.hidden || element.getAttribute('aria-hidden') === 'true') return false;

  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
};

const getDocumentLanguage = (doc: Document): string =>
  doc.documentElement.lang ||
  doc.querySelector('html')?.getAttribute('lang') ||
  navigator.language ||
  'en';

const readSelectionText = (): string => {
  try {
    return window.getSelection()?.toString().trim() || '';
  } catch {
    return '';
  }
};

const getHeadingForElement = (element: Element): string | undefined => {
  if (/^H[1-4]$/.test(element.tagName)) {
    return normalizeText(element.textContent || '') || undefined;
  }

  let current: Element | null = element.previousElementSibling;
  while (current) {
    if (/^H[1-4]$/.test(current.tagName)) {
      return normalizeText(current.textContent || '') || undefined;
    }
    current = current.previousElementSibling;
  }

  return undefined;
};

const isCompactContentElement = (element: Element): boolean => {
  if (/^H[1-4]$/.test(element.tagName)) return true;
  if (element.tagName === 'LI') return true;
  if (element.tagName === 'TEXTAREA') return true;
  if (element.tagName === 'INPUT') {
    const type = (element.getAttribute('type') || '').toLowerCase();
    return TEXT_INPUT_TYPES.has(type);
  }
  return element.matches(
    '[contenteditable="true"], [contenteditable="plaintext-only"], [role="textbox"]'
  );
};

const readElementText = (element: Element): string => {
  if (element.tagName === 'TEXTAREA') {
    const value = (element as HTMLTextAreaElement).value || element.textContent || '';
    return normalizeText(value);
  }

  if (element.tagName === 'INPUT') {
    const type = (element.getAttribute('type') || '').toLowerCase();
    if (!TEXT_INPUT_TYPES.has(type)) return '';

    const value = (element as HTMLInputElement).value || element.getAttribute('value') || '';
    return normalizeText(value);
  }

  return normalizeText(element.textContent || '');
};

const collectDomBlocks = (doc: Document, frameUrl?: string): TabContextBlock[] => {
  const blocks: TabContextBlock[] = [];
  const seen = new Set<string>();
  const elements = Array.from(doc.body?.querySelectorAll(TAB_CONTEXT_BLOCK_SELECTOR) || []);

  for (const element of elements) {
    if (SKIP_TAGS.has(element.tagName) || !isElementVisible(element)) continue;
    if (element.closest('script, style, noscript, template, svg, canvas')) continue;
    if (element.matches('select, button, nav, footer')) continue;

    const text = readElementText(element);
    const minChars = isCompactContentElement(element)
      ? COMPACT_CONTENT_MIN_CHARS
      : DEFAULT_MIN_BLOCK_CHARS;
    if (text.length < minChars) continue;
    if (seen.has(text)) continue;
    seen.add(text);

    blocks.push({
      id: `b${blocks.length + 1}`,
      order: blocks.length,
      heading: getHeadingForElement(element),
      text,
      charCount: text.length,
      frameUrl,
    });
  }

  return blocks;
};

const readWithReadability = (doc: Document): { text: string; title?: string } | null => {
  try {
    const clone = doc.cloneNode(true) as Document;
    const article = new Readability(clone).parse();
    const text = normalizeText(article?.textContent || '');
    if (!text || text.length < 120) return null;
    return {
      text,
      title: article?.title || undefined,
    };
  } catch {
    return null;
  }
};

const normalizeComparableText = (text: string): string => normalizeText(text).toLowerCase();

const isTextCoveredBy = (text: string, container: string): boolean => {
  const normalizedText = normalizeComparableText(text);
  const normalizedContainer = normalizeComparableText(container);
  return normalizedText.length > 0 && normalizedContainer.includes(normalizedText);
};

const createReadabilityBlock = (
  readability: { text: string; title?: string },
  docTitle: string,
  url: string
): TabContextBlock => ({
  id: 'b1',
  order: 0,
  heading: readability.title || docTitle || undefined,
  text: readability.text,
  charCount: readability.text.length,
  frameUrl: url,
});

const mergeReadabilityAndDomBlocks = (
  readability: { text: string; title?: string },
  domBlocks: TabContextBlock[],
  docTitle: string,
  url: string
): TabContextBlock[] => {
  const readabilityBlock = createReadabilityBlock(readability, docTitle, url);
  const supplementalDomBlocks = domBlocks.filter(
    (block) => !isTextCoveredBy(block.text, readability.text)
  );

  if (supplementalDomBlocks.length === 0) {
    return [readabilityBlock];
  }

  const domHasReadabilityBlock = domBlocks.some((block) =>
    isTextCoveredBy(readability.text, block.text)
  );

  if (domHasReadabilityBlock) {
    return domBlocks;
  }

  return [readabilityBlock, ...supplementalDomBlocks];
};

const trimBlocksToBudget = (
  blocks: TabContextBlock[],
  maxContextChars: number
): { blocks: TabContextBlock[]; text: string; includedChars: number; truncated: boolean } => {
  const included: TabContextBlock[] = [];
  let includedChars = 0;
  let truncated = false;

  for (const block of blocks) {
    if (includedChars >= maxContextChars) {
      truncated = true;
      break;
    }

    const remaining = maxContextChars - includedChars;
    const nextText =
      block.text.length > remaining
        ? block.text.slice(0, Math.max(0, remaining)).trim()
        : block.text;
    if (nextText.length < block.text.length) truncated = true;
    if (!nextText) continue;

    included.push({
      ...block,
      text: nextText,
      charCount: nextText.length,
      order: included.length,
    });
    includedChars += nextText.length + 2;
  }

  return {
    blocks: included,
    text: included
      .map((block) => (block.heading ? `${block.heading}\n${block.text}` : block.text))
      .join('\n\n'),
    includedChars,
    truncated,
  };
};

const collectAccessibleFrameBlocks = (
  doc: Document
): { blocks: TabContextBlock[]; frameCount: number; skippedFrameCount: number } => {
  const frames = Array.from(doc.querySelectorAll('iframe'));
  const blocks: TabContextBlock[] = [];
  let skippedFrameCount = 0;

  for (const frame of frames) {
    try {
      const frameDoc = frame.contentDocument;
      if (!frameDoc?.body) {
        skippedFrameCount += 1;
        continue;
      }
      blocks.push(...collectDomBlocks(frameDoc, frame.src || frameDoc.location.href));
    } catch {
      skippedFrameCount += 1;
    }
  }

  return { blocks, frameCount: frames.length + 1, skippedFrameCount };
};

export const captureTabContextSnapshot = (
  doc: Document,
  budget: ModelContextBudget
): TabContextSnapshot => {
  const url = doc.location.href;
  const normalizedUrl = normalizePageUrl(url);
  const hostname = doc.location.hostname;
  const readability = readWithReadability(doc);
  const domBlocks = collectDomBlocks(doc, url);
  const frameResult = collectAccessibleFrameBlocks(doc);
  let source: TabContextSource = 'dom';
  let blocks: TabContextBlock[] = [];

  if (readability) {
    source = 'readability';
    blocks.push(...mergeReadabilityAndDomBlocks(readability, domBlocks, doc.title, url));
  } else {
    blocks.push(...domBlocks);
  }

  blocks.push(...frameResult.blocks);
  if (blocks.length === 0) source = 'empty';

  const orderedBlocks = blocks.map((block, index) => ({
    ...block,
    id: `b${index + 1}`,
    order: index,
  }));
  const totalChars = orderedBlocks.reduce((sum, block) => sum + block.charCount, 0);
  const trimmed = trimBlocksToBudget(orderedBlocks, budget.maxContextChars);

  return {
    id: createId('ctx'),
    url,
    normalizedUrl,
    title: readability?.title || doc.title || url,
    hostname,
    language: getDocumentLanguage(doc),
    capturedAt: Date.now(),
    extractorVersion: TAB_CONTEXT_EXTRACTOR_VERSION,
    source,
    text: trimmed.text,
    blocks: trimmed.blocks,
    selectedText: readSelectionText(),
    stats: {
      totalChars,
      includedChars: trimmed.includedChars,
      blockCount: trimmed.blocks.length,
      frameCount: frameResult.frameCount,
      skippedFrameCount: frameResult.skippedFrameCount,
      truncated: trimmed.truncated,
      maxContextChars: budget.maxContextChars,
      maxContextTokens: budget.maxContextTokens || estimateTokensFromChars(budget.maxContextChars),
    },
  };
};
