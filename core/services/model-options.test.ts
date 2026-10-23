import { describe, expect, it } from 'vitest';

import { CLOUD_PROVIDER } from '../config/llm-config';
import { buildModelChoices, getModelChoiceLabel } from './model-options';

describe('model options', () => {
  it('does not offer a legacy cloud model when official services are disabled', () => {
    const choices = buildModelChoices([{ provider: CLOUD_PROVIDER, models: [] }], 'cloud/default');

    expect(choices).toEqual([]);
  });

  it('formats a missing selected model from the model string', () => {
    expect(getModelChoiceLabel('openai/gpt-4o-mini', [])).toBe('gpt-4o-mini');
  });
});
