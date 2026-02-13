import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { withAuth } from '@/lib/middleware/auth';
import { validateName, validateAge, validateUserPhone, validateTCKimlikNo } from '@/lib/utils/validation/userValidation';
import { EDUCATION_LEVEL } from '@shared/constants/education';
import { GENDER } from '@shared/constants/gender';
import type { UserProfileUpdateData } from '@shared/types/user';
import { generateSignedUrl } from '@/lib/utils/storage';
import { 
  successResponse, 
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError, AppNotFoundError, AppAuthorizationError, AppConflictError } from '@/lib/utils/errors/AppError';
import admin from 'firebase-admin';

import { logger } from '../../../../lib/utils/logger';
// GET /api/users/me - Kendi kullanıcı bilgilerini getir
export const GET = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
      // Firestore'dan kullanıcı bilgilerini al
      const userDoc = await db.collection('users').doc(user.uid).get();
      
      if (!userDoc.exists) {
      throw new AppNotFoundError('Kullanıcı');
      }
      
      const userData = userDoc.data();
      const userWithData: Record<string, any> = {
        uid: userDoc.id,
        ...userData,
      };
      
      // Generate signed URL for document if path exists
      if (userData?.documentPath) {
        try {
          userWithData.documentUrl = await generateSignedUrl(userData.documentPath);
        } catch (error) {
          logger.error('Failed to generate signed URL for current user:', error);
          // documentUrl will remain undefined if generation fails
        }
      }
      
      return successResponse(
        'Kullanıcı bilgileri başarıyla getirildi',
        {
          user: userWithData,
        }
      );
  });
  });

// PUT /api/users/me - Kendi bilgilerini güncelle
export const PUT = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
    const body = await parseJsonBody<any>(req);
      
      // Firestore'dan mevcut kullanıcı bilgilerini al
      const userDoc = await db.collection('users').doc(user.uid).get();
      
      if (!userDoc.exists) {
      throw new AppNotFoundError('Kullanıcı');
      }
      
      // Güncellenebilir alanlar
      const allowedFields = [
        'firstName',
        'lastName',
        'birthDate',
        'gender',
        'phone',
        'address',
        'city',
        'district',
        'tcKimlikNo',
        'fatherName',
        'motherName',
        'birthPlace',
        'education',
        'kurumSicil',
        'kadroUnvani',
        'kadroUnvanKodu',
      ];
      
      // Güncellenemeyen alanları kontrol et
      const restrictedFields = ['uid', 'email', 'role', 'status', 'createdAt', 'branchId', 'isActive'];
      const hasRestrictedField = restrictedFields.some(field => field in body);
      
      if (hasRestrictedField) {
      throw new AppAuthorizationError('Bu alanları güncelleyemezsiniz');
      }
      
      // Validation
      if (body.firstName !== undefined) {
        const nameValidation = validateName(body.firstName, 'Ad');
        if (!nameValidation.valid) {
        throw new AppValidationError(nameValidation.error || 'Geçersiz ad');
        }
      }
      
      if (body.lastName !== undefined) {
        const nameValidation = validateName(body.lastName, 'Soyad');
        if (!nameValidation.valid) {
        throw new AppValidationError(nameValidation.error || 'Geçersiz soyad');
        }
      }
      
      if (body.birthDate !== undefined) {
        const ageValidation = validateAge(body.birthDate);
        if (!ageValidation.valid) {
        throw new AppValidationError(ageValidation.error || 'Geçersiz doğum tarihi');
        }
      }
      
      if (body.gender !== undefined) {
        if (body.gender !== GENDER.MALE && body.gender !== GENDER.FEMALE) {
        throw new AppValidationError('Cinsiyet sadece male veya female olabilir');
        }
      }
      
      if (body.phone !== undefined) {
        const phoneValidation = validateUserPhone(body.phone);
        if (!phoneValidation.valid) {
        throw new AppValidationError(phoneValidation.error || 'Geçersiz telefon numarası');
        }
      }
      
      if (body.tcKimlikNo !== undefined) {
        const tcValidation = validateTCKimlikNo(body.tcKimlikNo);
        if (!tcValidation.valid) {
        throw new AppValidationError(tcValidation.error || 'Geçersiz TC Kimlik No');
        }
        
        // TC Kimlik No'nun başka kullanıcıda olup olmadığını kontrol et
        const existingUser = await db.collection('users')
          .where('tcKimlikNo', '==', body.tcKimlikNo)
          .where('uid', '!=', user.uid)
          .limit(1)
          .get();
        
        if (!existingUser.empty) {
        throw new AppConflictError('Bu TC Kimlik No zaten kullanılıyor');
        }
      }
      
      if (body.fatherName !== undefined && body.fatherName) {
        const nameValidation = validateName(body.fatherName, 'Baba adı');
        if (!nameValidation.valid) {
        throw new AppValidationError(nameValidation.error || 'Geçersiz baba adı');
        }
      }
      
      if (body.motherName !== undefined && body.motherName) {
        const nameValidation = validateName(body.motherName, 'Anne adı');
        if (!nameValidation.valid) {
        throw new AppValidationError(nameValidation.error || 'Geçersiz anne adı');
        }
      }
      
      if (body.education !== undefined && body.education) {
        if (!Object.values(EDUCATION_LEVEL).includes(body.education)) {
        throw new AppValidationError('Geçersiz eğitim seviyesi');
        }
      }
      
      // Sadece izin verilen ve gönderilen alanları al
      const updateData: UserProfileUpdateData = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      allowedFields.forEach(field => {
        if (body[field] !== undefined) {
          // birthDate için timestamp'e çevir
          if (field === 'birthDate' && body[field]) {
            updateData[field] = admin.firestore.Timestamp.fromDate(new Date(body[field]));
          } else {
            (updateData as any)[field] = body[field];
          }
        }
      });
      
      // Firestore'da güncelle
      await db.collection('users').doc(user.uid).update(updateData as any);
      
      // Güncellenmiş kullanıcı bilgilerini getir
      const updatedUserDoc = await db.collection('users').doc(user.uid).get();
      const updatedUserData = updatedUserDoc.data();
      
      return successResponse(
        'Bilgileriniz başarıyla güncellendi',
        {
          user: {
            uid: updatedUserDoc.id,
            ...updatedUserData,
          },
        },
        200,
        'USER_UPDATE_SUCCESS'
      );
  });
  });

