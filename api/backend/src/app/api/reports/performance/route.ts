import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import { USER_STATUS } from '@shared/constants/status';
import { successResponse } from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { AppAuthorizationError, AppValidationError } from '@/lib/utils/errors/AppError';
import { logger } from '@/lib/utils/logger';

/**
 * Performans skorunu hesapla (0-100)
 * Ağırlıklar:
 * - Aktivite sayısı: %50
 * - Haber/Duyuru sayısı: %20
 * - Üye sayısı: %20
 * - Yanıtlanan mesaj oranı: %10
 */
function calculatePerformanceScore(metrics: {
  activityCount: number;
  newsCount: number;
  announcementCount: number;
  memberCount: number;
  readMessageRate: number; // 0-1 arası
}): number {
  // Her metrik için normalize (max değerlere göre)
  const activityScore = Math.min(metrics.activityCount / 10, 1) * 50; // 10 aktivite = tam puan
  const contentScore = Math.min((metrics.newsCount + metrics.announcementCount) / 8, 1) * 20; // 8 içerik = tam puan
  const memberScore = Math.min(metrics.memberCount / 50, 1) * 20; // 50 üye = tam puan
  const messageScore = metrics.readMessageRate * 10;

  return Math.round(activityScore + contentScore + memberScore + messageScore);
}

/**
 * Firestore Timestamp'ı ISO string'e çevir
 */
function toISOString(ts: any): string {
  if (!ts) return '';
  if (ts._seconds) return new Date(ts._seconds * 1000).toISOString();
  if (ts.toDate) return ts.toDate().toISOString();
  if (ts instanceof Date) return ts.toISOString();
  if (typeof ts === 'string') return ts;
  return '';
}

/**
 * Firestore Timestamp'ı ay formatına çevir ("2026-01")
 */
function toMonthKey(ts: any): string {
  const iso = toISOString(ts);
  if (!iso) return '';
  return iso.substring(0, 7);
}

/**
 * Firestore Timestamp'ı hafta formatına çevir ("2026-W06")
 */
