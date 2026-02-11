import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { withAuth } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import type { Branch,  BranchWithManagers, CreateBranchRequest } from '@shared/types/branch';
import { validateBranchName, validateBranchEmail, validateBranchPhone } from '@/lib/utils/validation/branchValidation';
import { 
  successResponse, 
  notFoundError,
} from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { parseJsonBody, parseQueryParamAsNumber } from '@/lib/utils/request';
import { AppValidationError, AppAuthorizationError, AppNotFoundError } from '@/lib/utils/errors/AppError';
import { getBranchDetails } from '@/lib/utils/branchQueries';
import { paginateHybrid, parsePaginationParams } from '@/lib/utils/pagination';

// Note: getBranchManagers, getBranchEventCount, getBranchEducationCount fonksiyonları
// artık getBranchDetails() utility fonksiyonu kullanılıyor (src/lib/utils/branchQueries.ts)

// Helper: Birden fazla branch için etkinlik ve eğitim sayılarını batch olarak getir
async function getBranchCountsBatch(branchIds: string[]): Promise<Record<string, { eventCount: number; educationCount: number }>> {
  const result: Record<string, { eventCount: number; educationCount: number }> = {};
  
  // Tüm branch'ler için sayıları 0 ile başlat
  for (const branchId of branchIds) {
    result[branchId] = { eventCount: 0, educationCount: 0 };
  }
  
  // Etkinlik sayılarını toplu olarak getir
  try {
    // Firestore 'in' operatörü max 10 item destekler, chunking yap
    const chunkSize = 10;
    for (let i = 0; i < branchIds.length; i += chunkSize) {
      const chunk = branchIds.slice(i, i + chunkSize);
      
      const eventsSnapshot = await db.collection('events')
        .where('branchId', 'in', chunk)
        .get();
      
      // Sayıları branchId'ye göre grupla
      eventsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const branchId = data.branchId as string;
        if (branchId && result[branchId]) {
          result[branchId].eventCount++;
        }
      });
    }
  } catch (error) {
    console.warn('⚠️  Could not get event counts:', error);
  }
  
  // Eğitim sayılarını toplu olarak getir
  try {
    const chunkSize = 10;
    for (let i = 0; i < branchIds.length; i += chunkSize) {
      const chunk = branchIds.slice(i, i + chunkSize);
      
      const educationsSnapshot = await db.collection('educations')
        .where('branchId', 'in', chunk)
        .get();
      
      // Sayıları branchId'ye göre grupla
      educationsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const branchId = data.branchId as string;
        if (branchId && result[branchId]) {
          result[branchId].educationCount++;
        }
      });
    }
  } catch (error) {
    console.warn('⚠️  Could not get education counts:', error);
  }
  
  return result;
}

// Helper: Birden fazla branch'in manager'larını batch olarak getir (N+1 query problemini çözer)
// Firestore 'in' operatörü max 10 item destekler, bu yüzden chunking yapıyoruz
async function getBranchManagersBatch(branchIds: string[]): Promise<Record<string, Array<{ uid: string; firstName: string; lastName: string; email: string }>>> {
  if (branchIds.length === 0) {
    return {};
  }

  const result: Record<string, Array<{ uid: string; firstName: string; lastName: string; email: string }>> = {};
  
  // Firestore 'in' operatörü max 10 item destekler, chunking yap
  const chunkSize = 10;
  const chunks: string[][] = [];
  
  for (let i = 0; i < branchIds.length; i += chunkSize) {
    chunks.push(branchIds.slice(i, i + chunkSize));
  }
  
  // Her chunk için ayrı query yap ve sonuçları birleştir
  const queryPromises = chunks.map(async (chunk) => {
    const managersSnapshot = await db.collection('users')
      .where('branchId', 'in', chunk)
      .where('role', '==', USER_ROLE.BRANCH_MANAGER)
      .where('isActive', '==', true)
      .get();
    
    return managersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        branchId: data.branchId as string,
        manager: {
          uid: doc.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
        },
      };
    });
  });
  
  const allResults = await Promise.all(queryPromises);
  
  // Manager'ları branch ID'lerine göre grupla
  for (const chunkResults of allResults) {
    for (const { branchId, manager } of chunkResults) {
      if (!result[branchId]) {
        result[branchId] = [];
      }
      result[branchId].push(manager);
    }
  }
  
  return result;
}

