import { describe, expect, it } from 'vitest';

import {
  getDefaultThinkingModeForFunction,
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
});
