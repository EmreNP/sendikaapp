import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { Content, ContentType, VideoContent, DocumentContent } from '@shared/types/training';
import { generatePublicUrl, generateSignedUrl } from '@/lib/utils/storage';
import { 
  successResponse, 
  serializeContentTimestamps
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { AppAuthorizationError, AppNotFoundError } from '@/lib/utils/errors/AppError';

import { logger } from '../../../../../lib/utils/logger';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - Dersin tüm içeriklerini listele (video, document, test birleştirilmiş)
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
    const typeParam = url.searchParams.get('type') as ContentType | null;
    const isActiveParam = url.searchParams.get('isActive');
      
      // Lesson'ın var olup olmadığını kontrol et
      const lessonDoc = await db.collection('lessons').doc(lessonId).get();
      if (!lessonDoc.exists) {
      throw new AppNotFoundError('Ders');
      }
      
      const contents: Content[] = [];
      
      // Video contents
      if (!typeParam || typeParam === 'video') {
        let videoQuery = db.collection('video_contents')
          .where('lessonId', '==', lessonId) as admin.firestore.Query;
        
        if (userRole === USER_ROLE.USER || userRole === USER_ROLE.BRANCH_MANAGER) {
          videoQuery = videoQuery.where('isActive', '==', true);
        } else if (userRole === USER_ROLE.ADMIN && isActiveParam !== null) {
          videoQuery = videoQuery.where('isActive', '==', isActiveParam === 'true');
        }
        
        const videoSnapshot = await videoQuery.orderBy('order', 'asc').get();
        const videos = videoSnapshot.docs.map((doc) => ({
          id: doc.id,
          type: 'video' as const,
          ...doc.data(),
        }));
        contents.push(...videos as Content[]);
      }
      
      // Document contents
      if (!typeParam || typeParam === 'document') {
        let documentQuery = db.collection('document_contents')
          .where('lessonId', '==', lessonId) as admin.firestore.Query;
        
        if (userRole === USER_ROLE.USER || userRole === USER_ROLE.BRANCH_MANAGER) {
          documentQuery = documentQuery.where('isActive', '==', true);
        } else if (userRole === USER_ROLE.ADMIN && isActiveParam !== null) {
          documentQuery = documentQuery.where('isActive', '==', isActiveParam === 'true');
        }
        
        const documentSnapshot = await documentQuery.orderBy('order', 'asc').get();
        const documents = documentSnapshot.docs.map((doc) => ({
          id: doc.id,
          type: 'document' as const,
          ...doc.data(),
        }));
        contents.push(...documents as Content[]);
      }
      
      // Test contents
      if (!typeParam || typeParam === 'test') {
        let testQuery = db.collection('test_contents')
          .where('lessonId', '==', lessonId) as admin.firestore.Query;
        
        if (userRole === USER_ROLE.USER || userRole === USER_ROLE.BRANCH_MANAGER) {
          testQuery = testQuery.where('isActive', '==', true);
        } else if (userRole === USER_ROLE.ADMIN && isActiveParam !== null) {
          testQuery = testQuery.where('isActive', '==', isActiveParam === 'true');
        }
        
        const testSnapshot = await testQuery.orderBy('order', 'asc').get();
        const tests = testSnapshot.docs.map((doc) => ({
          id: doc.id,
          type: 'test' as const,
          ...doc.data(),
        }));
        contents.push(...tests as Content[]);
      }
      
      // Order'a göre sırala (tüm tipler birleştirildikten sonra)
      contents.sort((a, b) => a.order - b.order);
      
      // Generate URLs for all contents
      // Documents use signed URLs (7-day expiry) to bypass Storage security rules
      // Videos use public URLs (files are made public on upload)
      const contentsWithUrls = await Promise.all(contents.map(async (content) => {
        const result: Record<string, any> = { ...content };
        
        // Handle video content
        // Uploaded videos are private (no public ACL) → signed URL (1 gün)
        // Thumbnails are in video-thumbnails/ (public category) → public URL
        if (content.type === 'video') {
          const videoContent = content as VideoContent;
          if (videoContent.videoSource === 'uploaded' && videoContent.videoPath) {
            try {
              result.videoUrl = await generateSignedUrl(videoContent.videoPath, 1);
            } catch (err) {
              logger.warn(`[contents] Video signed URL failed for ${videoContent.videoPath}:`, err);
            }
          }
          if (videoContent.thumbnailPath) {
            // video-thumbnails/ — public category, makePublic() çağrılmış
            result.thumbnailUrl = generatePublicUrl(videoContent.thumbnailPath);
          }
        }
        
        // Handle document content — lesson-documents are private, always use signed URL
        if (content.type === 'document') {
          const docContent = content as DocumentContent;
          if (docContent.documentPath) {
            try {
              result.documentUrl = await generateSignedUrl(docContent.documentPath, 7);
            } catch (err) {
              logger.warn(`[contents] Document signed URL failed for ${docContent.documentPath}:`, err);
            }
          }
        }
        
        return result;
      }));
      
      const serializedContents = contentsWithUrls.map(c => serializeContentTimestamps(c));
      
      return successResponse(
        'İçerikler başarıyla getirildi',
        { contents: serializedContents }
      );
  });
});

