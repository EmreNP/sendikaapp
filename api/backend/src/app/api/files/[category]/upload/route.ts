import { NextRequest } from 'next/server';
import { storage } from '@/lib/firebase/admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import { validateImage, sanitizeFileName } from '@/lib/utils/validation/imageValidation';
import { validateDocument } from '@/lib/utils/validation/documentValidation';
import {
  successResponse,
  validationError,
  unauthorizedError,
  serverError,
  isErrorWithMessage,
} from '@/lib/utils/response';

// İzin verilen kategoriler
const ALLOWED_CATEGORIES = ['news', 'announcements', 'user-documents'] as const;
type AllowedCategory = typeof ALLOWED_CATEGORIES[number];

// Kategori bazlı yetki kontrolü
function getCategoryPermissions(category: string, userRole: string): {
  canUpload: boolean;
  error?: string;
} {
  switch (category) {
    case 'news':
      // News: Sadece admin
      return {
        canUpload: userRole === USER_ROLE.ADMIN,
        error: userRole !== USER_ROLE.ADMIN ? 'Bu işlem için admin yetkisi gerekli' : undefined,
      };
    
    case 'announcements':
      // Announcements: Sadece admin
      return {
        canUpload: userRole === USER_ROLE.ADMIN,
        error: userRole !== USER_ROLE.ADMIN ? 'Bu işlem için admin yetkisi gerekli' : undefined,
      };
    
    case 'user-documents':
      // User documents: Admin ve branch_manager
      return {
        canUpload: userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.BRANCH_MANAGER,
        error: (userRole !== USER_ROLE.ADMIN && userRole !== USER_ROLE.BRANCH_MANAGER) 
          ? 'Bu işlem için admin veya branch manager yetkisi gerekli' 
          : undefined,
      };
    
    default:
      return {
        canUpload: false,
        error: 'Geçersiz kategori veya bu kategori henüz desteklenmiyor',
      };
  }
}

