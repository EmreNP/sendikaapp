import { useState, useEffect } from 'react';
import { Bell, Search, Calendar, Users, CheckCircle, XCircle, Building2 } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import NotificationDetailModal from '@/components/notifications/NotificationDetailModal';
import { notificationService } from '@/services/api/notificationService';
import type { NotificationHistory } from '@/services/api/notificationService';
import { NOTIFICATION_TYPE, TARGET_AUDIENCE } from '@shared/constants/notifications';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/utils/api';

interface Branch {
  id: string;
  name: string;
}

export default function NotificationHistoryPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [limit] = useState(20);
  const [filterType, setFilterType] = useState<'all' | 'announcement' | 'news'>('all');
  const [filterTargetAudience, setFilterTargetAudience] = useState<'all' | 'active' | 'branch'>('all');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filterBranchId, setFilterBranchId] = useState<string>('');
  const [selectedNotification, setSelectedNotification] = useState<NotificationHistory | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [page, filterType, filterTargetAudience, filterBranchId]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchBranches();
    }
  }, [user]);

  const fetchBranches = async () => {
    try {
      const data = await apiRequest<{ branches: Branch[] }>('/api/branches');
      setBranches(data.branches || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await notificationService.getNotificationHistory({
        page,
        limit,
        type: filterType === 'all' ? undefined : filterType,
        targetAudience: filterTargetAudience === 'all' ? undefined : filterTargetAudience,
        branchId: filterBranchId || undefined,
      });

      setNotifications(data.notifications || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 0);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      setError(error.message || 'Bildirim geçmişi yüklenirken bir hata oluştu');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: any): string => {
    if (!date) return '-';
    
    try {
      let dateObj: Date;
      
      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        // ISO string from backend
        dateObj = new Date(date);
      } else if (typeof date === 'object' && date.seconds !== undefined) {
        // Firestore Timestamp object
        dateObj = new Date(date.seconds * 1000);
      } else if (typeof date === 'object' && date._seconds !== undefined) {
        // Firestore Timestamp alternative format
        dateObj = new Date(date._seconds * 1000);
      } else if (typeof date === 'object' && date.toDate) {
        // Firestore Timestamp with toDate method
        dateObj = date.toDate();
      } else if (typeof date === 'number') {
        dateObj = new Date(date);
      } else {
        console.warn('Unknown date format:', date);
        return '-';
      }
      
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date:', date);
        return '-';
      }
      
      return new Intl.DateTimeFormat('tr-TR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(dateObj);
    } catch (error) {
      console.error('Date formatting error:', error, date);
      return '-';
    }
  };

  const getTargetAudienceLabel = (audience: string): string => {
    switch (audience) {
      case 'all':
        return 'Tüm Kullanıcılar';
      case 'active':
        return 'Aktif Kullanıcılar';
      case 'branch':
        return 'Belirli Şube';
      default:
        return audience;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6" />
            Bildirim Geçmişi
          </h1>
          <p className="text-gray-600 mt-1">Gönderilen tüm bildirimleri görüntüleyin</p>
        </div>

        {/* Filtreler */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tip Filtresi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bildirim Tipi
              </label>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value as 'all' | 'announcement' | 'news');
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tümü</option>
                <option value={NOTIFICATION_TYPE.ANNOUNCEMENT}>Duyuru</option>
                <option value={NOTIFICATION_TYPE.NEWS}>Haber</option>
              </select>
            </div>

            {/* Hedef Kitle Filtresi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hedef Kitle
              </label>
              <select
                value={filterTargetAudience}
                onChange={(e) => {
                  setFilterTargetAudience(e.target.value as 'all' | 'active' | 'branch');
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tümü</option>
                <option value={TARGET_AUDIENCE.ALL}>Tüm Kullanıcılar</option>
                <option value={TARGET_AUDIENCE.ACTIVE}>Aktif Kullanıcılar</option>
                <option value={TARGET_AUDIENCE.BRANCH}>Belirli Şube</option>
              </select>
            </div>

            {/* Şube Filtresi (Sadece Admin) */}
            {user?.role === 'admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Şube
                </label>
                <select
                  value={filterBranchId}
                  onChange={(e) => {
                    setFilterBranchId(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tüm Şubeler</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Notifications Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Yükleniyor...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Bildirim geçmişi bulunamadı</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Başlık
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tip
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hedef Kitle
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Şube
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sonuç
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gönderen
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tarih
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {notifications.map((notification) => (
                      <tr 
                        key={notification.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleViewDetail(notification)}
                      >
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {notification.body}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            notification.type === 'news'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {notification.type === 'news' ? 'Haber' : 'Duyuru'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-600">
                            {getTargetAudienceLabel(notification.targetAudience)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {notification.branch ? (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              {notification.branch.name}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">{notification.sentCount}</span>
                            </div>
                            {notification.failedCount > 0 && (
                              <div className="flex items-center gap-1 text-red-600">
                                <XCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">{notification.failedCount}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {notification.sentByUser ? (
                            <div className="text-sm text-gray-600">
                              {notification.sentByUser.firstName} {notification.sentByUser.lastName}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {formatDate(notification.createdAt)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Toplam {total} bildirim, Sayfa {page} / {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Önceki
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sonraki
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedNotification(null);
        }}
      />
    </AdminLayout>
  );
}

