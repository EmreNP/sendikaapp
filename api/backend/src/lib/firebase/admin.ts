import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Error type guard
 */
function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

// Admin SDK'yı başlat (sadece bir kez)
if (getApps().length === 0) {
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    // Local development için service account key kullan
    try {
      // Service account key path'ini belirle
      let serviceAccountPath: string;
      
      if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        // Environment variable'dan path al
        serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      } else {
        // Next.js'de process.cwd() proje root'unu verir (api/backend/)
        serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
        
        // Eğer bulunamazsa, bir üst dizinde dene (workspace root)
        if (!fs.existsSync(serviceAccountPath)) {
          const workspacePath = path.resolve(process.cwd(), '..', 'serviceAccountKey.json');
          if (fs.existsSync(workspacePath)) {
            serviceAccountPath = workspacePath;
          }
        }
      }
      
      // Dosyanın var olup olmadığını kontrol et
      if (!fs.existsSync(serviceAccountPath)) {
        throw new Error(`Service account key file not found at: ${serviceAccountPath}`);
      }
      
      // Dosyayı oku ve parse et
      const serviceAccountContent = fs.readFileSync(serviceAccountPath, 'utf8');
      const serviceAccount = JSON.parse(serviceAccountContent);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
      
      console.log('✅ Firebase Admin SDK initialized (Development)');
      console.log(`   Service account loaded from: ${serviceAccountPath}`);
    } catch (error: unknown) {
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      console.error('❌ Firebase Admin SDK initialization error:', errorMessage);
      console.error('   Attempting to use default credentials...');
      // Fallback to default credentials
      try {
        admin.initializeApp();
        console.log('✅ Firebase Admin SDK initialized with default credentials');
      } catch (fallbackError: unknown) {
        const fallbackErrorMessage = isErrorWithMessage(fallbackError) ? fallbackError.message : 'Bilinmeyen hata';
        console.error('❌ Failed to initialize with default credentials:', fallbackErrorMessage);
        throw fallbackError;
      }
    }
  } else {
    // Production'da environment variables veya default credentials kullan
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    
    console.log('✅ Firebase Admin SDK initialized (Production)');
  }
}

export const auth = admin.auth();
export const db = admin.firestore();

export default admin;