// POST - Generic görsel yükleme
export async function POST(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const category = params.category as AllowedCategory;

      // Kategori validasyonu
      if (!ALLOWED_CATEGORIES.includes(category)) {
        return validationError(
          `Geçersiz kategori. İzin verilen kategoriler: ${ALLOWED_CATEGORIES.join(', ')}`
        );
      }

      // Kullanıcı bilgilerini al
      const { error, user: currentUserData } = await getCurrentUser(user.uid);

      if (error) {
        return error;
      }

      if (!currentUserData) {
        return unauthorizedError('Kullanıcı bilgileri alınamadı');
      }

      // Kategori bazlı yetki kontrolü
      const permissions = getCategoryPermissions(
        category,
        currentUserData.role
      );

      if (!permissions.canUpload) {
        return unauthorizedError(permissions.error || 'Bu işlem için yetkiniz yok');
      }

      const formData = await req.formData();

      // Dosyayı al
      const file = formData.get('file');

      if (!file) {
        return validationError('Dosya bulunamadı');
      }

      // File tipini kontrol et
      if (!(file instanceof File) && typeof file !== 'object') {
        return validationError('Geçersiz dosya formatı');
      }

      // File objesini oluştur (Next.js FormData'dan gelen dosya için)
      let fileObj: File;
      if (file instanceof File) {
        fileObj = file;
      } else {
        // Next.js'de FormData'dan gelen dosya Blob olabilir
        const blob = file as Blob;
        fileObj = new File([blob], (file as any).name || 'image', {
          type: (file as any).type || blob.type,
        });
      }

      // Dosya validasyonu - kategoriye göre
      let validation;
      if (category === 'user-documents') {
        validation = validateDocument(fileObj.type, fileObj.size, fileObj.name);
      } else {
        validation = validateImage(fileObj.type, fileObj.size, fileObj.name);
      }
      
      if (!validation.valid) {
        return validationError(validation.error || 'Geçersiz dosya');
      }

      // Dosya adını sanitize et
      const sanitizedFileName = sanitizeFileName(fileObj.name);
      const timestamp = Date.now();
      const fileExtension = sanitizedFileName.substring(sanitizedFileName.lastIndexOf('.'));
      const fileName = `${timestamp}-${sanitizedFileName.replace(fileExtension, '')}${fileExtension}`;

      // Storage path oluştur - kategoriye göre
      let storagePath: string;
      if (category === 'user-documents') {
        // user-documents için userId parametresi gerekli
        const userId = formData.get('userId') as string;
        if (!userId) {
          return validationError('User ID gerekli');
        }
        storagePath = `${category}/${userId}/${fileName}`;
      } else {
        storagePath = `${category}/${fileName}`;
      }

      // Firebase Storage bucket'ı al
      // Önce environment variable'dan, sonra default bucket'ı kullan
      let bucket;
      try {
        // Environment variable'dan bucket name al
        const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
        
        if (bucketName) {
          bucket = storage.bucket(bucketName);
          console.log(`✅ Using storage bucket from env: ${bucketName}`);
        } else {
          // Default bucket'ı kullan (Firebase Admin SDK initialize edilirken belirtilen bucket)
          bucket = storage.bucket();
          console.log(`✅ Using default storage bucket: ${bucket.name}`);
        }
        
        if (!bucket) {
          throw new Error('Firebase Storage bucket yapılandırılmamış');
        }
        
        // Bucket'ın var olup olmadığını kontrol et
        const [exists] = await bucket.exists();
        if (!exists) {
          throw new Error(`Storage bucket '${bucket.name}' mevcut değil. Lütfen Firebase Console'dan bucket oluşturun veya doğru bucket name'i belirtin.`);
        }
        
      } catch (bucketError: unknown) {
        const errorMessage = isErrorWithMessage(bucketError) ? bucketError.message : 'Bilinmeyen hata';
        console.error('❌ Bucket initialization error:', bucketError);
        
        // 404 hatası için özel mesaj
        if (errorMessage.includes('does not exist') || errorMessage.includes('mevcut değil')) {
          return serverError(
            `Storage bucket bulunamadı. Lütfen Firebase Console'dan Storage bucket'ı oluşturun veya .env dosyasına doğru FIREBASE_STORAGE_BUCKET değerini ekleyin.`,
            errorMessage
          );
        }
        
        return serverError('Storage bucket yapılandırma hatası', errorMessage);
      }

      // Dosyayı buffer'a çevir
      const arrayBuffer = await fileObj.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Storage'a yükle
      const fileRef = bucket.file(storagePath);
      
      try {
        await fileRef.save(buffer, {
          metadata: {
            contentType: fileObj.type,
            metadata: {
              uploadedBy: user.uid,
              uploadedAt: new Date().toISOString(),
              category: category,
            },
          },
        });
        console.log(`✅ File saved to storage: ${storagePath}`);
      } catch (saveError: unknown) {
        const errorMessage = isErrorWithMessage(saveError) ? saveError.message : 'Bilinmeyen hata';
        console.error('❌ Storage save error:', saveError);
        return serverError(`Dosya storage'a kaydedilemedi: ${errorMessage}`, errorMessage);
      }

      // Public URL al
      try {
        await fileRef.makePublic();
        console.log(`✅ File made public: ${storagePath}`);
      } catch (publicError: unknown) {
        // makePublic başarısız olsa bile dosya yüklendi, URL'i manuel oluştur
        const errorMessage = isErrorWithMessage(publicError) ? publicError.message : 'Bilinmeyen hata';
        console.warn('⚠️ makePublic failed, using manual URL:', errorMessage);
        // Devam et, dosya yüklendi
      }
      
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

      return successResponse(
        category === 'user-documents' ? 'Döküman başarıyla yüklendi' : 'Görsel başarıyla yüklendi',
        {
          imageUrl: publicUrl, // Backward compatibility için
          documentUrl: publicUrl, // User documents için
          fileUrl: publicUrl, // Generic
          fileName: fileName,
          size: fileObj.size,
          contentType: fileObj.type,
          category: category,
        },
        201,
        category === 'user-documents' ? 'DOCUMENT_UPLOAD_SUCCESS' : 'IMAGE_UPLOAD_SUCCESS'
      );
    } catch (error: unknown) {
      console.error('❌ Upload image error:', error);
      
      // Detaylı hata mesajı
      let errorMessage = 'Bilinmeyen hata';
      if (isErrorWithMessage(error)) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Firebase Storage hatalarını yakala
      if (errorMessage.includes('storage') || errorMessage.includes('bucket')) {
        return serverError(
          'Storage yapılandırma hatası. Lütfen Firebase Storage ayarlarını kontrol edin.',
          errorMessage
        );
      }
      
      return serverError('Görsel yüklenirken bir hata oluştu', errorMessage);
    }
  });
}

