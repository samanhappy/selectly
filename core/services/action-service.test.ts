import { afterEach, describe, expect, it, vi } from 'vitest';

import type { FunctionConfig } from '../config/llm-config';
import { ActionService } from './action-service';

const llmMocks = vi.hoisted(() => ({
  chatStream: vi.fn(),
}));

vi.mock('./llm-service', () => ({
  LLMService: {
    getInstance: () => ({
      chatStream: llmMocks.chatStream,
    }),
  },
  processText: (text: string) => text,
}));

const createLLMFunctionConfig = (): FunctionConfig =>
  ({
    title: 'Translate',
    description: '',
    icon: 'translate',
    model: 'default',
    prompt: 'Translate: {text}',
    autoExecute: false,
    autoCloseButtons: true,
    enabled: true,
    requiresAI: true,
  }) as FunctionConfig;

describe('ActionService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    llmMocks.chatStream.mockReset();
  });

  it('opens an inline conversation with the selected text', async () => {
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

    expect(sendMessage).not.toHaveBeenCalled();
    expect((window as any).selectlyInstance.showDialogueResult).toHaveBeenCalledWith(
      expect.any(String),
      'selected text',
      { enabled: true }
    );
  });

  it('notifies when LLM streaming successfully starts', async () => {
    const updateStreamingResult = vi.fn();
    const onStreamingStart = vi.fn();
    llmMocks.chatStream.mockImplementation(async (_messages, onChunk) => {
      onChunk('first', 'test-model');
      onChunk('second', 'test-model');
    });
    vi.stubGlobal('window', {
      selectlyInstance: {
        showStreamingResult: vi.fn(),
      },
      updateStreamingResult,
    });

    const result = await ActionService.getInstance().executeAction(
      'translate',
      'selected text',
      createLLMFunctionConfig(),
      { onStreamingStart }
    );

    expect(onStreamingStart).toHaveBeenCalledTimes(1);
    expect(updateStreamingResult).toHaveBeenCalledWith('first', 'test-model', false);
    expect(updateStreamingResult).toHaveBeenCalledWith('second', 'test-model', false);
    expect(result.closeButtonsAfterExecution).toBe(false);
  });

  it('does not notify streaming start when the LLM stream errors first', async () => {
    const updateStreamingResult = vi.fn();
    const onStreamingStart = vi.fn();
    llmMocks.chatStream.mockRejectedValue(new Error('provider failed'));
    vi.stubGlobal('window', {
      selectlyInstance: {
        showStreamingResult: vi.fn(),
      },
      updateStreamingResult,
    });

    const result = await ActionService.getInstance().executeAction(
      'translate',
      'selected text',
      createLLMFunctionConfig(),
      { onStreamingStart }
    );

    expect(onStreamingStart).not.toHaveBeenCalled();
    expect(updateStreamingResult).toHaveBeenCalledWith('provider failed', '', true, true);
    expect(result.closeButtonsAfterExecution).toBe(false);
  });
});
