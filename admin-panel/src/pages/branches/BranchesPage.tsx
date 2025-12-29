import { useState, useEffect } from 'react';
import { Building2, Search, Trash2, XCircle, CheckCircle, Edit } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import BranchFormModal from '@/components/branches/BranchFormModal';
import { useAuth } from '@/context/AuthContext';

interface Branch {
  id: string;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  district?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export default function BranchesPage() {
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
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
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      setError(null);

      const { apiRequest } = await import('@/utils/api');
      
      console.log('📡 Fetching branches from:', '/api/branches');

      const data = await apiRequest<{ branches: Branch[] }>('/api/branches');
      
      console.log('✅ Branches data received:', data);
      setBranches(data.branches || []);
    } catch (error: any) {
      console.error('❌ Error fetching branches:', error);
      setError(error.message || 'Şubeler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredBranches = branches.filter((branch) => {
    const matchesSearch =
      searchTerm === '' ||
      branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.city?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleDeleteBranch = async (branchId: string) => {
    try {
      setProcessing(true);
      const { apiRequest } = await import('@/utils/api');
      await apiRequest(`/api/branches/${branchId}`, { method: 'DELETE' });
      
      // State'den direkt kaldır
      setBranches(prev => prev.filter(b => b.id !== branchId));
    } catch (error: any) {
      console.error('Error deleting branch:', error);
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
      console.error('Error toggling branch active status:', error);
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

  const totalBranches = filteredBranches.length;

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex items-center justify-end">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Şube ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm w-64"
            />
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
          ) : filteredBranches.length === 0 ? (
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
                        Kod
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
                        Durum
                      </th>
                      {user?.role === 'admin' && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          İşlemler
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBranches.map((branch) => (
                      <tr 
                        key={branch.id} 
                        className="hover:bg-gray-50 transition-colors"
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
                          <div className="text-sm text-gray-600">
                            {branch.code || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-600">
                            {branch.district && `${branch.district}, `}
                            {branch.city || '-'}
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
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                            {branch.isActive ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                        {user?.role === 'admin' && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedBranch(branch);
                                  setIsFormModalOpen(true);
                                }}
                                disabled={processing}
                                className="p-2 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Düzenle"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {branch.isActive ? (
                                <button
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
                                  disabled={processing}
                                  className="p-2 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
                                  title="Pasif Et"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
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
                                  disabled={processing}
                                  className="p-2 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
                                  title="Aktif Et"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button
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
                                disabled={processing}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Total Count */}
              <div className="flex justify-end px-4 py-3 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Toplam şube sayısı: <span className="font-medium text-gray-900">{totalBranches}</span>
                </div>
              </div>
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

