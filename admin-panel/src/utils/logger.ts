/**
 * Production-safe logging utility
 * Logs are disabled in production to prevent sensitive data leaks
 */

const isDevelopment = import.meta.env.MODE === 'development';
const isLocalhost =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);
const forceDebugLogs =
  typeof window !== 'undefined' &&
  (window.localStorage.getItem('debugLogs') === 'true' ||
    new URLSearchParams(window.location.search).get('debugLogs') === '1');

const canVerboseLog = isDevelopment || isLocalhost || forceDebugLogs;

export const logger = {
  log: (...args: unknown[]) => {
    if (canVerboseLog) {
      console.log(...args);
    }
  },

  error: (...args: unknown[]) => {
    // Always log errors, but sanitize in production
    if (canVerboseLog) {
      console.error(...args);
    } else {
      // In production, only log generic error messages without sensitive data
      console.error('An error occurred. Check application logs for details.');
    }
  },

  warn: (...args: unknown[]) => {
    if (canVerboseLog) {
      console.warn(...args);
    }
  },

  debug: (...args: unknown[]) => {
    if (canVerboseLog) {
      console.debug(...args);
    }
  },

  info: (...args: unknown[]) => {
    if (canVerboseLog) {
      console.info(...args);
    }
  },
};
