import { NextRequest } from 'next/server';
import { storage } from '@/lib/firebase/admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import { validateImage, sanitizeFileName } from '@/lib/utils/validation/imageValidation';
import { validateDocument } from '@/lib/utils/validation/documentValidation';
import { validateVideo } from '@/lib/utils/validation/videoValidation';
import {
  successResponse,
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { AppValidationError, AppAuthorizationError, AppInternalServerError, AppBadGatewayError } from '@/lib/utils/errors/AppError';
import { isErrorWithMessage } from '@/lib/utils/response';

// İzin verilen kategoriler
const ALLOWED_CATEGORIES = ['news', 'announcements', 'user-documents', 'videos', 'video-thumbnails', 'lesson-documents', 'activity-images'] as const;
type AllowedCategory = typeof ALLOWED_CATEGORIES[number];

// Kategori bazlı yetki kontrolü
function isAdminOrSuperadmin(role: string): boolean {
  return role === USER_ROLE.ADMIN || role === USER_ROLE.SUPERADMIN;
}

function getCategoryPermissions(category: string, userRole: string): {
  canUpload: boolean;
  error?: string;
} {
  switch (category) {
    case 'news':
      // News: Admin veya Superadmin
      return {
        canUpload: isAdminOrSuperadmin(userRole),
        error: !isAdminOrSuperadmin(userRole) ? 'Bu işlem için admin yetkisi gerekli' : undefined,
      };
    
    case 'announcements':
      // Announcements: Admin veya Superadmin
      return {
        canUpload: isAdminOrSuperadmin(userRole),
        error: !isAdminOrSuperadmin(userRole) ? 'Bu işlem için admin yetkisi gerekli' : undefined,
      };
    
    case 'user-documents':
      // User documents: Admin, Superadmin ve branch_manager
      return {
        canUpload: isAdminOrSuperadmin(userRole) || userRole === USER_ROLE.BRANCH_MANAGER,
        error: (!isAdminOrSuperadmin(userRole) && userRole !== USER_ROLE.BRANCH_MANAGER) 
          ? 'Bu işlem için admin veya branch manager yetkisi gerekli' 
          : undefined,
      };
    
    case 'videos':
      // Videos: Admin veya Superadmin
      return {
        canUpload: isAdminOrSuperadmin(userRole),
        error: !isAdminOrSuperadmin(userRole) ? 'Bu işlem için admin yetkisi gerekli' : undefined,
      };
    
    case 'video-thumbnails':
      // Video thumbnails: Admin veya Superadmin
      return {
        canUpload: isAdminOrSuperadmin(userRole),
        error: !isAdminOrSuperadmin(userRole) ? 'Bu işlem için admin yetkisi gerekli' : undefined,
      };
    
    case 'lesson-documents':
      // Lesson documents: Admin veya Superadmin
      return {
        canUpload: isAdminOrSuperadmin(userRole),
        error: !isAdminOrSuperadmin(userRole) ? 'Bu işlem için admin yetkisi gerekli' : undefined,
      };
    
    case 'activity-images':
      // Activity images: Admin, Superadmin ve branch_manager
      return {
        canUpload: isAdminOrSuperadmin(userRole) || userRole === USER_ROLE.BRANCH_MANAGER,
        error: (!isAdminOrSuperadmin(userRole) && userRole !== USER_ROLE.BRANCH_MANAGER) 
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
export const POST = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { category: string } }
) => {
  return withAuth(request, async (req, user) => {
    const category = params.category as AllowedCategory;

    // Kategori validasyonu
    if (!ALLOWED_CATEGORIES.includes(category)) {
      throw new AppValidationError(
        `Geçersiz kategori. İzin verilen kategoriler: ${ALLOWED_CATEGORIES.join(', ')}`
      );
    }

    // Kullanıcı bilgilerini al
    const { error, user: currentUserData } = await getCurrentUser(user.uid);

    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }

    if (!currentUserData) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }

    // Kategori bazlı yetki kontrolü
    const permissions = getCategoryPermissions(
      category,
      currentUserData.role
    );

    if (!permissions.canUpload) {
      throw new AppAuthorizationError(permissions.error || 'Bu işlem için yetkiniz yok');
    }

      const formData = await req.formData();

      // Dosyayı al
    const file = formData.get('file');

    if (!file) {
      throw new AppValidationError('Dosya bulunamadı');
    }

    // File tipini kontrol et
    if (!(file instanceof File) && typeof file !== 'object') {
      throw new AppValidationError('Geçersiz dosya formatı');
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
      } else if (category === 'videos') {
        validation = validateVideo(fileObj.type, fileObj.size, fileObj.name);
      } else if (category === 'lesson-documents') {
        // Lesson documents için sadece PDF ve 20MB limit
        const allowedTypes = ['application/pdf'];
        const allowedExtensions = ['.pdf'];
        const maxSize = 20 * 1024 * 1024; // 20MB
        
        if (!allowedTypes.includes(fileObj.type.toLowerCase())) {
          validation = { valid: false, error: 'Geçersiz dosya formatı. Sadece PDF dosyası yüklenebilir.' };
        } else if (fileObj.size > maxSize) {
          validation = { valid: false, error: 'Dosya boyutu çok büyük. Maksimum boyut: 20MB' };
        } else {
          const extension = fileObj.name.toLowerCase().substring(fileObj.name.lastIndexOf('.'));
          if (!allowedExtensions.includes(extension)) {
            validation = { valid: false, error: 'Geçersiz dosya uzantısı. Sadece .pdf uzantılı dosyalar yüklenebilir.' };
          } else {
            validation = { valid: true };
          }
        }
      } else if (category === 'video-thumbnails') {
        // Video thumbnails için görsel validasyonu (max 2MB)
        const thumbnailValidation = validateImage(fileObj.type, fileObj.size, fileObj.name);
        if (thumbnailValidation.valid && fileObj.size > 2 * 1024 * 1024) {
          validation = { valid: false, error: 'Thumbnail görseli en fazla 2MB olabilir' };
        } else {
          validation = thumbnailValidation;
        }
      } else {
        validation = validateImage(fileObj.type, fileObj.size, fileObj.name);
      }
    
    if (!validation.valid) {
      throw new AppValidationError(validation.error || 'Geçersiz dosya');
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
        throw new AppValidationError('User ID gerekli');
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
        throw new AppBadGatewayError(
          `Storage bucket bulunamadı. Lütfen Firebase Console'dan Storage bucket'ı oluşturun veya .env dosyasına doğru FIREBASE_STORAGE_BUCKET değerini ekleyin.`
        );
      }
      
      throw new AppBadGatewayError('Storage bucket yapılandırma hatası');
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
      throw new AppInternalServerError(`Dosya storage'a kaydedilemedi: ${errorMessage}`);
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

      // Response mesajı ve kod kategoriye göre
      let message = 'Dosya başarıyla yüklendi';
      let code = 'FILE_UPLOAD_SUCCESS';
      if (category === 'user-documents' || category === 'lesson-documents') {
        message = 'Döküman başarıyla yüklendi';
        code = 'DOCUMENT_UPLOAD_SUCCESS';
      } else if (category === 'videos') {
        message = 'Video başarıyla yüklendi';
        code = 'VIDEO_UPLOAD_SUCCESS';
      } else if (category === 'video-thumbnails') {
        message = 'Thumbnail başarıyla yüklendi';
        code = 'THUMBNAIL_UPLOAD_SUCCESS';
      } else {
        message = 'Görsel başarıyla yüklendi';
        code = 'IMAGE_UPLOAD_SUCCESS';
      }

      return successResponse(
        message,
        {
          imageUrl: publicUrl, // Backward compatibility için
          documentUrl: publicUrl, // Documents için
          videoUrl: publicUrl, // Videos için
          thumbnailUrl: publicUrl, // Thumbnails için
          fileUrl: publicUrl, // Generic
          fileName: fileName,
          size: fileObj.size,
          contentType: fileObj.type,
          category: category,
        },
        201,
        code
      );
  });
});

