import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { FAQ, CreateFAQRequest } from '@shared/types/faq';
import { validateCreateFAQ } from '@/lib/utils/validation/faqValidation';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { getNextFAQOrder } from '@/lib/utils/orderManagement';
import { 
  successResponse, 
  serializeFAQTimestamps
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody, parseQueryParamAsNumber } from '@/lib/utils/request';
import { AppValidationError, AppAuthorizationError } from '@/lib/utils/errors/AppError';

// GET - Tüm FAQ'leri listele
export const GET = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      if (error) {
        throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
      }
      
      const userRole = currentUserData!.role;
      const url = new URL(request.url);
      const page = parseQueryParamAsNumber(url, 'page', 1, 1);
      const limit = Math.min(parseQueryParamAsNumber(url, 'limit', 20, 1), 100);
      const isPublishedParam = url.searchParams.get('isPublished');
      const search = url.searchParams.get('search');
      
      let query = db.collection('faqs') as admin.firestore.Query;
      
      // USER/BRANCH_MANAGER için sadece yayınlanan FAQ'ler
      if (userRole === USER_ROLE.USER || userRole === USER_ROLE.BRANCH_MANAGER) {
        query = query.where('isPublished', '==', true);
      } else if (userRole === USER_ROLE.ADMIN) {
        // Admin için isPublished filtresi kullanılabilir
        if (isPublishedParam !== null) {
          query = query.where('isPublished', '==', isPublishedParam === 'true');
        }
      }
      
      const snapshot = await query.orderBy('order', 'asc').orderBy('createdAt', 'desc').get();
      
      let faqs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FAQ[];
      
      // Search filtresi (client-side - Firestore'da full-text search yok)
      if (search) {
        const searchLower = search.toLowerCase();
        faqs = faqs.filter((f: FAQ) => {
          const question = (f.question || '').toLowerCase();
          const answer = (f.answer || '').replace(/<[^>]*>/g, '').toLowerCase();
          return question.includes(searchLower) || answer.includes(searchLower);
        });
      }
      
      // Sayfalama
      const total = faqs.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedFaqs = faqs.slice(startIndex, endIndex);
      
      const serializedFaqs = paginatedFaqs.map(f => serializeFAQTimestamps(f));
      
      return successResponse(
        'FAQ\'ler başarıyla getirildi',
        {
          faqs: serializedFaqs,
          total,
          page,
          limit,
        }
      );
  });
});

// POST - Yeni FAQ oluştur (sadece admin)
export const POST = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
      // Admin kontrolü
      const { error, user: currentUserData } = await getCurrentUser(user.uid);
      
      if (error) {
        throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
      }
      
      if (!currentUserData || currentUserData.role !== USER_ROLE.ADMIN) {
        throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
      }
      
      const body = await parseJsonBody<CreateFAQRequest>(req);
      const { question, answer, isPublished, order } = body;
      
      // Validation
      const validation = validateCreateFAQ(body);
      if (!validation.valid) {
        const firstError = validation.errors ? Object.values(validation.errors)[0] : 'Geçersiz veri';
        throw new AppValidationError(firstError);
      }
      
      // HTML sanitization
      const sanitizedAnswer = sanitizeHtml(answer);
      
      // Order yönetimi
      let finalOrder: number;
      if (order !== undefined && order !== null && order > 0) {
        // Kullanıcı order belirtmişse, shift işlemi yap
        finalOrder = order;
        // FAQ için özel shift işlemi (filter yok, tüm FAQs)
        const snapshot = await db.collection('faqs')
          .where('order', '>=', finalOrder)
          .get();
        
        if (!snapshot.empty) {
          const batch = db.batch();
          snapshot.docs.forEach((doc) => {
            const currentOrder = doc.data().order || 0;
            batch.update(doc.ref, {
              order: currentOrder + 1,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          });
          await batch.commit();
        }
      } else {
        // Order belirtilmemişse, en yüksek order + 1
        finalOrder = await getNextFAQOrder();
      }
      
      // Yeni FAQ oluştur
      const faqData = {
        question: question.trim(),
        answer: sanitizedAnswer,
        isPublished: isPublished !== undefined ? isPublished : false,
        order: finalOrder,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: user.uid,
      };
      
      const faqRef = await db.collection('faqs').add(faqData);
      
      // Oluşturulan FAQ'i getir
      const faqDoc = await faqRef.get();
      const faq: FAQ = {
        id: faqDoc.id,
        ...faqDoc.data(),
      } as FAQ;
      
      // Timestamp'leri serialize et
      const serializedFAQ = serializeFAQTimestamps(faq);
      
      return successResponse(
        'FAQ başarıyla oluşturuldu',
        { faq: serializedFAQ },
        201,
        'FAQ_CREATE_SUCCESS'
      );
  });
});

