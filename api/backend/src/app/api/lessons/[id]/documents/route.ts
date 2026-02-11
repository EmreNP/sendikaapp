import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { DocumentContent, CreateDocumentContentRequest } from '@shared/types/training';
import { validateCreateDocumentContent } from '@/lib/utils/validation/documentContentValidation';
import { getNextContentOrder, shiftOrdersUp } from '@/lib/utils/orderManagement';
import { generateSignedUrl } from '@/lib/utils/storage';
import { 
  successResponse, 
  serializeDocumentContentTimestamps
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError, AppAuthorizationError, AppNotFoundError, AppInternalServerError } from '@/lib/utils/errors/AppError';

// GET - Dersin dökümanlarını listele
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
      
      let query = db.collection('document_contents')
        .where('lessonId', '==', lessonId) as admin.firestore.Query;
      
      if (userRole === USER_ROLE.USER || userRole === USER_ROLE.BRANCH_MANAGER) {
        query = query.where('isActive', '==', true);
      } else if (userRole === USER_ROLE.ADMIN && isActiveParam !== null) {
        query = query.where('isActive', '==', isActiveParam === 'true');
      }
      
      const snapshot = await query.orderBy('order', 'asc').get();
      
      const documents = snapshot.docs.map((doc) => ({
        id: doc.id,
        type: 'document' as const,
        ...doc.data(),
      })) as DocumentContent[];
      
      // Generate signed URLs for all documents
      const documentsWithUrls = await Promise.all(
        documents.map(async (doc) => {
          if (doc.documentPath) {
            try {
              const documentUrl = await generateSignedUrl(doc.documentPath);
              return { ...doc, documentUrl };
            } catch (error) {
              console.error(`Failed to generate signed URL for ${doc.documentPath}:`, error);
              return doc;
            }
          }
          return doc;
        })
      );
      
      const serializedDocuments = documentsWithUrls.map(d => serializeDocumentContentTimestamps(d));
      
      return successResponse(
        'Dökümanlar başarıyla getirildi',
        { documents: serializedDocuments }
      );
  });
});

// POST - Yeni döküman ekle (sadece admin)
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
      
    const body = await parseJsonBody<CreateDocumentContentRequest>(req);
      
      // lessonId'yi body'den al veya params'tan kullan
      const documentData: CreateDocumentContentRequest = {
        ...body,
        lessonId: body.lessonId || lessonId,
      };
      
      // Validation
      const validation = validateCreateDocumentContent(documentData);
      if (!validation.valid) {
        const firstError = validation.errors ? Object.values(validation.errors)[0] : 'Geçersiz veri';
      throw new AppValidationError(firstError);
      }
      
      // Order yönetimi
      let finalOrder: number;
      if (documentData.order !== undefined && documentData.order !== null && documentData.order > 0) {
        // Kullanıcı order belirtmişse, shift işlemi yap
        finalOrder = documentData.order;
        await shiftOrdersUp('document_contents', 'lessonId', lessonId, finalOrder);
      } else {
        // Order belirtilmemişse, aynı lesson içindeki en yüksek order + 1
        finalOrder = await getNextContentOrder(lessonId, 'document');
      }
      
      // Use documentPath if provided, otherwise fall back to documentUrl (backward compatibility)
      const documentPath = documentData.documentPath || documentData.documentUrl;
      
      if (!documentPath) {
        throw new AppValidationError('documentPath veya documentUrl gerekli');
      }
      
      const contentData = {
        lessonId: documentData.lessonId,
        title: documentData.title.trim(),
        description: documentData.description?.trim() || null,
        documentPath: documentPath.trim(), // Store path, not URL
        documentType: 'pdf', // Sadece PDF
        fileSize: documentData.fileSize || null,
        order: finalOrder,
        isActive: documentData.isActive !== undefined ? documentData.isActive : true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: user.uid,
      };
      
      const documentRef = await db.collection('document_contents').add(contentData);
      const documentDoc = await documentRef.get();
      
      if (!documentDoc.exists) {
      throw new AppInternalServerError('Döküman oluşturuldu ancak veri alınamadı');
      }
      
      const docData = documentDoc.data();
      const document: DocumentContent = {
        id: documentDoc.id,
        type: 'document',
        ...docData,
      } as DocumentContent;
      
      // Generate signed URL for response
      if (document.documentPath) {
        try {
          document.documentUrl = await generateSignedUrl(document.documentPath);
        } catch (error) {
          console.error('Failed to generate signed URL:', error);
        }
      }
      
      const serializedDocument = serializeDocumentContentTimestamps(document);
      
      return successResponse(
        'Döküman başarıyla oluşturuldu',
        { document: serializedDocument },
        201,
        'DOCUMENT_CONTENT_CREATE_SUCCESS'
      );
  });
});

