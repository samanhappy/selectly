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
});
