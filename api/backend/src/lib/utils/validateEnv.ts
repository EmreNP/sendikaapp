import { logger } from './logger';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Validate critical environment variables at startup.
 * Fails fast with a clear error message if any required variable is missing.
 */
export function validateEnv(): void {
  const required: { name: string; description: string }[] = [
    { name: 'NODE_ENV', description: 'Application environment (development/production)' },
  ];

  // Check if Firebase credentials are available via any supported mechanism
  const hasFirebaseCreds =
    !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ||
    !!process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    fs.existsSync(path.resolve(process.cwd(), 'serviceAccountKey.json'));

  const recommended: { name: string; description: string; skip?: boolean }[] = [
    { name: 'FIREBASE_WEB_API_KEY', description: 'Firebase Web API key for auth verification' },
    { name: 'ALLOWED_ORIGINS', description: 'Comma-separated list of allowed CORS origins' },
    {
      name: 'GOOGLE_APPLICATION_CREDENTIALS',
      description: 'Path to Firebase service account key (or use default credentials)',
      // Suppress warning when serviceAccountKey.json or JSON env var is present
      skip: hasFirebaseCreds,
    },
  ];

  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required env vars
  for (const { name, description } of required) {
    if (!process.env[name]) {
      missing.push(`  ❌ ${name} — ${description}`);
    }
  }

  // Check recommended env vars (warn but don't fail)
  for (const { name, description, skip } of recommended) {
    if (!skip && !process.env[name]) {
      warnings.push(`  ⚠️  ${name} — ${description}`);
    }
  }

  // Log warnings
  if (warnings.length > 0) {
    logger.warn(`⚠️  Missing recommended environment variables:\n${warnings.join('\n')}`);
  }

  // Fail on missing required vars
  if (missing.length > 0) {
    const errorMsg = `🔴 FATAL: Missing required environment variables:\n${missing.join('\n')}\n\nSet these variables before starting the server.`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Validate NODE_ENV value
  const validEnvs = ['development', 'production', 'test'];
  if (process.env.NODE_ENV && !validEnvs.includes(process.env.NODE_ENV)) {
    const errorMsg = `🔴 FATAL: Invalid NODE_ENV value "${process.env.NODE_ENV}". Must be one of: ${validEnvs.join(', ')}`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  logger.log(`✅ Environment validation passed (NODE_ENV=${process.env.NODE_ENV})`);
}
