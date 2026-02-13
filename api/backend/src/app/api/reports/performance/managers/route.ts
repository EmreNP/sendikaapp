import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import { USER_STATUS } from '@shared/constants/status';
import { successResponse } from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { AppAuthorizationError } from '@/lib/utils/errors/AppError';
import { logger } from '@/lib/utils/logger';

function toISOString(ts: any): string {
  if (!ts) return '';
  if (ts._seconds) return new Date(ts._seconds * 1000).toISOString();
  if (ts.toDate) return ts.toDate().toISOString();
  if (ts instanceof Date) return ts.toISOString();
  if (typeof ts === 'string') return ts;
  return '';
}

function toMonthKey(ts: any): string {
  const iso = toISOString(ts);
  if (!iso) return '';
  return iso.substring(0, 7);
}

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

function toDayKey(ts: any): string {
  const iso = toISOString(ts);
  if (!iso) return '';
  return iso.substring(0, 10);
}

function determineGranularity(startDate: Date, endDate: Date): 'daily' | 'weekly' | 'monthly' {
  const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 14) return 'daily';
  if (diffDays <= 60) return 'weekly';
  return 'monthly';
}

function toTimeKey(ts: any, granularity: 'daily' | 'weekly' | 'monthly'): string {
  switch (granularity) {
    case 'daily': return toDayKey(ts);
    case 'weekly': return toWeekKey(ts);
    case 'monthly': return toMonthKey(ts);
  }
}

