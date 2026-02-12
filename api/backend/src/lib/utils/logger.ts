/**
 * Production-safe logging utility
 * Logs are disabled or sanitized in production to prevent sensitive data leaks
 */

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  error: (message: string, error?: any, context?: any) => {
    if (isDevelopment) {
      console.error(message, error, context);
    } else {
      // In production, log without sensitive details
      console.error(message);
      if (error?.stack) {
        console.error(error.stack);
      }
    }
  },

  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  info: (message: string, context?: any) => {
    if (isDevelopment) {
      console.info(message, context);
    }
  },
};
