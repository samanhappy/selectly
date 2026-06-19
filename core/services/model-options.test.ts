import { describe, expect, it } from 'vitest';

import { CLOUD_PROVIDER } from '../config/llm-config';
import { buildModelChoices, getModelChoiceLabel } from './model-options';

describe('model options', () => {
  it('keeps the required session model available even when model loading is empty', () => {
    const choices = buildModelChoices([{ provider: CLOUD_PROVIDER, models: [] }], 'cloud/default');

    expect(choices[0]).toMatchObject({ value: 'cloud/default', providerName: 'Cloud' });
  });

  it('formats a missing selected model from the model string', () => {
    expect(getModelChoiceLabel('openai/gpt-4o-mini', [])).toBe('gpt-4o-mini');
  });
});
