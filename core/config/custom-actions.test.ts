import { describe, expect, it } from 'vitest';

import {
  canAddCustomFunctions,
  FREE_CUSTOM_ACTION_LIMIT,
  getCustomFunctionCount,
  getRemainingCustomFunctionSlots,
} from './custom-actions';
import type { FunctionConfig } from './llm-config';

const customAction = (title: string): FunctionConfig => ({
  title,
  description: '',
  icon: 'sparkles',
  model: 'default',
  prompt: 'Process {text}',
  autoExecute: false,
  autoCloseButtons: true,
  autoCloseResult: true,
  enabled: true,
  isBuiltIn: false,
  requiresAI: true,
});

describe('custom action limits', () => {
  it('counts only non-built-in actions as custom actions', () => {
    expect(
      getCustomFunctionCount({
        translate: { ...customAction('Translate'), isBuiltIn: true },
        issueActionItems: customAction('Issue action items'),
        competitorMessaging: customAction('Competitor messaging'),
      })
    ).toBe(2);
  });

  it('limits free users to 3 custom actions', () => {
    const functions = {
      a: customAction('A'),
      b: customAction('B'),
      c: customAction('C'),
    };

    expect(FREE_CUSTOM_ACTION_LIMIT).toBe(3);
    expect(getRemainingCustomFunctionSlots(functions, false)).toBe(0);
    expect(canAddCustomFunctions(functions, false)).toBe(false);
  });

  it('lets subscribed users add unlimited custom actions', () => {
    const functions = {
      a: customAction('A'),
      b: customAction('B'),
      c: customAction('C'),
      d: customAction('D'),
    };

    expect(getRemainingCustomFunctionSlots(functions, true)).toBe(Number.POSITIVE_INFINITY);
    expect(canAddCustomFunctions(functions, true, 20)).toBe(true);
  });
});