// GET - Tüm şubeleri listele
export const GET = asyncHandler(async (request: NextRequest) => {
  // Email verification kontrolünü bypass et - kullanıcılar kayıt sırasında şubeleri görebilmeli
  return withAuth(request, async (req, user) => {
      const userDoc = await db.collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      
      if (!userData) {
      throw new AppNotFoundError('Kullanıcı');
      }

      // Query parametreleri
    const url = new URL(request.url);
    const paginationParams = parsePaginationParams(url);

      // Branch manager sadece kendi şubesini görebilir
      if (userData.role === USER_ROLE.BRANCH_MANAGER && userData.branchId) {
        const branchDoc = await db.collection('branches')
          .doc(userData.branchId)
          .get();
          
        if (!branchDoc.exists) {
          return successResponse(
            'Şubeler başarıyla getirildi',
            { 
              branches: [],
              total: 0,
              page: 1,
              limit: paginationParams.limit,
              hasMore: false,
            }
          );
        }
        
        const branchData = branchDoc.data();
        
        // Tüm branch bilgilerini tek seferde getir (optimize edilmiş ✅)
        const { eventCount, educationCount, managers } = await getBranchDetails(branchDoc.id);
        
        const branch: Branch = {
          id: branchDoc.id,
          ...branchData,
          eventCount,
          educationCount,
        } as Branch;
        
        // Branch manager kendi şubesinin manager'larını görebilir
        const branchWithManagers: BranchWithManagers = { ...branch, managers };
        
        return successResponse(
          'Şubeler başarıyla getirildi',
          { 
            branches: [branchWithManagers],
            total: 1,
            page: 1,
            limit: paginationParams.limit,
            hasMore: false,
          }
        );
      }
      
      // Admin/Superadmin: Tüm şubeleri görebilir (aktif + pasif)
      if (userData.role === USER_ROLE.ADMIN || userData.role === USER_ROLE.SUPERADMIN) {
        let items: any[] = [];
        let total = 0;
        let hasMore = false;

        const search = url.searchParams.get('search');

        if (search) {
          const searchLower = search.toLowerCase();
          // Fetch larger set for searching (limit 500)
          const snapshot = await db.collection('branches')
            .orderBy('createdAt', 'desc')
            .limit(500)
            .get();

          const allItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          // Filter by name, code, or city
          const filtered = allItems.filter((item: any) => 
            (item.name?.toLowerCase().includes(searchLower)) ||
            (item.code?.toLowerCase().includes(searchLower)) ||
            (item.city?.toLowerCase().includes(searchLower))
          );

          total = filtered.length;

          // Slice for pagination
          const startIndex = (paginationParams.page - 1) * paginationParams.limit;
          items = filtered.slice(startIndex, startIndex + paginationParams.limit);
          hasMore = startIndex + paginationParams.limit < total;
        } else {
          // Server-side pagination for branches without search
          const query = db.collection('branches');
          
          const paginatedResult = await paginateHybrid(
            query,
            paginationParams,
            (doc) => ({ id: doc.id, ...doc.data() }),
            'createdAt'
          );
          items = paginatedResult.items;
          total = paginatedResult.total;
          hasMore = paginatedResult.hasMore;
        }
        
        // Tüm branch ID'lerini topla
        const branchIds = items.map(b => b.id);
        
        // Tüm manager'ları ve sayıları tek batch query ile getir (N+1 query problemini çözer)
        const [managersByBranch, countsByBranch] = await Promise.all([
          getBranchManagersBatch(branchIds),
          getBranchCountsBatch(branchIds),
        ]);
        
        // Branch'leri manager'larla ve sayılarla birleştir
        const branchesWithDetails: BranchWithManagers[] = items.map(branch => {
          const branchId = branch.id;
          const counts = countsByBranch[branchId] || { eventCount: 0, educationCount: 0 };
          
          const branchWithCounts: Branch = {
            ...branch,
            eventCount: counts.eventCount,
            educationCount: counts.educationCount,
          } as Branch;
          
          return { 
            ...branchWithCounts, 
            managers: managersByBranch[branchId] || [] 
          };
        });
        
        return successResponse(
          'Şubeler başarıyla getirildi',
          { 
            branches: branchesWithDetails,
            total: total,
            page: paginationParams.page,
            limit: paginationParams.limit,
            hasMore: hasMore,
          }
        );
      }
      
      // User: Sadece aktif şubeleri görebilir (manager bilgisi yok)
      const query = db.collection('branches').where('isActive', '==', true);
      
      const paginatedResult = await paginateHybrid(
        query,
        paginationParams,
        (doc) => ({ id: doc.id, ...doc.data() }),
        'createdAt'
      );
      
      const branchIds = paginatedResult.items.map(b => b.id);
      const countsByBranch = await getBranchCountsBatch(branchIds);
      
      const branchesWithCounts: Branch[] = paginatedResult.items.map(branch => {
        const branchId = branch.id;
        const counts = countsByBranch[branchId] || { eventCount: 0, educationCount: 0 };
        
        return {
          ...branch,
          eventCount: counts.eventCount,
          educationCount: counts.educationCount,
        } as Branch;
      });
      
      return successResponse(
        'Şubeler başarıyla getirildi',
        { 
          branches: branchesWithCounts,
          total: paginatedResult.total,
          page: paginatedResult.page,
          limit: paginatedResult.limit,
          hasMore: paginatedResult.hasMore,
          nextCursor: paginatedResult.nextCursor,
        }
      );
  }, { skipEmailVerification: true });
});

