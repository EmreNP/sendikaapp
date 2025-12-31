import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { DocumentContent, CreateDocumentContentRequest } from '@shared/types/training';
import { validateCreateDocumentContent } from '@/lib/utils/validation/documentContentValidation';
import { getNextContentOrder, shiftOrdersUp } from '@/lib/utils/orderManagement';
import { 
  successResponse, 
  validationError,
  unauthorizedError,
  notFoundError,
  serverError,
  isErrorWithMessage,
  serializeDocumentContentTimestamps
} from '@/lib/utils/response';

// GET - Dersin dökümanlarını listele
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
      
      const serializedDocuments = documents.map(d => serializeDocumentContentTimestamps(d));
      
      return successResponse(
        'Dökümanlar başarıyla getirildi',
        { documents: serializedDocuments }
      );
    } catch (error: unknown) {
      console.error('❌ Get documents error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError('Dökümanlar getirilirken bir hata oluştu', errorMessage);
    }
  });
}

// POST - Yeni döküman ekle (sadece admin)
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
      
      const body: CreateDocumentContentRequest = await request.json();
      
      // lessonId'yi body'den al veya params'tan kullan
      const documentData: CreateDocumentContentRequest = {
        ...body,
        lessonId: body.lessonId || lessonId,
      };
      
      // Validation
      const validation = validateCreateDocumentContent(documentData);
      if (!validation.valid) {
        const firstError = validation.errors ? Object.values(validation.errors)[0] : 'Geçersiz veri';
        return validationError(firstError);
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
      
      const contentData = {
        lessonId: documentData.lessonId,
        title: documentData.title.trim(),
        description: documentData.description?.trim() || null,
        documentUrl: documentData.documentUrl.trim(),
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
        return serverError('Döküman oluşturuldu ancak veri alınamadı');
      }
      
      const docData = documentDoc.data();
      const document: DocumentContent = {
        id: documentDoc.id,
        type: 'document',
        ...docData,
      } as DocumentContent;
      
      const serializedDocument = serializeDocumentContentTimestamps(document);
      
      return successResponse(
        'Döküman başarıyla oluşturuldu',
        { document: serializedDocument },
        201,
        'DOCUMENT_CONTENT_CREATE_SUCCESS'
      );
    } catch (error: unknown) {
      console.error('❌ Create document content error:', error);
      const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
      return serverError('Döküman oluşturulurken bir hata oluştu', errorMessage);
    }
  });
}

