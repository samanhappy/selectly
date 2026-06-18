import { afterEach, describe, expect, it, vi } from 'vitest';

import type { FunctionConfig } from '../config/llm-config';
import { ActionService } from './action-service';

vi.mock('./llm-service', () => ({
  LLMService: {
    getInstance: () => ({}),
  },
  processText: (text: string) => text,
}));

describe('ActionService chat action', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('opens the side panel with the selected text', async () => {
    const sendMessage = vi.fn().mockResolvedValue({ success: true });
    vi.stubGlobal('chrome', {
      runtime: {
        sendMessage,
      },
    });
    vi.stubGlobal('window', {
      selectlyInstance: {
        showDialogueResult: vi.fn(),
        showErrorResult: vi.fn(),
      },
    });

    await ActionService.getInstance().executeAction('chat', 'selected text', {
      enabled: true,
    } as FunctionConfig);

    expect(sendMessage).toHaveBeenCalledWith({
      action: 'tabContext:openSidePanel',
      selectedText: 'selected text',
    });
    expect((window as any).selectlyInstance.showDialogueResult).not.toHaveBeenCalled();
  });
});
