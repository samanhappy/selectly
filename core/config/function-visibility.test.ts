import { describe, expect, it } from 'vitest';

import type { FunctionConfig } from './llm-config';
import { shouldShowFunctionInToolbar } from './function-visibility';

function createFunction(config: Partial<FunctionConfig>): FunctionConfig {
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
    showInToolbar: true,
    enabled: true,
    displayDomains: [],
    isBuiltIn: false,
    requiresAI: true,
    ...config,
  };
}

describe('shouldShowFunctionInToolbar', () => {
  it('shows enabled functions by default', () => {
    expect(shouldShowFunctionInToolbar(createFunction({ showInToolbar: undefined }))).toBe(true);
  });

  it('hides functions that are disabled or explicitly hidden from the toolbar', () => {
    expect(shouldShowFunctionInToolbar(createFunction({ enabled: false }))).toBe(false);
    expect(shouldShowFunctionInToolbar(createFunction({ showInToolbar: false }))).toBe(false);
  });
});
