import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { withAuth } from '@/lib/middleware/auth';
import { validateName, validateAge, validateUserPhone, validateTCKimlikNo } from '@/lib/utils/validation/userValidation';
import { EDUCATION_LEVEL } from '@shared/constants/education';
import { GENDER } from '@shared/constants/gender';
import type { UserProfileUpdateData } from '@shared/types/user';
import { 
  successResponse, 
  validationError, 
  unauthorizedError,
  notFoundError,
  serverError,
  isErrorWithMessage
} from '@/lib/utils/response';
import admin from 'firebase-admin';

// GET /api/users/me - Kendi kullanıcı bilgilerini getir
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      // Firestore'dan kullanıcı bilgilerini al
      const userDoc = await db.collection('users').doc(user.uid).get();
      
      if (!userDoc.exists) {
        return notFoundError('Kullanıcı');
      }
      
      const userData = userDoc.data();
      
      return successResponse(
        'Kullanıcı bilgileri başarıyla getirildi',
        {
          user: {
            uid: userDoc.id,
            ...userData,
          },
        }
      );
      
    } catch (error: unknown) {
      console.error('❌ Get me error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError(
        'Kullanıcı bilgileri alınırken bir hata oluştu',
        errorMessage
      );
    }
  });
}

// PUT /api/users/me - Kendi bilgilerini güncelle
export async function PUT(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await request.json();
      
      // Firestore'dan mevcut kullanıcı bilgilerini al
      const userDoc = await db.collection('users').doc(user.uid).get();
      
      if (!userDoc.exists) {
        return notFoundError('Kullanıcı');
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
        return unauthorizedError('Bu alanları güncelleyemezsiniz');
      }
      
      // Validation
      if (body.firstName !== undefined) {
        const nameValidation = validateName(body.firstName, 'Ad');
        if (!nameValidation.valid) {
          return validationError(nameValidation.error || 'Geçersiz ad');
        }
      }
      
      if (body.lastName !== undefined) {
        const nameValidation = validateName(body.lastName, 'Soyad');
        if (!nameValidation.valid) {
          return validationError(nameValidation.error || 'Geçersiz soyad');
        }
      }
      
      if (body.birthDate !== undefined) {
        const ageValidation = validateAge(body.birthDate);
        if (!ageValidation.valid) {
          return validationError(ageValidation.error || 'Geçersiz doğum tarihi');
        }
      }
      
      if (body.gender !== undefined) {
        if (body.gender !== GENDER.MALE && body.gender !== GENDER.FEMALE) {
          return validationError('Cinsiyet sadece male veya female olabilir');
        }
      }
      
      if (body.phone !== undefined) {
        const phoneValidation = validateUserPhone(body.phone);
        if (!phoneValidation.valid) {
          return validationError(phoneValidation.error || 'Geçersiz telefon numarası');
        }
      }
      
      if (body.tcKimlikNo !== undefined) {
        const tcValidation = validateTCKimlikNo(body.tcKimlikNo);
        if (!tcValidation.valid) {
          return validationError(tcValidation.error || 'Geçersiz TC Kimlik No');
        }
        
        // TC Kimlik No'nun başka kullanıcıda olup olmadığını kontrol et
        const existingUser = await db.collection('users')
          .where('tcKimlikNo', '==', body.tcKimlikNo)
          .where('uid', '!=', user.uid)
          .limit(1)
          .get();
        
        if (!existingUser.empty) {
          return validationError('Bu TC Kimlik No zaten kullanılıyor');
        }
      }
      
      if (body.fatherName !== undefined && body.fatherName) {
        const nameValidation = validateName(body.fatherName, 'Baba adı');
        if (!nameValidation.valid) {
          return validationError(nameValidation.error || 'Geçersiz baba adı');
        }
      }
      
      if (body.motherName !== undefined && body.motherName) {
        const nameValidation = validateName(body.motherName, 'Anne adı');
        if (!nameValidation.valid) {
          return validationError(nameValidation.error || 'Geçersiz anne adı');
        }
      }
      
      if (body.education !== undefined && body.education) {
        if (!Object.values(EDUCATION_LEVEL).includes(body.education)) {
          return validationError('Geçersiz eğitim seviyesi');
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
      
    } catch (error: unknown) {
      console.error('❌ Update me error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError(
        'Bilgiler güncellenirken bir hata oluştu',
        errorMessage
      );
    }
  });
}

