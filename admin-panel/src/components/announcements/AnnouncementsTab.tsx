import { useState, useEffect } from 'react';
import { Megaphone, Plus, Search, Trash2, Edit, Eye, EyeOff, User, X, XCircle, CheckCircle, Bell } from 'lucide-react';
import DOMPurify from 'dompurify';
import ActionButton from '@/components/common/ActionButton';
import Pagination from '@/components/common/Pagination';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import AnnouncementFormModal from '@/components/announcements/AnnouncementFormModal';
import SendNotificationSimpleModal from '@/components/notifications/SendNotificationSimpleModal';
import { announcementService } from '@/services/api/announcementService';
import { authService } from '@/services/auth/authService';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/utils/dateFormatter';
import type { Announcement } from '@/types/announcement';
import type { User as UserType } from '@/types/user';
import type { NotificationType } from '@shared/constants/notifications';
import { logger } from '@/utils/logger';

/** HTML içeriğinden düz metin çıkar ve kısalt (XSS-safe: innerHTML kullanmaz) */
function extractPlainText(html: string, maxLength: number = 200): string {
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

interface AnnouncementsTabProps {
  userCache: Record<string, UserType>;
  onUserCacheUpdate: (newEntries: Record<string, UserType>) => void;
}

export default function AnnouncementsTab({ userCache, onUserCacheUpdate }: AnnouncementsTabProps) {
  const { user } = useAuth();
  const canCreateAnnouncement = user?.role === 'admin' || user?.role === 'superadmin';

  // Announcements states
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [filterPublished, setFilterPublished] = useState<boolean | null>(null);
  const [filterFeatured, setFilterFeatured] = useState<boolean | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(25);
  const [selectedAnnouncementIds, setSelectedAnnouncementIds] = useState<Set<string>>(new Set());

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'warning',
    onConfirm: () => {},
  });

  // Notification modal states
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationData, setNotificationData] = useState<{
    type: NotificationType;
    contentId: string;
    title: string;
    body: string;
    imageUrl?: string;
  } | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, [page, filterPublished, filterFeatured, searchTerm]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await announcementService.getAnnouncements({
        page,
        limit: 25,
        isPublished: filterPublished ?? undefined,
        isFeatured: filterFeatured ?? undefined,
        search: searchTerm || undefined,
      });

      setAnnouncements(data.announcements || []);
      setTotal(data.total || 0);

      // Kullanıcı bilgilerini cache'le
      const uniqueUserIds = new Set<string>();
      data.announcements?.forEach((item) => {
        if (item.createdBy) uniqueUserIds.add(item.createdBy);
        if (item.updatedBy) uniqueUserIds.add(item.updatedBy);
      });

      // Cache'de olmayan kullanıcıları getir
      const userIdsToFetch = Array.from(uniqueUserIds).filter(uid => !userCache[uid]);
      
      if (userIdsToFetch.length > 0) {
        const userPromises = userIdsToFetch.map(async (uid) => {
          try {
            const userData = await authService.getUserData(uid);
            return userData ? { uid, user: userData } : null;
          } catch (error) {
            logger.error(`Error fetching user ${uid}:`, error);
            return null;
          }
        });

        const userResults = await Promise.all(userPromises);
        const newUserCache: Record<string, UserType> = {};
        userResults.forEach((result) => {
          if (result) {
            newUserCache[result.uid] = result.user;
          }
        });

        onUserCacheUpdate(newUserCache);
      }
    } catch (error: any) {
      logger.error('❌ Error fetching announcements:', error);
      setError(error.message || 'Duyurular yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (uid: string | undefined): string => {
    if (!uid) return '-';
    const cachedUser = userCache[uid];
    if (cachedUser) {
      return `${cachedUser.firstName} ${cachedUser.lastName}`;
    }
    return 'Yükleniyor...';
  };

  const handleOpenNotificationModal = (item: Announcement, type: NotificationType) => {
    const content = item.content || '';
    const body = content ? extractPlainText(content, 200) : item.title;

    setNotificationData({
      type,
      contentId: item.id,
      title: item.title,
      body,
      imageUrl: item.imageUrl,
    });
    setIsNotificationModalOpen(true);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAnnouncementIds(new Set(announcements.map(a => a.id)));
    } else {
      setSelectedAnnouncementIds(new Set());
    }
  };

  const handleSelectAnnouncement = (announcementId: string, checked: boolean) => {
    const newSelected = new Set(selectedAnnouncementIds);
    if (checked) {
      newSelected.add(announcementId);
    } else {
      newSelected.delete(announcementId);
    }
    setSelectedAnnouncementIds(newSelected);
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    try {
      setProcessing(true);
      await announcementService.deleteAnnouncement(announcementId);
      setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
      setSelectedAnnouncementIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(announcementId);
        return newSet;
      });
    } catch (error: any) {
      logger.error('Error deleting announcement:', error);
      setError(error.message || 'Duyuru silinirken bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const handleTogglePublished = async (announcementId: string, currentPublished: boolean) => {
    try {
      setProcessing(true);
      await announcementService.updateAnnouncement(announcementId, {
        isPublished: !currentPublished,
      });
      await fetchAnnouncements();
    } catch (error: any) {
      logger.error('Error toggling announcement published:', error);
      setError(error.message || 'Duyuru durumu güncellenirken bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setProcessing(true);
      const announcementIds = Array.from(selectedAnnouncementIds);

      const result = await announcementService.bulkAction('delete', announcementIds);

      if (result.failureCount > 0) {
        setError(`${result.failureCount} duyuru silinirken hata oluştu`);
      }

      if (result.successCount > 0) {
        setAnnouncements(prev => prev.filter(a => !announcementIds.includes(a.id)));
      }

      setSelectedAnnouncementIds(new Set());
    } catch (error: any) {
      logger.error('Error bulk deleting announcements:', error);
      setError(error.message || 'Toplu silme işlemi sırasında bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkPublish = async () => {
    try {
      setProcessing(true);
      const announcementIds = Array.from(selectedAnnouncementIds);

      const result = await announcementService.bulkAction('publish', announcementIds);

      if (result.failureCount > 0) {
        setError(`${result.failureCount} duyuru yayınlanırken hata oluştu`);
      }

      await fetchAnnouncements();
      setSelectedAnnouncementIds(new Set());
    } catch (error: any) {
      logger.error('Error bulk publishing announcements:', error);
      setError(error.message || 'Toplu yayınlama işlemi sırasında bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkUnpublish = async () => {
    try {
      setProcessing(true);
      const announcementIds = Array.from(selectedAnnouncementIds);

      const result = await announcementService.bulkAction('unpublish', announcementIds);

      if (result.failureCount > 0) {
        setError(`${result.failureCount} duyuru yayından kaldırılırken hata oluştu`);
      }

      await fetchAnnouncements();
      setSelectedAnnouncementIds(new Set());
    } catch (error: any) {
      logger.error('Error bulk unpublishing announcements:', error);
      setError(error.message || 'Toplu yayından kaldırma işlemi sırasında bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-end">
        {canCreateAnnouncement && (
          <button
            onClick={() => {
              setSelectedAnnouncement(null);
              setIsFormModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yeni Duyuru
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Duyuru ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
          />
        </div>
        
        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterPublished === null
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setFilterPublished(null)}
            >
              Tümü
            </button>
            <button
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterPublished === true
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setFilterPublished(true)}
            >
              Yayında
            </button>
            <button
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterPublished === false
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setFilterPublished(false)}
            >
              Taslak
            </button>
          </div>

          {/* Featured Filter */}
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterFeatured === null
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setFilterFeatured(null)}
            >
              Tümü
            </button>
            <button
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterFeatured === true
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setFilterFeatured(true)}
            >
              Öne Çıkan
            </button>
            <button
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterFeatured === false
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setFilterFeatured(false)}
            >
              Normal
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Announcements Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Yükleniyor...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-8 text-center">
            <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Duyuru bulunamadı</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        checked={announcements.length > 0 && selectedAnnouncementIds.size === announcements.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-slate-700 focus:ring-slate-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Başlık
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Oluşturulma
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Yayınlanma
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Oluşturan
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {announcements.map((item, index) => (
                    <tr 
                      key={item.id || `announcement-${index}`} 
                      className={`hover:bg-gray-50 transition-colors ${
                        selectedAnnouncementIds.has(item.id) ? 'bg-slate-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedAnnouncementIds.has(item.id)}
                          onChange={(e) => handleSelectAnnouncement(item.id, e.target.checked)}
                          className="rounded border-gray-300 text-slate-700 focus:ring-slate-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td 
                        className="px-4 py-3 cursor-pointer"
                        onClick={() => {
                          setSelectedAnnouncement(item);
                          setIsPreviewModalOpen(true);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-900">
                            {item.title}
                          </div>
                          {item.isFeatured && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded bg-yellow-100 text-yellow-800">
                              Öne Çıkan
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded ${
                            item.isPublished
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {item.isPublished ? 'Yayında' : 'Taslak'}
                        </span>
                      </td>
                      <td 
                        className="px-4 py-3 cursor-pointer"
                        onClick={() => {
                          setSelectedAnnouncement(item);
                          setIsPreviewModalOpen(true);
                        }}
                      >
                        <div className="text-sm text-gray-600">
                          {formatDate(item.createdAt, true, 'short')}
                        </div>
                      </td>
                      <td 
                        className="px-4 py-3 cursor-pointer"
                        onClick={() => {
                          setSelectedAnnouncement(item);
                          setIsPreviewModalOpen(true);
                        }}
                      >
                        <div className="text-sm text-gray-600">
                          {item.publishedAt ? formatDate(item.publishedAt, true, 'short') : '-'}
                        </div>
                      </td>
                      <td 
                        className="px-4 py-3 cursor-pointer"
                        onClick={() => {
                          setSelectedAnnouncement(item);
                          setIsPreviewModalOpen(true);
                        }}
                      >
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>{getUserName(item.createdBy)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <ActionButton
                            icon={Eye}
                            variant="preview"
                            onClick={() => {
                              setSelectedAnnouncement(item);
                              setIsPreviewModalOpen(true);
                            }}
                            title="Önizle"
                          />
                          {canCreateAnnouncement && (
                            <>
                              <ActionButton
                                icon={Edit}
                                variant="edit"
                                onClick={() => {
                                  setSelectedAnnouncement(item);
                                  setIsFormModalOpen(true);
                                }}
                                title="Düzenle"
                                disabled={processing}
                              />
                              <ActionButton
                                icon={item.isPublished ? XCircle : CheckCircle}
                                variant={item.isPublished ? 'unpublish' : 'publish'}
                                onClick={() => {
                                  setConfirmDialog({
                                    isOpen: true,
                                    title: item.isPublished ? 'Duyuru Yayından Kaldır' : 'Duyuru Yayınla',
                                    message: `${item.title} duyurusunu ${
                                      item.isPublished ? 'yayından kaldırmak' : 'yayınlamak'
                                    } istediğinizden emin misiniz?`,
                                    variant: item.isPublished ? 'warning' : 'info',
                                    onConfirm: () => {
                                      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                      handleTogglePublished(item.id, item.isPublished);
                                    },
                                  });
                                }}
                                title={item.isPublished ? 'Yayından Kaldır' : 'Yayınla'}
                                disabled={processing}
                              />
                            </>
                          )}
                          <ActionButton
                            icon={Bell}
                            variant="info"
                            onClick={() => handleOpenNotificationModal(item, 'announcement')}
                            title="Bildirim Gönder"
                            disabled={processing}
                          />
                          {canCreateAnnouncement && (
                            <ActionButton
                              icon={Trash2}
                              variant="delete"
                              onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  title: 'Duyuru Sil',
                                  message: `${item.title} duyurusunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
                                  variant: 'danger',
                                  onConfirm: () => {
                                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                    handleDeleteAnnouncement(item.id);
                                  },
                                });
                              }}
                              title="Sil"
                              disabled={processing}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <Pagination
              currentPage={page}
              total={total}
              limit={limit}
              onPageChange={setPage}
              showPageNumbers={false}
            />
          </>
        )}
      </div>

      {/* Bulk Action Buttons */}
      {selectedAnnouncementIds.size > 0 && canCreateAnnouncement && (
        <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
          <span className="text-sm text-gray-600 mr-2">
            {selectedAnnouncementIds.size} seçili
          </span>
          <button
            onClick={() => {
              setConfirmDialog({
                isOpen: true,
                title: 'Toplu Silme',
                message: `${selectedAnnouncementIds.size} duyuruyu kalıcı olarak silmek istediğinizden emin misiniz?`,
                variant: 'danger',
                onConfirm: () => {
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  handleBulkDelete();
                },
              });
            }}
            disabled={processing}
            className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            Sil
          </button>
          <button
            onClick={() => {
              setConfirmDialog({
                isOpen: true,
                title: 'Toplu Yayınlama',
                message: `${selectedAnnouncementIds.size} duyuruyu yayınlamak istediğinizden emin misiniz?`,
                variant: 'info',
                onConfirm: () => {
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  handleBulkPublish();
                },
              });
            }}
            disabled={processing}
            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            Yayınla
          </button>
          <button
            onClick={() => {
              setConfirmDialog({
                isOpen: true,
                title: 'Toplu Yayından Kaldırma',
                message: `${selectedAnnouncementIds.size} duyuruyu yayından kaldırmak istediğinizden emin misiniz?`,
                variant: 'warning',
                onConfirm: () => {
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  handleBulkUnpublish();
                },
              });
            }}
            disabled={processing}
            className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            Yayından Kaldır
          </button>
          <button
            onClick={() => setSelectedAnnouncementIds(new Set())}
            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
          >
            Temizle
          </button>
        </div>
      )}

      {/* Announcement Form Modal */}
      <AnnouncementFormModal
        announcement={selectedAnnouncement}
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedAnnouncement(null);
        }}
        onSuccess={() => {
          setIsFormModalOpen(false);
          setSelectedAnnouncement(null);
          fetchAnnouncements();
        }}
      />

      {/* Announcement Preview Modal */}
      {isPreviewModalOpen && selectedAnnouncement && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => {
              setIsPreviewModalOpen(false);
              setSelectedAnnouncement(null);
            }}
          />

          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200 bg-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Duyuru Önizleme</h2>
                </div>
                <button
                  onClick={() => {
                    setIsPreviewModalOpen(false);
                    setSelectedAnnouncement(null);
                  }}
                  className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Görsel */}
                {selectedAnnouncement.imageUrl && (
                  <div className="mb-6">
                    <img
                      src={selectedAnnouncement.imageUrl}
                      alt={selectedAnnouncement.title}
                      className="w-full h-64 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Başlık */}
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedAnnouncement.title}</h1>

                {/* Meta Bilgiler */}
                <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    {selectedAnnouncement.isPublished ? (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800 flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        Yayında
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700 flex items-center gap-1">
                        <EyeOff className="w-3 h-3" />
                        Taslak
                      </span>
                    )}
                  </div>
                  {selectedAnnouncement.isFeatured && (
                    <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800">
                      Öne Çıkan
                    </span>
                  )}
                </div>

                {/* İçerik veya Dış Link */}
                {selectedAnnouncement.content && (
                  <div className="mb-6">
                    <div
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedAnnouncement.content) }}
                    />
                  </div>
                )}
                {selectedAnnouncement.externalUrl && (
                  <div className="mb-6">
                    <p className="text-gray-700 mb-2">
                      <strong>Dış Link:</strong>
                    </p>
                    <a
                      href={selectedAnnouncement.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {selectedAnnouncement.externalUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Notification Modal */}
      {notificationData && (
        <SendNotificationSimpleModal
          isOpen={isNotificationModalOpen}
          onClose={() => {
            setIsNotificationModalOpen(false);
            setNotificationData(null);
          }}
          onSuccess={() => {
            // İsteğe bağlı: başarılı gönderim sonrası işlemler
          }}
          type={notificationData.type}
          contentId={notificationData.contentId}
          title={notificationData.title}
          body={notificationData.body}
          imageUrl={notificationData.imageUrl}
        />
      )}
    </>
  );
}
