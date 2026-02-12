import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { Topic } from '@shared/types/contact';
import { 
  successResponse
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError, AppNotFoundError, AppAuthorizationError } from '@/lib/utils/errors/AppError';

// GET - Tek konu detayı (aktif konuları herkes görebilir)
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
    const topicId = params.id;

    const topicDoc = await db.collection('topics').doc(topicId).get();

    if (!topicDoc.exists) {
      throw new AppNotFoundError('Konu');
    }

    const topicData = topicDoc.data();

    // Admin/Superadmin olmayan kullanıcılar sadece aktif konuları görebilir
    const { error, user: currentUserData } = await getCurrentUser(user.uid);
    const isAdmin = !error && (currentUserData?.role === USER_ROLE.ADMIN || currentUserData?.role === USER_ROLE.SUPERADMIN);

    if (!isAdmin && !topicData?.isActive) {
      throw new AppNotFoundError('Konu');
    }

    const topic: Topic = {
      id: topicDoc.id,
      ...topicData,
    } as Topic;

    return successResponse('Konu getirildi', { topic });
  });
});

// PUT - Konu güncelle (sadece admin)
export const PUT = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
    const topicId = params.id;

    const { error, user: currentUserData } = await getCurrentUser(user.uid);
    
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }

    if (!currentUserData || (currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN)) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
    }

    const topicDoc = await db.collection('topics').doc(topicId).get();

    if (!topicDoc.exists) {
      throw new AppNotFoundError('Konu');
    }

    const body = await parseJsonBody<{
      name?: string;
      isVisibleToBranchManager?: boolean; // Admin bu boolean ile branch manager görünürlüğünü yönetir
      description?: string;
      isActive?: boolean;
    }>(req);

    const { name, isVisibleToBranchManager, description, isActive } = body;

    const updateData: Record<string, any> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (name !== undefined) {
      if (name.trim().length < 2 || name.trim().length > 100) {
        throw new AppValidationError('İsim 2-100 karakter arasında olmalıdır');
      }
      updateData.name = name.trim();
    }

    if (isVisibleToBranchManager !== undefined) {
      if (typeof isVisibleToBranchManager !== 'boolean') {
        throw new AppValidationError('isVisibleToBranchManager boolean olmalıdır');
      }
      updateData.isVisibleToBranchManager = isVisibleToBranchManager;
    }

    if (description !== undefined) {
      updateData.description = description.trim() || null;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    await db.collection('topics').doc(topicId).update(updateData);

    // Güncellenmiş konuyu getir
    const updatedTopicDoc = await db.collection('topics').doc(topicId).get();
    const updatedTopic: Topic = {
      id: topicId,
      ...updatedTopicDoc.data(),
    } as Topic;

    return successResponse(
      'Konu başarıyla güncellendi',
      { topic: updatedTopic },
      200,
      'TOPIC_UPDATE_SUCCESS'
    );
  });
});

// DELETE - Konu sil (sadece admin, soft delete)
export const DELETE = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
    const topicId = params.id;

    const { error, user: currentUserData } = await getCurrentUser(user.uid);
    
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }

    if (!currentUserData || (currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN)) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
    }

    const topicDoc = await db.collection('topics').doc(topicId).get();

    if (!topicDoc.exists) {
      throw new AppNotFoundError('Konu');
    }

    // Soft delete - isActive: false yap
    await db.collection('topics').doc(topicId).update({
      isActive: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return successResponse(
      'Konu başarıyla silindi',
      undefined,
      200,
      'TOPIC_DELETE_SUCCESS'
    );
  });
});