function generateTimeKeys(startDate: Date, endDate: Date, granularity: 'daily' | 'weekly' | 'monthly'): string[] {
  const keys: string[] = [];
  const current = new Date(startDate);
  
  if (granularity === 'daily') {
    while (current <= endDate) {
      keys.push(current.toISOString().substring(0, 10));
      current.setDate(current.getDate() + 1);
      if (keys.length > 365) break;
    }
  } else if (granularity === 'weekly') {
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
      if (keys.length > 104) break;
    }
  } else {
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

/**
 * Performans skorunu hesapla
 * Puanlama:
 * - Üye alımı: 1 puan (her üye için)
 * - Faaliyet: 0.25 puan (her faaliyet için)
 */
function calculatePerformanceScore(metrics: {
  activityCount: number;
  newsCount: number;
  announcementCount: number;
  memberCount: number;
  readMessageRate: number;
}): number {
  // Üye alımı: 1 puan, Faaliyet: 0.25 puan
  const memberScore = metrics.memberCount * 1;
  const activityScore = metrics.activityCount * 0.25;

  return memberScore + activityScore;
}

// GET /api/reports/performance/managers - İlçe yöneticisi bazlı performans raporu
export const GET = asyncHandler(async (request: NextRequest) => {
  return withAuth(request, async (req, user) => {
    const { error, user: currentUserData } = await getCurrentUser(user.uid);

    if (error || !currentUserData) {
      throw new AppAuthorizationError('Kullanıcı bilgileri alınamadı');
    }

    const userRole = currentUserData.role;

    if (userRole !== USER_ROLE.ADMIN && userRole !== USER_ROLE.SUPERADMIN) {
      throw new AppAuthorizationError('Bu rapora erişim yetkiniz yok');
    }

    const url = new URL(request.url);
    const branchIdFilter = url.searchParams.get('branchId');
    const managerIdFilter = url.searchParams.get('managerId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Tarih aralığı kontrolü için helper
    const isInDateRange = (timestamp: any): boolean => {
      if (!startDate && !endDate) return true;
      const itemDate = toISOString(timestamp);
      if (!itemDate) return false;
      const itemTime = new Date(itemDate).getTime();
      if (startDate && itemTime < new Date(startDate).getTime()) return false;
      if (endDate && itemTime > new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1) return false;
      return true;
    };

    // Paralel veri çekme
    const [
      usersSnap,
      activitiesSnap,
      newsSnap,
      announcementsSnap,
      branchesSnap,
      categoriesSnap,
    ] = await Promise.all([
      db.collection('users').get(),
      db.collection('activities').get(),
      db.collection('news').get(),
      db.collection('announcements').get(),
      db.collection('branches').get(),
      db.collection('activity_categories').get(),
    ]);

    const categoryMap = new Map<string, string>();
    categoriesSnap.docs.forEach((doc: any) => {
      categoryMap.set(doc.id, doc.data().name || 'Bilinmeyen');
    });

    const branchMap = new Map<string, string>();
    branchesSnap.docs.forEach((doc: any) => {
      branchMap.set(doc.id, doc.data().name || '');
    });

    const allUsers = usersSnap.docs.map((doc: any) => ({ uid: doc.id, ...doc.data() }));
    const allActivities = activitiesSnap.docs
      .map((doc: any) => ({ id: doc.id, ...doc.data() }))
      .filter((activity: any) => isInDateRange(activity.createdAt));
    const allNews = newsSnap.docs
      .map((doc: any) => ({ id: doc.id, ...doc.data() }))
      .filter((news: any) => isInDateRange(news.createdAt));
    const allAnnouncements = announcementsSnap.docs
      .map((doc: any) => ({ id: doc.id, ...doc.data() }))
      .filter((announcement: any) => isInDateRange(announcement.createdAt));

    // Yöneticileri filtrele
    let managers = allUsers.filter((u: any) => u.role === USER_ROLE.BRANCH_MANAGER);

    if (branchIdFilter) {
      managers = managers.filter((m: any) => m.branchId === branchIdFilter);
    }
    if (managerIdFilter) {
      managers = managers.filter((m: any) => m.uid === managerIdFilter);
    }

    // Dinamik zaman granularity belirleme
    const sDate = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 6));
    const eDate = endDate ? new Date(endDate) : new Date();
    const granularity = determineGranularity(sDate, eDate);
    const timeKeys = generateTimeKeys(sDate, eDate, granularity);

    let totalActivitiesCount = 0;
    let totalScore = 0;

    const managerReports = managers.map((m: any) => {
      const branchName = m.branchId ? branchMap.get(m.branchId) || '' : '';

      // Yöneticinin oluşturduğu aktiviteler
      const mActivities = allActivities.filter((a: any) => a.createdBy === m.uid);
      const publishedActivities = mActivities.filter((a: any) => a.isPublished === true);

      // Kategori dağılımı
      const categoryCountMap = new Map<string, number>();
      mActivities.forEach((a: any) => {
        const catId = a.categoryId || 'unknown';
        categoryCountMap.set(catId, (categoryCountMap.get(catId) || 0) + 1);
      });
      const byCategory = Array.from(categoryCountMap.entries()).map(([categoryId, count]) => ({
        categoryId,
        categoryName: categoryMap.get(categoryId) || 'Bilinmeyen',
        count,
      }));

      // Dinamik zaman dağılımı
      const byPeriod = timeKeys.map((key) => ({
        period: key,
        count: mActivities.filter((a: any) => toTimeKey(a.createdAt, granularity) === key).length,
      }));

      // Son 5 aktivite
      const recentActivities = [...mActivities]
        .sort((a: any, b: any) => {
          const aDate = toISOString(a.createdAt);
          const bDate = toISOString(b.createdAt);
          return bDate.localeCompare(aDate);
        })
        .slice(0, 5)
        .map((a: any) => ({
          id: a.id,
          name: a.name || '',
          categoryName: categoryMap.get(a.categoryId) || '',
          activityDate: toISOString(a.activityDate),
          isPublished: a.isPublished === true,
          createdAt: toISOString(a.createdAt),
        }));

      // Yöneticinin oluşturduğu haberler
      const mNews = allNews.filter((n: any) => n.createdBy === m.uid);
      const mAnnouncements = allAnnouncements.filter((a: any) => a.createdBy === m.uid);

      // Yönettiği üyeler (şubesindeki)
      const managedMembers = allUsers.filter(
        (u: any) => u.branchId === m.branchId && u.role === USER_ROLE.USER
      );
      const activeManaged = managedMembers.filter(
        (u: any) => u.status === USER_STATUS.ACTIVE
      );
      const pendingManaged = managedMembers.filter(
        (u: any) =>
          u.status === USER_STATUS.PENDING_DETAILS ||
          u.status === USER_STATUS.PENDING_BRANCH_REVIEW
      );

      // Son aktivite tarihi
      const lastActivity = recentActivities.length > 0 ? recentActivities[0].createdAt : undefined;

      const score = calculatePerformanceScore({
        activityCount: mActivities.length,
        newsCount: mNews.length,
        announcementCount: mAnnouncements.length,
        memberCount: managedMembers.length,
        readMessageRate: 0.5,
      });

      totalActivitiesCount += mActivities.length;
      totalScore += score;

      return {
        uid: m.uid,
        firstName: m.firstName || '',
        lastName: m.lastName || '',
        email: m.email || '',
        phone: m.phone || undefined,
        branchId: m.branchId || undefined,
        branchName,
        district: m.district || undefined,
        role: m.role,
        activities: {
          total: mActivities.length,
          published: publishedActivities.length,
          unpublished: mActivities.length - publishedActivities.length,
          byCategory,
          byPeriod,
          granularity,
          recentActivities,
        },
        news: {
          total: mNews.length,
          published: mNews.filter((n: any) => n.isPublished === true).length,
        },
        announcements: {
          total: mAnnouncements.length,
          published: mAnnouncements.filter((a: any) => a.isPublished === true).length,
        },
        managedMembers: {
          total: managedMembers.length,
          active: activeManaged.length,
          pending: pendingManaged.length,
        },
        lastActivityDate: lastActivity,
        performanceScore: score,
      };
    });

    // Skora göre sırala
    managerReports.sort((a: any, b: any) => b.performanceScore - a.performanceScore);

    const avgScore =
      managerReports.length > 0 ? Math.round(totalScore / managerReports.length) : 0;

    return successResponse('Yönetici performans raporu başarıyla getirildi', {
      managers: managerReports,
      summary: {
        totalActivities: totalActivitiesCount,
        averageScore: avgScore,
      },
      timeGranularity: granularity,
    });
  });
});