// POST - Yeni şube oluştur (sadece admin)
export const POST = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
      // Admin kontrolü
      const userDoc = await db.collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      
      if (!userData || userData.role !== USER_ROLE.ADMIN && userData.role !== USER_ROLE.SUPERADMIN) {
      throw new AppAuthorizationError('Bu işlem için admin yetkisi gerekli');
      }
      
    const body = await parseJsonBody<CreateBranchRequest>(req);
      const { name, desc, location, address, phone, email, workingHours } = body;
      
      // Validation
      const nameValidation = validateBranchName(name || '');
      if (!nameValidation.valid) {
      throw new AppValidationError(nameValidation.error || 'Geçersiz şube adı');
      }
      
      if (email) {
        const emailValidation = validateBranchEmail(email);
        if (!emailValidation.valid) {
        throw new AppValidationError(emailValidation.error || 'Geçersiz e-posta');
        }
      }
      
      if (phone) {
        const phoneValidation = validateBranchPhone(phone);
        if (!phoneValidation.valid) {
          console.log('Phone validation failed for:', phone);
          throw new AppValidationError(phoneValidation.error || 'Geçersiz telefon');
        }
      }
      
      // Yeni şube oluştur
      // Telefon numarasını normalize et (boşlukları kaldır)
      const normalizedPhone = phone?.trim().replace(/\s/g, '') || null;
      
      const branchData = {
        name: name.trim(),
        desc: desc?.trim() || null,
        location: location || null,
        address: address?.trim() || null,
        phone: normalizedPhone,
        email: email?.trim() || null,
        workingHours: workingHours || null,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      const branchRef = await db.collection('branches').add(branchData);
      
      const branch: Branch = {
        id: branchRef.id,
        ...branchData,
      } as Branch;
      
      return successResponse(
        'Şube başarıyla oluşturuldu',
        { branch },
        201,
        'BRANCH_CREATE_SUCCESS'
      );
  });
  });

