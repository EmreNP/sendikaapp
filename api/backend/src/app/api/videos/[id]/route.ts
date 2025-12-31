import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { VideoContent, UpdateVideoContentRequest } from '@shared/types/training';
import { validateUpdateVideoContent } from '@/lib/utils/validation/videoContentValidation';
import { shiftOrdersUp } from '@/lib/utils/orderManagement';
import { 
  successResponse, 
  validationError,
  unauthorizedError,
  notFoundError,
  serverError,
  isErrorWithMessage,
  serializeVideoContentTimestamps
} from '@/lib/utils/response';

// GET - Video detayı
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const videoId = params.id;
      
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      if (error) return error;
      
      const userRole = currentUserData!.role;
      
      const videoDoc = await db.collection('video_contents').doc(videoId).get();
      
      if (!videoDoc.exists) {
        return notFoundError('Video');
      }
      
      const videoData = videoDoc.data();
      
      // USER/BRANCH_MANAGER için sadece aktif videolar
      if (userRole === USER_ROLE.USER || userRole === USER_ROLE.BRANCH_MANAGER) {
        if (!videoData?.isActive) {
          return notFoundError('Video');
        }
      }
      
      const video: VideoContent = {
        id: videoDoc.id,
        type: 'video',
        ...videoData,
      } as VideoContent;
      
      const serializedVideo = serializeVideoContentTimestamps(video);
      
      return successResponse(
        'Video başarıyla getirildi',
        { video: serializedVideo }
      );
    } catch (error: unknown) {
      console.error('❌ Get video error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError('Video getirilirken bir hata oluştu', errorMessage);
    }
  });
}

// PUT - Video güncelle (sadece admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const videoId = params.id;
      
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      if (error) return error;
      
      if (!currentUserData || currentUserData.role !== USER_ROLE.ADMIN) {
        return unauthorizedError('Bu işlem için admin yetkisi gerekli');
      }
      
      const videoDoc = await db.collection('video_contents').doc(videoId).get();
      
      if (!videoDoc.exists) {
        return notFoundError('Video');
      }
      
      const body: UpdateVideoContentRequest = await request.json();
      const validation = validateUpdateVideoContent(body);
      if (!validation.valid) {
        const firstError = validation.errors ? Object.values(validation.errors)[0] : 'Geçersiz veri';
        return validationError(firstError);
      }
      
      const currentVideoData = videoDoc.data();
      const currentOrder = currentVideoData?.order || 0;
      const lessonId = currentVideoData?.lessonId;
      
      const updateData: Record<string, any> = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: user.uid,
      };
      
      // Sadece gönderilen alanları güncelle
      if (body.title !== undefined) updateData.title = body.title.trim();
      if (body.description !== undefined) updateData.description = body.description?.trim() || null;
      if (body.videoUrl !== undefined) updateData.videoUrl = body.videoUrl.trim();
      if (body.videoSource !== undefined) updateData.videoSource = body.videoSource;
      if (body.thumbnailUrl !== undefined) updateData.thumbnailUrl = body.thumbnailUrl?.trim() || null;
      if (body.duration !== undefined) updateData.duration = body.duration || null;
      
      // Order yönetimi
      if (body.order !== undefined && body.order !== currentOrder && lessonId) {
        const newOrder = body.order;
        
        // Yeni order mevcut order'dan farklıysa ve > 0 ise shift işlemi yap
        if (newOrder > 0) {
          await shiftOrdersUp('video_contents', 'lessonId', lessonId, newOrder, videoId);
        }
        
        updateData.order = newOrder;
      }
      
      if (body.isActive !== undefined) updateData.isActive = body.isActive;
      
      await db.collection('video_contents').doc(videoId).update(updateData);
      
      // Güncellenmiş videoyu getir
      const updatedVideoDoc = await db.collection('video_contents').doc(videoId).get();
      const updatedVideoData = updatedVideoDoc.data();
      const video: VideoContent = {
        id: videoId,
        type: 'video',
        ...updatedVideoData,
      } as VideoContent;
      
      const serializedVideo = serializeVideoContentTimestamps(video);
      
      return successResponse(
        'Video başarıyla güncellendi',
        { video: serializedVideo },
        200,
        'VIDEO_CONTENT_UPDATE_SUCCESS'
      );
    } catch (error: unknown) {
      console.error('❌ Update video error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError('Video güncellenirken bir hata oluştu', errorMessage);
    }
  });
}

// DELETE - Video sil (sadece admin, hard delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const videoId = params.id;
      
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      if (error) return error;
      
      if (!currentUserData || currentUserData.role !== USER_ROLE.ADMIN) {
        return unauthorizedError('Bu işlem için admin yetkisi gerekli');
      }
      
      const videoDoc = await db.collection('video_contents').doc(videoId).get();
      
      if (!videoDoc.exists) {
        return notFoundError('Video');
      }
      
      // Hard delete
      await db.collection('video_contents').doc(videoId).delete();
      
      console.log(`✅ Video ${videoId} deleted`);
      
      return successResponse(
        'Video başarıyla silindi',
        undefined,
        200,
        'VIDEO_CONTENT_DELETE_SUCCESS'
      );
    } catch (error: unknown) {
      console.error('❌ Delete video error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError('Video silinirken bir hata oluştu', errorMessage);
    }
  });
}

