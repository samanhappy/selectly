export type TextControlElement = HTMLInputElement | HTMLTextAreaElement;

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
