import type { FunctionConfig, UserConfig } from '../config/llm-config';

export type ShortcutValidationCode = 'incomplete' | 'reserved' | 'duplicate';
export type ShortcutWarningCode = 'web-conflict-risk';

export interface ShortcutValidationResult {
  valid: boolean;
  chord?: string;
  error?: ShortcutValidationCode;
  warning?: ShortcutWarningCode;
  conflictKey?: string;
}

export interface FunctionShortcutMatch {
  actionKey: string;
  config: FunctionConfig;
  chord: string;
}

export interface ShortcutDisplayPart {
  value: string;
  kind: 'modifier' | 'separator' | 'key';
}

type ModifierToken = 'Mod' | 'Meta' | 'Ctrl' | 'Alt' | 'Shift';

const MODIFIER_KEYS = new Set([
  'Alt',
  'Control',
  'Ctrl',
  'Meta',
  'Shift',
  'OS',
  'Command',
  'Cmd',
  'Option',
  'MacCtrl',
]);

const RESERVED_SHORTCUTS = new Set([
  'Ctrl+L',
  'Ctrl+N',
  'Ctrl+R',
  'Ctrl+Shift+R',
  'Ctrl+T',
  'Ctrl+W',
  'Meta+L',
  'Meta+N',
  'Meta+R',
  'Meta+Shift+R',
  'Meta+T',
  'Meta+W',
  'Mod+L',
  'Mod+N',
  'Mod+R',
  'Mod+Shift+R',
  'Mod+T',
  'Mod+W',
]);

const WEB_CONFLICT_RISK_SHORTCUTS = new Set([
  'Ctrl+B',
  'Ctrl+Enter',
  'Ctrl+I',
  'Ctrl+K',
  'Ctrl+Shift+P',
  'Ctrl+U',
  'Meta+B',
  'Meta+Enter',
  'Meta+I',
  'Meta+K',
  'Meta+Shift+P',
  'Meta+U',
  'Mod+B',
  'Mod+Enter',
  'Mod+I',
  'Mod+K',
  'Mod+Shift+P',
  'Mod+U',
]);

const KEY_ALIASES: Record<string, string> = {
  ' ': 'Space',
  arrowdown: 'Down',
  arrowleft: 'Left',
  arrowright: 'Right',
  arrowup: 'Up',
  comma: 'Comma',
  delete: 'Delete',
  down: 'Down',
  end: 'End',
  enter: 'Enter',
  escape: 'Escape',
  esc: 'Escape',
  home: 'Home',
  insert: 'Insert',
  left: 'Left',
  minus: 'Minus',
  pagedown: 'PageDown',
  pageup: 'PageUp',
  period: 'Period',
  return: 'Enter',
  right: 'Right',
  space: 'Space',
  tab: 'Tab',
  up: 'Up',
};

const KEY_DISPLAY: Record<string, string> = {
  Comma: ',',
  Delete: 'Del',
  Down: '↓',
  Escape: 'Esc',
  Left: '←',
  Minus: '-',
  Period: '.',
  Right: '→',
  Space: 'Space',
  Up: '↑',
};

function normalizeKeyToken(key: string): string {
  const trimmed = key.trim();
  if (!trimmed) return '';

  if (trimmed.length === 1) {
    if (trimmed === ',') return 'Comma';
    if (trimmed === '.') return 'Period';
    if (trimmed === '-') return 'Minus';
    return trimmed.toUpperCase();
  }

  const alias = KEY_ALIASES[trimmed.toLowerCase()];
  if (alias) return alias;

  if (/^f(?:[1-9]|1[0-2])$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  return trimmed;
}

function getModifierToken(token: string): ModifierToken | null {
  const value = token.trim().toLowerCase();
  if (value === 'mod') {
    return 'Mod';
  }
  if (['cmd', 'command', 'meta'].includes(value)) {
    return 'Meta';
  }
  if (['ctrl', 'control'].includes(value)) {
    return 'Ctrl';
  }
  if (['alt', 'option'].includes(value)) {
    return 'Alt';
  }
  if (value === 'shift') {
    return 'Shift';
  }
  return null;
}

export function normalizeShortcutChord(chord?: string | null): string {
  if (!chord) return '';

  const modifiers = new Set<ModifierToken>();
  let key = '';

  chord
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const modifier = getModifierToken(part);
      if (modifier) {
        modifiers.add(modifier);
        return;
      }

      key = normalizeKeyToken(part);
    });

  if (!key) return '';

  return [
    ...(modifiers.has('Mod') ? ['Mod'] : []),
    ...(modifiers.has('Meta') ? ['Meta'] : []),
    ...(modifiers.has('Ctrl') ? ['Ctrl'] : []),
    ...(modifiers.has('Alt') ? ['Alt'] : []),
    ...(modifiers.has('Shift') ? ['Shift'] : []),
    key,
  ].join('+');
}

export function normalizeShortcutEvent(event: KeyboardEvent): string {
  if (event.isComposing || MODIFIER_KEYS.has(event.key)) {
    return '';
  }

  const key = normalizeKeyToken(event.key);
  if (!key) return '';

  return normalizeShortcutChord(
    [
      event.metaKey ? 'Meta' : '',
      event.ctrlKey ? 'Ctrl' : '',
      event.altKey ? 'Alt' : '',
      event.shiftKey ? 'Shift' : '',
      key,
    ]
      .filter(Boolean)
      .join('+')
  );
}

export function formatShortcut(chord?: string | null, platform?: string): string {
  return getShortcutDisplayParts(chord, platform)
    .map((part) => part.value)
    .join('');
}

