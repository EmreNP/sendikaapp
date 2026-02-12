import { storage } from '@/lib/firebase/admin';
import { AppInternalServerError } from './errors/AppError';

import { logger } from '../../lib/utils/logger';
/**
 * Generate a signed URL for a given storage path
 * @param storagePath - The path to the file in Firebase Storage
 * @param expiresInDays - Number of days until the URL expires (default: 7)
 * @returns The signed URL
 */
export async function generateSignedUrl(
  storagePath: string,
  expiresInDays: number = 7
): Promise<string> {
  try {
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
    const bucket = bucketName ? storage.bucket(bucketName) : storage.bucket();
    
    const file = bucket.file(storagePath);
    
    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      throw new AppInternalServerError(`File not found in storage: ${storagePath}`);
    }
    
    // Generate signed URL
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
    });
    
    return signedUrl;
  } catch (error: any) {
    logger.error('Error generating signed URL:', error);
    throw new AppInternalServerError(`Failed to generate signed URL: ${error.message}`);
  }
}

/**
 * Generate signed URLs for multiple storage paths
 * @param storagePaths - Array of storage paths
 * @param expiresInDays - Number of days until the URLs expire (default: 7)
 * @returns Array of signed URLs in the same order
 */
export async function generateSignedUrls(
  storagePaths: string[],
  expiresInDays: number = 7
): Promise<string[]> {
  return Promise.all(
    storagePaths.map(path => generateSignedUrl(path, expiresInDays))
  );
}

/**
 * Generate a public URL for a given storage path
 * Note: File must be made public first using file.makePublic()
 * @param storagePath - The path to the file in Firebase Storage
 * @returns The public URL
 */
export function generatePublicUrl(storagePath: string): string {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'default-bucket';
  return `https://storage.googleapis.com/${bucketName}/${storagePath}`;
}
