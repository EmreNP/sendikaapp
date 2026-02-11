import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { VideoContent, CreateVideoContentRequest } from '@shared/types/training';
import { validateCreateVideoContent } from '@/lib/utils/validation/videoContentValidation';
import { getNextContentOrder, shiftOrdersUp } from '@/lib/utils/orderManagement';
import { generateSignedUrl } from '@/lib/utils/storage';
import { 
  successResponse, 
  serializeVideoContentTimestamps
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError, AppAuthorizationError, AppNotFoundError, AppInternalServerError } from '@/lib/utils/errors/AppError';

// GET - Dersin videolarını listele
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }
      
      const userRole = currentUserData!.role;
      const lessonId = params.id;
    const url = new URL(request.url);
    const isActiveParam = url.searchParams.get('isActive');
      
      // Lesson'ın var olup olmadığını kontrol et
      const lessonDoc = await db.collection('lessons').doc(lessonId).get();
      if (!lessonDoc.exists) {
      throw new AppNotFoundError('Ders');
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
      
      // Generate signed URLs for uploaded videos and thumbnails
      const videosWithUrls = await Promise.all(
        videos.map(async (video) => {
          const result = { ...video };
          
          // Generate signed URL for uploaded videos
          if (video.videoSource === 'uploaded' && video.videoPath) {
            try {
              result.videoUrl = await generateSignedUrl(video.videoPath);
            } catch (error) {
              console.error(`Failed to generate video signed URL for ${video.videoPath}:`, error);
            }
          }
          
          // Generate signed URL for thumbnails
          if (video.thumbnailPath) {
            try {
              result.thumbnailUrl = await generateSignedUrl(video.thumbnailPath);
            } catch (error) {
              console.error(`Failed to generate thumbnail signed URL for ${video.thumbnailPath}:`, error);
            }
          }
          
          return result;
        })
      );
      
      const serializedVideos = videosWithUrls.map(v => serializeVideoContentTimestamps(v));
      
      return successResponse(
        'Videolar başarıyla getirildi',
        { videos: serializedVideos }
      );
  });
});

// POST - Yeni video ekle (sadece admin)
export const POST = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }
      
      if (!currentUserData || currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
      }
      
      const lessonId = params.id;
      
      // Lesson'ın var olup olmadığını kontrol et
      const lessonDoc = await db.collection('lessons').doc(lessonId).get();
      if (!lessonDoc.exists) {
      throw new AppNotFoundError('Ders');
      }
      
    const body = await parseJsonBody<CreateVideoContentRequest>(req);
      
      // lessonId'yi body'den al veya params'tan kullan
      const videoData: CreateVideoContentRequest = {
        ...body,
        lessonId: body.lessonId || lessonId,
      };
      
      // Validation
      const validation = validateCreateVideoContent(videoData);
      if (!validation.valid) {
        const firstError = validation.errors ? Object.values(validation.errors)[0] : 'Geçersiz veri';
      throw new AppValidationError(firstError);
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
      
      // For uploaded videos, use videoPath; for YouTube/Vimeo, use videoUrl
      const contentData: any = {
        lessonId: videoData.lessonId,
        title: videoData.title.trim(),
        description: videoData.description?.trim() || null,
        videoSource: videoData.videoSource,
        duration: videoData.duration || null,
        order: finalOrder,
        isActive: videoData.isActive !== undefined ? videoData.isActive : true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: user.uid,
      };
      
      // Add video URL or path based on source
      if (videoData.videoSource === 'uploaded') {
        contentData.videoPath = videoData.videoPath?.trim() || videoData.videoUrl?.trim();
        if (!contentData.videoPath) {
          throw new AppValidationError('videoPath gerekli (uploaded videos için)');
        }
      } else {
        // YouTube or Vimeo
        contentData.videoUrl = videoData.videoUrl?.trim();
        if (!contentData.videoUrl) {
          throw new AppValidationError('videoUrl gerekli (YouTube/Vimeo için)');
        }
      }
      
      // Add thumbnail path if provided
      if (videoData.thumbnailPath) {
        contentData.thumbnailPath = videoData.thumbnailPath.trim();
      } else if (videoData.thumbnailUrl && !videoData.thumbnailUrl.startsWith('http')) {
        // If thumbnailUrl is actually a path (backward compatibility)
        contentData.thumbnailPath = videoData.thumbnailUrl.trim();
      } else if (videoData.thumbnailUrl) {
        // If it's an external URL (YouTube/Vimeo thumbnail)
        contentData.thumbnailUrl = videoData.thumbnailUrl.trim();
      }
      
      const videoRef = await db.collection('video_contents').add(contentData);
      const videoDoc = await videoRef.get();
      
      if (!videoDoc.exists) {
      throw new AppInternalServerError('Video oluşturuldu ancak veri alınamadı');
      }
      
      const docData = videoDoc.data();
      const video: VideoContent = {
        id: videoDoc.id,
        type: 'video',
        ...docData,
      } as VideoContent;
      
      // Generate signed URLs for response
      if (video.videoSource === 'uploaded' && video.videoPath) {
        try {
          video.videoUrl = await generateSignedUrl(video.videoPath);
        } catch (error) {
          console.error('Failed to generate video signed URL:', error);
        }
      }
      
      if (video.thumbnailPath) {
        try {
          video.thumbnailUrl = await generateSignedUrl(video.thumbnailPath);
        } catch (error) {
          console.error('Failed to generate thumbnail signed URL:', error);
        }
      }
      
      const serializedVideo = serializeVideoContentTimestamps(video);
      
      return successResponse(
        'Video başarıyla oluşturuldu',
        { video: serializedVideo },
        201,
        'VIDEO_CONTENT_CREATE_SUCCESS'
      );
  });
});

