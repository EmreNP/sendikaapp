import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import { successResponse } from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseQueryParamAsNumber } from '@/lib/utils/request';
import { AppAuthorizationError } from '@/lib/utils/errors/AppError';

/**
 * GET /api/notifications/history
 * Bildirim geçmişini getir
 * 
 * Yetki: Admin veya Branch Manager
 * 
 * Query Parameters:
 * - page: Sayfa numarası (default: 1)
 * - limit: Sayfa başına kayıt (default: 20)
 * - type: Bildirim tipi ('announcement' | 'news')
 * - targetAudience: Hedef kitle ('all' | 'active' | 'branch')
 * - branchId: Şube ID'si
 */
export const GET = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
    // 1. Yetki kontrolü
    const { error, user: currentUserData } = await getCurrentUser(user.uid);
    
    if (error) {
      throw new AppAuthorizationError('Bu işlem için yetkiniz yok');
    }
    
    const userRole = currentUserData!.role;
    
    // Sadece admin, superadmin ve branch manager bildirim geçmişini görebilir
    if (userRole !== USER_ROLE.ADMIN && userRole !== USER_ROLE.SUPERADMIN && userRole !== USER_ROLE.BRANCH_MANAGER) {
      throw new AppAuthorizationError('Bu işlem için yetkiniz yok');
    }
    
    // 2. Query parametreleri
    const url = new URL(request.url);
    const page = parseQueryParamAsNumber(url, 'page', 1, 1);
    const limit = parseQueryParamAsNumber(url, 'limit', 20, 1, 100);
    const type = url.searchParams.get('type');
    const targetAudience = url.searchParams.get('targetAudience');
    const branchIdParam = url.searchParams.get('branchId');
    
    // 3. Query oluştur
    let query = db.collection('notificationHistory');
    
    // Branch Manager sadece kendi şubesine ait bildirimleri görebilir
    if (userRole === USER_ROLE.BRANCH_MANAGER) {
      query = query.where('branchId', '==', currentUserData!.branchId);
    }
    
    // Filtreler
    if (type) {
      query = query.where('type', '==', type);
    }
    
    if (targetAudience) {
      query = query.where('targetAudience', '==', targetAudience);
    }
    
    if (branchIdParam && (userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.SUPERADMIN)) {
      query = query.where('branchId', '==', branchIdParam);
    }
    
    // 4. Sıralama ve sayfalama
    query = query.orderBy('createdAt', 'desc');
    
    const totalSnapshot = await query.get();
    const total = totalSnapshot.size;
    
    const snapshot = await query
      .limit(limit)
      .offset((page - 1) * limit)
      .get();
    
    // 5. Verileri işle
    const notifications = snapshot.docs.map(doc => {
      const data = doc.data();
      // Firestore Timestamp'ı serialize et
      let createdAt: any = null;
      if (data.createdAt) {
        if (data.createdAt.toDate) {
          // Firestore Timestamp
          createdAt = data.createdAt.toDate().toISOString();
        } else if (data.createdAt.seconds) {
          // Timestamp object
          createdAt = new Date(data.createdAt.seconds * 1000).toISOString();
        } else if (data.createdAt instanceof Date) {
          createdAt = data.createdAt.toISOString();
        }
      }
      
      return {
        id: doc.id,
        title: data.title,
        body: data.body,
        type: data.type,
        contentId: data.contentId || null,
        imageUrl: data.imageUrl || null,
        sentBy: data.sentBy,
        targetAudience: data.targetAudience,
        branchId: data.branchId || null,
        sentCount: data.sentCount || 0,
        failedCount: data.failedCount || 0,
        data: data.data || null,
        createdAt,
      };
    });
    
    // 6. Şube bilgilerini ekle (branchId varsa)
    const branchIds = [...new Set(notifications.map(n => n.branchId).filter(Boolean))];
    const branchMap: Record<string, { id: string; name: string }> = {};
    
    if (branchIds.length > 0) {
      const branchPromises = branchIds.map(async (id) => {
        try {
          const branchDoc = await db.collection('branches').doc(id as string).get();
          if (branchDoc.exists) {
            const branchData = branchDoc.data();
            branchMap[id as string] = {
              id: branchDoc.id,
              name: branchData?.name || 'Bilinmeyen Şube',
            };
          }
        } catch (error) {
          console.error(`Error fetching branch ${id}:`, error);
        }
      });
      
      await Promise.all(branchPromises);
    }
    
    // 7. Gönderen kullanıcı bilgilerini ekle
    const senderIds = [...new Set(notifications.map(n => n.sentBy))];
    const userMap: Record<string, { uid: string; firstName: string; lastName: string }> = {};
    
    if (senderIds.length > 0) {
      const userPromises = senderIds.map(async (uid) => {
        try {
          const userDoc = await db.collection('users').doc(uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            userMap[uid] = {
              uid,
              firstName: userData?.firstName || '',
              lastName: userData?.lastName || '',
            };
          }
        } catch (error) {
          console.error(`Error fetching user ${uid}:`, error);
        }
      });
      
      await Promise.all(userPromises);
    }
    
    // 8. Sonuçları birleştir
    const notificationsWithDetails = notifications.map(notification => ({
      ...notification,
      branch: notification.branchId ? branchMap[notification.branchId] || null : null,
      sentByUser: userMap[notification.sentBy] || null,
    }));
    
    return successResponse(
      'Bildirim geçmişi başarıyla getirildi',
      {
        notifications: notificationsWithDetails,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      200
    );
  });
});

