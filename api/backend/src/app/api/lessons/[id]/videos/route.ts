import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { VideoContent, CreateVideoContentRequest } from '@shared/types/training';
import { validateCreateVideoContent } from '@/lib/utils/validation/videoContentValidation';
import { getNextContentOrder, shiftOrdersUp } from '@/lib/utils/orderManagement';
import { 
  successResponse, 
  validationError,
  unauthorizedError,
  notFoundError,
  serverError,
  isErrorWithMessage,
  serializeVideoContentTimestamps
} from '@/lib/utils/response';

// GET - Dersin videolarını listele
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      if (error) return error;
      
      const userRole = currentUserData!.role;
      const lessonId = params.id;
      const { searchParams } = new URL(request.url);
      const isActiveParam = searchParams.get('isActive');
      
      // Lesson'ın var olup olmadığını kontrol et
      const lessonDoc = await db.collection('lessons').doc(lessonId).get();
      if (!lessonDoc.exists) {
        return notFoundError('Ders');
      }
      
      let query = db.collection('video_contents')
        .where('lessonId', '==', lessonId) as admin.firestore.Query;
      
      if (userRole === USER_ROLE.USER || userRole === USER_ROLE.BRANCH_MANAGER) {
        query = query.where('isActive', '==', true);
      } else if (userRole === USER_ROLE.ADMIN && isActiveParam !== null) {
        query = query.where('isActive', '==', isActiveParam === 'true');
      }
      
      const snapshot = await query.orderBy('order', 'asc').get();
      
      const videos = snapshot.docs.map((doc) => ({
        id: doc.id,
        type: 'video' as const,
        ...doc.data(),
      })) as VideoContent[];
      
      const serializedVideos = videos.map(v => serializeVideoContentTimestamps(v));
      
      return successResponse(
        'Videolar başarıyla getirildi',
        { videos: serializedVideos }
      );
    } catch (error: unknown) {
      console.error('❌ Get videos error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError('Videolar getirilirken bir hata oluştu', errorMessage);
    }
  });
}

// POST - Yeni video ekle (sadece admin)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      if (error) return error;
      
      if (!currentUserData || currentUserData.role !== USER_ROLE.ADMIN) {
        return unauthorizedError('Bu işlem için admin yetkisi gerekli');
      }
      
      const lessonId = params.id;
      
      // Lesson'ın var olup olmadığını kontrol et
      const lessonDoc = await db.collection('lessons').doc(lessonId).get();
      if (!lessonDoc.exists) {
        return notFoundError('Ders');
      }
      
      const body: CreateVideoContentRequest = await request.json();
      
      // lessonId'yi body'den al veya params'tan kullan
      const videoData: CreateVideoContentRequest = {
        ...body,
        lessonId: body.lessonId || lessonId,
      };
      
      // Validation
      const validation = validateCreateVideoContent(videoData);
      if (!validation.valid) {
        const firstError = validation.errors ? Object.values(validation.errors)[0] : 'Geçersiz veri';
        return validationError(firstError);
      }
      
      // Order yönetimi
      let finalOrder: number;
      if (videoData.order !== undefined && videoData.order !== null && videoData.order > 0) {
        // Kullanıcı order belirtmişse, shift işlemi yap
        finalOrder = videoData.order;
        await shiftOrdersUp('video_contents', 'lessonId', lessonId, finalOrder);
      } else {
        // Order belirtilmemişse, aynı lesson içindeki en yüksek order + 1
        finalOrder = await getNextContentOrder(lessonId, 'video');
      }
      
      const contentData = {
        lessonId: videoData.lessonId,
        title: videoData.title.trim(),
        description: videoData.description?.trim() || null,
        videoUrl: videoData.videoUrl.trim(),
        videoSource: videoData.videoSource,
        thumbnailUrl: videoData.thumbnailUrl?.trim() || null,
        duration: videoData.duration || null,
        order: finalOrder,
        isActive: videoData.isActive !== undefined ? videoData.isActive : true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: user.uid,
      };
      
      const videoRef = await db.collection('video_contents').add(contentData);
      const videoDoc = await videoRef.get();
      
      if (!videoDoc.exists) {
        return serverError('Video oluşturuldu ancak veri alınamadı');
      }
      
      const docData = videoDoc.data();
      const video: VideoContent = {
        id: videoDoc.id,
        type: 'video',
        ...docData,
      } as VideoContent;
      
      const serializedVideo = serializeVideoContentTimestamps(video);
      
      return successResponse(
        'Video başarıyla oluşturuldu',
        { video: serializedVideo },
        201,
        'VIDEO_CONTENT_CREATE_SUCCESS'
      );
    } catch (error: unknown) {
      console.error('❌ Create video content error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError('Video oluşturulurken bir hata oluştu', errorMessage);
    }
  });
}

