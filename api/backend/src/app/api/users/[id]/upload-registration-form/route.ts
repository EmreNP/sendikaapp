import { NextRequest } from 'next/server';
import { db, storage } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import { successResponse } from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError, AppAuthorizationError, AppNotFoundError } from '@/lib/utils/errors/AppError';
import { isErrorWithMessage } from '@/lib/utils/response';

import { logger } from '../../../../../lib/utils/logger';
// POST /api/users/[id]/upload-registration-form
export const POST = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
    const targetUserId = params.id;

    const body = await parseJsonBody<{ fileName: string; contentType: string; base64: string }>(req);
    const { fileName, contentType, base64 } = body;

    if (!fileName || !contentType || !base64) {
      throw new AppValidationError('fileName, contentType ve base64 alanları zorunludur');
    }

    if (contentType !== 'application/pdf') {
      throw new AppValidationError('Sadece PDF dosyası kabul edilir');
    }

    // Kullanıcının rolünü kontrol et
    const { error, user: currentUserData } = await getCurrentUser(user.uid);
    if (error) return error;

    const userRole = currentUserData!.role;
    if (userRole === USER_ROLE.USER) {
      throw new AppAuthorizationError('Bu işlem için yetkiniz yok');
    }

    // Branch manager kendi şubesindeki kullanıcıları güncelleyebilir
    const targetUserDoc = await db.collection('users').doc(targetUserId).get();
    if (!targetUserDoc.exists) throw new AppNotFoundError('Kullanıcı');
    const targetUserData = targetUserDoc.data();

    if (userRole === USER_ROLE.BRANCH_MANAGER) {
      if (targetUserData?.branchId !== currentUserData!.branchId) {
        throw new AppAuthorizationError('Bu kullanıcıya erişim yetkiniz yok');
      }
    }

    // Decode base64
    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64, 'base64');
    } catch (err) {
      throw new AppValidationError('Base64 decoding failed');
    }

    const maxSizeBytes = 10 * 1024 * 1024;
    if (buffer.length > maxSizeBytes) {
      throw new AppValidationError('Dosya boyutu 10MB\'dan küçük olmalıdır');
    }

    // Upload to bucket
    const timestamp = Date.now();
    const path = `user-registration-forms/${targetUserId}/${fileName}`;

    try {
      const bucket = admin.storage().bucket();
      const file = bucket.file(path);
      await file.save(buffer, { metadata: { contentType } });

      // Update user doc with storage path (not signed URL)
      await db.collection('users').doc(targetUserId).update({ 
        documentPath: path,  // Store path instead of URL
        updatedAt: admin.firestore.FieldValue.serverTimestamp() 
      });

      // Generate signed URL for response (temporary, 7 days)
      const [signedUrl] = await file.getSignedUrl({ 
        action: 'read', 
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000 
      });

      return successResponse('Dosya başarılı bir şekilde yüklendi', { 
        documentUrl: signedUrl,  // Return signed URL for immediate use
        documentPath: path       // Also return path for reference
      });
    } catch (err: any) {
      logger.error('Upload error:', err);
      throw new AppValidationError('Dosya yüklenirken bir hata oluştu');
    }
  });
});