function toWeekKey(ts: any): string {
  const iso = toISOString(ts);
  if (!iso) return '';
  const date = new Date(iso);
  const year = date.getFullYear();
  const firstDayOfYear = new Date(year, 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

/**
 * Firestore Timestamp'ı gün formatına çevir ("2026-02-12")
 */
function toDayKey(ts: any): string {
  const iso = toISOString(ts);
  if (!iso) return '';
  return iso.substring(0, 10);
}

/**
 * Tarih aralığına göre uygun zaman granularity'sini belirle
 */
function determineGranularity(startDate: Date, endDate: Date): 'daily' | 'weekly' | 'monthly' {
  const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 14) return 'daily'; // 2 hafta veya daha az → günlük
  if (diffDays <= 60) return 'weekly'; // 2 ay veya daha az → haftalık
  return 'monthly'; // 2 aydan fazla → aylık
}

/**
 * Zaman anahtarı oluştur (granularity'ye göre)
 */
function toTimeKey(ts: any, granularity: 'daily' | 'weekly' | 'monthly'): string {
  switch (granularity) {
    case 'daily': return toDayKey(ts);
    case 'weekly': return toWeekKey(ts);
    case 'monthly': return toMonthKey(ts);
  }
}

/**
 * Tarih aralığındaki tüm zaman anahtarlarını oluştur
 */
function generateTimeKeys(startDate: Date, endDate: Date, granularity: 'daily' | 'weekly' | 'monthly'): string[] {
  const keys: string[] = [];
  const current = new Date(startDate);
  
  if (granularity === 'daily') {
    while (current <= endDate) {
      keys.push(current.toISOString().substring(0, 10));
      current.setDate(current.getDate() + 1);
      if (keys.length > 365) break; // Güvenlik
    }
  } else if (granularity === 'weekly') {
    // Hafta başlangıcına yuvarla (Pazartesi)
    const startOfWeek = new Date(current);
    const day = startOfWeek.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    startOfWeek.setDate(startOfWeek.getDate() + diff);
    
    while (startOfWeek <= endDate) {
      const year = startOfWeek.getFullYear();
      const firstDayOfYear = new Date(year, 0, 1);
      const pastDaysOfYear = (startOfWeek.getTime() - firstDayOfYear.getTime()) / 86400000;
      const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      keys.push(`${year}-W${String(weekNumber).padStart(2, '0')}`);
      startOfWeek.setDate(startOfWeek.getDate() + 7);
      if (keys.length > 104) break; // 2 yıl max
    }
  } else {
    // Aylık
    const startOfMonth = new Date(current.getFullYear(), current.getMonth(), 1);
    const endLimit = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
    
    while (startOfMonth <= endLimit) {
      keys.push(`${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}`);
      startOfMonth.setMonth(startOfMonth.getMonth() + 1);
      if (keys.length > 60) break;
    }
  }
  
  return keys;
}

// GET /api/reports/performance - Performans raporu dashboard özeti
export const GET = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
    const { error, user: currentUserData } = await getCurrentUser(user.uid);

    if (error || !currentUserData) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }

    const userRole = currentUserData.role;

    // Sadece admin ve superadmin görebilir
    if (userRole !== USER_ROLE.ADMIN && userRole !== USER_ROLE.SUPERADMIN) {
      throw new AppAuthorizationError('Bu rapora erişim yetkiniz yok');
    }

    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'monthly';
    const startDateParam = url.searchParams.get('startDate');
    const endDateParam = url.searchParams.get('endDate');

    // Tarih aralığını hesapla
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
    } else {
      switch (period) {
        case 'weekly':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'quarterly':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          break;
        case 'yearly':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'monthly':
        default:
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          break;
      }
    }

    // Paralel veri çekme
    const [
      branchesSnap,
      activitiesSnap,
      usersSnap,
      newsSnap,
      announcementsSnap,
      categoriesSnap,
    ] = await Promise.all([
      db.collection('branches').get(),
      db.collection('activities').get(),
      db.collection('users').get(),
      db.collection('news').get(),
      db.collection('announcements').get(),
      db.collection('activity_categories').get(),
    ]);

    // Helper: Tarih aralığında mı?
    const isInDateRange = (timestamp: any): boolean => {
      const itemDate = toISOString(timestamp);
      if (!itemDate) return false;
      const itemTime = new Date(itemDate).getTime();
      return itemTime >= startDate.getTime() && itemTime <= endDate.getTime() + 24 * 60 * 60 * 1000 - 1;
    };

    // Kategori map'i oluştur
    const categoryMap = new Map<string, string>();
    categoriesSnap.docs.forEach((doc) => {
      categoryMap.set(doc.id, doc.data().name || 'Bilinmeyen');
    });

    // Şube map'i oluştur
    const branchMap = new Map<string, { id: string; name: string; isActive: boolean }>();
    branchesSnap.docs.forEach((doc) => {
      const data = doc.data();
      branchMap.set(doc.id, { id: doc.id, name: data.name, isActive: data.isActive !== false });
    });

    // Tüm kullanıcıları indexle
    const allUsers = usersSnap.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
    const managers = allUsers.filter(
      (u: any) => u.role === USER_ROLE.BRANCH_MANAGER
    );

    // Filtrelenmiş veriler
    const allActivities = activitiesSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((a: any) => isInDateRange(a.createdAt));

    const allNews = newsSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((n: any) => isInDateRange(n.createdAt));

    const allAnnouncements = announcementsSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((a: any) => isInDateRange(a.createdAt));

    const newMembersInPeriod = allUsers.filter((u: any) => 
      u.role === USER_ROLE.USER && isInDateRange(u.createdAt)
    ).length;

    // ====== GENEL ÖZET ======
    const totalBranches = branchesSnap.docs.length;
    const activeBranches = branchesSnap.docs.filter((doc) => doc.data().isActive !== false).length;
    const totalManagers = managers.length;
    const totalActivities = allActivities.length;
    const totalMembers = allUsers.filter((u: any) => u.role === USER_ROLE.USER).length; // Toplam üye sayısı (tarihten bağımsız)
    const activeMembersCount = allUsers.filter(
      (u: any) => u.role === USER_ROLE.USER && u.status === USER_STATUS.ACTIVE
    ).length;

    // ====== AKTİVİTE TRENDİ (Seçilen tarih aralığı - DİNAMİK) ======
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    const granularity = determineGranularity(sDate, eDate);
    const timeKeys = generateTimeKeys(sDate, eDate, granularity);

    const activityTrend = timeKeys.map((key) => ({
      period: key,
      count: allActivities.filter((a: any) => toTimeKey(a.createdAt, granularity) === key).length,
      granularity,
    }));

    // ====== ŞUBE KARŞILAŞTIRMA ======
    const branchComparison = Array.from(branchMap.values()).map((branch) => {
      const branchActivities = allActivities.filter((a: any) => a.branchId === branch.id);
      
      // Şubenin bu dönemde kazandığı üyeler
      const newBranchMembers = allUsers.filter(
        (u: any) => u.branchId === branch.id && u.role === USER_ROLE.USER && isInDateRange(u.createdAt)
      );

      const branchNews = allNews.filter((n: any) => {
        // Haber oluşturanın şubesine göre
        const creator = allUsers.find((u: any) => u.uid === n.createdBy);
        return creator && (creator as any).branchId === branch.id;
      });

      return {
        branchId: branch.id,
        branchName: branch.name,
        activityCount: branchActivities.length,
        memberCount: newBranchMembers.length, // Bu dönemde eklenen üye sayısı
        newsCount: branchNews.length,
      };
    });

    // ====== EN İYİ ŞUBELER (TOP 5) ======
    const topBranches = branchComparison
      .map((bc) => {
        const score = calculatePerformanceScore({
          activityCount: bc.activityCount,
          newsCount: bc.newsCount,
          announcementCount: 0,
          memberCount: bc.memberCount,
          readMessageRate: 0.5,
        });
        return { ...bc, performanceScore: score };
      })
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, 5);

    // ====== EN İYİ YÖNETİCİLER (TOP 5) ======
    const topManagers = managers
      .map((m: any) => {
        const mActivities = allActivities.filter((a: any) => a.createdBy === m.uid);
        const branch = m.branchId ? branchMap.get(m.branchId) : null;
        const score = calculatePerformanceScore({
          activityCount: mActivities.length,
          newsCount: allNews.filter((n: any) => n.createdBy === m.uid).length,
          announcementCount: allAnnouncements.filter((a: any) => a.createdBy === m.uid).length,
          memberCount: allUsers.filter(
            (u: any) => u.branchId === m.branchId && u.role === USER_ROLE.USER
          ).length,
          readMessageRate: 0.5,
        });
        return {
          uid: m.uid,
          fullName: `${m.firstName || ''} ${m.lastName || ''}`.trim(),
          branchName: branch?.name || '',
          activityCount: mActivities.length,
          performanceScore: score,
        };
      })
      .sort((a: any, b: any) => b.performanceScore - a.performanceScore)
      .slice(0, 5);

    return successResponse('Performans özeti başarıyla getirildi', {
      overview: {
        totalBranches,
        activeBranches,
        totalManagers,
        totalActivities,
        totalMembers,
        activeMembersCount,
      },
      topBranches,
      topManagers,
      activityTrend,
      branchComparison,
      timeGranularity: granularity,
    });
  });
});
