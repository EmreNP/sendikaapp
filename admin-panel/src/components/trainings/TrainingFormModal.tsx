import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { trainingService } from '@/services/api/trainingService';
import type { Training, CreateTrainingRequest, UpdateTrainingRequest } from '@/types/training';

interface TrainingFormModalProps {
  training: Training | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TrainingFormModal({ training, isOpen, onClose, onSuccess }: TrainingFormModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isActive: true,
    order: '' as string | number,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!training;

  useEffect(() => {
    if (isOpen) {
      if (training) {
        // HTML içeriğini düz metne çevir
        let descriptionText = '';
        if (training.description) {
          // HTML tag'lerini kaldır (basit regex)
          descriptionText = training.description
            .replace(/<[^>]*>/g, '') // HTML tag'lerini kaldır
            .replace(/&nbsp;/g, ' ') // &nbsp; karakterlerini boşlukla değiştir
            .replace(/&amp;/g, '&') // HTML entity'leri düzelt
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .trim();
        }
        setFormData({
          title: training.title || '',
          description: descriptionText,
          isActive: training.isActive ?? true,
          order: training.order || '',
        });
      } else {
        setFormData({
          title: '',
          description: '',
          isActive: true,
          order: '',
        });
      }
      setError(null);
    }
  }, [isOpen, training]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError('Başlık zorunludur');
      return;
    }

    try {
      setLoading(true);
      
      if (isEditMode && training) {
        const updateData: UpdateTrainingRequest = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          isActive: formData.isActive,
          order: formData.order === '' ? undefined : (typeof formData.order === 'number' ? formData.order : parseInt(formData.order.toString()) || undefined),
        };
        await trainingService.updateTraining(training.id, updateData);
      } else {
        const createData: CreateTrainingRequest = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          isActive: formData.isActive,
          order: formData.order === '' ? undefined : (typeof formData.order === 'number' ? formData.order : parseInt(formData.order.toString()) || undefined),
        };
        await trainingService.createTraining(createData);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Save training error:', err);
      setError(err.message || 'Eğitim kaydedilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200 bg-slate-700">
            <h3 className="text-sm font-medium text-white">
              {isEditMode ? 'Eğitimi Düzenle' : 'Yeni Eğitim Oluştur'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Başlık <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Eğitim açıklaması (opsiyonel)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sıra
                    </label>
                      <input
                        type="number"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: e.target.value === '' ? '' : parseInt(e.target.value) || '' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        placeholder="Otomatik"
                      />
                  </div>

                  <div className="flex items-center pt-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Aktif</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {loading ? 'Kaydediliyor...' : isEditMode ? 'Güncelle' : 'Oluştur'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

