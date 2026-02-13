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

// GET /api/reports/performance/branches - Şube bazlı performans raporu
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
      branchesSnap,
      activitiesSnap,
      usersSnap,
      newsSnap,
      announcementsSnap,
      contactSnap,
      categoriesSnap,
    ] = await Promise.all([
      branchIdFilter
        ? db.collection('branches').doc(branchIdFilter).get().then((doc) => ({
            docs: doc.exists ? [doc] : [],
          }))
        : db.collection('branches').get(),
      db.collection('activities').get(),
      db.collection('users').get(),
      db.collection('news').get(),
      db.collection('announcements').get(),
      db.collection('contact_messages').get(),
      db.collection('activity_categories').get(),
    ]);

    const categoryMap = new Map<string, string>();
    categoriesSnap.docs.forEach((doc: any) => {
      categoryMap.set(doc.id, doc.data().name || 'Bilinmeyen');
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
    const allContactMessages = contactSnap.docs
      .map((doc: any) => ({ id: doc.id, ...doc.data() }))
      .filter((message: any) => isInDateRange(message.createdAt));

    // Dinamik zaman granularity belirleme
    const sDate = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 6));
    const eDate = endDate ? new Date(endDate) : new Date();
    const granularity = determineGranularity(sDate, eDate);
    const timeKeys = generateTimeKeys(sDate, eDate, granularity);

    let totalActivitiesCount = 0;
    let totalMembersCount = 0;
    let totalScore = 0;

    const branches = branchesSnap.docs.map((doc: any) => {
      const data = doc.data ? doc.data() : doc;
      const branchId = doc.id;
      const branchName = data.name || '';

      // Şubeye ait aktiviteler
      const branchActivities = allActivities.filter((a: any) => a.branchId === branchId);
      const publishedActivities = branchActivities.filter((a: any) => a.isPublished === true);

      // Kategori bazlı dağılım
      const categoryCountMap = new Map<string, number>();
      branchActivities.forEach((a: any) => {
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
        count: branchActivities.filter((a: any) => toTimeKey(a.createdAt, granularity) === key).length,
      }));

      // Şubeye ait üyeler
      const branchMembers = allUsers.filter(
        (u: any) => u.branchId === branchId && u.role === USER_ROLE.USER
      );
      const activeMembers = branchMembers.filter((u: any) => u.status === USER_STATUS.ACTIVE);
      const pendingMembers = branchMembers.filter(
        (u: any) =>
          u.status === USER_STATUS.PENDING_DETAILS ||
          u.status === USER_STATUS.PENDING_BRANCH_REVIEW
      );
      const rejectedMembers = branchMembers.filter(
        (u: any) => u.status === USER_STATUS.REJECTED
      );

      // Bu şubenin yöneticilerinin oluşturduğu içerikler
      const branchManagerUids = allUsers
        .filter((u: any) => u.branchId === branchId && u.role === USER_ROLE.BRANCH_MANAGER)
        .map((u: any) => u.uid);

      const branchNews = allNews.filter((n: any) => branchManagerUids.includes(n.createdBy));
      const branchAnnouncements = allAnnouncements.filter((a: any) =>
        branchManagerUids.includes(a.createdBy) || a.branchId === branchId
      );

      // İletişim mesajları (şubeye ait)
      const branchMessages = allContactMessages.filter(
        (m: any) => m.branchId === branchId
      );
      const readMessages = branchMessages.filter((m: any) => m.isRead === true);

      // Yöneticiler
      const branchManagers = allUsers
        .filter((u: any) => u.branchId === branchId && u.role === USER_ROLE.BRANCH_MANAGER)
        .map((u: any) => ({
          uid: u.uid,
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          email: u.email || '',
        }));

      const readRate =
        branchMessages.length > 0 ? readMessages.length / branchMessages.length : 0.5;

      const score = calculatePerformanceScore({
        activityCount: branchActivities.length,
        newsCount: branchNews.length,
        announcementCount: branchAnnouncements.length,
        memberCount: branchMembers.length,
        readMessageRate: readRate,
      });

      totalActivitiesCount += branchActivities.length;
      totalMembersCount += branchMembers.length;
      totalScore += score;

      // 30 gün içinde yeni üye
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const newThisPeriod = branchMembers.filter((u: any) => {
        const created = toISOString(u.createdAt);
        return created && new Date(created) >= thirtyDaysAgo;
      }).length;

      return {
        branchId,
        branchName,
        isActive: data.isActive !== false,
        activities: {
          total: branchActivities.length,
          published: publishedActivities.length,
          unpublished: branchActivities.length - publishedActivities.length,
          byCategory,
          byPeriod,
          granularity,
        },
        members: {
          total: branchMembers.length,
          active: activeMembers.length,
          pending: pendingMembers.length,
          rejected: rejectedMembers.length,
          newThisPeriod,
        },
        news: {
          total: branchNews.length,
          published: branchNews.filter((n: any) => n.isPublished === true).length,
        },
        announcements: {
          total: branchAnnouncements.length,
          published: branchAnnouncements.filter((a: any) => a.isPublished === true).length,
        },
        contactMessages: {
          total: branchMessages.length,
          read: readMessages.length,
          unread: branchMessages.length - readMessages.length,
        },
        managers: branchManagers,
        performanceScore: score,
      };
    });

    // Skora göre sırala
    branches.sort((a: any, b: any) => b.performanceScore - a.performanceScore);

    const avgScore = branches.length > 0 ? Math.round(totalScore / branches.length) : 0;

    return successResponse('Şube performans raporu başarıyla getirildi', {
      branches,
      summary: {
        totalActivities: totalActivitiesCount,
        totalMembers: totalMembersCount,
        averageScore: avgScore,
      },
      timeGranularity: granularity,
    });
  });
});
