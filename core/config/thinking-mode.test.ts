import { describe, expect, it } from 'vitest';

import {
  getDefaultThinkingModeForFunction,
  getEffectiveThinkingMode,
  migrateFunctionModelSettings,
  normalizeThinkingMode,
  resolveFunctionThinkingMode,
} from './thinking-mode';

describe('thinking mode defaults', () => {
  it('uses latency-oriented defaults for lightweight built-in functions', () => {
    expect(getDefaultThinkingModeForFunction('translate', true)).toBe('disabled');
    expect(getDefaultThinkingModeForFunction('polish', true)).toBe('disabled');
    expect(getDefaultThinkingModeForFunction('correct', true)).toBe('disabled');
  });

  it('enables thinking for built-in explain and chat functions', () => {
    expect(getDefaultThinkingModeForFunction('explain', true)).toBe('enabled');
    expect(getDefaultThinkingModeForFunction('chat', true)).toBe('enabled');
  });

  it('uses auto for custom functions and preserves explicit auto values', () => {
    expect(getDefaultThinkingModeForFunction('translate', false)).toBe('auto');
    expect(getDefaultThinkingModeForFunction('custom-function', false)).toBe('auto');
    expect(normalizeThinkingMode(undefined)).toBe('auto');
    expect(normalizeThinkingMode('auto')).toBe('auto');
  });

  it('backfills historical built-ins without overwriting an explicit auto value', () => {
    expect(resolveFunctionThinkingMode('translate', true)).toBe('disabled');
    expect(resolveFunctionThinkingMode('translate', true, 'auto')).toBe('auto');
  });

  it('migrates built-in legacy defaults to automatic model settings', () => {
    expect(
      migrateFunctionModelSettings('translate', {
        isBuiltIn: true,
        thinkingMode: 'disabled',
      })
    ).toEqual({ thinkingMode: 'auto' });
  });

  it('preserves built-in legacy non-default values as explicit model settings', () => {
    expect(
      migrateFunctionModelSettings('translate', {
        isBuiltIn: true,
        thinkingMode: 'enabled',
      })
    ).toEqual({ thinkingMode: 'enabled' });
  });

  it('preserves custom legacy values as explicit model settings', () => {
    expect(
      migrateFunctionModelSettings('custom', {
        isBuiltIn: false,
        thinkingMode: 'disabled',
      })
    ).toEqual({ thinkingMode: 'disabled' });
  });

  it('uses explicit function model settings before default model settings', () => {
    expect(
      getEffectiveThinkingMode({
        functionKey: 'translate',
        isBuiltIn: true,
        functionModel: 'default',
        functionModelSettings: { thinkingMode: 'disabled' },
        defaultModelSettings: { thinkingMode: 'enabled' },
      })
    ).toEqual({ mode: 'disabled', allowFallback: false });
  });

  it('uses default model settings only when the function uses the default model', () => {
    expect(
      getEffectiveThinkingMode({
        functionKey: 'translate',
        isBuiltIn: true,
        functionModel: 'default',
        functionModelSettings: { thinkingMode: 'auto' },
        defaultModelSettings: { thinkingMode: 'disabled' },
      })
    ).toEqual({ mode: 'disabled', allowFallback: false });

    expect(
      getEffectiveThinkingMode({
        functionKey: 'translate',
        isBuiltIn: true,
        functionModel: 'openrouter/model-a',
        functionModelSettings: { thinkingMode: 'auto' },
        defaultModelSettings: { thinkingMode: 'disabled' },
      })
    ).toEqual({ mode: 'disabled', allowFallback: true });
  });
});
