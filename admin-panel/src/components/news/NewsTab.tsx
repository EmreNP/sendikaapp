import { useState, useEffect } from 'react';
import { Newspaper, Plus, Search, Trash2, Edit, Eye, User, XCircle, CheckCircle, Bell } from 'lucide-react';
import ActionButton from '@/components/common/ActionButton';
import Pagination from '@/components/common/Pagination';
import NewsFormModal from '@/components/news/NewsFormModal';
import NewsPreviewModal from '@/components/news/NewsPreviewModal';
import SendNotificationSimpleModal from '@/components/notifications/SendNotificationSimpleModal';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { newsService } from '@/services/api/newsService';
import { authService } from '@/services/auth/authService';
import { useAuth } from '@/context/AuthContext';
import type { News } from '@/types/news';
import { formatDate } from '@/utils/dateFormatter';
import type { User as UserType } from '@/types/user';
import type { NotificationType } from '@shared/constants/notifications';
import { logger } from '@/utils/logger';

/** HTML içeriğinden düz metin çıkar ve kısalt (XSS-safe: innerHTML kullanmaz) */
export function extractPlainText(html: string, maxLength: number = 200): string {
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

interface NewsTabProps {
  userCache: Record<string, UserType>;
  onUserCacheUpdate: (newEntries: Record<string, UserType>) => void;
}

export default function NewsTab({ userCache, onUserCacheUpdate }: NewsTabProps) {
  const { user } = useAuth();
  const canCreateNews = user?.role === 'admin' || user?.role === 'superadmin';

  // News states
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [filterPublished, setFilterPublished] = useState<boolean | null>(null);
  const [filterFeatured, setFilterFeatured] = useState<boolean | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(25);
  const [selectedNewsIds, setSelectedNewsIds] = useState<Set<string>>(new Set());

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
    fetchNews();
  }, [page, filterPublished, filterFeatured, searchTerm]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await newsService.getNews({
        page,
        limit: 25,
        isPublished: filterPublished ?? undefined,
        isFeatured: filterFeatured ?? undefined,
        search: searchTerm || undefined,
      });

      setNews(data.news || []);
      setTotal(data.total || 0);

      // Kullanıcı bilgilerini cache'le
      const uniqueUserIds = new Set<string>();
      data.news?.forEach((item) => {
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
      logger.error('❌ Error fetching news:', error);
      setError(error.message || 'Haberler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
      setNews([]);
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

  const handleOpenNotificationModal = (item: News, type: NotificationType) => {
    const body = item.content ? extractPlainText(item.content, 200) : item.title;

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
      setSelectedNewsIds(new Set(news.map(n => n.id)));
    } else {
      setSelectedNewsIds(new Set());
    }
  };

  const handleSelectNews = (newsId: string, checked: boolean) => {
    const newSelected = new Set(selectedNewsIds);
    if (checked) {
      newSelected.add(newsId);
    } else {
      newSelected.delete(newsId);
    }
    setSelectedNewsIds(newSelected);
  };

  const handleDeleteNews = async (newsId: string) => {
    try {
      setProcessing(true);
      await newsService.deleteNews(newsId);
      setNews(prev => prev.filter(n => n.id !== newsId));
      setSelectedNewsIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(newsId);
        return newSet;
      });
    } catch (error: any) {
      logger.error('Error deleting news:', error);
      setError(error.message || 'Haber silinirken bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const handleTogglePublished = async (newsId: string, currentPublished: boolean) => {
    try {
      setProcessing(true);
      await newsService.updateNews(newsId, {
        isPublished: !currentPublished,
      });
      await fetchNews();
    } catch (error: any) {
      logger.error('Error toggling published:', error);
      setError(error.message || 'Haber durumu güncellenirken bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setProcessing(true);
      const newsIds = Array.from(selectedNewsIds);

      const result = await newsService.bulkAction('delete', newsIds);

      if (result.failureCount > 0) {
        setError(`${result.failureCount} haber silinirken hata oluştu`);
      }

      // Başarılı olanları state'den kaldır
      if (result.successCount > 0) {
        setNews(prev => prev.filter(n => !newsIds.includes(n.id)));
      }

      setSelectedNewsIds(new Set());
    } catch (error: any) {
      logger.error('Error bulk deleting news:', error);
      setError(error.message || 'Toplu silme işlemi sırasında bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkPublish = async () => {
    try {
      setProcessing(true);
      const newsIds = Array.from(selectedNewsIds);

      const result = await newsService.bulkAction('publish', newsIds);

      if (result.failureCount > 0) {
        setError(`${result.failureCount} haber yayınlanırken hata oluştu`);
      }

      await fetchNews();
      setSelectedNewsIds(new Set());
    } catch (error: any) {
      logger.error('Error bulk publishing news:', error);
      setError(error.message || 'Toplu yayınlama işlemi sırasında bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkUnpublish = async () => {
    try {
      setProcessing(true);
      const newsIds = Array.from(selectedNewsIds);

      const result = await newsService.bulkAction('unpublish', newsIds);

      if (result.failureCount > 0) {
        setError(`${result.failureCount} haber yayından kaldırılırken hata oluştu`);
      }

      await fetchNews();
      setSelectedNewsIds(new Set());
    } catch (error: any) {
      logger.error('Error bulk unpublishing news:', error);
      setError(error.message || 'Toplu yayından kaldırma işlemi sırasında bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-end">
        {canCreateNews && (
          <button
            onClick={() => {
              setSelectedNews(null);
              setIsFormModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yeni Haber
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
            placeholder="Haber ara..."
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

      {/* News Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Yükleniyor...</p>
          </div>
        ) : news.length === 0 ? (
          <div className="p-8 text-center">
            <Newspaper className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Haber bulunamadı</p>
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
                        checked={news.length > 0 && selectedNewsIds.size === news.length}
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
                  {news.map((item, index) => (
                    <tr 
                      key={item.id || `news-${index}`} 
                      className={`hover:bg-gray-50 transition-colors ${
                        selectedNewsIds.has(item.id) ? 'bg-slate-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedNewsIds.has(item.id)}
                          onChange={(e) => handleSelectNews(item.id, e.target.checked)}
                          className="rounded border-gray-300 text-slate-700 focus:ring-slate-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td 
                        className="px-4 py-3 cursor-pointer"
                        onClick={() => {
                          setSelectedNews(item);
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
                          setSelectedNews(item);
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
                          setSelectedNews(item);
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
                          setSelectedNews(item);
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
                              setSelectedNews(item);
                              setIsPreviewModalOpen(true);
                            }}
                            title="Önizle"
                          />
                          {canCreateNews && (
                            <>
                              <ActionButton
                                icon={Edit}
                                variant="edit"
                                onClick={() => {
                                  setSelectedNews(item);
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
                                    title: item.isPublished ? 'Haber Yayından Kaldır' : 'Haber Yayınla',
                                    message: `${item.title} haberini ${
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
                            onClick={() => handleOpenNotificationModal(item, 'news')}
                            title="Bildirim Gönder"
                            disabled={processing}
                          />
                          {canCreateNews && (
                            <ActionButton
                              icon={Trash2}
                              variant="delete"
                              onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  title: 'Haber Sil',
                                  message: `${item.title} haberini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
                                  variant: 'danger',
                                  onConfirm: () => {
                                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                    handleDeleteNews(item.id);
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
      {selectedNewsIds.size > 0 && canCreateNews && (
        <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
          <span className="text-sm text-gray-600 mr-2">
            {selectedNewsIds.size} seçili
          </span>
          <button
            onClick={() => {
              setConfirmDialog({
                isOpen: true,
                title: 'Toplu Silme',
                message: `${selectedNewsIds.size} haberi kalıcı olarak silmek istediğinizden emin misiniz?`,
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
                message: `${selectedNewsIds.size} haberi yayınlamak istediğinizden emin misiniz?`,
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
                message: `${selectedNewsIds.size} haberi yayından kaldırmak istediğinizden emin misiniz?`,
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
            onClick={() => setSelectedNewsIds(new Set())}
            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
          >
            Temizle
          </button>
        </div>
      )}

      {/* News Form Modal */}
      <NewsFormModal
        news={selectedNews}
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedNews(null);
        }}
        onSuccess={() => {
          setIsFormModalOpen(false);
          setSelectedNews(null);
          fetchNews();
        }}
      />

      {/* News Preview Modal */}
      <NewsPreviewModal
        news={selectedNews}
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setSelectedNews(null);
        }}
      />

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
