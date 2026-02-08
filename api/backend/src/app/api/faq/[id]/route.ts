import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { FAQ, UpdateFAQRequest } from '@shared/types/faq';
import { validateUpdateFAQ } from '@/lib/utils/validation/faqValidation';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { 
  successResponse, 
  serializeFAQTimestamps
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody } from '@/lib/utils/request';
import { AppValidationError, AppAuthorizationError, AppNotFoundError } from '@/lib/utils/errors/AppError';

// GET - Tek FAQ detayı
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const faqId = params.id;
      
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      if (error) {
        throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
      }
      
      const userRole = currentUserData!.role;
      
      const faqDoc = await db.collection('faqs').doc(faqId).get();
      
      if (!faqDoc.exists) {
        throw new AppNotFoundError('FAQ');
      }
      
      const faqData = faqDoc.data();
      
      // USER/BRANCH_MANAGER için sadece yayınlanan FAQ'ler
      if (userRole === USER_ROLE.USER || userRole === USER_ROLE.BRANCH_MANAGER) {
        if (!faqData?.isPublished) {
          throw new AppNotFoundError('FAQ');
        }
      }
      
      const faq: FAQ = {
        id: faqDoc.id,
        ...faqData,
      } as FAQ;
      
      const serializedFAQ = serializeFAQTimestamps(faq);
      
      return successResponse(
        'FAQ başarıyla getirildi',
        { faq: serializedFAQ }
      );
  });
});

// PUT - FAQ güncelle (sadece admin)
export const PUT = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const faqId = params.id;
      
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      if (error) {
        throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
      }
      
      if (!currentUserData || currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN) {
        throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
      }
      
      const faqDoc = await db.collection('faqs').doc(faqId).get();
      
      if (!faqDoc.exists) {
        throw new AppNotFoundError('FAQ');
      }
      
      const body = await parseJsonBody<UpdateFAQRequest>(req);
      const currentFAQData = faqDoc.data();
      
      const validation = validateUpdateFAQ(body, {
        question: currentFAQData?.question,
        answer: currentFAQData?.answer,
      });
      if (!validation.valid) {
        const firstError = validation.errors ? Object.values(validation.errors)[0] : 'Geçersiz veri';
        throw new AppValidationError(firstError);
      }
      
      const currentOrder = currentFAQData?.order || 0;
      
      const updateData: Record<string, any> = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: user.uid,
      };
      
      // Sadece gönderilen alanları güncelle
      if (body.question !== undefined) updateData.question = body.question.trim();
      
      if (body.answer !== undefined) {
        updateData.answer = body.answer ? sanitizeHtml(body.answer) : null;
      }
      
      if (body.isPublished !== undefined) {
        updateData.isPublished = body.isPublished;
      }
      
      // Order yönetimi
      if (body.order !== undefined && body.order !== currentOrder) {
        const newOrder = body.order;
        
        // Yeni order mevcut order'dan farklıysa ve > 0 ise shift işlemi yap
        if (newOrder > 0) {
          // FAQ için özel shift işlemi (filter yok, tüm FAQs)
          const snapshot = await db.collection('faqs')
            .where('order', '>=', newOrder)
            .get();
          
          if (!snapshot.empty) {
            const batch = db.batch();
            snapshot.docs.forEach((doc) => {
              // Mevcut item'ı atla
              if (doc.id === faqId) {
                return;
              }
              const docOrder = doc.data().order || 0;
              batch.update(doc.ref, {
                order: docOrder + 1,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
            });
            await batch.commit();
          }
        }
        
        updateData.order = newOrder;
      }
      
      await db.collection('faqs').doc(faqId).update(updateData);
      
      // Güncellenmiş FAQ'i getir
      const updatedFAQDoc = await db.collection('faqs').doc(faqId).get();
      const updatedFAQData = updatedFAQDoc.data();
      const faq: FAQ = {
        id: faqId,
        ...updatedFAQData,
      } as FAQ;
      
      const serializedFAQ = serializeFAQTimestamps(faq);
      
      return successResponse(
        'FAQ başarıyla güncellendi',
        { faq: serializedFAQ },
        200,
        'FAQ_UPDATE_SUCCESS'
      );
  });
});

// DELETE - FAQ sil (sadece admin, hard delete)
export const DELETE = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return withAuth(request, async (req, user) => {
      const faqId = params.id;
      
      // Admin kontrolü
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
        throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
      }
      
      if (!currentUserData || currentUserData.role !== USER_ROLE.ADMIN && currentUserData.role !== USER_ROLE.SUPERADMIN) {
        throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
      }
      
      const faqDoc = await db.collection('faqs').doc(faqId).get();
      
      if (!faqDoc.exists) {
        throw new AppNotFoundError('FAQ');
      }
      
      // Hard delete - belgeyi tamamen sil
      await db.collection('faqs').doc(faqId).delete();
      
      console.log(`✅ FAQ ${faqId} deleted`);
      
      return successResponse(
        'FAQ başarıyla silindi',
        undefined,
        200,
        'FAQ_DELETE_SUCCESS'
      );
  });
});

