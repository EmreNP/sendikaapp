import { useEffect, useState, useRef } from 'react';
import { X, XCircle, Scissors } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { announcementService } from '@/services/api/announcementService';
import type { Announcement, CreateAnnouncementRequest, UpdateAnnouncementRequest } from '@/types/announcement';
import ImageCropModal from '../news/ImageCropModal';
import { useAuth } from '@/context/AuthContext';


interface AnnouncementFormModalProps {
  announcement: Announcement | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AnnouncementFormModal({ announcement, isOpen, onClose, onSuccess }: AnnouncementFormModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    externalUrl: '',
    imageUrl: '',
    isPublished: false,
    isFeatured: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Image crop states
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null);
  const [croppedImagePreview, setCroppedImagePreview] = useState<string>('');

  const isEditMode = !!announcement;

  useEffect(() => {
    if (isOpen) {
      if (announcement) {
        // Edit mode - mevcut verileri doldur
        setFormData({
          title: announcement.title || '',
          content: announcement.content || '',
          externalUrl: announcement.externalUrl || '',
          imageUrl: announcement.imageUrl || '',
          isPublished: announcement.isPublished || false,
          isFeatured: announcement.isFeatured || false,
        });
      } else {
        // Create mode - formu temizle
        setFormData({
          title: '',
          content: '',
          externalUrl: '',
          imageUrl: '',
          isPublished: true, // Varsayılan olarak işaretli
          isFeatured: false,
        });
      }
      setError(null);
      // Reset image states
      setSelectedImageFile(null);
      setCroppedImageBlob(null);
      setCroppedImagePreview('');
      setIsCropModalOpen(false);
    }
  }, [isOpen, announcement, user]);

  // Blob URL'lerini component unmount olduğunda temizle — memory leak önlemi
  useEffect(() => {
    return () => {
      if (croppedImagePreview) {
        URL.revokeObjectURL(croppedImagePreview);
      }
    };
  }, [croppedImagePreview]);



