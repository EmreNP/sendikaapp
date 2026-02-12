import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { withAuth, getCurrentUser } from '@/lib/middleware/auth';
import { USER_ROLE } from '@shared/constants/roles';
import { USER_STATUS } from '@shared/constants/status';
import { successResponse } from '@/lib/utils/response';
import { asyncHandler } from '@/lib/utils/errors/errorHandler';
import { AppAuthorizationError, AppValidationError } from '@/lib/utils/errors/AppError';
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

function isInRange(ts: any, start: Date, end: Date): boolean {
  const iso = toISOString(ts);
  if (!iso) return false;
  const date = new Date(iso);
  return date >= start && date <= end;
}

// GET /api/reports/generate - Rapor verisi oluştur (PDF için)
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
    const startDateParam = url.searchParams.get('startDate');
    const endDateParam = url.searchParams.get('endDate');
    const branchIdFilter = url.searchParams.get('branchId');
    const managerIdFilter = url.searchParams.get('managerId');
    const reportType = url.searchParams.get('type') || 'branch'; // 'branch' | 'manager'

    // Tarih aralığını belirle (default: son 1 ay)
    const now = new Date();
    const startDate = startDateParam ? new Date(startDateParam) : new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    // End date'i günün sonuna ayarla (23:59:59.999)
    const endDate = endDateParam ? new Date(new Date(endDateParam).getTime() + 24 * 60 * 60 * 1000 - 1) : now;

    logger.info('Report generation date range', { startDate, endDate, startDateParam, endDateParam });

    // Paralel veri çekme
    const [
      branchesSnap,
      activitiesSnap,
      usersSnap,
      newsSnap,
      announcementsSnap,
      categoriesSnap,
      auditLogsSnap,
      notificationHistorySnap,
      registrationLogsSnap,
    ] = await Promise.all([
      db.collection('branches').get(),
      db.collection('activities').get(),
      db.collection('users').get(),
      db.collection('news').get(),
      db.collection('announcements').get(),
      db.collection('activity_categories').get(),
      db.collection('audit_logs')
        .orderBy('timestamp', 'desc')
        .get(),
      db.collection('notificationHistory')
        .orderBy('createdAt', 'desc')
        .get(),
      db.collection('user_registration_logs')
        .orderBy('createdAt', 'desc')
        .get(),
    ]);

    // Maps
    const categoryMap = new Map<string, string>();
    categoriesSnap.docs.forEach((doc: any) => {
      categoryMap.set(doc.id, doc.data().name || 'Bilinmeyen');
    });

    const branchMap = new Map<string, { id: string; name: string; isActive: boolean }>();
    branchesSnap.docs.forEach((doc: any) => {
      const data = doc.data();
      branchMap.set(doc.id, { id: doc.id, name: data.name || '', isActive: data.isActive !== false });
    });

    const allUsers = usersSnap.docs.map((doc: any) => ({ uid: doc.id, ...doc.data() }));
    const allActivities = activitiesSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    const allNews = newsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    const allAnnouncements = announcementsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    // Audit logs — tarih aralığına göre filtrele
    const auditLogs = auditLogsSnap.docs
      .map((doc: any) => ({ id: doc.id, ...doc.data() }))
      .filter((log: any) => isInRange(log.timestamp, startDate, endDate));

    // Notification history — tarih aralığına göre filtrele  
    const notifHistory = notificationHistorySnap.docs
      .map((doc: any) => ({ id: doc.id, ...doc.data() }))
      .filter((n: any) => isInRange(n.createdAt, startDate, endDate));

    // Registration logs — tarih aralığına göre filtrele
    const regLogs = registrationLogsSnap.docs
      .map((doc: any) => ({ id: doc.id, ...doc.data() }))
      .filter((log: any) => isInRange(log.createdAt, startDate, endDate));

    // ========== ŞUBE RAPORU ==========
    if (reportType === 'branch') {
      const targetBranches = branchIdFilter
        ? [branchMap.get(branchIdFilter)].filter(Boolean)
        : Array.from(branchMap.values());

      const branchReports = targetBranches.map((branch: any) => {
        const branchId = branch.id;
        const branchName = branch.name;

        // Bu şubenin yöneticileri
        const branchManagerUids = allUsers
          .filter((u: any) => u.branchId === branchId && u.role === USER_ROLE.BRANCH_MANAGER)
          .map((u: any) => u.uid);

        const branchManagers = allUsers
          .filter((u: any) => u.branchId === branchId && u.role === USER_ROLE.BRANCH_MANAGER)
          .map((u: any) => ({
            uid: u.uid,
            fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
          }));

        // Tarih aralığında oluşturulan aktiviteler (bu şube)
        const periodActivities = allActivities.filter(
          (a: any) => a.branchId === branchId && isInRange(a.createdAt, startDate, endDate)
        );

        logger.info('Branch activities', {
          branchId,
          branchName,
          totalActivities: allActivities.filter((a: any) => a.branchId === branchId).length,
          periodActivities: periodActivities.length,
          sampleActivity: allActivities.filter((a: any) => a.branchId === branchId)[0] ? {
            createdAt: toISOString(allActivities.filter((a: any) => a.branchId === branchId)[0].createdAt),
            name: allActivities.filter((a: any) => a.branchId === branchId)[0].name,
          } : null,
        });

        // Aktiviteleri kategoriye göre grupla
        const catCounts: Record<string, { name: string; count: number }> = {};
        periodActivities.forEach((a: any) => {
          const catId = a.categoryId || 'unknown';
          if (!catCounts[catId]) catCounts[catId] = { name: categoryMap.get(catId) || 'Bilinmeyen', count: 0 };
          catCounts[catId].count++;
        });

        // Sıralı aktivite listesi
        const activityList = periodActivities
          .sort((a: any, b: any) => toISOString(b.createdAt).localeCompare(toISOString(a.createdAt)))
          .map((a: any) => ({
            id: a.id,
            name: a.name || '',
            categoryName: categoryMap.get(a.categoryId) || '',
            activityDate: toISOString(a.activityDate),
            createdAt: toISOString(a.createdAt),
            isPublished: a.isPublished === true,
            createdByName: (() => {
              const creator = allUsers.find((u: any) => u.uid === a.createdBy);
              return creator ? `${creator.firstName || ''} ${creator.lastName || ''}`.trim() : '';
            })(),
          }));

        // Tarih aralığında üye değişiklikleri
        const newMembers = allUsers.filter(
          (u: any) => u.branchId === branchId && u.role === USER_ROLE.USER && isInRange(u.createdAt, startDate, endDate)
        );

        // Kayıt loglarından bu şubeyle ilgili güncelleme logları
        const branchRegLogs = regLogs.filter((log: any) => {
          const logUser = allUsers.find((u: any) => u.uid === log.userId);
          return logUser && logUser.branchId === branchId;
        });
        const updatedMemberCount = branchRegLogs.filter((log: any) => log.action === 'user_update').length;
        const statusChanges = branchRegLogs.filter((log: any) =>
          ['branch_manager_approval', 'branch_manager_rejection', 'admin_approval', 'admin_rejection', 'status_update'].includes(log.action)
        );

        // Bildirimler
        const branchNotifs = notifHistory.filter(
          (n: any) => branchManagerUids.includes(n.sentBy) || n.branchId === branchId
        );

        // Haberler & Duyurular
        const branchNewsCount = allNews.filter(
          (n: any) => branchManagerUids.includes(n.createdBy) && isInRange(n.createdAt, startDate, endDate)
        ).length;
        const branchAnnouncementCount = allAnnouncements.filter(
          (a: any) => (branchManagerUids.includes(a.createdBy) || a.branchId === branchId) && isInRange(a.createdAt, startDate, endDate)
        ).length;

        // Log satırları (kronolojik)
        const logEntries: Array<{ date: string; message: string; type: string }> = [];

        // Üye logları
        if (newMembers.length > 0) {
          logEntries.push({
            date: toISOString(startDate),
            message: `${newMembers.length} yeni üye kaydedildi`,
            type: 'user',
          });
        }
        if (updatedMemberCount > 0) {
          logEntries.push({
            date: toISOString(startDate),
            message: `${updatedMemberCount} üye bilgisi güncellendi`,
            type: 'user',
          });
        }
        if (statusChanges.length > 0) {
          const approvals = statusChanges.filter((l: any) => l.action.includes('approval')).length;
          const rejections = statusChanges.filter((l: any) => l.action.includes('rejection')).length;
          if (approvals > 0) {
            logEntries.push({ date: toISOString(startDate), message: `${approvals} üye başvurusu onaylandı`, type: 'user' });
          }
          if (rejections > 0) {
            logEntries.push({ date: toISOString(startDate), message: `${rejections} üye başvurusu reddedildi`, type: 'user' });
          }
        }

        // Bildirim logları
        if (branchNotifs.length > 0) {
          logEntries.push({
            date: toISOString(startDate),
            message: `${branchNotifs.length} bildirim gönderildi`,
            type: 'notification',
          });
        }

        // Aktivite logları
        if (periodActivities.length > 0) {
          const catSummary = Object.values(catCounts)
            .map((c: any) => `${c.count} ${c.name}`)
            .join(', ');
          logEntries.push({
            date: toISOString(startDate),
            message: `${periodActivities.length} aktivite oluşturuldu (${catSummary})`,
            type: 'activity',
          });
        }

        // Haber/Duyuru logları
        if (branchNewsCount > 0) {
          logEntries.push({ date: toISOString(startDate), message: `${branchNewsCount} haber oluşturuldu`, type: 'news' });
        }
        if (branchAnnouncementCount > 0) {
          logEntries.push({ date: toISOString(startDate), message: `${branchAnnouncementCount} duyuru oluşturuldu`, type: 'announcement' });
        }

        // Toplam üyeler
        const totalMembers = allUsers.filter(
          (u: any) => u.branchId === branchId && u.role === USER_ROLE.USER
        ).length;
        const activeMembers = allUsers.filter(
          (u: any) => u.branchId === branchId && u.role === USER_ROLE.USER && u.status === USER_STATUS.ACTIVE
        ).length;

        return {
          branchId,
          branchName,
          isActive: branch.isActive,
          managers: branchManagers,
          period: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
          summary: {
            totalMembers,
            activeMembers,
            newMembers: newMembers.length,
            updatedMembers: updatedMemberCount,
            totalActivities: periodActivities.length,
            activitiesByCategory: Object.values(catCounts),
            notificationsSent: branchNotifs.length,
            newsCreated: branchNewsCount,
            announcementsCreated: branchAnnouncementCount,
          },
          logEntries,
          activities: activityList,
        };
      });

      return successResponse('Şube rapor verisi oluşturuldu', {
        reportType: 'branch',
        generatedAt: now.toISOString(),
        period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        reports: branchReports,
      });
    }

    // ========== YÖNETİCİ RAPORU ==========
    let managers = allUsers.filter((u: any) => u.role === USER_ROLE.BRANCH_MANAGER);
    if (branchIdFilter) managers = managers.filter((m: any) => m.branchId === branchIdFilter);
    if (managerIdFilter) managers = managers.filter((m: any) => m.uid === managerIdFilter);

    const managerReports = managers.map((m: any) => {
      const branchName = m.branchId ? branchMap.get(m.branchId)?.name || '' : '';

      // Tarih aralığında oluşturulan aktiviteler
      const periodActivities = allActivities.filter(
        (a: any) => a.createdBy === m.uid && isInRange(a.createdAt, startDate, endDate)
      );

      // Kategori dağılımı
      const catCounts: Record<string, { name: string; count: number }> = {};
      periodActivities.forEach((a: any) => {
        const catId = a.categoryId || 'unknown';
        if (!catCounts[catId]) catCounts[catId] = { name: categoryMap.get(catId) || 'Bilinmeyen', count: 0 };
        catCounts[catId].count++;
      });

      // Aktivite listesi
      const activityList = periodActivities
        .sort((a: any, b: any) => toISOString(b.createdAt).localeCompare(toISOString(a.createdAt)))
        .map((a: any) => ({
          id: a.id,
          name: a.name || '',
          categoryName: categoryMap.get(a.categoryId) || '',
          activityDate: toISOString(a.activityDate),
          createdAt: toISOString(a.createdAt),
          isPublished: a.isPublished === true,
        }));

      // Yönetici kayıt logları
      const managerRegLogs = regLogs.filter((log: any) => log.performedBy === m.uid);
      const updatedMemberCount = managerRegLogs.filter((l: any) => l.action === 'user_update').length;
      const approvals = managerRegLogs.filter((l: any) => l.action.includes('approval')).length;
      const rejections = managerRegLogs.filter((l: any) => l.action.includes('rejection')).length;

      // Bildirimler
      const managerNotifs = notifHistory.filter((n: any) => n.sentBy === m.uid);

      // Haberler & Duyurular
      const newsCount = allNews.filter(
        (n: any) => n.createdBy === m.uid && isInRange(n.createdAt, startDate, endDate)
      ).length;
      const announcementCount = allAnnouncements.filter(
        (a: any) => a.createdBy === m.uid && isInRange(a.createdAt, startDate, endDate)
      ).length;

      // Yönettiği üyeler
      const managedTotal = allUsers.filter(
        (u: any) => u.branchId === m.branchId && u.role === USER_ROLE.USER
      ).length;
      const managedActive = allUsers.filter(
        (u: any) => u.branchId === m.branchId && u.role === USER_ROLE.USER && u.status === USER_STATUS.ACTIVE
      ).length;
      const newMembers = allUsers.filter(
        (u: any) => u.branchId === m.branchId && u.role === USER_ROLE.USER && isInRange(u.createdAt, startDate, endDate)
      ).length;

      // Log satırları
      const logEntries: Array<{ date: string; message: string; type: string }> = [];

      if (newMembers > 0) {
        logEntries.push({ date: '', message: `${newMembers} yeni üye kaydedildi`, type: 'user' });
      }
      if (updatedMemberCount > 0) {
        logEntries.push({ date: '', message: `${updatedMemberCount} üye bilgisi güncellendi`, type: 'user' });
      }
      if (approvals > 0) {
        logEntries.push({ date: '', message: `${approvals} üye başvurusu onaylandı`, type: 'user' });
      }
      if (rejections > 0) {
        logEntries.push({ date: '', message: `${rejections} üye başvurusu reddedildi`, type: 'user' });
      }
      if (managerNotifs.length > 0) {
        logEntries.push({ date: '', message: `${managerNotifs.length} bildirim gönderildi`, type: 'notification' });
      }
      if (periodActivities.length > 0) {
        const catSummary = Object.values(catCounts).map((c: any) => `${c.count} ${c.name}`).join(', ');
        logEntries.push({ date: '', message: `${periodActivities.length} aktivite oluşturuldu (${catSummary})`, type: 'activity' });
      }
      if (newsCount > 0) {
        logEntries.push({ date: '', message: `${newsCount} haber oluşturuldu`, type: 'news' });
      }
      if (announcementCount > 0) {
        logEntries.push({ date: '', message: `${announcementCount} duyuru oluşturuldu`, type: 'announcement' });
      }

      return {
        uid: m.uid,
        fullName: `${m.firstName || ''} ${m.lastName || ''}`.trim(),
        email: m.email || '',
        phone: m.phone || '',
        district: m.district || '',
        branchId: m.branchId || '',
        branchName,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        summary: {
          managedMembers: managedTotal,
          activeMembers: managedActive,
          newMembers,
          updatedMembers: updatedMemberCount,
          approvals,
          rejections,
          totalActivities: periodActivities.length,
          activitiesByCategory: Object.values(catCounts),
          notificationsSent: managerNotifs.length,
          newsCreated: newsCount,
          announcementsCreated: announcementCount,
        },
        logEntries,
        activities: activityList,
      };
    });

    return successResponse('Yönetici rapor verisi oluşturuldu', {
      reportType: 'manager',
      generatedAt: now.toISOString(),
      period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      reports: managerReports,
    });
  });
});
