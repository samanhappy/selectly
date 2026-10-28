/**
 * Streaming result styles that must stay scoped to its Shadow DOM.
 */

export const streamingStyles = `
  .sl-chat-display-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: none;
    border-radius: 8px;
    background: none;
    cursor: pointer;
    flex-shrink: 0;
  }

  .selectly-streaming-result pre {
    margin: 12px 0;
    padding: 12px;
    overflow: auto;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.05);
    white-space: pre;
    word-spacing: normal;
    word-break: normal;
    overflow-wrap: normal;
    tab-size: 4;
  }

  .selectly-streaming-result pre code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.9em;
    line-height: 1.5;
    white-space: inherit;
  }
`;
