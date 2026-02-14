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
import { searchInBatches } from '@/lib/utils/pagination';

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
    const limit = Math.min(parseQueryParamAsNumber(url, 'limit', 25, 1), 100);
    const topicId = url.searchParams.get('topicId');
    const isRead = url.searchParams.get('isRead');
    const search = url.searchParams.get('search');

    let query: admin.firestore.Query = db.collection('contact_messages');

    if (userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.SUPERADMIN) {
      // Admin/Superadmin: Tüm mesajları görür
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
        // 10'dan fazla topic varsa, birden fazla query yapıp sonuçları birleştir
        if (branchTopicIds.length <= 10) {
          query = query.where('topicId', 'in', branchTopicIds);
        } else {
          // Multiple queries için bayrak set et - query'yi sonra oluşturacağız
          // Bu durumda aşağıdaki branch ve isRead filtrelerini eklemeden önce
          // query'yi bölmeliyiz
        }
      }

      // Şube filtresi
      query = query.where('branchId', '==', currentUserData!.branchId);

      // Okundu filtresi
      if (isRead !== null) {
        query = query.where('isRead', '==', isRead === 'true');
      }
      
      // 10'dan fazla topic varsa, birden fazla query yap ve sonuçları birleştir
      if (!topicId && branchTopicIds.length > 10) {
        const allMessages: ContactMessage[] = [];
        
        // Topic ID'lerini 10'luk gruplara böl
        const chunks: string[][] = [];
        for (let i = 0; i < branchTopicIds.length; i += 10) {
          chunks.push(branchTopicIds.slice(i, i + 10));
        }
        
        // Her chunk için ayrı query yap
        for (const chunk of chunks) {
          let chunkQuery = db.collection('contact_messages')
            .where('topicId', 'in', chunk)
            .where('branchId', '==', currentUserData!.branchId);
          
          if (isRead !== null) {
            chunkQuery = chunkQuery.where('isRead', '==', isRead === 'true');
          }
          
          const chunkSnapshot = await chunkQuery.get();
          const chunkMessages = chunkSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as ContactMessage[];
          
          allMessages.push(...chunkMessages);
        }
        
        // Mesajları tarihe göre sırala (desc)
        allMessages.sort((a, b) => {
          const aTime = a.createdAt?._seconds || a.createdAt?.seconds || 0;
          const bTime = b.createdAt?._seconds || b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
        
        // Search filtresi varsa uygula
        let filteredMessages = allMessages;
        if (search) {
          const searchLower = search.toLowerCase();
          filteredMessages = allMessages.filter(msg => 
            (msg.message || '').toLowerCase().includes(searchLower)
          );
        }
        
        // Pagination uygula
        const total = filteredMessages.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedMessages = filteredMessages.slice(startIndex, endIndex);
        
        return successResponse('Mesajlar getirildi', { 
          messages: paginatedMessages, 
          total, 
          page, 
          limit 
        });
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

    if (search) {
      const searchLower = search.toLowerCase();
      const orderedQuery = query.orderBy('createdAt', 'desc');
      
      const result = await searchInBatches<ContactMessage>(
        orderedQuery,
        { page, limit },
        (doc) => ({ id: doc.id, ...doc.data() }) as ContactMessage,
        (msg) => (msg.message || '').toLowerCase().includes(searchLower)
      );

      return successResponse('Mesajlar getirildi', {
        messages: result.items,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil((result.total || 0) / result.limit)
      });
    }

    // Standard pagination without search
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
      limit,
      totalPages: Math.ceil(total / limit)
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

    // Mesaj oluştur
    const messageData = {
      userId: user.uid,
      ...(currentUserData.branchId ? { branchId: currentUserData.branchId } : {}),
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

