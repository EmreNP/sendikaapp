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
import { AppValidationError, AppAuthorizationError } from '@/lib/utils/errors/AppError';

// GET - Aktif konuları listele (herkes görebilir)
export const GET = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
    let query: admin.firestore.Query = db.collection('topics')
      .where('isActive', '==', true); // Sadece aktif topic'ler

    const snapshot = await query.orderBy('name', 'asc').get();

    const topics = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Topic[];

    return successResponse('Konular getirildi', { topics });
  });
});

// POST - Yeni konu oluştur (sadece admin)
export const POST = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
    const { error, user: currentUserData } = await getCurrentUser(user.uid);
    
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }

    if (!currentUserData || currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
    }

    const body = await parseJsonBody<{
      name: string;
      isVisibleToBranchManager: boolean; // true = branch manager görsün, false = sadece admin görsün
      description?: string;
      isActive?: boolean;
    }>(req);

    const { name, isVisibleToBranchManager, description, isActive } = body;

    // Validasyon
    if (!name || isVisibleToBranchManager === undefined) {
      throw new AppValidationError('İsim ve branch manager görünürlüğü zorunludur');
    }

    if (typeof isVisibleToBranchManager !== 'boolean') {
      throw new AppValidationError('isVisibleToBranchManager boolean olmalıdır');
    }

    if (name.trim().length < 2 || name.trim().length > 100) {
      throw new AppValidationError('İsim 2-100 karakter arasında olmalıdır');
    }

    // Aynı isimde aktif konu var mı kontrol et
    const existingTopic = await db.collection('topics')
      .where('name', '==', name.trim())
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (!existingTopic.empty) {
      throw new AppValidationError('Bu isimde aktif bir konu zaten var');
    }

    // Yeni konu oluştur
    const topicData = {
      name: name.trim(),
      isVisibleToBranchManager, // Admin bu boolean ile branch manager görünürlüğünü kontrol eder
      description: description?.trim() || null,
      isActive: isActive !== undefined ? isActive : true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const topicRef = await db.collection('topics').add(topicData);

    const topicDoc = await topicRef.get();
    const topic: Topic = {
      id: topicRef.id,
      ...topicDoc.data(),
    } as Topic;

    return successResponse(
      'Konu başarıyla oluşturuldu',
      { topic },
      201,
      'TOPIC_CREATE_SUCCESS'
    );
  });
});