  // Görsel seçildiğinde crop modal'ı aç
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Dosya validasyonu
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Geçersiz dosya formatı. Sadece JPG, PNG ve WEBP formatları desteklenir.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Dosya boyutu çok büyük. Maksimum 5MB olabilir.');
      return;
    }

    setSelectedImageFile(file);
    setIsCropModalOpen(true);
    setError(null);
    
    // File input'u temizle
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Kırpma tamamlandığında
  const handleCropComplete = (croppedBlob: Blob) => {
    setCroppedImageBlob(croppedBlob);
    
    // Preview için URL oluştur
    const previewUrl = URL.createObjectURL(croppedBlob);
    setCroppedImagePreview(previewUrl);
    
    // Eski preview URL'lerini temizle
    if (formData.imageUrl && formData.imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(formData.imageUrl);
    }
    
    setSelectedImageFile(null);
    setIsCropModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError('Başlık zorunludur');
      return;
    }

    // İçerik ve dış link aynı anda kullanılamaz kontrolü
    // ReactQuill HTML döndürür, sadece tag'leri temizleyerek kontrol et
    const contentText = formData.content.replace(/<[^>]*>/g, '').trim();
    const hasContent = contentText !== '';
    const hasExternalUrl = formData.externalUrl.trim() !== '';
    
    if (!hasContent && !hasExternalUrl) {
      setError('İçerik veya dış link alanlarından en az biri zorunludur');
      return;
    }
    
    if (hasContent && hasExternalUrl) {
      setError('İçerik ve dış link aynı anda kullanılamaz. Lütfen sadece birini seçin.');
      return;
    }
    
    // İçerik minimum uzunluk kontrolü (sadece içerik kullanıldığında)
    // ExternalUrl kullanıldığında içerik kontrolü yapılmamalı
    if (hasContent && !hasExternalUrl && contentText.length < 10) {
      setError('İçerik en az 10 karakter olmalıdır');
      return;
    }

    try {
      setLoading(true);

      let imageUrl = formData.imageUrl;

      // Eğer kırpılmış görsel varsa, önce onu yükle
      if (croppedImageBlob) {
        // Blob'u File'a çevir
        const croppedFile = new File([croppedImageBlob], 'cropped-image.jpg', {
          type: 'image/jpeg',
        });
        
        const uploadResult = await announcementService.uploadImage(croppedFile);
        imageUrl = uploadResult.imageUrl;
      }

      const body: CreateAnnouncementRequest | UpdateAnnouncementRequest = {
        title: formData.title.trim(),
        content: formData.content || undefined,
        externalUrl: formData.externalUrl.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        isPublished: formData.isPublished,
        isFeatured: formData.isFeatured,
      };

      if (isEditMode) {
        await announcementService.updateAnnouncement(announcement!.id, body);
      } else {
        await announcementService.createAnnouncement(body as CreateAnnouncementRequest);
      }

      // Preview URL'lerini temizle
      if (croppedImagePreview) {
        URL.revokeObjectURL(croppedImagePreview);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving announcement:', err);
      setError(err.message || 'Duyuru kaydedilirken bir hata oluştu');
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
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200 bg-slate-700">
            <h2 className="text-sm font-medium text-white">
              {isEditMode ? 'Duyuru Düzenle' : 'Yeni Duyuru Ekle'}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Başlık */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Başlık <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  required
                  placeholder="Duyuru başlığı"
                  maxLength={200}
                />
              </div>


              {/* İçerik */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İçerik {formData.externalUrl.trim() ? '' : <span className="text-red-500">*</span>}
                </label>
                <div className={formData.externalUrl.trim() ? 'opacity-50 pointer-events-none' : ''}>
                  <ReactQuill
                    theme="snow"
                    value={formData.content}
                    onChange={(value) => {
                      // HTML tag'lerini temizleyerek kontrol et
                      const textContent = value.replace(/<[^>]*>/g, '').trim();
                      // Eğer içerik dolduruluyorsa, dış link'i temizle
                      if (textContent !== '') {
                        setFormData({ ...formData, content: value, externalUrl: '' });
                      } else {
                        setFormData({ ...formData, content: value });
                      }
                    }}
                    placeholder="Duyuru içeriğini buraya yazın..."
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['link'],
                        ['clean'],
                      ],
                    }}
                    className="bg-white"
                    readOnly={!!formData.externalUrl.trim()}
                  />
                </div>
                {formData.externalUrl.trim() && (
                  <p className="text-xs text-amber-600 mt-1">
                    Dış link kullanıldığı için içerik alanı devre dışı bırakıldı
                  </p>
                )}
                {!formData.externalUrl.trim() && formData.content.replace(/<[^>]*>/g, '').trim() === '' && (
                  <p className="text-xs text-gray-500 mt-1">
                    İçerik veya dış link alanlarından en az biri zorunludur
                  </p>
                )}
                {!formData.externalUrl.trim() && formData.content.replace(/<[^>]*>/g, '').trim() !== '' && (
                  (() => {
                    const textLength = formData.content.replace(/<[^>]*>/g, '').trim().length;
                    if (textLength > 0 && textLength < 10) {
                      return (
                        <p className="text-xs text-amber-600 mt-1">
                          İçerik en az 10 karakter olmalıdır (şu an: {textLength} karakter)
                        </p>
                      );
                    }
                    return null;
                  })()
                )}
              </div>

              {/* Dış Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dış Link {formData.content.replace(/<[^>]*>/g, '').trim() ? '' : <span className="text-red-500">*</span>}
                </label>
                <input
                  type="url"
                  value={formData.externalUrl}
                  onChange={(e) => {
                    const url = e.target.value;
                    // Eğer dış link dolduruluyorsa, içeriği temizle
                    if (url.trim() !== '') {
                      setFormData({ ...formData, externalUrl: url, content: '' });
                    } else {
                      setFormData({ ...formData, externalUrl: url });
                    }
                  }}
                  disabled={!!formData.content.replace(/<[^>]*>/g, '').trim()}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent ${
                    formData.content.replace(/<[^>]*>/g, '').trim() ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''
                  }`}
                  placeholder="https://example.com"
                />
                {formData.content.replace(/<[^>]*>/g, '').trim() && (
                  <p className="text-xs text-amber-600 mt-1">
                    İçerik kullanıldığı için dış link alanı devre dışı bırakıldı
                  </p>
                )}
                {!formData.content.replace(/<[^>]*>/g, '').trim() && !formData.externalUrl.trim() && (
                  <p className="text-xs text-gray-500 mt-1">
                    İçerik veya dış link alanlarından en az biri zorunludur
                  </p>
                )}
              </div>

              {/* Görsel Yükleme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Görsel <span className="text-gray-500 text-xs">(Opsiyonel - 16:9 oranında kırpılacak)</span>
                </label>
                
                {/* Yükleme Alanı */}
                {!croppedImagePreview && !formData.imageUrl ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={loading}
                    />
                    <Scissors className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Görsel seçmek için tıklayın
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      JPG, PNG, WEBP (Max 5MB) - 16:9 oranında kırpılacak
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Görsel Seç ve Kırp
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center gap-4">
                        <img
                          src={croppedImagePreview || formData.imageUrl}
                          alt="Preview"
                          className="w-32 h-18 object-cover rounded-lg"
                          style={{ aspectRatio: '16/9' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {croppedImagePreview ? 'Kırpılmış görsel hazır' : 'Görsel yüklendi'}
                          </p>
                          {croppedImagePreview ? (
                            <p className="text-xs text-gray-500 mt-1">
                              Duyuru oluşturulduğunda yüklenecek
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500 mt-1 break-all">{formData.imageUrl}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (croppedImagePreview) {
                              URL.revokeObjectURL(croppedImagePreview);
                            }
                            setCroppedImageBlob(null);
                            setCroppedImagePreview('');
                            setFormData({ ...formData, imageUrl: '' });
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Görseli kaldır"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      className="mt-2 text-sm text-slate-700 hover:text-slate-900 disabled:opacity-50"
                    >
                      Farklı görsel seç
                    </button>
                  </div>
                )}
              </div>

              {/* Yayın Durumu */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="w-4 h-4 text-slate-600 rounded focus:ring-slate-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Hemen yayınla</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  İşaretlenmezse duyuru taslak olarak kaydedilir
                </p>
              </div>

              {/* Öne Çıkan Duyuru */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 text-slate-600 rounded focus:ring-slate-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Öne çıkan duyuru</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Öne çıkan duyurular ana sayfada özel olarak gösterilir
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={loading}
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Kaydediliyor...' : isEditMode ? 'Güncelle' : 'Oluştur'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Image Crop Modal */}
      {selectedImageFile && (
        <ImageCropModal
          imageFile={selectedImageFile}
          isOpen={isCropModalOpen}
          onClose={() => {
            setIsCropModalOpen(false);
            setSelectedImageFile(null);
          }}
          onCropComplete={handleCropComplete}
          aspectRatio={16 / 9}
        />
      )}
    </div>
  );
}

