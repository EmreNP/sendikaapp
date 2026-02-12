import { useState, useEffect } from 'react';
import { X, Tag } from 'lucide-react';
import Button from '@/components/common/Button';
import type { ActivityCategory, CreateActivityCategoryRequest, UpdateActivityCategoryRequest } from '@/types/activity';
import { logger } from '@/utils/logger';

interface CategoryFormModalProps {
  category?: ActivityCategory | null;
  onSubmit: (data: CreateActivityCategoryRequest | UpdateActivityCategoryRequest) => Promise<void>;
  onCancel: () => void;
  disabled?: boolean;
}

export default function CategoryFormModal({ 
  category, 
  onSubmit, 
  onCancel, 
  disabled = false 
}: CategoryFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || ''
      });
    } else {
      // Reset form for new category
      setFormData({
        name: '',
        description: ''
      });
    }
  }, [category]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Kategori adı zorunludur';
    } else if (formData.name.trim().length < 2 || formData.name.trim().length > 200) {
      newErrors.name = 'Kategori adı 2-200 karakter arasında olmalıdır';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const submitData = category 
        ? { ...formData } as UpdateActivityCategoryRequest
        : { ...formData } as CreateActivityCategoryRequest;

      await onSubmit(submitData);
    } catch (error) {
      logger.error('Form submission error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {category ? 'Kategori Düzenle' : 'Yeni Kategori'}
          </h2>
          <button
            onClick={onCancel}
            disabled={disabled}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategori Adı *
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                  placeholder="Kategori adını girin"
                  disabled={disabled}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Açıklama
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Kategori açıklamasını girin (opsiyonel)"
                disabled={disabled}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={disabled}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={disabled}
            >
              {category ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
