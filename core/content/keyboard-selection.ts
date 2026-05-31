import { getTextControlSelectedText, isTextControlElement } from './text-control-selection';

export interface KeyboardSelection {
  target: HTMLElement;
  selectedText: string;
}

const MODIFIER_KEYS = new Set(['Alt', 'Control', 'Meta', 'Shift']);
const SELECTION_NAVIGATION_KEYS = new Set([
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'End',
  'Home',
  'PageDown',
  'PageUp',
]);

function shouldFlushAfterKeyDown(event: KeyboardEvent): boolean {
  const isSelectAll = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a';
  return isSelectAll || (event.shiftKey && SELECTION_NAVIGATION_KEYS.has(event.key));
}

function isHTMLElement(target: EventTarget | Element | null): target is HTMLElement {
  return typeof (target as HTMLElement | null)?.tagName === 'string';
}

function getSelectionTarget(
  source: Document,
  eventTarget: EventTarget | null,
  keyboardTarget: EventTarget | null
): HTMLElement | null {
  if (isTextControlElement(eventTarget)) {
    return eventTarget;
  }

  if (isTextControlElement(keyboardTarget)) {
    return keyboardTarget;
  }

  if (isHTMLElement(keyboardTarget)) {
    return keyboardTarget;
  }

  if (isHTMLElement(source.activeElement)) {
    return source.activeElement;
  }

  return source.body;
}

function readKeyboardSelection(
  source: Document,
  eventTarget: EventTarget | null,
  keyboardTarget: EventTarget | null
): KeyboardSelection | null {
  const target = getSelectionTarget(source, eventTarget, keyboardTarget);
  if (!target) {
    return null;
  }

  return {
    target,
    selectedText: isTextControlElement(target)
      ? getTextControlSelectedText(target)
      : source.getSelection()?.toString().trim() || '',
  };
}

export function observeKeyboardSelection(
  source: Document,
  onSelectionChange: (selection: KeyboardSelection) => void
): () => void {
  let keyboardTarget: EventTarget | null = null;
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  const clearPendingSelection = () => {
    keyboardTarget = null;
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
  };

  const flushPendingSelection = (eventTarget: EventTarget | null = null) => {
    if (!keyboardTarget) {
      return;
    }

    const selection = readKeyboardSelection(source, eventTarget, keyboardTarget);
    clearPendingSelection();
    if (selection) {
      onSelectionChange(selection);
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' || MODIFIER_KEYS.has(event.key)) {
      return;
    }

    keyboardTarget = event.target;
    if (flushTimer) {
      clearTimeout(flushTimer);
    }
    flushTimer = setTimeout(
      shouldFlushAfterKeyDown(event) ? flushPendingSelection : clearPendingSelection,
      0
    );
  };

  const handleSelectionChange = (event: Event) => {
    flushPendingSelection(event.target);
  };

  source.addEventListener('keydown', handleKeyDown, true);
  source.addEventListener('selectionchange', handleSelectionChange, true);

  return () => {
    clearPendingSelection();
    source.removeEventListener('keydown', handleKeyDown, true);
    source.removeEventListener('selectionchange', handleSelectionChange, true);
  };
}
