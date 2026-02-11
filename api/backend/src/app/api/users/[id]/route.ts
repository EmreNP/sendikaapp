import { NextRequest } from 'next/server';
import { auth, db } from '@/lib/firebase/admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import { USER_STATUS } from '@shared/constants/status';
import { createRegistrationLog } from '@/lib/services/registrationLogService';
import { generateSignedUrl } from '@/lib/utils/storage';
import admin from 'firebase-admin';
import { 
  successResponse, 
  serializeUserTimestamps
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { AppValidationError, AppAuthorizationError, AppNotFoundError } from '@/lib/utils/errors/AppError';
import { isErrorWithMessage } from '@/lib/utils/response';
import { parseJsonBody } from '@/lib/utils/request';

// GET /api/users/[id] - Kullanıcı detayı
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const targetUserId = params.id;
      
      // Kullanıcının rolünü kontrol et
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
      }
      
      const userRole = currentUserData!.role;
      
      // Hedef kullanıcıyı getir
      const targetUserDoc = await db.collection('users').doc(targetUserId).get();
      
      if (!targetUserDoc.exists) {
      throw new AppNotFoundError('Kullanıcı');
      }
      
      const targetUserData = targetUserDoc.data();
      
      // Yetki kontrolü
      if (userRole === USER_ROLE.USER) {
        // User sadece kendi bilgilerini görebilir
        if (targetUserId !== user.uid) {
        throw new AppAuthorizationError('Bu işlem için yetkiniz yok');
        }
      } else if (userRole === USER_ROLE.BRANCH_MANAGER) {
        // Branch Manager sadece kendi şubesindeki kullanıcıları görebilir
        const targetBranchId = targetUserData?.branchId;
        const currentBranchId = currentUserData!.branchId;
        const branchesMatch = targetBranchId === currentBranchId;
        const branchCheck = targetUserId !== user.uid && !branchesMatch;
        
        if (branchCheck) {
        throw new AppAuthorizationError('Bu kullanıcıya erişim yetkiniz yok');
        }
      }
      // Admin herhangi bir kullanıcıyı görebilir
      
      // Timestamp'leri serialize et
      const userData = {
        uid: targetUserDoc.id,
        ...targetUserData,
      };
      const serializedUser = serializeUserTimestamps(userData);
      
      // Generate signed URL for document if path exists
      if (serializedUser.documentPath) {
        try {
          serializedUser.documentUrl = await generateSignedUrl(serializedUser.documentPath);
        } catch (error) {
          console.error(`Failed to generate signed URL for user ${targetUserId}:`, error);
        }
      }
      
      return successResponse(
        'Kullanıcı bilgileri başarıyla getirildi',
        {
          user: serializedUser,
        }
      );
  });
  });

// DELETE /api/users/[id] - Kullanıcı sil (Hard Delete)
export const DELETE = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const targetUserId = params.id;
      
      // Kullanıcının rolünü kontrol et
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
      }
      
      const userRole = currentUserData!.role;
      
      // Admin, Superadmin veya Branch Manager hard delete yapabilir
      if (userRole !== USER_ROLE.ADMIN && userRole !== USER_ROLE.SUPERADMIN && userRole !== USER_ROLE.BRANCH_MANAGER) {
      throw new AppAuthorizationError('Bu işlem için yetkiniz yok');
      }
      
      // Hedef kullanıcıyı kontrol et
      const targetUserDoc = await db.collection('users').doc(targetUserId).get();
      
      if (!targetUserDoc.exists) {
      throw new AppNotFoundError('Kullanıcı');
      }
      
      const targetUserData = targetUserDoc.data();
      
      // Branch Manager kısıtlamaları
      if (userRole === USER_ROLE.BRANCH_MANAGER) {
        // Sadece kendi şubesindeki kullanıcıları silebilir
        if (!targetUserData?.branchId || targetUserData.branchId !== currentUserData!.branchId) {
          throw new AppAuthorizationError('Sadece kendi şubenizdeki kullanıcıları silebilirsiniz');
        }
        // Sadece 'user' rolündeki kullanıcıları silebilir
        if (targetUserData.role !== USER_ROLE.USER) {
          throw new AppAuthorizationError('Sadece kullanıcı rolündeki kişileri silebilirsiniz');
        }
      }
      
      // Kendini silmeye izin verme
      if (targetUserId === user.uid) {
      throw new AppValidationError('Kendi hesabınızı silemezsiniz');
      }
      
      // Firebase Auth'dan sil
      try {
        await auth.deleteUser(targetUserId);
        console.log(`✅ Firebase Auth user deleted: ${targetUserId}`);
      } catch (authError: unknown) {
        const errorMessage = isErrorWithMessage(authError) ? authError.message : 'Bilinmeyen hata';
        console.error('⚠️ Firebase Auth delete error:', errorMessage);
        // Auth'da yoksa devam et
      }
      
      // Firestore'dan sil
      await db.collection('users').doc(targetUserId).delete();
      console.log(`✅ Firestore user document deleted: ${targetUserId}`);
      
      return successResponse(
        'Kullanıcı kalıcı olarak silindi',
        undefined,
        200,
        'USER_DELETE_SUCCESS'
      );
  });
  });

