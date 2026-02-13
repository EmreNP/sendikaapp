import { useState, useEffect } from 'react';
import { Briefcase, Plus, Search, Trash2, Edit, Eye, EyeOff, User, XCircle, CheckCircle } from 'lucide-react';
import ActionButton from '@/components/common/ActionButton';
import Pagination from '@/components/common/Pagination';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ContractedInstitutionFormModal from '@/components/contracted-institutions/ContractedInstitutionFormModal';
import ContractedInstitutionPreviewModal from '@/components/contracted-institutions/ContractedInstitutionPreviewModal';
import { contractedInstitutionService } from '@/services/api/contractedInstitutionService';
import { batchFetchUserNames } from '@/services/api/userNameService';
import type { ContractedInstitution, InstitutionCategory } from '@/types/contracted-institution';
import type { User as UserType } from '@/types/user';
import { logger } from '@/utils/logger';
import { formatDate } from '@/utils/dateFormatter';

interface InstitutionsTabProps {
  userCache: Record<string, UserType>;
  onUserCacheUpdate: (newEntries: Record<string, UserType>) => void;
  categories: InstitutionCategory[];
}

export default function InstitutionsTab({ userCache, onUserCacheUpdate, categories }: InstitutionsTabProps) {
  const [institutions, setInstitutions] = useState<ContractedInstitution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<ContractedInstitution | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [filterPublished, setFilterPublished] = useState<boolean | null>(null);
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 25;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  // Kategori id → name haritası
  const categoryMap = categories.reduce<Record<string, string>>((acc, cat) => {
    acc[cat.id] = cat.name;
    return acc;
  }, {});

  useEffect(() => {
    fetchInstitutions();
  }, [page, filterPublished, filterCategoryId, searchTerm]);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await contractedInstitutionService.getInstitutions({
        page,
        limit,
        isPublished: filterPublished ?? undefined,
        categoryId: filterCategoryId || undefined,
        search: searchTerm || undefined,
      });

      setInstitutions(data.institutions || []);
      setTotal(data.total || 0);

      // Kullanıcı bilgilerini toplu getir
      const uniqueUserIds = new Set<string>();
      data.institutions?.forEach((item) => {
        if (item.createdBy) uniqueUserIds.add(item.createdBy);
        if (item.updatedBy) uniqueUserIds.add(item.updatedBy);
      });

      const userIdsToFetch = Array.from(uniqueUserIds).filter(uid => !userCache[uid]);

      if (userIdsToFetch.length > 0) {
        const batchNames = await batchFetchUserNames(userIdsToFetch);
        const newUserCache: Record<string, UserType> = {};

        for (const [uid, name] of Object.entries(batchNames)) {
          newUserCache[uid] = { firstName: name.firstName, lastName: name.lastName } as UserType;
        }

        onUserCacheUpdate(newUserCache);
      }
    } catch (error: any) {
      logger.error('❌ Error fetching contracted institutions:', error);
      setError(error.message || 'Anlaşmalı kurumlar yüklenirken bir hata oluştu.');
      setInstitutions([]);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (uid: string | undefined): string => {
    if (!uid) return '-';
    const user = userCache[uid];
    if (user) return `${user.firstName} ${user.lastName}`;
    return 'Yükleniyor...';
  };

  const getCategoryName = (categoryId: string | undefined): string => {
    if (!categoryId) return '-';
    return categoryMap[categoryId] || categoryId;
  };

  const handleDelete = async (institution: ContractedInstitution) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Anlaşmalı Kurumu Sil',
      message: `"${institution.title}" anlaşmalı kurumunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          setProcessing(true);
          await contractedInstitutionService.deleteInstitution(institution.id);
          fetchInstitutions();
        } catch (err: any) {
          logger.error('Error deleting institution:', err);
          setError(err.message || 'Silme işlemi başarısız oldu');
        } finally {
          setProcessing(false);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleTogglePublish = async (institution: ContractedInstitution) => {
    try {
      setProcessing(true);
      await contractedInstitutionService.updateInstitution(institution.id, {
        isPublished: !institution.isPublished,
      });
      fetchInstitutions();
    } catch (err: any) {
      logger.error('Error toggling publish:', err);
      setError(err.message || 'İşlem başarısız oldu');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkAction = async (action: 'delete' | 'publish' | 'unpublish') => {
    const ids = Array.from(selectedIds);
    const actionLabels = {
      delete: 'silmek',
      publish: 'yayınlamak',
      unpublish: 'yayından kaldırmak',
    };

    setConfirmDialog({
      isOpen: true,
      title: `Toplu İşlem - ${actionLabels[action]}`,
      message: `Seçili ${ids.length} anlaşmalı kurumu ${actionLabels[action]} istediğinize emin misiniz?`,
      variant: action === 'delete' ? 'danger' : 'warning',
      onConfirm: async () => {
        try {
          setProcessing(true);
          await contractedInstitutionService.bulkAction(action, ids);
          setSelectedIds(new Set());
          fetchInstitutions();
        } catch (err: any) {
          logger.error('Error in bulk action:', err);
          setError(err.message || 'Toplu işlem başarısız oldu');
        } finally {
          setProcessing(false);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === institutions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(institutions.map(i => i.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Anlaşmalı Kurumlar</h2>
            {total > 0 && (
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {total} kurum
              </span>
            )}
          </div>
          <button
            onClick={() => { setSelectedInstitution(null); setIsFormModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Yeni Kurum Ekle
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Search - sol */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              placeholder="Kurum adı veya açıklama ara..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(''); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters - sağ */}
          <div className="flex items-center gap-3">
            {/* Category Filter */}
            {categories.length > 0 && (
              <select
                value={filterCategoryId}
                onChange={(e) => { setFilterCategoryId(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="">Tüm Kategoriler</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            )}

            {/* Published Filter */}
            <div className="inline-flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => { setFilterPublished(null); setPage(1); }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filterPublished === null ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Tümü
              </button>
              <button
                onClick={() => { setFilterPublished(true); setPage(1); }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filterPublished === true ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Yayında
              </button>
              <button
                onClick={() => { setFilterPublished(false); setPage(1); }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filterPublished === false ? 'bg-white text-yellow-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Taslak
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-blue-700 font-medium">
              {selectedIds.size} kurum seçildi
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('publish')}
                disabled={processing}
                className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 disabled:opacity-50"
              >
                Yayınla
              </button>
              <button
                onClick={() => handleBulkAction('unpublish')}
                disabled={processing}
                className="px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-lg hover:bg-yellow-200 disabled:opacity-50"
              >
                Yayından Kaldır
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                disabled={processing}
                className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 disabled:opacity-50"
              >
                Sil
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700"></div>
              <span className="ml-3 text-gray-500">Yükleniyor...</span>
            </div>
          ) : institutions.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {searchTerm || filterCategoryId || filterPublished !== null
                  ? 'Arama kriterlerine uygun kurum bulunamadı'
                  : 'Henüz anlaşmalı kurum eklenmemiş'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === institutions.length && institutions.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-slate-700 focus:ring-slate-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kurum</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Badge</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Oluşturan</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {institutions.map((institution) => (
                    <tr
                      key={institution.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => { setSelectedInstitution(institution); setIsPreviewModalOpen(true); }}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(institution.id)}
                          onChange={() => toggleSelect(institution.id)}
                          className="rounded border-gray-300 text-slate-700 focus:ring-slate-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {institution.coverImageUrl ? (
                            <img
                              src={institution.coverImageUrl}
                              alt={institution.title}
                              className="w-12 h-8 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
                              <Briefcase className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900 line-clamp-1">{institution.title}</p>
                            <p className="text-xs text-gray-500 line-clamp-1">{institution.description.substring(0, 60)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {getCategoryName(institution.categoryId)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {institution.badgeText}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          institution.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {institution.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {institution.isPublished ? 'Yayında' : 'Taslak'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <User className="w-3 h-3" />
                          <span className="text-xs">{getUserName(institution.createdBy)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">{formatDate(institution.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <ActionButton
                            variant="edit"
                            icon={Edit}
                            title="Düzenle"
                            onClick={() => { setSelectedInstitution(institution); setIsFormModalOpen(true); }}
                          />
                          <ActionButton
                            variant={institution.isPublished ? 'unpublish' : 'publish'}
                            icon={institution.isPublished ? EyeOff : CheckCircle}
                            title={institution.isPublished ? 'Yayından Kaldır' : 'Yayınla'}
                            onClick={() => handleTogglePublish(institution)}
                            disabled={processing}
                          />
                          <ActionButton
                            variant="delete"
                            icon={Trash2}
                            title="Sil"
                            onClick={() => handleDelete(institution)}
                            disabled={processing}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > limit && (
          <Pagination
            currentPage={page}
            total={total}
            limit={limit}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Form Modal */}
      <ContractedInstitutionFormModal
        institution={selectedInstitution}
        isOpen={isFormModalOpen}
        onClose={() => { setIsFormModalOpen(false); setSelectedInstitution(null); }}
        onSuccess={() => {
          setIsFormModalOpen(false);
          setSelectedInstitution(null);
          fetchInstitutions();
        }}
        categories={categories}
      />

      {/* Preview Modal */}
      <ContractedInstitutionPreviewModal
        institution={selectedInstitution}
        isOpen={isPreviewModalOpen}
        onClose={() => { setIsPreviewModalOpen(false); setSelectedInstitution(null); }}
        categories={categories}
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
    </>
  );
}
