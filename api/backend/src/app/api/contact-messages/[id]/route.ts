import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { ContactMessage, UpdateContactMessageRequest } from '@shared/types/contact';
import { 
  successResponse
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError, AppNotFoundError, AppAuthorizationError } from '@/lib/utils/errors/AppError';

// GET - Tek mesaj detayı
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
    const messageId = params.id;

    const { error, user: currentUserData } = await getCurrentUser(user.uid);
    
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }

    const userRole = currentUserData!.role;

    const messageDoc = await db.collection('contact_messages').doc(messageId).get();

    if (!messageDoc.exists) {
      throw new AppNotFoundError('Mesaj');
    }

    const messageData = messageDoc.data()!;
    const message: ContactMessage = {
      id: messageDoc.id,
      ...messageData,
    } as ContactMessage;

    // Yetki kontrolü
    if (userRole === USER_ROLE.USER) {
      // User sadece kendi mesajlarını görebilir
      if (message.userId !== user.uid) {
        throw new AppNotFoundError('Mesaj');
      }
    } 
    else if (userRole === USER_ROLE.BRANCH_MANAGER) {
      // Branch manager: Sadece kendi şubesinin ve branch manager'a görünür konulara ait mesajları görebilir
      if (message.branchId !== currentUserData!.branchId) {
        throw new AppNotFoundError('Mesaj');
      }

      // Topic'in branch manager'a görünür olduğunu kontrol et
      const topicDoc = await db.collection('topics').doc(message.topicId).get();
      if (!topicDoc.exists || !topicDoc.data()?.isVisibleToBranchManager) {
        throw new AppNotFoundError('Mesaj');
      }
    }
    // Admin tüm mesajları görebilir (ek kontrol gerekmez)

    return successResponse(
      'Mesaj başarıyla getirildi',
      { message }
    );
  });
});

// PUT - Mesajı güncelle (okundu işaretleme)
export const PUT = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
    const messageId = params.id;

    const { error, user: currentUserData } = await getCurrentUser(user.uid);
    
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }

    const userRole = currentUserData!.role;

    const messageDoc = await db.collection('contact_messages').doc(messageId).get();

    if (!messageDoc.exists) {
      throw new AppNotFoundError('Mesaj');
    }

    const messageData = messageDoc.data()!;

    // Yetki kontrolü - Sadece admin ve branch manager okuyabilir
    if (userRole === USER_ROLE.USER) {
      throw new AppAuthorizationError('Bu işlem için yetkiniz yok');
    }

    if (userRole === USER_ROLE.BRANCH_MANAGER) {
      // Branch manager: Sadece kendi şubesinin ve branch manager'a görünür konulara ait mesajları okuyabilir
      if (messageData.branchId !== currentUserData!.branchId) {
        throw new AppNotFoundError('Mesaj');
      }

      // Topic'in branch manager'a görünür olduğunu kontrol et
      const topicDoc = await db.collection('topics').doc(messageData.topicId).get();
      if (!topicDoc.exists || !topicDoc.data()?.isVisibleToBranchManager) {
        throw new AppNotFoundError('Mesaj');
      }
    }

    const body = await parseJsonBody<UpdateContactMessageRequest>(req);
    const { isRead } = body;

    if (isRead === undefined) {
      throw new AppValidationError('isRead alanı zorunludur');
    }

    const updateData: Record<string, any> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (isRead === true) {
      updateData.isRead = true;
      updateData.readBy = user.uid;
      updateData.readAt = admin.firestore.FieldValue.serverTimestamp();
    } else if (isRead === false) {
      updateData.isRead = false;
      updateData.readBy = admin.firestore.FieldValue.delete();
      updateData.readAt = admin.firestore.FieldValue.delete();
    }

    await db.collection('contact_messages').doc(messageId).update(updateData);

    // Güncellenmiş mesajı getir
    const updatedMessageDoc = await db.collection('contact_messages').doc(messageId).get();
    const updatedMessage: ContactMessage = {
      id: messageId,
      ...updatedMessageDoc.data(),
    } as ContactMessage;

    return successResponse(
      'Mesaj başarıyla güncellendi',
      { message: updatedMessage },
      200,
      'CONTACT_MESSAGE_UPDATE_SUCCESS'
    );
  });
});