// PATCH /api/users/[id] - Kullanıcı bilgilerini güncelle
export const PATCH = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const targetUserId = params.id;
      const body = await parseJsonBody<any>(req);
      
      // Kullanıcının rolünü kontrol et
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
      }
      
      const userRole = currentUserData!.role;
      
      // User rolü güncelleyemez
      if (userRole === USER_ROLE.USER) {
      throw new AppAuthorizationError('Bu işlem için yetkiniz yok');
      }
      
      // Hedef kullanıcıyı getir
      let targetUserDoc = await db.collection('users').doc(targetUserId).get();
      let targetUserData = targetUserDoc.exists ? targetUserDoc.data() : null;

      // Eğer kullanıcı dokümanı yoksa, minimal bir doküman oluşturup devam et
      if (!targetUserDoc.exists) {
        try {
          const authUser = await auth.getUser(targetUserId);
          const displayName = authUser.displayName || '';
          const [firstNameFromAuth, ...rest] = displayName.trim().split(' ');
          const lastNameFromAuth = rest.join(' ');

          const initialDoc: any = {
            uid: targetUserId,
            email: authUser.email || null,
            firstName: firstNameFromAuth || '',
            lastName: lastNameFromAuth || '',
            role: USER_ROLE.USER,
            status: USER_STATUS.PENDING_DETAILS,
            isActive: true,
            emailVerified: authUser.emailVerified || false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          await db.collection('users').doc(targetUserId).set(initialDoc);
          targetUserDoc = await db.collection('users').doc(targetUserId).get();
          targetUserData = targetUserDoc.data();
        } catch (err: any) {
          // Auth'da kullanıcı yoksa Not Found gönder
          console.error('Error creating initial user doc:', err);
          throw new AppNotFoundError('Kullanıcı');
        }
      }
      
      const targetRole = targetUserData?.role;
      
      // Yetki kontrolü - Aynı yetkiye sahip kişiler birbirini düzenleyemez
      if (userRole === targetRole && targetUserId !== user.uid) {
      throw new AppAuthorizationError('Aynı yetkiye sahip kullanıcıların bilgilerini düzenleyemezsiniz');
      }
      
      // Branch Manager kısıtlamaları
      if (userRole === USER_ROLE.BRANCH_MANAGER) {
        // Sadece kendi şubesindeki kullanıcıları düzenleyebilir
        if (targetUserData?.branchId !== currentUserData!.branchId) {
        throw new AppAuthorizationError('Bu kullanıcıya erişim yetkiniz yok');
        }
        // Branch Manager sadece user rolündeki kullanıcıları düzenleyebilir
        if (targetRole !== USER_ROLE.USER) {
        throw new AppAuthorizationError('Sadece kullanıcı rolündeki kişileri düzenleyebilirsiniz');
        }
      }
      
      // Admin kısıtlamaları - Superadmin ve Admin kullanıcıları düzenleyemez
      if (userRole === USER_ROLE.ADMIN) {
        if (targetRole === USER_ROLE.ADMIN || targetRole === USER_ROLE.SUPERADMIN) {
        throw new AppAuthorizationError('Admin, diğer admin veya superadmin kullanıcıları düzenleyemez');
        }
      }
      
      // Kendini düzenlemeye izin verme (özel endpoint'ler kullanılmalı)
      if (targetUserId === user.uid) {
      throw new AppValidationError('Kendi bilgilerinizi bu endpoint ile güncelleyemezsiniz');
      }
      
      // Güncellenebilir alanları filtrele
      const allowedFields = [
        'firstName',
        'lastName',
        'email',
        'phone',
        'birthDate',
        'gender',
        'tcKimlikNo',
        'fatherName',
        'motherName',
        'birthPlace',
        'education',
        'kurumSicil',
        'kadroUnvani',
        'kadroUnvanKodu',
        'address',
        'city',
        'district',
        'branchId',
        'documentUrl',
        'isMemberOfOtherUnion',
      ];
      
      const updateData: any = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      const updatedFields: string[] = [];
      const fieldChanges: Record<string, { oldValue: any; newValue: any }> = {};
      
      // Sadece izin verilen alanları ekle
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          const oldValue = targetUserData?.[field];
          
          // birthDate özel işlem gerektirir
          if (field === 'birthDate' && body[field]) {
            const newDate = admin.firestore.Timestamp.fromDate(new Date(body[field]));
            updateData[field] = newDate;
            
            // Sadece değişmişse fieldChanges'e ekle - Tarihleri normalize et (YYYY-MM-DD)
            const normalizeDate = (date: any) => {
              if (!date) return null;
              const d = date.toDate ? date.toDate() : new Date(date);
              return d.toISOString().split('T')[0]; // Sadece tarih kısmı: YYYY-MM-DD
            };
            
            const oldDateNormalized = normalizeDate(oldValue);
            const newDateNormalized = normalizeDate(body[field]);
            
            if (oldDateNormalized !== newDateNormalized) {
              fieldChanges[field] = { 
                oldValue: oldValue ? (oldValue.toDate ? oldValue.toDate().toISOString() : oldValue) : null, 
                newValue: body[field] 
              };
              updatedFields.push(field);
            }
          } else {
            updateData[field] = body[field];
            
            // Sadece değişmişse fieldChanges'e ekle
            if (oldValue !== body[field]) {
              fieldChanges[field] = { oldValue, newValue: body[field] };
              updatedFields.push(field);
            }
          }
        }
      }
      
      // En az bir alan güncellenmeli (updatedAt haricinde)
      // updateData'da updatedAt dışında bir şey varsa güncellemeye izin ver
      const hasRealUpdates = Object.keys(updateData).length > 1 || updatedFields.length > 0;
      if (!hasRealUpdates) {
        throw new AppValidationError('Güncellenecek en az bir alan belirtilmelidir');
      }
      
      // Firestore'da güncelle
      await db.collection('users').doc(targetUserId).update(updateData);
      
      console.log(`✅ User ${targetUserId} updated by ${user.uid}. Updated fields: ${updatedFields.join(', ')}`);
      
      // Log oluştur
      let logCreated = false;
      try {
        const logData: any = {
          userId: targetUserId,
          action: 'user_update',
          performedBy: user.uid,
          performedByRole: userRole as any,
          metadata: {
            updatedFields,
            fieldChanges,
          },
        };

        if (body.note) {
          logData.note = body.note;
        }
        
        // documentUrl - Hem değişiklik hem de mevcut durumu logla
        if (body.documentUrl) {
          logData.documentUrl = body.documentUrl;
          // Eğer değişmişse previousDocumentUrl da ekle
          if (fieldChanges.documentUrl) {
            logData.previousDocumentUrl = fieldChanges.documentUrl.oldValue;
          }
        }

        await createRegistrationLog(logData);
        logCreated = true;
      } catch (logErr: any) {
        console.error('Failed to create user_update log:', logErr?.message || logErr);
      }
      
      return successResponse(
        'Kullanıcı bilgileri başarıyla güncellendi',
        {
          user: {
            uid: targetUserId,
            updatedFields,
          },
        },
        200,
        'USER_UPDATE_SUCCESS'
      );
  });
  });
