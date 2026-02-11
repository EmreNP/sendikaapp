import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

import { logger } from '../../lib/utils/logger';
/**
 * Google Cloud Secret Manager'dan secret okur
 * Development'ta process.env'den okur, production'da Secret Manager'dan
 */
export async function getSecret(secretName: string): Promise<string | undefined> {
  // Development ortamında .env'den oku
  if (process.env.NODE_ENV === 'development') {
    return process.env[secretName];
  }

  // Production'da Secret Manager kullan
  try {
    const client = new SecretManagerServiceClient();
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT;
    
    if (!projectId) {
      logger.warn('⚠️ GOOGLE_CLOUD_PROJECT environment variable bulunamadı, .env fallback');
      return process.env[secretName];
    }

    const secretPath = `projects/${projectId}/secrets/${secretName}/versions/latest`;
    const [version] = await client.accessSecretVersion({ name: secretPath });
    const secretValue = version.payload?.data?.toString();
    
    if (secretValue) {
      logger.log(`✅ Secret loaded from GCP Secret Manager: ${secretName}`);
      return secretValue;
    }
  } catch (error: any) {
    logger.warn(`⚠️ Secret Manager'dan ${secretName} okunamadı, .env fallback:`, error.message);
    return process.env[secretName];
  }
  
  return process.env[secretName];
}

/**
 * Birden fazla secret'ı paralel olarak yükler
 */
export async function loadSecrets(secretNames: string[]): Promise<Record<string, string>> {
  const results = await Promise.all(
    secretNames.map(async (name) => ({
      name,
      value: await getSecret(name),
    }))
  );

  return results.reduce((acc, { name, value }) => {
    if (value) {
      acc[name] = value;
    }
    return acc;
  }, {} as Record<string, string>);
}
