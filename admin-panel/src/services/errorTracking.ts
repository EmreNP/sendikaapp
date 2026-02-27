/**
 * Error Tracking Service
 * 
 * Lightweight error tracking abstraction that can be backed by Sentry or any other service.
 * 
 * Setup:
 * 1. Install Sentry: npm install @sentry/react
 * 2. Set VITE_SENTRY_DSN in your .env file
 * 3. The service will auto-initialize on first import
 * 
 * Without Sentry installed, errors are logged to console via logger.
 */
import { logger } from '@/utils/logger';

interface ErrorTrackingUser {
  id: string;
  email?: string;
  role?: string;
}

interface ErrorContext {
  [key: string]: unknown;
}

// Generic interface to avoid requiring @sentry/react types at compile time
interface SentryLike {
  init: (options: Record<string, unknown>) => void;
  captureException: (error: unknown, context?: Record<string, unknown>) => void;
  captureMessage: (message: string, level?: string) => void;
  setUser: (user: { id: string; email?: string } | null) => void;
  addBreadcrumb: (breadcrumb: Record<string, unknown>) => void;
}

let _sentry: SentryLike | null = null;
let _initialized = false;

/**
 * Initialize error tracking service.
 * Call once at app startup (e.g., in main.tsx).
 */
async function init(): Promise<void> {
  if (_initialized) return;
  _initialized = true;

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    logger.log('ℹ️ Error tracking: No VITE_SENTRY_DSN configured. Errors will only be logged locally.');
    return;
  }

  try {
    // Dynamic import — won't fail at build time even if @sentry/react is not installed
    // Use a variable to hide the specifier from Vite's static import analysis
    const sentryModule = '@sentry/' + 'react';          // opaque to bundler
    const Sentry = await (import(/* @vite-ignore */ sentryModule) as Promise<unknown>) as SentryLike;
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE || 'development',
      release: import.meta.env.VITE_APP_VERSION || 'unknown',
      sampleRate: 1.0,
      tracesSampleRate: 0.1,
      sendDefaultPii: false,
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        'Non-Error promise rejection captured',
      ],
    });
    _sentry = Sentry;
    logger.log('✅ Error tracking initialized (Sentry)');
  } catch {
    logger.warn('⚠️ @sentry/react not installed. Error tracking disabled. Install with: npm install @sentry/react');
  }
}

/**
 * Capture an exception for error tracking.
 */
function captureException(error: Error | unknown, context?: ErrorContext): void {
  if (_sentry) {
    _sentry.captureException(error, {
      extra: context,
    });
  }
  // Always log locally as well
  logger.error('🔴 Tracked error:', error, context);
}

/**
 * Capture a message (warning, info, etc.)
 */
function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (_sentry) {
    _sentry.captureMessage(message, level);
  }
  logger.log(`📝 Tracked message [${level}]:`, message);
}

/**
 * Set the current user context for error reports.
 * Call after login.
 */
function setUser(user: ErrorTrackingUser | null): void {
  if (_sentry) {
    if (user) {
      _sentry.setUser({ id: user.id, email: user.email });
    } else {
      _sentry.setUser(null);
    }
  }
}

/**
 * Add breadcrumb for debugging context.
 */
function addBreadcrumb(message: string, category: string, data?: Record<string, unknown>): void {
  if (_sentry) {
    _sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  }
}

export const errorTracking = {
  init,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
};
