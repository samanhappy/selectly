import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { describe, expect, it } from 'vitest';

import type { ModelChoice } from '../../core/services/model-options';
import { getCompactModelLabel, TabModelPicker } from './TabModelPicker';

const choices: ModelChoice[] = [
  { value: 'cloud/default', label: 'default', providerName: 'Cloud' },
  { value: 'openai/gpt-4o-mini', label: 'gpt-4o-mini', providerName: 'OpenAI' },
];

const labels = {
  chooseModel: 'Choose model',
  loadingModels: 'Loading models...',
  noModelsAvailable: 'No models available',
  selectedModel: 'Selected model',
};

describe('TabModelPicker', () => {
  it('uses the selected model label on the trigger', () => {
    const html = renderToStaticMarkup(
      <TabModelPicker
        choices={choices}
        selectedModel="openai/gpt-4o-mini"
        labels={labels}
        onSelect={() => {}}
      />
    );

    expect(html).toContain('gpt-4o-mini');
    expect(html).toContain('h-9');
    expect(html).toContain('aria-haspopup="listbox"');
  });

  it('falls back to the model string suffix when the model is not loaded', () => {
    expect(getCompactModelLabel('anthropic/claude-sonnet', choices)).toBe('claude-sonnet');
  });
});
