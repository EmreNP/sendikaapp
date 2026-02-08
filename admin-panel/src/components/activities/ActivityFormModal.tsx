import { useState, useEffect, useRef } from 'react';
import { X, Calendar, Upload, Trash2 } from 'lucide-react';
import Button from '@/components/common/Button';
import { fileUploadService } from '@/services/api/fileUploadService';
import type { Activity, ActivityCategory, CreateActivityRequest, UpdateActivityRequest } from '@/types/activity';

interface BranchOption {
  id: string;
  name: string;
}

interface ActivityFormModalProps {
  activity?: Activity | null;
  categories: ActivityCategory[];
  branches: BranchOption[];
  currentUserRole: 'admin' | 'branch_manager';
  currentUserBranchId?: string;
  onSubmit: (data: CreateActivityRequest | UpdateActivityRequest) => Promise<void>;
  onCancel: () => void;
  disabled?: boolean;
}

export default function ActivityFormModal({ 
  activity, 
  categories, 
  branches,
  currentUserRole,
  currentUserBranchId,
  onSubmit, 
  onCancel, 
  disabled = false 
}: ActivityFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    branchId: '',
    activityDate: '',
    isPublished: false,
    images: [] as string[],
    documents: [] as string[],
    
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (activity) {
      setFormData({
        name: activity.name,
        description: activity.description,
        categoryId: activity.categoryId,
        branchId: activity.branchId,
        activityDate: activity.activityDate ? new Date(activity.activityDate).toISOString().slice(0, 10) : '',
        isPublished: activity.isPublished,
        images: activity.images || [],
        documents: activity.documents || [],

      });
    } else {
      // Reset form for new activity
      setFormData({
        name: '',
        description: '',
        categoryId: '',
        branchId: '',
        activityDate: '',
        isPublished: false,
        images: [],
        documents: [],

      });
    }
  }, [activity]);

  useEffect(() => {
    // branch_manager: branchId always fixed to user's branch
    if (currentUserRole === 'branch_manager') {
      if (currentUserBranchId) {
        setFormData(prev => ({ ...prev, branchId: currentUserBranchId }));
      }
    }
  }, [currentUserRole, currentUserBranchId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Aktivite adı zorunludur';
    } else if (formData.name.trim().length < 2 || formData.name.trim().length > 200) {
      newErrors.name = 'Aktivite adı 2-200 karakter arasında olmalıdır';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Açıklama zorunludur';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Açıklama en az 10 karakter olmalıdır';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Kategori seçimi zorunludur';
    }

    if (!formData.activityDate) {
      newErrors.activityDate = 'Aktivite tarihi zorunludur';
    }

    if (!activity) {
      if ((currentUserRole === 'admin' || currentUserRole === 'superadmin') && !formData.branchId) {
        newErrors.branchId = 'Şube seçimi zorunludur';
      }
      if (currentUserRole === 'branch_manager' && !formData.branchId) {
        newErrors.branchId = 'Şube bilgisi bulunamadı';
      }
    }

    if (formData.images.length > 10) {
      newErrors.images = 'En fazla 10 resim eklenebilir';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const submitData = activity 
        ? { ...formData } as UpdateActivityRequest
        : { ...formData } as CreateActivityRequest;

      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const filesToUpload: File[] = [];

    // Validate all files first
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, images: `Geçersiz dosya formatı: ${file.name}. Sadece JPG, PNG ve WEBP formatları desteklenir.` }));
        return;
      }

      if (file.size > maxSize) {
        setErrors(prev => ({ ...prev, images: `Dosya boyutu çok büyük: ${file.name}. Maksimum 5MB olabilir.` }));
        return;
      }

      filesToUpload.push(file);
    }

    // Check if total would exceed max
    if (formData.images.length + filesToUpload.length > 10) {
      setErrors(prev => ({ ...prev, images: `En fazla 10 resim eklenebilir. Şu an ${formData.images.length} resim var, ${filesToUpload.length} resim daha eklenemez.` }));
      return;
    }

    try {
      setUploadingImage(true);
      setErrors(prev => ({ ...prev, images: '' }));
      
      // Upload all files
      const uploadPromises = filesToUpload.map(file => fileUploadService.uploadActivityImage(file));
      const results = await Promise.all(uploadPromises);
      
      const newImageUrls = results.map(result => result.documentUrl);
      setFormData(prev => ({ ...prev, images: [...prev.images, ...newImageUrls] }));
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setErrors(prev => ({ ...prev, images: err.message || 'Resimler yüklenirken hata oluştu' }));
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {activity ? 'Aktivite Düzenle' : 'Yeni Aktivite'}
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
            <h3 className="text-lg font-medium text-gray-900">Temel Bilgiler</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aktivite Adı *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Aktivite adını girin"
                disabled={disabled}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Açıklama *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Aktivite açıklamasını girin"
                disabled={disabled}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={disabled}
                >
                  <option value="">Kategori seçin</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şube {currentUserRole === 'admin' ? '*' : ''}
                </label>

                {currentUserRole === 'admin' ? (
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData(prev => ({ ...prev, branchId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={disabled}
                  >
                    <option value="">Şube seçin</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.branchId}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                    disabled
                  />
                )}

                {errors.branchId && (
                  <p className="mt-1 text-sm text-red-600">{errors.branchId}</p>
                )}
              </div>
            </div>
          </div>

          {/* Date */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Tarih</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aktivite Tarihi *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    value={formData.activityDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, activityDate: e.target.value }))}
                    className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                    disabled={disabled}
                  />
                </div>
                {errors.activityDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.activityDate}</p>
                )}
              </div>

              <div />
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Resimler</h3>
            <p className="text-sm text-gray-600">En fazla 10 resim yükleyebilirsiniz. (JPG, PNG, WEBP - Max 5MB)</p>

            <div className="space-y-3">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={disabled || uploadingImage || formData.images.length >= 10}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || uploadingImage || formData.images.length >= 10}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4" />
                  {uploadingImage ? 'Yükleniyor...' : `Resim Yükle (${formData.images.length}/10)`}
                </button>
              </div>

              {errors.images && (
                <p className="text-sm text-red-600">{errors.images}</p>
              )}

              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {formData.images.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Aktivite resmi ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EResim%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        disabled={disabled}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        title="Kaldır"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
              {activity ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
