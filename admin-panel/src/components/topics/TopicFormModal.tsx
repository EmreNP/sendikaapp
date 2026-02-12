import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { contactService } from '@/services/api/contactService';
import type { Topic } from '@/types/contact';
import { logger } from '@/utils/logger';

interface TopicFormModalProps {
  topic: Topic | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TopicFormModal({ topic, isOpen, onClose, onSuccess }: TopicFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isVisibleToBranchManager: false,
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!topic;

  useEffect(() => {
    if (isOpen) {
      if (topic) {
        setFormData({
          name: topic.name || '',
          description: topic.description || '',
          isVisibleToBranchManager: topic.isVisibleToBranchManager || false,
          isActive: topic.isActive ?? true,
        });
      } else {
        setFormData({
          name: '',
          description: '',
          isVisibleToBranchManager: false,
          isActive: true,
        });
      }
      setError(null);
    }
  }, [isOpen, topic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isEditMode && topic) {
        await contactService.updateTopic(topic.id, formData);
      } else {
        await contactService.createTopic(formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      logger.error('Error saving topic:', err);
      setError(err.message || 'Konu kaydedilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200 bg-slate-700">
          <h2 className="text-sm font-medium text-white">
            {isEditMode ? 'Konu Düzenle' : 'Yeni Konu Oluştur'}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Konu Adı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Örn: Eğitim İçeriği Hakkında"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Açıklama
            </label>
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Konu hakkında açıklama (isteğe bağlı)"
            />
          </div>

          {/* isVisibleToBranchManager */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label htmlFor="isVisibleToBranchManager" className="block text-sm font-medium text-gray-700">
                Şube Yöneticilerine Görünür
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Aktif edilirse şube yöneticileri bu konuya ait mesajları görebilir
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="isVisibleToBranchManager"
                checked={formData.isVisibleToBranchManager}
                onChange={(e) => setFormData({ ...formData, isVisibleToBranchManager: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* isActive */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label htmlFor="isActive" className="block text-sm font-medium text-gray-700">
                Aktif
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Pasif konular kullanıcılar tarafından seçilemez
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Kaydediliyor...' : isEditMode ? 'Güncelle' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

