/**
 * Centralized logger utility for Selectly
 *
 * Usage:
 *   import { createLogger, mask } from '@/utils/logger'
 *   const logger = createLogger('Auth')
 *   logger.info('login succeeded')
 *   logger.debug('user_id:', mask(user_id))
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
}

interface Logger {
  debug: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}

let currentLevel: LogLevel = process.env.NODE_ENV === 'production' ? 'warn' : 'debug'

/**
 * Set the global log level
 */
export const setLogLevel = (level: LogLevel): void => {
  currentLevel = level
}

/**
 * Get the current log level
 */
export const getLogLevel = (): LogLevel => currentLevel

/**
 * Mask a sensitive string value, showing only the first `show` characters
 */
export const mask = (value: string | null | undefined, show = 4): string =>
  value ? value.slice(0, show) + '***' : '(empty)'

/**
 * Create a logger instance with a module prefix
 */
export const createLogger = (module: string): Logger => ({
  debug: (...args: unknown[]) => {
    if (LOG_LEVELS[currentLevel] <= 0) console.debug(`[${module}]`, ...args)
  },
  info: (...args: unknown[]) => {
    if (LOG_LEVELS[currentLevel] <= 1) console.log(`[${module}]`, ...args)
  },
  warn: (...args: unknown[]) => {
    if (LOG_LEVELS[currentLevel] <= 2) console.warn(`[${module}]`, ...args)
  },
  error: (...args: unknown[]) => {
    if (LOG_LEVELS[currentLevel] <= 3) console.error(`[${module}]`, ...args)
  },
})
