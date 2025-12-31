import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { ContactMessage, CreateContactMessageRequest } from '@shared/types/contact';
import { 
  successResponse
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody, parseQueryParamAsNumber } from '@/lib/utils/request';
import { AppValidationError, AppNotFoundError, AppAuthorizationError } from '@/lib/utils/errors/AppError';

// GET - Mesajları listele
export const GET = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
    const { error, user: currentUserData } = await getCurrentUser(user.uid);
    
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }

    const userRole = currentUserData!.role;

    // Query parametreleri
    const url = new URL(request.url);
    const page = parseQueryParamAsNumber(url, 'page', 1, 1);
    const limit = Math.min(parseQueryParamAsNumber(url, 'limit', 20, 1), 100);
    const topicId = url.searchParams.get('topicId');
    const isRead = url.searchParams.get('isRead');

    let query: admin.firestore.Query = db.collection('contact_messages');

    if (userRole === USER_ROLE.ADMIN) {
      // Admin: Tüm mesajları görür
      if (topicId) {
        query = query.where('topicId', '==', topicId);
      }
      if (isRead !== null) {
        query = query.where('isRead', '==', isRead === 'true');
      }
    } 
    else if (userRole === USER_ROLE.BRANCH_MANAGER) {
      // Branch Manager: Sadece isVisibleToBranchManager=true olan konulara ait mesajları
      // ve sadece kendi şubesindeki öğrencilerin mesajlarını görebilir
      
      if (!currentUserData!.branchId) {
        throw new AppValidationError('Şube bilgisi bulunamadı');
      }

      // isVisibleToBranchManager=true olan konuları bul
      const branchTopicsSnapshot = await db.collection('topics')
        .where('isVisibleToBranchManager', '==', true)
        .where('isActive', '==', true)
        .get();

      const branchTopicIds = branchTopicsSnapshot.docs.map(doc => doc.id);

      if (branchTopicIds.length === 0) {
        return successResponse('Mesajlar getirildi', { 
          messages: [], 
          total: 0, 
          page, 
          limit 
        });
      }

      // Topic filtresi varsa, o topic'in branch manager'a görünür olduğunu kontrol et
      if (topicId) {
        if (!branchTopicIds.includes(topicId)) {
          throw new AppValidationError('Bu konuya erişim yetkiniz yok');
        }
        query = query.where('topicId', '==', topicId);
      } else {
        // Firestore 'in' operatörü maksimum 10 eleman kabul eder
        if (branchTopicIds.length <= 10) {
          query = query.where('topicId', 'in', branchTopicIds);
        } else {
          // 10'dan fazla topic varsa, ilk 10'unu al
          query = query.where('topicId', 'in', branchTopicIds.slice(0, 10));
        }
      }

      // Şube filtresi
      query = query.where('branchId', '==', currentUserData!.branchId);

      // Okundu filtresi
      if (isRead !== null) {
        query = query.where('isRead', '==', isRead === 'true');
      }
    }
    else {
      // User: Sadece kendi mesajlarını görebilir
      query = query.where('userId', '==', user.uid);
      
      if (topicId) {
        query = query.where('topicId', '==', topicId);
      }
      if (isRead !== null) {
        query = query.where('isRead', '==', isRead === 'true');
      }
    }

    // Toplam sayı için count query
    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    // Pagination
    const offset = (page - 1) * limit;
    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(limit)
      .get();

    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ContactMessage[];

    return successResponse('Mesajlar getirildi', {
      messages,
      total,
      page,
      limit
    });
  });
});

// POST - Yeni mesaj oluştur
export const POST = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
    const body = await parseJsonBody<CreateContactMessageRequest>(req);
    const { topicId, message } = body;

    // Validasyon
    if (!topicId || !message) {
      throw new AppValidationError('Konu ve mesaj zorunludur');
    }

    if (typeof message !== 'string' || message.trim().length === 0) {
      throw new AppValidationError('Mesaj boş olamaz');
    }

    if (message.length > 5000) {
      throw new AppValidationError('Mesaj en fazla 5000 karakter olabilir');
    }

    // Topic'in var olup olmadığını ve aktif olduğunu kontrol et
    const topicDoc = await db.collection('topics').doc(topicId).get();
    if (!topicDoc.exists) {
      throw new AppNotFoundError('Konu');
    }

    const topicData = topicDoc.data();
    if (!topicData?.isActive) {
      throw new AppValidationError('Bu konu aktif değil');
    }

    // Kullanıcı bilgilerini al
    const { error, user: currentUserData } = await getCurrentUser(user.uid);
    
    if (error || !currentUserData) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }

    if (!currentUserData.branchId) {
      throw new AppValidationError('Şube bilgisi bulunamadı');
    }

    // Mesaj oluştur
    const messageData = {
      userId: user.uid,
      branchId: currentUserData.branchId,
      topicId,
      message: message.trim(),
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('contact_messages').add(messageData);

    const messageDoc = await docRef.get();
    const createdMessage: ContactMessage = {
      id: docRef.id,
      ...messageDoc.data(),
    } as ContactMessage;

    return successResponse(
      'Mesaj başarıyla gönderildi',
      { message: createdMessage },
      201,
      'CONTACT_MESSAGE_CREATE_SUCCESS'
    );
  });
});

