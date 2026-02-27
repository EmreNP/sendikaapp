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
    // Always use the default bucket (already configured in admin.initializeApp)
    const bucket = storage.bucket();
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
 * Generate a public URL for a given storage path.
 *
 * ⚠️  UYARI — YALNIZCA GERÇEKTEN PUBLIC KATEGORİLER İÇİN KULLAN
 * Bu fonksiyon, GCS ACL'i allUsers:objectViewer olan (yani makePublic()
 * çağrılmış) dosyalar için tahmin edilebilir bir URL üretir.
 * Hassas belgeler (user-documents vb.) için generateSignedUrl() kullanın.
 *
 * @param storagePath - The path to the file in Firebase Storage
 * @returns The public URL
 */
export function generatePublicUrl(storagePath: string): string {
  // Use the bucket name from the already-initialized Admin SDK (avoids wrong fallback)
  const bucketName = storage.bucket().name ||
    process.env.FIREBASE_STORAGE_BUCKET ||
    'sendikaapp.firebasestorage.app';
  return `https://storage.googleapis.com/${bucketName}/${storagePath}`;
}
