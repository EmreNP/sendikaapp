import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { DocumentContent, UpdateDocumentContentRequest } from '@shared/types/training';
import { validateUpdateDocumentContent } from '@/lib/utils/validation/documentContentValidation';
import { shiftOrdersUp } from '@/lib/utils/orderManagement';
import { 
  successResponse, 
  serializeDocumentContentTimestamps
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError, AppAuthorizationError, AppNotFoundError } from '@/lib/utils/errors/AppError';

// GET - Döküman detayı
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const documentId = params.id;
      
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }
      
      const userRole = currentUserData!.role;
      
      const documentDoc = await db.collection('document_contents').doc(documentId).get();
      
      if (!documentDoc.exists) {
      throw new AppNotFoundError('Döküman');
      }
      
      const documentData = documentDoc.data();
      
      // USER/BRANCH_MANAGER için sadece aktif dökümanlar
      if (userRole === USER_ROLE.USER || userRole === USER_ROLE.BRANCH_MANAGER) {
        if (!documentData?.isActive) {
        throw new AppNotFoundError('Döküman');
        }
      }
      
      const document: DocumentContent = {
        id: documentDoc.id,
        type: 'document',
        ...documentData,
      } as DocumentContent;
      
      const serializedDocument = serializeDocumentContentTimestamps(document);
      
      return successResponse(
        'Döküman başarıyla getirildi',
        { document: serializedDocument }
      );
  });
});

// PUT - Döküman güncelle (sadece admin)
export const PUT = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const documentId = params.id;
      
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }
      
      if (!currentUserData || currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
      }
      
      const documentDoc = await db.collection('document_contents').doc(documentId).get();
      
      if (!documentDoc.exists) {
      throw new AppNotFoundError('Döküman');
      }
      
    const body = await parseJsonBody<UpdateDocumentContentRequest>(req);
      const validation = validateUpdateDocumentContent(body);
      if (!validation.valid) {
        const firstError = validation.errors ? Object.values(validation.errors)[0] : 'Geçersiz veri';
      throw new AppValidationError(firstError);
      }
      
      const currentDocumentData = documentDoc.data();
      const currentOrder = currentDocumentData?.order || 0;
      const lessonId = currentDocumentData?.lessonId;
      
      const updateData: Record<string, any> = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: user.uid,
      };
      
      // Sadece gönderilen alanları güncelle
      if (body.title !== undefined) updateData.title = body.title.trim();
      if (body.description !== undefined) updateData.description = body.description?.trim() || null;
      if (body.documentUrl !== undefined) updateData.documentUrl = body.documentUrl.trim();
      // documentType her zaman 'pdf' olacak
      if (body.documentUrl !== undefined) {
        updateData.documentType = 'pdf';
      }
      if (body.fileSize !== undefined) updateData.fileSize = body.fileSize || null;
      
      // Order yönetimi
      if (body.order !== undefined && body.order !== currentOrder && lessonId) {
        const newOrder = body.order;
        
        // Yeni order mevcut order'dan farklıysa ve > 0 ise shift işlemi yap
        if (newOrder > 0) {
          await shiftOrdersUp('document_contents', 'lessonId', lessonId, newOrder, documentId);
        }
        
        updateData.order = newOrder;
      }
      
      if (body.isActive !== undefined) updateData.isActive = body.isActive;
      
      await db.collection('document_contents').doc(documentId).update(updateData);
      
      // Güncellenmiş dökümanı getir
      const updatedDocumentDoc = await db.collection('document_contents').doc(documentId).get();
      const updatedDocumentData = updatedDocumentDoc.data();
      const document: DocumentContent = {
        id: documentId,
        type: 'document',
        ...updatedDocumentData,
      } as DocumentContent;
      
      const serializedDocument = serializeDocumentContentTimestamps(document);
      
      return successResponse(
        'Döküman başarıyla güncellendi',
        { document: serializedDocument },
        200,
        'DOCUMENT_CONTENT_UPDATE_SUCCESS'
      );
  });
});

// DELETE - Döküman sil (sadece admin, hard delete)
export const DELETE = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const documentId = params.id;
      
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
    if (error) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }
      
      if (!currentUserData || currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
      }
      
      const documentDoc = await db.collection('document_contents').doc(documentId).get();
      
      if (!documentDoc.exists) {
      throw new AppNotFoundError('Döküman');
      }
      
      // Hard delete
      await db.collection('document_contents').doc(documentId).delete();
      
      console.log(`✅ Document ${documentId} deleted`);
      
      return successResponse(
        'Döküman başarıyla silindi',
        undefined,
        200,
        'DOCUMENT_CONTENT_DELETE_SUCCESS'
      );
  });
});