export function getShortcutDisplayParts(
  chord?: string | null,
  platform?: string
): ShortcutDisplayPart[] {
  const normalized = normalizeShortcutChord(chord);
  if (!normalized) return [];

  const isMac = /mac|iphone|ipad|ipod/i.test(
    platform ?? (typeof navigator !== 'undefined' ? navigator.platform : '')
  );
  const parts = normalized.split('+');
  const displayParts: ShortcutDisplayPart[] = parts.map((part) => {
    if (part === 'Mod') return { value: isMac ? '⌘' : 'Ctrl', kind: 'modifier' };
    if (part === 'Meta') return { value: isMac ? '⌘' : 'Meta', kind: 'modifier' };
    if (part === 'Ctrl') return { value: isMac ? '⌃' : 'Ctrl', kind: 'modifier' };
    if (part === 'Alt') return { value: isMac ? '⌥' : 'Alt', kind: 'modifier' };
    if (part === 'Shift') return { value: isMac ? '⇧' : 'Shift', kind: 'modifier' };
    return { value: KEY_DISPLAY[part] || part, kind: 'key' };
  });

  if (isMac) {
    return displayParts;
  }

  return displayParts.flatMap((part, index) =>
    index === 0 ? [part] : [{ value: '+', kind: 'separator' }, part]
  );
}

export function matchesShortcutDisplayDomains(
  hostname: string,
  displayDomains?: string[]
): boolean {
  if (!displayDomains || displayDomains.length === 0) return true;

  const host = hostname.toLowerCase();
  return displayDomains.some((entry) => {
    const domain = entry.toLowerCase().trim();
    if (!domain) return false;

    if (domain.startsWith('.')) {
      return host.endsWith(domain) && host !== domain.slice(1);
    }

    return host === domain || host.endsWith(`.${domain}`);
  });
}

export function isSelectlyShortcutTarget(target: EventTarget | null): boolean {
  const element =
    typeof HTMLElement !== 'undefined' && target instanceof HTMLElement ? target : null;
  if (!element?.closest) return false;

  return !!element.closest(
    '#selectly-buttons-host, #selectly-streaming-host, #selectly-share-preview-host, #selectly-progress-host, #selectly-global-actions-host, .selectly-buttons, .selectly-streaming-result, .selectly-highlight, .selectly-progress-bar, .selectly-global-actions, .selectly-global-action-btn, .action-btn'
  );
}

function getConfiguredShortcut(config?: FunctionConfig): string {
  return normalizeShortcutChord(config?.shortcut?.chord);
}

function expandModShortcut(chord: string): Set<string> {
  if (!chord.includes('Mod+')) {
    return new Set([chord]);
  }

  return new Set([chord, chord.replace('Mod+', 'Meta+'), chord.replace('Mod+', 'Ctrl+')]);
}

function shortcutsConflict(first: string, second: string): boolean {
  const expandedFirst = expandModShortcut(first);
  const expandedSecond = expandModShortcut(second);

  return [...expandedFirst].some((chord) => expandedSecond.has(chord));
}

function configuredShortcutMatchesEvent(configuredChord: string, eventChord: string): boolean {
  return expandModShortcut(configuredChord).has(eventChord);
}

export function validateFunctionShortcut(
  chord: string | undefined,
  functions: Record<string, FunctionConfig>,
  currentFunctionKey?: string
): ShortcutValidationResult {
  const normalized = normalizeShortcutChord(chord);
  if (!normalized) {
    return { valid: true, chord: '' };
  }

  const parts = normalized.split('+');
  const hasModifier =
    parts.includes('Mod') ||
    parts.includes('Meta') ||
    parts.includes('Ctrl') ||
    parts.includes('Alt');
  if (!hasModifier) {
    return { valid: false, chord: normalized, error: 'incomplete' };
  }

  if (RESERVED_SHORTCUTS.has(normalized)) {
    return { valid: false, chord: normalized, error: 'reserved' };
  }

  const conflictEntry = Object.entries(functions).find(
    ([key, config]) =>
      key !== currentFunctionKey && shortcutsConflict(getConfiguredShortcut(config), normalized)
  );
  if (conflictEntry) {
    return {
      valid: false,
      chord: normalized,
      error: 'duplicate',
      conflictKey: conflictEntry[0],
    };
  }

  return {
    valid: true,
    chord: normalized,
    warning: WEB_CONFLICT_RISK_SHORTCUTS.has(normalized) ? 'web-conflict-risk' : undefined,
  };
}

export function findShortcutAction(
  userConfig: Pick<UserConfig, 'functions' | 'functionOrder'>,
  event: KeyboardEvent,
  hostname: string
): FunctionShortcutMatch | null {
  if (event.defaultPrevented || event.isComposing || isSelectlyShortcutTarget(event.target)) {
    return null;
  }

  const chord = normalizeShortcutEvent(event);
  if (!chord) return null;

  const orderedKeys =
    userConfig.functionOrder && userConfig.functionOrder.length
      ? userConfig.functionOrder.filter((key) => key in userConfig.functions)
      : Object.keys(userConfig.functions);

  for (const actionKey of orderedKeys) {
    const config = userConfig.functions[actionKey];
    if (!config?.enabled) continue;
    if (!configuredShortcutMatchesEvent(getConfiguredShortcut(config), chord)) continue;
    if (!matchesShortcutDisplayDomains(hostname, config.displayDomains)) continue;

    return { actionKey, config, chord };
  }

  return null;
}
