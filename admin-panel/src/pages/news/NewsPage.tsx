import { useState, useEffect } from 'react';
import { Newspaper, Plus, Search, Trash2, Edit, Eye, EyeOff, ExternalLink, User } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import NewsFormModal from '@/components/news/NewsFormModal';
import NewsPreviewModal from '@/components/news/NewsPreviewModal';
import { useAuth } from '@/context/AuthContext';
import { newsService } from '@/services/api/newsService';
import { authService } from '@/services/auth/authService';
import type { News } from '@/types/news';
import type { User as UserType } from '@/types/user';

export default function NewsPage() {
  const { user } = useAuth();
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
  const [userCache, setUserCache] = useState<Record<string, UserType>>({});
  const [selectedNewsIds, setSelectedNewsIds] = useState<Set<string>>(new Set());
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

  useEffect(() => {
    fetchNews();
  }, [page, filterPublished, filterFeatured, searchTerm]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await newsService.getNews({
        page,
        limit: 100,
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
            console.error(`Error fetching user ${uid}:`, error);
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

        setUserCache(prev => ({ ...prev, ...newUserCache }));
      }
    } catch (error: any) {
      console.error('❌ Error fetching news:', error);
      setError(error.message || 'Haberler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (uid: string | undefined): string => {
    if (!uid) return '-';
    const user = userCache[uid];
    if (user) {
      return `${user.firstName} ${user.lastName}`;
    }
    return 'Yükleniyor...';
  };

  const formatDate = (date: string | Date | { seconds?: number; nanoseconds?: number } | undefined) => {
    if (!date) return '-';
    
    let d: Date;
    
    // Firestore timestamp formatı kontrolü
    if (typeof date === 'object' && 'seconds' in date) {
      d = new Date(date.seconds * 1000 + (date.nanoseconds || 0) / 1000000);
    } else if (typeof date === 'string' || date instanceof Date) {
      d = new Date(date);
    } else {
      return '-';
    }
    
    // Invalid date kontrolü
    if (isNaN(d.getTime())) {
      return '-';
    }
    
    return d.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredNews = news.filter((item) => {
    const matchesSearch =
      searchTerm === '' ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNewsIds(new Set(filteredNews.map(n => n.id)));
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
      console.error('Error deleting news:', error);
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
      console.error('Error toggling published:', error);
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
      console.error('Error bulk deleting news:', error);
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
      console.error('Error bulk publishing news:', error);
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
      console.error('Error bulk unpublishing news:', error);
      setError(error.message || 'Toplu yayından kaldırma işlemi sırasında bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Newspaper className="w-6 h-6" />
              Haberler
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Haberleri yönetin, oluşturun ve düzenleyin
            </p>
          </div>
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
        </div>

        {/* Filters */}
        <div className="flex items-center justify-end">
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
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Haber ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm w-64"
              />
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
          ) : filteredNews.length === 0 ? (
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
                          checked={filteredNews.length > 0 && selectedNewsIds.size === filteredNews.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300 text-slate-700 focus:ring-slate-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Başlık
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tip
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
                    {filteredNews.map((item) => (
                      <tr 
                        key={item.id} 
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
                        <td 
                          className="px-4 py-3 cursor-pointer"
                          onClick={() => {
                            setSelectedNews(item);
                            setIsPreviewModalOpen(true);
                          }}
                        >
                          <div className="text-sm text-gray-600">
                            {item.externalUrl ? (
                              <span className="flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" />
                                Dış Link
                              </span>
                            ) : (
                              'İçerik'
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
                            {formatDate(item.createdAt)}
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
                            {item.publishedAt ? formatDate(item.publishedAt) : '-'}
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
                            <button
                              onClick={() => {
                                setSelectedNews(item);
                                setIsPreviewModalOpen(true);
                              }}
                              className="p-2 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                              title="Önizle"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedNews(item);
                                setIsFormModalOpen(true);
                              }}
                              disabled={processing}
                              className="p-2 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Düzenle"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
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
                              disabled={processing}
                              className="p-2 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
                              title={item.isPublished ? 'Yayından Kaldır' : 'Yayınla'}
                            >
                              {item.isPublished ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                            <button
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
                              disabled={processing}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Total Count */}
              <div className="flex justify-end px-4 py-3 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Toplam haber sayısı: <span className="font-medium text-gray-900">{total}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        {selectedNewsIds.size > 0 && (
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
      </div>

      {/* Form Modal */}
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

      {/* Preview Modal */}
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
    </AdminLayout>
  );
}
