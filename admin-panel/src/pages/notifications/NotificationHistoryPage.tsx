import { useState, useEffect } from 'react';
import { Bell, Search, CheckCircle, XCircle, Building2, X } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import NotificationDetailModal from '@/components/notifications/NotificationDetailModal';
import { notificationService } from '@/services/api/notificationService';
import type { NotificationHistory } from '@/services/api/notificationService';
import { NOTIFICATION_TYPE } from '@shared/constants/notifications';
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
  const [limit] = useState(25);
  const [filterType, setFilterType] = useState<'all' | 'announcement' | 'news'>('all');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filterBranchId, setFilterBranchId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotification, setSelectedNotification] = useState<NotificationHistory | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [page, filterType, filterBranchId, searchTerm]);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'superadmin') {
      fetchBranches();
    } else if (user?.role === 'branch_manager') {
      // Şube yöneticileri yalnızca kendi şubelerinin bildirimlerini görmelidir
      setFilterBranchId(user.branchId || '');
    }
  }, [user]);

  const fetchBranches = async () => {
    try {
      const data = await apiRequest<{ 
        branches: Branch[];
        total?: number;
        page: number;
        limit: number;
        hasMore: boolean;
        nextCursor?: string;
      }>('/api/branches');
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
        // Branch manager için backend'e kendi şubesi gönderilsin, diğerleri seçime göre
        branchId: user?.role === 'branch_manager' ? (user.branchId || undefined) : (filterBranchId || undefined),
        search: searchTerm || undefined,
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

  const handleViewDetail = (notification: NotificationHistory) => {
    setSelectedNotification(notification);
    setIsDetailModalOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Filtreler ve Arama */}
        <div className="flex items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Bildirimlerde ara..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Tip Filtresi */}
            <div className="inline-flex bg-gray-100 rounded-lg p-1">
              <button
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => {
                  setFilterType('all');
                  setPage(1);
                }}
              >
                Tümü
              </button>
              <button
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filterType === NOTIFICATION_TYPE.ANNOUNCEMENT
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => {
                  setFilterType(NOTIFICATION_TYPE.ANNOUNCEMENT);
                  setPage(1);
                }}
              >
                Duyuru
              </button>
              <button
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filterType === NOTIFICATION_TYPE.NEWS
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => {
                  setFilterType(NOTIFICATION_TYPE.NEWS);
                  setPage(1);
                }}
              >
                Haber
              </button>
            </div>

            {/* Şube Filtresi (sadece admin/superadmin) */}
            {(user?.role === 'admin' || user?.role === 'superadmin') && (
              <select
                value={filterBranchId}
                onChange={(e) => {
                  setFilterBranchId(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-xs font-medium appearance-none"
              >
                <option value="">Tüm Şubeler</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
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

