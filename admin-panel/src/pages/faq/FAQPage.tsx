import { useState, useEffect } from 'react';
import { HelpCircle, Plus, Search, Trash2, Edit, User, XCircle, CheckCircle } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ActionButton from '@/components/common/ActionButton';
import Pagination from '@/components/common/Pagination';
import FAQFormModal from '@/components/faq/FAQFormModal';
import FAQPreviewModal from '@/components/faq/FAQPreviewModal';
import { faqService } from '@/services/api/faqService';
import { batchFetchUserNames } from '@/services/api/userNameService';
import type { FAQ } from '@/types/faq';
import type { User as UserType } from '@/types/user';
import { logger } from '@/utils/logger';
import { formatDate } from '@/utils/dateFormatter';

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [filterPublished, setFilterPublished] = useState<boolean | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 25;
  const [userCache, setUserCache] = useState<Record<string, UserType>>({});
  const [selectedFAQIds, setSelectedFAQIds] = useState<Set<string>>(new Set());
  
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
    fetchFAQ();
  }, [page, filterPublished, searchTerm]);

  const fetchFAQ = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await faqService.getFAQ({
        page,
        limit: 25,
        isPublished: filterPublished ?? undefined,
        search: searchTerm || undefined,
      });

      setFaqs(data.faqs || []);
      setTotal(data.total || 0);

      // Kullanıcı bilgilerini toplu olarak çek (batch)
      const uniqueUserIds = new Set<string>();
      data.faqs?.forEach((item) => {
        if (item.createdBy) uniqueUserIds.add(item.createdBy);
        if (item.updatedBy) uniqueUserIds.add(item.updatedBy);
      });

      // Cache'de olmayan kullanıcıları toplu getir
      const userIdsToFetch = Array.from(uniqueUserIds).filter(uid => !userCache[uid]);
      
      if (userIdsToFetch.length > 0) {
        const batchNames = await batchFetchUserNames(userIdsToFetch);
        const newUserCache: Record<string, UserType> = {};
        
        for (const [uid, name] of Object.entries(batchNames)) {
          newUserCache[uid] = { firstName: name.firstName, lastName: name.lastName } as UserType;
        }

        setUserCache(prev => ({ ...prev, ...newUserCache }));
      }
    } catch (error: any) {
      logger.error('❌ Error fetching FAQ:', error);
      setError(error.message || 'FAQ\'ler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
      setFaqs([]);
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFAQIds(new Set(faqs.map(f => f.id)));
    } else {
      setSelectedFAQIds(new Set());
    }
  };

  const handleSelectFAQ = (faqId: string, checked: boolean) => {
    const newSelected = new Set(selectedFAQIds);
    if (checked) {
      newSelected.add(faqId);
    } else {
      newSelected.delete(faqId);
    }
    setSelectedFAQIds(newSelected);
  };

  const handleDeleteFAQ = async (faqId: string) => {
    try {
      setProcessing(true);
      await faqService.deleteFAQ(faqId);
      setFaqs(prev => prev.filter(f => f.id !== faqId));
      setSelectedFAQIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(faqId);
        return newSet;
      });
    } catch (error: any) {
      logger.error('Error deleting FAQ:', error);
      setError(error.message || 'FAQ silinirken bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const handleTogglePublished = async (faqId: string, currentPublished: boolean) => {
    try {
      setProcessing(true);
      await faqService.updateFAQ(faqId, {
        isPublished: !currentPublished,
      });
      await fetchFAQ();
    } catch (error: any) {
      logger.error('Error toggling published:', error);
      setError(error.message || 'FAQ durumu güncellenirken bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setProcessing(true);
      const faqIds = Array.from(selectedFAQIds);

      const result = await faqService.bulkAction('delete', faqIds);

      if (result.failureCount > 0) {
        setError(`${result.failureCount} FAQ silinirken hata oluştu`);
      }

      // Başarılı olanları state'den kaldır
      if (result.successCount > 0) {
        setFaqs(prev => prev.filter(f => !faqIds.includes(f.id)));
      }

      setSelectedFAQIds(new Set());
    } catch (error: any) {
      logger.error('Error bulk deleting FAQ:', error);
      setError(error.message || 'Toplu silme işlemi sırasında bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkPublish = async () => {
    try {
      setProcessing(true);
      const faqIds = Array.from(selectedFAQIds);

      const result = await faqService.bulkAction('publish', faqIds);

      if (result.failureCount > 0) {
        setError(`${result.failureCount} FAQ yayınlanırken hata oluştu`);
      }

      await fetchFAQ();
      setSelectedFAQIds(new Set());
    } catch (error: any) {
      logger.error('Error bulk publishing FAQ:', error);
      setError(error.message || 'Toplu yayınlama işlemi sırasında bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkUnpublish = async () => {
    try {
      setProcessing(true);
      const faqIds = Array.from(selectedFAQIds);

      const result = await faqService.bulkAction('unpublish', faqIds);

      if (result.failureCount > 0) {
        setError(`${result.failureCount} FAQ yayından kaldırılırken hata oluştu`);
      }

      await fetchFAQ();
      setSelectedFAQIds(new Set());
    } catch (error: any) {
      logger.error('Error bulk unpublishing FAQ:', error);
      setError(error.message || 'Toplu yayından kaldırma işlemi sırasında bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-end">
          <button
            onClick={() => {
              setSelectedFAQ(null);
              setIsFormModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yeni FAQ
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="FAQ ara..."
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
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* FAQ Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Yükleniyor...</p>
            </div>
          ) : faqs.length === 0 ? (
            <div className="p-8 text-center">
              <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">FAQ bulunamadı</p>
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
                          checked={faqs.length > 0 && selectedFAQIds.size === faqs.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300 text-slate-700 focus:ring-slate-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Soru
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Oluşturulma
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Düzenlenme
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
                    {faqs.map((item, index) => (
                      <tr 
                        key={item.id || `faq-${index}`} 
                        className={`hover:bg-gray-50 transition-colors ${
                          selectedFAQIds.has(item.id) ? 'bg-slate-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedFAQIds.has(item.id)}
                            onChange={(e) => handleSelectFAQ(item.id, e.target.checked)}
                            className="rounded border-gray-300 text-slate-700 focus:ring-slate-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td 
                          className="px-4 py-3 cursor-pointer"
                          onClick={() => {
                            setSelectedFAQ(item);
                            setIsPreviewModalOpen(true);
                          }}
                        >
                          <div className="text-sm font-medium text-gray-900">
                            {item.question}
                          </div>
                        </td>
                        <td 
                          className="px-4 py-3 cursor-pointer"
                          onClick={() => {
                            setSelectedFAQ(item);
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
                            setSelectedFAQ(item);
                            setIsPreviewModalOpen(true);
                          }}
                        >
                          <div className="text-sm text-gray-600">
                            {formatDate(item.updatedAt, true, 'short')}
                          </div>
                        </td>
                        <td 
                          className="px-4 py-3 cursor-pointer"
                          onClick={() => {
                            setSelectedFAQ(item);
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
                              icon={Edit}
                              variant="edit"
                              onClick={() => {
                                setSelectedFAQ(item);
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
                                  title: item.isPublished ? 'FAQ Yayından Kaldır' : 'FAQ Yayınla',
                                  message: `"${item.question}" FAQ'ini ${
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
                            <ActionButton
                              icon={Trash2}
                              variant="delete"
                              onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  title: 'FAQ Sil',
                                  message: `"${item.question}" FAQ'ini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
                                  variant: 'danger',
                                  onConfirm: () => {
                                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                    handleDeleteFAQ(item.id);
                                  },
                                });
                              }}
                              title="Sil"
                              disabled={processing}
                            />
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

        {/* Action Buttons */}
        {selectedFAQIds.size > 0 && (
          <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
            <span className="text-sm text-gray-600 mr-2">
              {selectedFAQIds.size} seçili
            </span>
            <button
              onClick={() => {
                setConfirmDialog({
                  isOpen: true,
                  title: 'Toplu Silme',
                  message: `${selectedFAQIds.size} FAQ'i kalıcı olarak silmek istediğinizden emin misiniz?`,
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
                  message: `${selectedFAQIds.size} FAQ'i yayınlamak istediğinizden emin misiniz?`,
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
                  message: `${selectedFAQIds.size} FAQ'i yayından kaldırmak istediğinizden emin misiniz?`,
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
              onClick={() => setSelectedFAQIds(new Set())}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Temizle
            </button>
          </div>
        )}

      </div>

      {/* FAQ Form Modal */}
      <FAQFormModal
        faq={selectedFAQ}
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedFAQ(null);
        }}
        onSuccess={() => {
          setIsFormModalOpen(false);
          setSelectedFAQ(null);
          fetchFAQ();
        }}
      />

      {/* FAQ Preview Modal */}
      <FAQPreviewModal
        faq={selectedFAQ}
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setSelectedFAQ(null);
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

