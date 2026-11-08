export interface DialogueMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type DialogueChunkHandler = (chunk: string, model: string) => void;
export type DialogueStream = (
  messages: DialogueMessage[],
  onChunk: DialogueChunkHandler
) => Promise<void>;

/** One instance per floating conversation; persists only completed turns. */
export class InlineDialogue {
  private history: DialogueMessage[];

  constructor(
    initialMessages: DialogueMessage[],
    private readonly stream: DialogueStream
  ) {
    this.history = initialMessages.map((message) => ({ ...message }));
  }

  async send(message: string, onChunk: DialogueChunkHandler): Promise<string> {
    return this.complete([...this.history, { role: 'user', content: message }], onChunk);
  }

  async regenerate(onChunk: DialogueChunkHandler): Promise<string> {
    if (this.history[this.history.length - 1]?.role !== 'assistant') {
      throw new Error('No completed answer to regenerate');
    }
    return this.complete(this.history.slice(0, -1), onChunk);
  }

  private async complete(
    messages: DialogueMessage[],
    onChunk: DialogueChunkHandler
  ): Promise<string> {
    let response = '';
    await this.stream(messages, (chunk, model) => {
      response += chunk;
      onChunk(chunk, model);
    });
    this.history = [...messages, { role: 'assistant', content: response }];
    return response;
  }
}
