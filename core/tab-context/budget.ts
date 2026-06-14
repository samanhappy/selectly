import type { ModelContextBudget } from './types';

const FALLBACK_CONTEXT_CHARS = 24_000;
const APPROX_CHARS_PER_TOKEN = 4;
const PAGE_CONTEXT_RATIO = 0.6;
const HISTORY_RATIO = 0.2;
const OUTPUT_RATIO = 0.2;
const MIN_CONTEXT_CHARS = 4_000;
const MAX_CONTEXT_CHARS = 160_000;

export interface ContextBudgetInput {
  contextWindow?: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const estimateTokensFromChars = (charCount: number): number =>
  Math.ceil(Math.max(0, charCount) / APPROX_CHARS_PER_TOKEN);

export const estimateCharsFromTokens = (tokenCount: number): number =>
  Math.floor(Math.max(0, tokenCount) * APPROX_CHARS_PER_TOKEN);

export const getContextBudget = ({ contextWindow }: ContextBudgetInput): ModelContextBudget => {
  if (!contextWindow || contextWindow <= 0 || !Number.isFinite(contextWindow)) {
    return {
      maxContextChars: FALLBACK_CONTEXT_CHARS,
    };
  }

  const maxContextTokens = Math.floor(contextWindow * PAGE_CONTEXT_RATIO);
  const maxHistoryTokens = Math.floor(contextWindow * HISTORY_RATIO);
  const maxOutputTokens = Math.max(512, Math.floor(contextWindow * OUTPUT_RATIO));
  const maxContextChars = clamp(
    estimateCharsFromTokens(maxContextTokens),
    MIN_CONTEXT_CHARS,
    MAX_CONTEXT_CHARS
  );

  return {
    maxContextChars,
    maxContextTokens,
    maxHistoryTokens,
    maxOutputTokens,
  };
};
