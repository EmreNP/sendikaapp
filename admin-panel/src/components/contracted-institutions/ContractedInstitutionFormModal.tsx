import { useEffect, useState, useRef } from 'react';
import { X, Upload, XCircle, Plus, Trash2 } from 'lucide-react';
import { contractedInstitutionService } from '@/services/api/contractedInstitutionService';
import type { 
  ContractedInstitution, 
  CreateContractedInstitutionRequest, 
  UpdateContractedInstitutionRequest,
  InstitutionCategory,
  HowToUseStep
} from '@/types/contracted-institution';
import ImageCropModal from '@/components/news/ImageCropModal';
import { logger } from '@/utils/logger';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';

interface ContractedInstitutionFormModalProps {
  institution: ContractedInstitution | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: InstitutionCategory[];
}

export default function ContractedInstitutionFormModal({ 
  institution, 
  isOpen, 
  onClose, 
  onSuccess,
  categories 
}: ContractedInstitutionFormModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    badgeText: '',
    coverImageUrl: '',
    logoUrl: '',
    isPublished: false,
  });
  const [howToUseSteps, setHowToUseSteps] = useState<HowToUseStep[]>([
    { stepNumber: 1, title: '', description: '' },
    { stepNumber: 2, title: '', description: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Cover image states
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const [isCoverCropOpen, setIsCoverCropOpen] = useState(false);
  const [croppedCoverBlob, setCroppedCoverBlob] = useState<Blob | null>(null);
  const [croppedCoverPreview, setCroppedCoverPreview] = useState<string>('');

  // Logo image states
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [isLogoCropOpen, setIsLogoCropOpen] = useState(false);
  const [croppedLogoBlob, setCroppedLogoBlob] = useState<Blob | null>(null);
  const [croppedLogoPreview, setCroppedLogoPreview] = useState<string>('');

  const { handleClose, showConfirm, handleConfirmClose, handleCancelClose } = useUnsavedChangesWarning(hasChanges, onClose);

  const isEditMode = !!institution;

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  useEffect(() => {
    if (isOpen) {
      if (institution) {
        setFormData({
          title: institution.title || '',
          description: institution.description || '',
          categoryId: institution.categoryId || '',
          badgeText: institution.badgeText || '',
          coverImageUrl: institution.coverImageUrl || '',
          logoUrl: institution.logoUrl || '',
          isPublished: institution.isPublished || false,
        });
        setHowToUseSteps(
          institution.howToUseSteps?.length > 0 
            ? institution.howToUseSteps 
            : [{ stepNumber: 1, title: '', description: '' }]
        );
      } else {
        setFormData({
          title: '',
          description: '',
          categoryId: categories.length > 0 ? categories[0].id : '',
          badgeText: '',
          coverImageUrl: '',
          logoUrl: '',
          isPublished: true,
        });
        setHowToUseSteps([
          { stepNumber: 1, title: 'Üyelik Kartınızı Gösterin', description: 'Sendika üyelik kartınızı veya mobil uygulamadaki üyelik ekranınızı gösterin' },
          { stepNumber: 2, title: 'İndriminizi Alın', description: 'Ödeme sırasında indiriminiz uygulanacaktır' },
        ]);
      }
      setError(null);
      setHasChanges(false);
      setSelectedCoverFile(null);
      setCroppedCoverBlob(null);
      setCroppedCoverPreview('');
      setSelectedLogoFile(null);
      setCroppedLogoBlob(null);
      setCroppedLogoPreview('');
    }
  }, [isOpen, institution]);

  useEffect(() => {
    return () => {
      if (croppedCoverPreview) URL.revokeObjectURL(croppedCoverPreview);
      if (croppedLogoPreview) URL.revokeObjectURL(croppedLogoPreview);
    };
  }, [croppedCoverPreview, croppedLogoPreview]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Geçersiz dosya formatı. Sadece JPG, PNG ve WEBP formatları desteklenir.');
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Dosya boyutu çok büyük. Maksimum 5MB olabilir.');
      return;
    }
    if (type === 'cover') {
      setSelectedCoverFile(file);
      setIsCoverCropOpen(true);
    } else {
      setSelectedLogoFile(file);
      setIsLogoCropOpen(true);
    }
    setError(null);
    if (type === 'cover' && coverInputRef.current) coverInputRef.current.value = '';
    if (type === 'logo' && logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleCoverCropComplete = (croppedBlob: Blob) => {
    setCroppedCoverBlob(croppedBlob);
    setCroppedCoverPreview(URL.createObjectURL(croppedBlob));
    setSelectedCoverFile(null);
    setIsCoverCropOpen(false);
    setHasChanges(true);
  };

  const handleLogoCropComplete = (croppedBlob: Blob) => {
    setCroppedLogoBlob(croppedBlob);
    setCroppedLogoPreview(URL.createObjectURL(croppedBlob));
    setSelectedLogoFile(null);
    setIsLogoCropOpen(false);
    setHasChanges(true);
  };

  const addStep = () => {
    setHowToUseSteps(prev => [
      ...prev,
      { stepNumber: prev.length + 1, title: '', description: '' },
    ]);
    setHasChanges(true);
  };

  const removeStep = (index: number) => {
    setHowToUseSteps(prev => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((step, i) => ({ ...step, stepNumber: i + 1 }));
    });
    setHasChanges(true);
  };

  const updateStep = (index: number, field: 'title' | 'description', value: string) => {
    setHowToUseSteps(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setHasChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.title.trim()) { setError('Kurum adı zorunludur'); return; }
    if (!formData.description.trim()) { setError('Anlaşma detayları zorunludur'); return; }
    if (!formData.categoryId) { setError('Kategori seçimi zorunludur'); return; }
    if (!formData.badgeText.trim()) { setError('Badge metni zorunludur (ör: %20 İndirim)'); return; }
    if (!formData.coverImageUrl && !croppedCoverBlob) { setError('Kapak fotoğrafı zorunludur'); return; }
    
    const validSteps = howToUseSteps.filter(s => s.title.trim() && s.description.trim());
    if (validSteps.length === 0) { setError('En az bir kullanım adımı gereklidir'); return; }

    try {
      setLoading(true);

      // Upload cover image if new
      let coverImageUrl = formData.coverImageUrl;
      if (croppedCoverBlob) {
        const croppedFile = new File([croppedCoverBlob], 'cover-image.jpg', { type: 'image/jpeg' });
        const uploadResult = await contractedInstitutionService.uploadImage(croppedFile);
        coverImageUrl = uploadResult.imageUrl;
      }

      // Upload logo if new
      let logoUrl = formData.logoUrl;
      if (croppedLogoBlob) {
        const croppedFile = new File([croppedLogoBlob], 'logo-image.jpg', { type: 'image/jpeg' });
        const uploadResult = await contractedInstitutionService.uploadImage(croppedFile);
        logoUrl = uploadResult.imageUrl;
      }

      const body: CreateContractedInstitutionRequest | UpdateContractedInstitutionRequest = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        categoryId: formData.categoryId,
        badgeText: formData.badgeText.trim(),
        coverImageUrl: coverImageUrl.trim(),
        logoUrl: logoUrl?.trim() || undefined,
        howToUseSteps: validSteps.map((s, i) => ({
          stepNumber: i + 1,
          title: s.title.trim(),
          description: s.description.trim(),
        })),
        isPublished: formData.isPublished,
      };

      if (isEditMode) {
        await contractedInstitutionService.updateInstitution(institution!.id, body);
      } else {
        await contractedInstitutionService.createInstitution(body as CreateContractedInstitutionRequest);
      }

      if (croppedCoverPreview) URL.revokeObjectURL(croppedCoverPreview);
      if (croppedLogoPreview) URL.revokeObjectURL(croppedLogoPreview);
      onSuccess();
      onClose();
    } catch (err: any) {
      logger.error('Error saving contracted institution:', err);
      setError(err.message || 'Anlaşmalı kurum kaydedilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentCoverPreview = croppedCoverPreview || formData.coverImageUrl;
  const currentLogoPreview = croppedLogoPreview || formData.logoUrl;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
          
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
              <h2 className="text-lg font-semibold text-gray-900">
                {isEditMode ? 'Anlaşmalı Kurumu Düzenle' : 'Yeni Anlaşmalı Kurum'}
              </h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Kurum Adı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kurum Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateFormData({ title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ör: Özel Şifa Hastanesi"
                  maxLength={200}
                />
              </div>

              {/* Kategori & Badge */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => updateFormData({ categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Kategori Seçin</option>
                    {categories.filter(c => c.isActive).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Badge Metni <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.badgeText}
                    onChange={(e) => updateFormData({ badgeText: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ör: %20 İndirim, %15 Burs"
                    maxLength={50}
                  />
                </div>
              </div>

              {/* Anlaşma Detayları */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Anlaşma Detayları <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Anlaşma detaylarını yazın..."
                  maxLength={5000}
                />
                <p className="mt-1 text-xs text-gray-500">{formData.description.length}/5000 karakter</p>
              </div>

              {/* Kapak Fotoğrafı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kapak Fotoğrafı <span className="text-red-500">*</span>
                </label>
                {currentCoverPreview ? (
                  <div className="relative">
                    <img
                      src={currentCoverPreview}
                      alt="Kapak"
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (croppedCoverPreview) URL.revokeObjectURL(croppedCoverPreview);
                        setCroppedCoverBlob(null);
                        setCroppedCoverPreview('');
                        updateFormData({ coverImageUrl: '' });
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => coverInputRef.current?.click()}
                    className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Kapak fotoğrafı yükleyin</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG veya WEBP - Max 5MB</p>
                  </div>
                )}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleImageSelect(e, 'cover')}
                />
              </div>

              {/* Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kurum Logosu <span className="text-gray-400">(opsiyonel)</span>
                </label>
                <div className="flex items-center gap-4">
                  {currentLogoPreview ? (
                    <div className="relative">
                      <img
                        src={currentLogoPreview}
                        alt="Logo"
                        className="w-20 h-20 object-contain rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (croppedLogoPreview) URL.revokeObjectURL(croppedLogoPreview);
                          setCroppedLogoBlob(null);
                          setCroppedLogoPreview('');
                          updateFormData({ logoUrl: '' });
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => logoInputRef.current?.click()}
                      className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                      <Upload className="w-5 h-5 text-gray-400" />
                      <p className="text-[10px] text-gray-400 mt-1">Logo</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">Logo görünümü opsiyoneldir. Kurum logosunu yükleyebilirsiniz.</p>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleImageSelect(e, 'logo')}
                />
              </div>

              {/* Nasıl Yararlanırım Adımları */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Nasıl Yararlanırım? <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={addStep}
                    disabled={howToUseSteps.length >= 10}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Adım Ekle
                  </button>
                </div>
                <div className="space-y-3">
                  {howToUseSteps.map((step, index) => (
                    <div key={index} className="flex gap-3 items-start bg-gray-50 rounded-lg p-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => updateStep(index, 'title', e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Adım başlığı"
                          maxLength={100}
                        />
                        <input
                          type="text"
                          value={step.description}
                          onChange={(e) => updateStep(index, 'description', e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Adım açıklaması"
                          maxLength={500}
                        />
                      </div>
                      {howToUseSteps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeStep(index)}
                          className="flex-shrink-0 text-red-400 hover:text-red-600 mt-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Yayın Durumu */}
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => updateFormData({ isPublished: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <span className="text-sm text-gray-700">
                  {formData.isPublished ? 'Yayında' : 'Taslak'}
                </span>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Kaydediliyor...' : isEditMode ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Unsaved changes confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Kaydedilmemiş Değişiklikler</h3>
            <p className="text-sm text-gray-600 mb-4">
              Kaydedilmemiş değişiklikleriniz var. Çıkmak istediğinize emin misiniz?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={handleCancelClose} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Geri Dön
              </button>
              <button onClick={handleConfirmClose} className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700">
                Çık
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cover Image Crop Modal */}
      {selectedCoverFile && (
        <ImageCropModal
          isOpen={isCoverCropOpen}
          onClose={() => { setIsCoverCropOpen(false); setSelectedCoverFile(null); }}
          imageFile={selectedCoverFile}
          onCropComplete={handleCoverCropComplete}
          aspectRatio={16 / 9}
        />
      )}

      {/* Logo Image Crop Modal */}
      {selectedLogoFile && (
        <ImageCropModal
          isOpen={isLogoCropOpen}
          onClose={() => { setIsLogoCropOpen(false); setSelectedLogoFile(null); }}
          imageFile={selectedLogoFile}
          onCropComplete={handleLogoCropComplete}
          aspectRatio={1}
        />
      )}
    </>
  );
}
