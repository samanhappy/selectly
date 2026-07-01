import { describe, expect, it } from 'vitest';

import type { FunctionConfig, UserConfig } from '../config/llm-config';
import {
  findShortcutAction,
  formatShortcut,
  matchesShortcutDisplayDomains,
  normalizeShortcutChord,
  normalizeShortcutEvent,
  validateFunctionShortcut,
} from './function-shortcuts';

function createEvent(event: Partial<KeyboardEvent>): KeyboardEvent {
  return {
    altKey: false,
    ctrlKey: false,
    defaultPrevented: false,
    isComposing: false,
    key: '',
    metaKey: false,
    shiftKey: false,
    target: null,
    ...event,
  } as KeyboardEvent;
}

function createFunction(config: Partial<FunctionConfig> = {}): FunctionConfig {
  return {
    title: 'Action',
    description: '',
    icon: 'sparkles',
    model: 'default',
    prompt: '{text}',
    autoExecute: false,
    autoExecuteDomains: [],
    autoCloseButtons: true,
    autoCloseResult: true,
    collapsed: false,
    enabled: true,
    displayDomains: [],
    isBuiltIn: false,
    requiresAI: true,
    ...config,
  };
}

describe('function shortcuts', () => {
  it('keeps Control and Command as distinct modifiers', () => {
    expect(normalizeShortcutEvent(createEvent({ key: 't', metaKey: true, shiftKey: true }))).toBe(
      'Meta+Shift+T'
    );
    expect(normalizeShortcutEvent(createEvent({ key: 't', ctrlKey: true, shiftKey: true }))).toBe(
      'Ctrl+Shift+T'
    );
    expect(normalizeShortcutChord('Command + Shift + t')).toBe('Meta+Shift+T');
    expect(normalizeShortcutChord('Ctrl + Shift + t')).toBe('Ctrl+Shift+T');
  });

  it('formats shortcuts for macOS and non-macOS platforms', () => {
    expect(formatShortcut('Meta+Shift+T', 'MacIntel')).toBe('⌘⇧T');
    expect(formatShortcut('Ctrl+Shift+T', 'MacIntel')).toBe('⌃⇧T');
    expect(formatShortcut('Ctrl+Shift+T', 'Win32')).toBe('Ctrl+Shift+T');
    expect(formatShortcut('Mod+Shift+T', 'MacIntel')).toBe('⌘⇧T');
  });

  it('rejects incomplete, reserved, and duplicate shortcuts', () => {
    const functions = {
      translate: createFunction({ shortcut: { chord: 'Mod+Shift+T' } }),
      explain: createFunction(),
    };

    expect(validateFunctionShortcut('T', functions, 'explain').error).toBe('incomplete');
    expect(validateFunctionShortcut('Mod+L', functions, 'explain').error).toBe('reserved');
    expect(validateFunctionShortcut('Ctrl+Shift+T', functions, 'explain')).toMatchObject({
      valid: false,
      error: 'duplicate',
      conflictKey: 'translate',
    });
  });

  it('allows common web shortcuts with a warning', () => {
    expect(validateFunctionShortcut('Mod+K', {}, 'search')).toMatchObject({
      valid: true,
      warning: 'web-conflict-risk',
    });
  });

  it('matches display domains using the same suffix rules as action buttons', () => {
    expect(matchesShortcutDisplayDomains('docs.example.com', ['example.com'])).toBe(true);
    expect(matchesShortcutDisplayDomains('example.com', ['.example.com'])).toBe(false);
    expect(matchesShortcutDisplayDomains('docs.example.com', ['.example.com'])).toBe(true);
    expect(matchesShortcutDisplayDomains('another.com', ['example.com'])).toBe(false);
  });

  it('finds an enabled matching shortcut action in function order', () => {
    const config: Pick<UserConfig, 'functions' | 'functionOrder'> = {
      functions: {
        translate: createFunction({
          shortcut: { chord: 'Ctrl+Shift+T' },
          displayDomains: ['example.com'],
        }),
        explain: createFunction({ shortcut: { chord: 'Meta+Shift+E' } }),
      },
      functionOrder: ['explain', 'translate'],
    };

    expect(
      findShortcutAction(
        config,
        createEvent({ key: 't', ctrlKey: true, shiftKey: true }),
        'docs.example.com'
      )
    ).toMatchObject({
      actionKey: 'translate',
      chord: 'Ctrl+Shift+T',
    });
  });

  it('keeps legacy Mod shortcuts working for Control and Command events', () => {
    const config: Pick<UserConfig, 'functions' | 'functionOrder'> = {
      functions: {
        translate: createFunction({
          shortcut: { chord: 'Mod+Shift+T' },
        }),
      },
      functionOrder: ['translate'],
    };

    expect(
      findShortcutAction(config, createEvent({ key: 't', ctrlKey: true, shiftKey: true }), '')
    ).toMatchObject({ actionKey: 'translate' });
    expect(
      findShortcutAction(config, createEvent({ key: 't', metaKey: true, shiftKey: true }), '')
    ).toMatchObject({ actionKey: 'translate' });
  });

  it('does not match disabled functions or domain misses', () => {
    const event = createEvent({ key: 't', ctrlKey: true, shiftKey: true });

    expect(
      findShortcutAction(
        {
          functions: {
            translate: createFunction({ enabled: false, shortcut: { chord: 'Ctrl+Shift+T' } }),
          },
        },
        event,
        'example.com'
      )
    ).toBeNull();

    expect(
      findShortcutAction(
        {
          functions: {
            translate: createFunction({
              shortcut: { chord: 'Ctrl+Shift+T' },
              displayDomains: ['example.com'],
            }),
          },
        },
        event,
        'another.com'
      )
    ).toBeNull();
  });
});
