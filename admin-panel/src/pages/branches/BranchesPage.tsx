import { useState, useEffect } from 'react';
import { Building2, Search, Trash2, XCircle, CheckCircle, Edit, Plus } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ActionButton from '@/components/common/ActionButton';
import Pagination from '@/components/common/Pagination';
import BranchFormModal from '@/components/branches/BranchFormModal';
import BranchDetailModal from '@/components/branches/BranchDetailModal';
import { useAuth } from '@/context/AuthContext';
import { logger } from '@/utils/logger';

interface Branch {
  id: string;
  name: string;
  desc?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  phone?: string;
  email?: string;
  workingHours?: {
    weekday?: string;
    saturday?: string;
    sunday?: string;
  };
  isActive?: boolean;
  eventCount?: number;
  educationCount?: number;
}

export default function BranchesPage() {
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBranches, setTotalBranches] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
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

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to first page on search change
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchBranches();
  }, [page, debouncedSearch]);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      setError(null);

      const { apiRequest } = await import('@/utils/api');
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
      });
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      logger.log('📡 Fetching branches from:', `/api/branches?${params.toString()}`);

      const data = await apiRequest<{ 
        branches: Branch[];
        total: number;
        page: number;
        limit: number;
        hasMore: boolean;
      }>(`/api/branches?${params.toString()}`);
      
      logger.log('✅ Branches data received:', data);
      setBranches(data.branches || []);
      setTotalBranches(data.total || 0);
      setTotalPages(Math.ceil((data.total || 0) / 25));
    } catch (error: any) {
      logger.error('❌ Error fetching branches:', error);
      setError(error.message || 'Şubeler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    try {
      setProcessing(true);
      const { apiRequest } = await import('@/utils/api');
      await apiRequest(`/api/branches/${branchId}`, { method: 'DELETE' });
      
      // State'den direkt kaldır
      setBranches(prev => prev.filter(b => b.id !== branchId));
    } catch (error: any) {
      logger.error('Error deleting branch:', error);
      setError(error.message || 'Şube silinirken bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleActive = async (branchId: string, currentActive: boolean) => {
    try {
      setProcessing(true);
      const { apiRequest } = await import('@/utils/api');

      await apiRequest(`/api/branches/${branchId}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !currentActive }),
      });
      
      // State'deki ilgili şubenin isActive değerini güncelle
      setBranches(prev => prev.map(b => b.id === branchId ? { ...b, isActive: !currentActive } : b));
    } catch (error: any) {
      logger.error('Error toggling branch active status:', error);
      setError(error.message || 'Şube durumu değiştirilirken bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const handleFormSuccess = (updatedBranch?: Branch) => {
    if (updatedBranch) {
      if (selectedBranch) {
        // Düzenleme modu - state'i güncelle
        setBranches(prev => prev.map(b => b.id === selectedBranch.id ? updatedBranch : b));
      } else {
        // Yeni ekleme - state'e ekle
        setBranches(prev => [...prev, updatedBranch]);
      }
    } else {
      // Fallback - eğer branch dönmezse listeyi yenile
      fetchBranches();
    }
  };



  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Filters and Actions */}
        <div className="flex items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Şube ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>
          
          <div className="flex items-center gap-3">
            {(user?.role === 'admin' || user?.role === 'superadmin') && (
              <button
                onClick={() => {
                  setSelectedBranch(null);
                  setIsFormModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Yeni Şube Ekle
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Branches Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Yükleniyor...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <Building2 className="w-12 h-12 text-red-400 mx-auto mb-2" />
              <p className="text-red-600">{error}</p>
            </div>
          ) : branches.length === 0 ? (
            <div className="p-8 text-center">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Şube bulunamadı</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Şube Adı
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Konum
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Telefon
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Etkinlik
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Eğitim
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {branches.map((branch) => (
                      <tr 
                        key={branch.id} 
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedBranchId(branch.id);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-4 h-4 text-gray-600" />
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {branch.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-600 max-w-xs truncate" title={branch.address || ''}>
                            {branch.address || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-600">
                            {branch.phone || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-600">
                            {branch.email || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 font-medium">
                            {branch.eventCount ?? 0}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 font-medium">
                            {branch.educationCount ?? 0}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                            {branch.isActive ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            {(user?.role === 'admin' || user?.role === 'superadmin') && (
                              <>
                                <ActionButton
                                  icon={Edit}
                                  variant="edit"
                                  onClick={() => {
                                    setSelectedBranch(branch);
                                    setIsFormModalOpen(true);
                                  }}
                                  title="Düzenle"
                                  disabled={processing}
                                />
                                {branch.isActive ? (
                                  <ActionButton
                                    icon={XCircle}
                                    variant="deactivate"
                                    onClick={() => {
                                      setConfirmDialog({
                                        isOpen: true,
                                        title: 'Şubeyi Pasif Et',
                                        message: `${branch.name} şubesini pasif etmek istediğinizden emin misiniz?`,
                                        variant: 'warning',
                                        onConfirm: () => {
                                          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                          handleToggleActive(branch.id, branch.isActive ?? false);
                                        },
                                      });
                                    }}
                                    title="Pasif Et"
                                    disabled={processing}
                                  />
                                ) : (
                                  <ActionButton
                                    icon={CheckCircle}
                                    variant="activate"
                                    onClick={() => {
                                      setConfirmDialog({
                                        isOpen: true,
                                        title: 'Şubeyi Aktif Et',
                                        message: `${branch.name} şubesini aktif etmek istediğinizden emin misiniz?`,
                                        variant: 'info',
                                        onConfirm: () => {
                                          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                          handleToggleActive(branch.id, branch.isActive ?? false);
                                        },
                                      });
                                    }}
                                    title="Aktif Et"
                                    disabled={processing}
                                  />
                                )}
                                <ActionButton
                                  icon={Trash2}
                                  variant="delete"
                                  onClick={() => {
                                    setConfirmDialog({
                                      isOpen: true,
                                      title: 'Şubeyi Sil',
                                      message: `${branch.name} şubesini silmek istediğinizden emin misiniz? Bu şubeye bağlı kullanıcılar varsa işlem başarısız olacaktır.`,
                                      variant: 'danger',
                                      onConfirm: () => {
                                        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                        handleDeleteBranch(branch.id);
                                      },
                                    });
                                  }}
                                  title="Sil"
                                  disabled={processing}
                                />
                              </>
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
                total={totalBranches}
                limit={25}
                onPageChange={setPage}
                showPageNumbers={false}
              />
            </>
          )}
        </div>
      </div>

      {/* Branch Form Modal */}
      <BranchFormModal
        branch={selectedBranch}
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedBranch(null);
        }}
        onSuccess={handleFormSuccess}
      />

      {/* Branch Detail Modal */}
      <BranchDetailModal
        branchId={selectedBranchId}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedBranchId(null);
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

