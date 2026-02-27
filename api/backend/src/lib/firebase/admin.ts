import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import * as path from 'path';
import * as fs from 'fs';

import { logger } from '../../lib/utils/logger';
import { validateEnv } from '../../lib/utils/validateEnv';

// Validate environment variables at startup
validateEnv();

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
      let serviceAccount;

      // 1. Önce GOOGLE_APPLICATION_CREDENTIALS_JSON env variable'ını kontrol et (önerilen yöntem)
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
        try {
          serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
          logger.log('📋 Service account loaded from GOOGLE_APPLICATION_CREDENTIALS_JSON');
        } catch (parseError) {
          logger.error('❌ Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:', parseError);
          throw parseError;
        }
      }
      // 2. GOOGLE_APPLICATION_CREDENTIALS (dosya yolu) kontrolü
      else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (fs.existsSync(credPath)) {
          serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf8'));
          logger.log(`📋 Service account loaded from: ${credPath}`);
        } else {
          throw new Error(`GOOGLE_APPLICATION_CREDENTIALS file not found: ${credPath}`);
        }
      }
      // 3. Eski yöntem: FIREBASE_SERVICE_ACCOUNT_PATH veya serviceAccountKey.json dosyası (deprecated)
      else {
        logger.warn('⚠️  serviceAccountKey.json dosyası kullanılıyor. Lütfen GOOGLE_APPLICATION_CREDENTIALS_JSON env variable kullanın.');
        let serviceAccountPath: string;

        if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
          serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
        } else {
          serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
          if (!fs.existsSync(serviceAccountPath)) {
            const workspacePath = path.resolve(process.cwd(), '..', 'serviceAccountKey.json');
            if (fs.existsSync(workspacePath)) {
              serviceAccountPath = workspacePath;
            }
          }
        }

        if (!fs.existsSync(serviceAccountPath)) {
          throw new Error(
            `Service account credentials not found. ` +
            `Set GOOGLE_APPLICATION_CREDENTIALS_JSON env variable. ` +
            `(Checked: ${serviceAccountPath})`
          );
        }

        serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      }
      
      // Storage bucket name'i service account'tan veya env'den al
      // Service account'ta storageBucket field'ı varsa onu kullan
      let storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
      
      if (!storageBucket && serviceAccount.storageBucket) {
        storageBucket = serviceAccount.storageBucket;
      } else if (!storageBucket) {
        // Fallback: project_id'den bucket name oluştur
        // Ama önce mevcut bucket'ları kontrol etmek daha iyi
        storageBucket = `${serviceAccount.project_id}.appspot.com`;
        logger.warn(`⚠️  Storage bucket belirtilmemiş, varsayılan kullanılıyor: ${storageBucket}`);
        logger.warn(`   Lütfen .env dosyasına FIREBASE_STORAGE_BUCKET ekleyin veya service account'ta storageBucket field'ı olduğundan emin olun`);
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        ...(storageBucket && { storageBucket: storageBucket }),
      });
      
      if (storageBucket) {
        logger.log(`   Storage bucket: ${storageBucket}`);
      } else {
        logger.warn(`   ⚠️  Storage bucket yapılandırılmamış`);
      }
      
      logger.log('✅ Firebase Admin SDK initialized (Development)');
    } catch (error: unknown) {
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      logger.error('❌ Firebase Admin SDK initialization error:', errorMessage);
      logger.error('   Attempting to use default credentials...');
      // Fallback to default credentials
      try {
        admin.initializeApp();
        logger.log('✅ Firebase Admin SDK initialized with default credentials');
      } catch (fallbackError: unknown) {
        const fallbackErrorMessage = isErrorWithMessage(fallbackError) ? fallbackError.message : 'Bilinmeyen hata';
        logger.error('❌ Failed to initialize with default credentials:', fallbackErrorMessage);
        throw fallbackError;
      }
    }
  } else {
    // Production ortamı için de service account key kullan
    // FCM mesajı gönderebilmek için gerekli
    try {
      let serviceAccount;
      
      // Önce GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable'ı kontrol et
      // Cloud Run/Cloud Build'de secret olarak enjekte edilebilir
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
        try {
          serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
          logger.log('📋 Service account loaded from GOOGLE_APPLICATION_CREDENTIALS_JSON');
        } catch (parseError) {
          logger.error('❌ Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:', parseError);
          throw parseError;
        }
      } 
      // Eğer path belirtilmişse dosyadan oku
      else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (fs.existsSync(credPath)) {
          const credContent = fs.readFileSync(credPath, 'utf8');
          serviceAccount = JSON.parse(credContent);
          logger.log(`📋 Service account loaded from: ${credPath}`);
        } else {
          throw new Error(`GOOGLE_APPLICATION_CREDENTIALS file not found: ${credPath}`);
        }
      } 
      // Fallback: serviceAccountKey.json dosyasını ara
      else {
        const possiblePaths = [
          path.resolve(process.cwd(), 'serviceAccountKey.json'),
          path.resolve(process.cwd(), '..', 'serviceAccountKey.json'),
          '/app/serviceAccountKey.json', // Docker container içinde
        ];
        
        let foundPath: string | null = null;
        for (const p of possiblePaths) {
          if (fs.existsSync(p)) {
            foundPath = p;
            break;
          }
        }
        
        if (foundPath) {
          const credContent = fs.readFileSync(foundPath, 'utf8');
          serviceAccount = JSON.parse(credContent);
          logger.log(`📋 Service account loaded from: ${foundPath}`);
        } else {
          throw new Error('Service account credentials not found. Set GOOGLE_APPLICATION_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS');
        }
      }
      
      let storageBucket = process.env.FIREBASE_STORAGE_BUCKET || serviceAccount.storageBucket;
      
      if (!storageBucket && serviceAccount.project_id) {
        // Firebase storage bucket format can be project-id.appspot.com or project-id.firebasestorage.app
        storageBucket = `${serviceAccount.project_id}.firebasestorage.app`;
        logger.warn(`⚠️  Storage bucket belirtilmemiş, varsayılan kullanılıyor: ${storageBucket}`);
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        ...(storageBucket && { storageBucket: storageBucket }),
      });
      
      logger.log('✅ Firebase Admin SDK initialized (Production with Service Account)');
      if (storageBucket) {
        logger.log(`   Storage bucket: ${storageBucket}`);
      }
    } catch (error: unknown) {
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      logger.error('❌ Production initialization with service account failed:', errorMessage);
      logger.warn('⚠️  Falling back to Application Default Credentials...');
      logger.warn('⚠️  FCM notifications may not work without proper credentials!');
      
      // Fallback to default credentials
      let storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

      // Try to determine project ID from environment variables if bucket is not set
      if (!storageBucket) {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
        if (projectId) {
          // Firebase storage bucket format can be project-id.appspot.com or project-id.firebasestorage.app
          // We default to firebasestorage.app as it appears to be the case for this project
          storageBucket = `${projectId}.firebasestorage.app`;
          logger.warn(`⚠️  Storage bucket belirtilmemiş, varsayılan kullanılıyor (from Project ID): ${storageBucket}`);
        }
      }
      
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        ...(storageBucket && { storageBucket: storageBucket }),
      });
      
      logger.log('✅ Firebase Admin SDK initialized (Production - ADC Fallback)');
      if (storageBucket) {
        logger.log(`   Storage bucket: ${storageBucket}`);
      } else {
        logger.warn('⚠️  FIREBASE_STORAGE_BUCKET not set');
      }
    }
  }
}

export const auth = admin.auth();
export const db = admin.firestore();
export const storage = admin.storage();

export default admin;

