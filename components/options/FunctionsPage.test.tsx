import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_CONFIG, type FunctionConfig } from '../../core/config/llm-config';
import { FunctionsPage } from './FunctionsPage';

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

const i18nConfig = {
  popup: {
    functions: {
      title: 'Functions',
      addCustom: 'Add Custom Function',
      appearance: 'Appearance',
      model: 'Model',
    },
    general: {
      buttonPosition: 'Button Position',
      buttonPositionAbove: 'Above',
      buttonPositionBelow: 'Below',
    },
  },
  defaultFunctions: {},
};

describe('FunctionsPage', () => {
  it('renders workflow packs alongside function management', () => {
    const html = renderToStaticMarkup(
      <FunctionsPage
        userConfig={DEFAULT_CONFIG}
        i18nConfig={i18nConfig}
        isSubscribed={false}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onReorder={vi.fn()}
        onPremiumClick={vi.fn()}
        onAddCustomFunction={vi.fn()}
        onInstallWorkflowPack={vi.fn()}
        onOpenConfig={vi.fn()}
      />
    );

    expect(html).toContain('Workflow Packs');
    expect(html).toContain('Developer Pack');
    expect(html).toContain('Research Pack');
    expect(html).toContain('Marketing/PM Pack');
  });

  it('shows an upgrade entry when a free user already has 3 custom actions', () => {
    const userConfig = {
      ...DEFAULT_CONFIG,
      functions: {
        ...DEFAULT_CONFIG.functions,
        customA: customAction('Custom A'),
        customB: customAction('Custom B'),
        customC: customAction('Custom C'),
      },
    };

    const html = renderToStaticMarkup(
      <FunctionsPage
        userConfig={userConfig}
        i18nConfig={i18nConfig}
        isSubscribed={false}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onReorder={vi.fn()}
        onPremiumClick={vi.fn()}
        onAddCustomFunction={vi.fn()}
        onInstallWorkflowPack={vi.fn()}
        onOpenConfig={vi.fn()}
      />
    );

    expect(html).toContain('3/3 custom actions');
    expect(html).toContain('Upgrade for unlimited');
  });
});
