import { describe, expect, it, vi } from 'vitest';

import { InlineDialogue } from './inline-dialogue';

describe('InlineDialogue', () => {
  it('includes selected text and previous completed turns in follow-up requests', async () => {
    const stream = vi.fn(async (_messages, onChunk) => {
      onChunk('First ', 'model');
      onChunk('answer', 'model');
    });
    const context = [
      { role: 'system' as const, content: 'Explain the selection' },
      { role: 'user' as const, content: 'Selected paragraph' },
    ];
    const dialogue = new InlineDialogue(context, stream);
    const onChunk = vi.fn();
    expect(await dialogue.send('What does it mean?', onChunk)).toBe('First answer');
    await dialogue.send('Give an example', onChunk);
    expect(stream.mock.calls[1][0]).toEqual([
      ...context,
      { role: 'user', content: 'What does it mean?' },
      { role: 'assistant', content: 'First answer' },
      { role: 'user', content: 'Give an example' },
    ]);
    expect(context).toHaveLength(2);
  });

  it('discards failed turns so a later request can recover', async () => {
    const stream = vi
      .fn()
      .mockImplementationOnce(async (_messages, onChunk) => {
        onChunk('partial', 'model');
        throw new Error('Provider unavailable');
      })
      .mockResolvedValueOnce(undefined);
    const dialogue = new InlineDialogue([{ role: 'user', content: 'Selection' }], stream);
    await expect(dialogue.send('Failed question', vi.fn())).rejects.toThrow('Provider unavailable');
    await dialogue.send('Retry question', vi.fn());
    expect(stream.mock.calls[1][0]).toEqual([
      { role: 'user', content: 'Selection' },
      { role: 'user', content: 'Retry question' },
    ]);
  });
  it('replaces only the latest answer and retains the question and earlier turns', async () => {
    let response = 'first answer';
    const stream = vi.fn(async (_messages, onChunk) => onChunk(response, 'model'));
    const context = [{ role: 'user' as const, content: 'Selection' }];
    const dialogue = new InlineDialogue(context, stream);
    await dialogue.send('First question', vi.fn());
    await dialogue.send('Second question', vi.fn());
    const originalRequest = stream.mock.calls[1][0];
    response = 'replacement';
    const onChunk = vi.fn();
    expect(await dialogue.regenerate(onChunk)).toBe('replacement');
    expect(onChunk).toHaveBeenCalledWith('replacement', 'model');
    expect(stream.mock.calls[2][0]).toEqual(originalRequest);
    await dialogue.regenerate(vi.fn());
    expect(stream.mock.calls[3][0]).toEqual(originalRequest);
    await dialogue.send('Follow up', vi.fn());
    expect(stream.mock.calls[4][0]).toEqual([
      ...originalRequest,
      { role: 'assistant', content: 'replacement' },
      { role: 'user', content: 'Follow up' },
    ]);
  });

  it('keeps the completed answer if regeneration fails', async () => {
    const stream = vi.fn(async (_messages, onChunk) => onChunk('original', 'model'));
    const dialogue = new InlineDialogue([{ role: 'user', content: 'Selection' }], stream);
    await dialogue.send('Question', vi.fn());
    stream.mockRejectedValueOnce(new Error('Provider unavailable'));
    await expect(dialogue.regenerate(vi.fn())).rejects.toThrow('Provider unavailable');
    await dialogue.send('Follow up', vi.fn());
    expect(stream.mock.calls[2][0]).toContainEqual({ role: 'assistant', content: 'original' });
  });

  it('does not send a request before there is a completed answer', async () => {
    const stream = vi.fn();
    const dialogue = new InlineDialogue([{ role: 'user', content: 'Selection' }], stream);
    await expect(dialogue.regenerate(vi.fn())).rejects.toThrow('No completed answer');
    expect(stream).not.toHaveBeenCalled();
  });
});
