import { NextRequest } from 'next/server';
import { auth, db } from '@/lib/firebase/admin';
import type { Query } from 'firebase-admin/firestore';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import { USER_STATUS } from '@shared/constants/status';
import type { CreateUserData, User } from '@shared/types/user';
import { validateEmail } from '@/lib/utils/validation/commonValidation';
import { validatePassword } from '@/lib/utils/validation/authValidation';
import { generateSignedUrl } from '@/lib/utils/storage';
import { 
  successResponse, 
  unauthorizedError,
  notFoundError,
  isErrorWithMessage,
} from '@/lib/utils/response';

// Default password to use when none is provided by admin/branch manager
const DEFAULT_PASSWORD = '123456'; // Per product decision: default for new users

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
      
      // Branch Manager sadece kendi şubesindeki 'user' rolündeki kullanıcıları görebilir
      if (userRole === USER_ROLE.BRANCH_MANAGER) {
        query = query.where('branchId', '==', currentUserData!.branchId).where('role', '==', USER_ROLE.USER);
      }
      
      // Admin ve Superadmin için filtreleme
      if (userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.SUPERADMIN) {
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
      
      // Generate signed URLs for documents
      const usersWithUrls = await Promise.all(
        paginatedUsers.map(async (user) => {
          if (user.documentPath) {
            try {
              const documentUrl = await generateSignedUrl(user.documentPath);
              return { ...user, documentUrl };
            } catch (error) {
              console.error(`Failed to generate signed URL for user ${user.uid}:`, error);
              return user;
            }
          }
          return user;
        })
      );
      
      return successResponse(
        'Kullanıcı listesi başarıyla getirildi',
        {
          users: usersWithUrls,
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
      
      // Gerekli alanlar (parola opsiyonel, verilmezse DEFAULT_PASSWORD kullanılır)
      const {
        firstName,
        lastName,
        email,
        password: providedPassword,
        role,
        branchId,
        status,
        birthDate,
        gender,
        phone,
      } = body;
      
      // Validasyon
      if (!firstName || !lastName || !email) {
      throw new AppValidationError('Gerekli alanlar eksik');
      }
      
      // Email validasyonu
      if (!validateEmail(email)) {
      throw new AppValidationError('Geçersiz e-posta adresi');
      }
      
      // Determine password: use provided or fallback to default
      let password = providedPassword;
      let usedDefaultPassword = false;
      if (!password) {
        password = DEFAULT_PASSWORD;
        usedDefaultPassword = true;
        console.warn('Password not provided: using DEFAULT_PASSWORD for new user creation');
      }
      
      // Şifre validasyonu - only validate if explicit password provided; default password is allowed even if it would fail validation
      if (!usedDefaultPassword) {
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
          throw new AppValidationError(passwordValidation.error || 'Geçersiz şifre');
        }
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
      
      // Admin rol kısıtlamaları - sadece superadmin, admin rolü oluşturabilir
      if (userRole === USER_ROLE.ADMIN) {
        if (role === USER_ROLE.ADMIN || role === USER_ROLE.SUPERADMIN) {
        throw new AppAuthorizationError('Admin rolü sadece superadmin tarafından atanabilir');
        }
        // Branch manager oluşturuluyorsa branchId zorunlu
        if (role === USER_ROLE.BRANCH_MANAGER && !branchId) {
        throw new AppValidationError('Branch manager için branchId zorunludur');
        }
      }
      
      // Superadmin için rol kontrolü
      if (userRole === USER_ROLE.SUPERADMIN) {
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
        emailVerified: true,
      });
      
      console.log(`✅ Auth user created: ${userRecord.uid}`);
      
      // Firestore'da kullanıcı belgesi oluştur
      const userData: CreateUserData = {
        uid: userRecord.uid,
        email,
        emailVerified: true,
        firstName,
        lastName,
        role: userRole === USER_ROLE.BRANCH_MANAGER ? USER_ROLE.USER : (role || USER_ROLE.USER),
        status: status || ((userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.SUPERADMIN) ? USER_STATUS.ACTIVE : USER_STATUS.PENDING_BRANCH_REVIEW),
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
      
      // Email verification is disabled: no verification email sent.
      
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

