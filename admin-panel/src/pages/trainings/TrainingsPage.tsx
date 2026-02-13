import { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Trash2, Edit, Eye, EyeOff, X, XCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import ActionButton from '@/components/common/ActionButton';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Pagination from '@/components/common/Pagination';
import TrainingFormModal from '@/components/trainings/TrainingFormModal';
import TrainingDetailModal from '@/components/trainings/TrainingDetailModal';
import { trainingService } from '@/services/api/trainingService';
import type { Training } from '@/types/training';
import { logger } from '@/utils/logger';

export default function TrainingsPage() {
  const navigate = useNavigate();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 25;
  const [selectedTrainingIds, setSelectedTrainingIds] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const loadTrainings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await trainingService.getTrainings({
        page,
        limit,
        isActive: filterActive ?? undefined,
        search: searchTerm || undefined,
      });
      setTrainings(response.trainings);
      setTotal(response.total);
    } catch (err: any) {
      logger.error('Load trainings error:', err);
      setError(err.message || 'Eğitimler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainings();
  }, [page, filterActive, searchTerm]);

  const handleDelete = async (id: string) => {
    try {
      setProcessing(true);
      logger.log('🗑️ Deleting training:', id);
      await trainingService.deleteTraining(id);
      logger.log('✅ Training deleted successfully');
      await loadTrainings();
    } catch (err: any) {
      logger.error('❌ Delete training error:', err);
      logger.error('Error details:', {
        message: err.message,
        response: err.response,
        status: err.status,
      });
      alert(err.message || 'Eğitim silinirken bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      setProcessing(true);
      await trainingService.updateTraining(id, {
        isActive: !currentStatus,
      });
      await loadTrainings();
    } catch (err: any) {
      logger.error('Toggle active error:', err);
      alert(err.message || 'Eğitim durumu güncellenirken bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkAction = async (action: 'delete' | 'activate' | 'deactivate') => {
    if (selectedTrainingIds.size === 0) {
      alert('Lütfen en az bir eğitim seçin');
      return;
    }

    try {
      setProcessing(true);
      const result = await trainingService.bulkAction(action, Array.from(selectedTrainingIds));
      
      if (result.success) {
        alert(`${result.successCount} eğitim için işlem başarıyla tamamlandı`);
        setSelectedTrainingIds(new Set());
        await loadTrainings();
      } else {
        alert(`İşlem kısmen tamamlandı. Başarılı: ${result.successCount}, Başarısız: ${result.failureCount}`);
        setSelectedTrainingIds(new Set());
        await loadTrainings();
      }
    } catch (err: any) {
      logger.error('Bulk action error:', err);
      alert(err.message || 'Toplu işlem sırasında bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedTrainingIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedTrainingIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedTrainingIds.size === trainings.length) {
      setSelectedTrainingIds(new Set());
    } else {
      setSelectedTrainingIds(new Set(trainings.map(t => t.id)));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-gray-700" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Eğitimler</h1>
              <p className="text-sm text-gray-500">Eğitimleri yönetin ve düzenleyin</p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedTraining(null);
              setIsFormModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Yeni Eğitim
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Eğitim ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setFilterActive(null)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterActive === null
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setFilterActive(true)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterActive === true
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Aktif
            </button>
            <button
              onClick={() => setFilterActive(false)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterActive === false
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pasif
            </button>
          </div>
        </div>

        {/* Error */}
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

        {/* Bulk Actions */}
        {selectedTrainingIds.size > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
            <span className="text-gray-700 font-medium">
              {selectedTrainingIds.size} eğitim seçildi
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('activate')}
                disabled={processing}
                className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                Aktifleştir
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                disabled={processing}
                className="px-3 py-1.5 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                Pasifleştir
              </button>
              <button
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Eğitimleri Sil',
                    message: `${selectedTrainingIds.size} eğitimi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
                    onConfirm: () => {
                      handleBulkAction('delete');
                      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                    },
                  });
                }}
                disabled={processing}
                className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                Sil
              </button>
              <button
                onClick={() => setSelectedTrainingIds(new Set())}
                className="px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Trainings List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Yükleniyor...</p>
            </div>
          ) : trainings.length === 0 ? (
            <div className="p-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Eğitim bulunamadı</p>
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
                          checked={trainings.length > 0 && selectedTrainingIds.size === trainings.length}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300 text-gray-700 focus:ring-gray-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Başlık
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Açıklama
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {trainings.map((training) => (
                      <tr 
                        key={training.id} 
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedTraining(training);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedTrainingIds.has(training.id)}
                            onChange={() => toggleSelection(training.id)}
                            className="rounded border-gray-300 text-gray-700 focus:ring-gray-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-900">
                            {training.title}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-500 line-clamp-2">
                            {training.description 
                              ? training.description.replace(/<[^>]*>/g, '').substring(0, 100)
                              : '-'}
                            {training.description && training.description.replace(/<[^>]*>/g, '').length > 100 ? '...' : ''}
                          </div>
                        </td>
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <ActionButton
                              icon={ExternalLink}
                              variant="view"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/trainings/${training.id}`);
                              }}
                              title="Derslere Git"
                            />
                            <ActionButton
                              icon={training.isActive ? XCircle : CheckCircle}
                              variant={training.isActive ? 'deactivate' : 'activate'}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleActive(training.id, training.isActive);
                              }}
                              title={training.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                              disabled={processing}
                            />
                            <ActionButton
                              icon={Edit}
                              variant="edit"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTraining(training);
                                setIsFormModalOpen(true);
                              }}
                              title="Düzenle"
                            />
                            <ActionButton
                              icon={Trash2}
                              variant="delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDialog({
                                  isOpen: true,
                                  title: 'Eğitimi Sil',
                                  message: `"${training.title}" eğitimini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
                                  onConfirm: () => {
                                    handleDelete(training.id);
                                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                  },
                                });
                              }}
                              title="Sil"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={page}
          total={total}
          limit={limit}
          onPageChange={setPage}
          showPageNumbers={false}
        />

        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        />

        {/* Training Form Modal */}
        <TrainingFormModal
          training={selectedTraining}
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setSelectedTraining(null);
          }}
          onSuccess={() => {
            loadTrainings();
            setIsFormModalOpen(false);
            setSelectedTraining(null);
          }}
        />

        {/* Training Detail Modal */}
        <TrainingDetailModal
          training={selectedTraining}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedTraining(null);
          }}
          onEdit={() => {
            setIsDetailModalOpen(false);
            setIsFormModalOpen(true);
          }}
          onDelete={() => {
            setIsDetailModalOpen(false);
            if (selectedTraining) {
              setConfirmDialog({
                isOpen: true,
                title: 'Eğitimi Sil',
                message: `"${selectedTraining.title}" eğitimini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
                onConfirm: () => {
                  handleDelete(selectedTraining.id);
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  setSelectedTraining(null);
                },
              });
            }
          }}
          onToggleActive={() => {
            if (selectedTraining) {
              handleToggleActive(selectedTraining.id, selectedTraining.isActive);
            }
          }}
          onRefresh={loadTrainings}
        />
      </div>
    </AdminLayout>
  );
}

