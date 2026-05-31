export type TextControlElement = HTMLInputElement | HTMLTextAreaElement;

export interface TextControlSelection {
  target: TextControlElement;
  selectedText: string;
}

interface KeyboardEventSource {
  addEventListener(type: 'keyup', listener: (event: KeyboardEvent) => void): void;
  removeEventListener(type: 'keyup', listener: (event: KeyboardEvent) => void): void;
}

export function isTextControlElement(target: EventTarget | null): target is TextControlElement {
  const tagName = (target as HTMLElement | null)?.tagName;
  return tagName === 'INPUT' || tagName === 'TEXTAREA';
}

export function getTextControlSelectedText(target: EventTarget | null): string {
  if (!isTextControlElement(target)) {
    return '';
  }

  const start = target.selectionStart ?? 0;
  const end = target.selectionEnd ?? start;
  return target.value.substring(start, end).trim();
}

export function observeTextControlKeyboardSelection(
  source: KeyboardEventSource,
  onSelectionChange: (selection: TextControlSelection) => void
): () => void {
  const handleKeyUp = (event: KeyboardEvent) => {
    if (!isTextControlElement(event.target)) {
      return;
    }

    onSelectionChange({
      target: event.target,
      selectedText: getTextControlSelectedText(event.target),
    });
  };

  source.addEventListener('keyup', handleKeyUp);
  return () => source.removeEventListener('keyup', handleKeyUp);
}
