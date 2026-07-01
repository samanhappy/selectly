import type { FunctionConfig } from './llm-config';

export function shouldShowFunctionInToolbar(config?: FunctionConfig): boolean {
  return !!config?.enabled && config.showInToolbar !== false;
}
