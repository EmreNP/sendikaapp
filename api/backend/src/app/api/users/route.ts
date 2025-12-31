import { NextRequest } from 'next/server';
import { auth, db } from '@/lib/firebase/admin';
import type { Query } from 'firebase-admin/firestore';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import { USER_STATUS } from '@shared/constants/status';
import type { CreateUserData, User } from '@shared/types/user';
import { validateEmail } from '@/lib/utils/validation/commonValidation';
import { validatePassword } from '@/lib/utils/validation/authValidation';
import { sendEmailVerification } from '@/lib/services/firebaseEmailService';
import { 
  successResponse, 
  unauthorizedError,
  notFoundError,
  isErrorWithMessage,
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody, parseQueryParamAsNumber } from '@/lib/utils/request';
import { AppValidationError, AppAuthorizationError } from '@/lib/utils/errors/AppError';
import admin from 'firebase-admin';

// GET /api/users - Kullanıcı listesi
export const GET = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
      // Kullanıcının rolünü kontrol et
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
      }
      
      const userRole = currentUserData!.role;
      
      // User rolü liste göremez
      if (userRole === USER_ROLE.USER) {
      throw new AppAuthorizationError('Bu işlem için yetkiniz yok');
      }
      
      // Query parametreleri
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const role = url.searchParams.get('role');
    const branchId = url.searchParams.get('branchId');
    const page = parseQueryParamAsNumber(url, 'page', 1, 1);
    const limit = parseQueryParamAsNumber(url, 'limit', 20, 1);
    const search = url.searchParams.get('search');
      
      // Query oluştur
      let query: Query = db.collection('users');
      
      // Branch Manager sadece kendi şubesindeki kullanıcıları görebilir
      if (userRole === USER_ROLE.BRANCH_MANAGER) {
        query = query.where('branchId', '==', currentUserData!.branchId);
      }
      
      // Admin için filtreleme
      if (userRole === USER_ROLE.ADMIN) {
        if (branchId) {
          query = query.where('branchId', '==', branchId);
        }
      }
      
      // Status filtresi
      if (status) {
        query = query.where('status', '==', status);
      }
      
      // Role filtresi
      if (role) {
        query = query.where('role', '==', role);
      }
      
      // Query'yi çalıştır
      const snapshot = await query.get();
      
      let users = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as User[];
      
      // Search filtresi (client-side - Firestore'da full-text search yok)
      if (search) {
        const searchLower = search.toLowerCase();
        users = users.filter((u: User) => {
          const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
          const email = (u.email || '').toLowerCase();
          return fullName.includes(searchLower) || email.includes(searchLower);
        });
      }
      
      // Sayfalama
      const total = users.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = users.slice(startIndex, endIndex);
      
      return successResponse(
        'Kullanıcı listesi başarıyla getirildi',
        {
          users: paginatedUsers,
          total,
          page,
          limit,
        }
      );
  });
  });

// POST /api/users - Kullanıcı oluştur
export const POST = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
    const body = await parseJsonBody<any>(req);
      
      // Kullanıcının rolünü kontrol et
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
        return error;
      }
      
      const userRole = currentUserData!.role;
      
      // User rolü kullanıcı oluşturamaz
      if (userRole === USER_ROLE.USER) {
      throw new AppAuthorizationError('Bu işlem için yetkiniz yok');
      }
      
      // Gerekli alanlar
      const {
        firstName,
        lastName,
        email,
        password,
        role,
        branchId,
        status,
        birthDate,
        gender,
        phone,
      } = body;
      
      // Validasyon
      if (!firstName || !lastName || !email || !password) {
      throw new AppValidationError('Gerekli alanlar eksik');
      }
      
      // Email validasyonu
      if (!validateEmail(email)) {
      throw new AppValidationError('Geçersiz e-posta adresi');
      }
      
      // Şifre validasyonu
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
      throw new AppValidationError(passwordValidation.error || 'Geçersiz şifre');
      }
      
      // Branch Manager kısıtlamaları
      if (userRole === USER_ROLE.BRANCH_MANAGER) {
        // Sadece 'user' rolü oluşturabilir
        if (role && role !== USER_ROLE.USER) {
        throw new AppAuthorizationError('Branch Manager sadece user rolü oluşturabilir');
        }
        
        // branchId otomatik olarak Branch Manager'ın branchId'si olur
        if (branchId && branchId !== currentUserData!.branchId) {
        throw new AppAuthorizationError('Sadece kendi şubeniz için kullanıcı oluşturabilirsiniz');
        }
      }
      
      // Admin için rol kontrolü
      if (userRole === USER_ROLE.ADMIN) {
        // Branch manager oluşturuluyorsa branchId zorunlu
        if (role === USER_ROLE.BRANCH_MANAGER && !branchId) {
        throw new AppValidationError('Branch manager için branchId zorunludur');
        }
      }
      
      // Firebase Auth'da kullanıcı oluştur
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: `${firstName} ${lastName}`,
        emailVerified: false, // Tüm kullanıcılar email doğrulamalı (admin oluştursa bile)
      });
      
      console.log(`✅ Auth user created: ${userRecord.uid}`);
      
      // Firestore'da kullanıcı belgesi oluştur
      const userData: CreateUserData = {
        uid: userRecord.uid,
        email,
        emailVerified: false, // Tüm kullanıcılar email doğrulamalı
        firstName,
        lastName,
        role: userRole === USER_ROLE.BRANCH_MANAGER ? USER_ROLE.USER : (role || USER_ROLE.USER),
        status: status || (userRole === USER_ROLE.ADMIN ? USER_STATUS.ACTIVE : USER_STATUS.PENDING_ADMIN_APPROVAL),
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      // branchId ekle
      if (userRole === USER_ROLE.BRANCH_MANAGER) {
        userData.branchId = currentUserData!.branchId;
      } else if (branchId) {
        userData.branchId = branchId;
      }
      
      // Opsiyonel alanları ekle
      if (birthDate) userData.birthDate = admin.firestore.Timestamp.fromDate(new Date(birthDate));
      if (gender) userData.gender = gender;
      if (phone) userData.phone = phone;
      
      await db.collection('users').doc(userRecord.uid).set(userData);
      
      console.log(`✅ User document created: ${userRecord.uid}`);
      
      // 4️⃣ E-POSTA DOĞRULAMA EMAİLİ GÖNDER
      try {
        await sendEmailVerification(email);
        console.log(`✅ Email verification sent to ${email}`);
      } catch (emailError: unknown) {
        const errorMessage = isErrorWithMessage(emailError) ? emailError.message : 'Bilinmeyen hata';
        console.error('❌ Email verification error:', errorMessage);
        // Hata olsa bile devam et (kullanıcı kaydı başarılı)
        // Email gönderilemese bile kullanıcı sonradan manuel olarak email doğrulayabilir
      }
      
      return successResponse(
        'Kullanıcı başarıyla oluşturuldu',
        {
          user: {
            uid: userRecord.uid,
            email,
            role: userData.role,
            status: userData.status,
          },
        },
        201,
        'USER_CREATE_SUCCESS'
      );
  });
  });

