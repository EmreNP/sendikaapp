import { useEffect, useState, useRef } from 'react';
import { X, Upload, FileText, ExternalLink } from 'lucide-react';
import { contentService } from '@/services/api/contentService';
import { fileUploadService } from '@/services/api/fileUploadService';
import type { DocumentContent, CreateDocumentContentRequest, UpdateDocumentContentRequest } from '@/types/training';

interface DocumentFormModalProps {
  document: DocumentContent | null;
  lessonId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DocumentFormModal({ document, lessonId, isOpen, onClose, onSuccess }: DocumentFormModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    documentUrl: '',
    order: '' as string | number,
    isActive: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!document;

  useEffect(() => {
    if (isOpen) {
      if (document) {
        setFormData({
          title: document.title || '',
          description: document.description || '',
          documentUrl: document.documentUrl || '',
          order: document.order || '',
          isActive: document.isActive ?? true,
        });
        setSelectedFile(null);
      } else {
        setFormData({
          title: '',
          description: '',
          documentUrl: '',
          order: '',
          isActive: true,
        });
        setSelectedFile(null);
      }
      setUploadProgress(0);
      setUploading(false);
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen, document]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Sadece PDF kabul et
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Sadece PDF dosyası yüklenebilir');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Max 20MB
    if (file.size > 20 * 1024 * 1024) {
      setError('Dosya boyutu en fazla 20MB olabilir');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError('Başlık zorunludur');
      return;
    }

    try {
      setLoading(true);
      let documentUrl = formData.documentUrl;

      // Yeni döküman için dosya yükleme
      if (!isEditMode) {
        if (!selectedFile) {
          setError('Lütfen bir PDF dosyası seçin');
          setLoading(false);
          return;
        }

        // Dosyayı yükle
        try {
          setUploading(true);
          setUploadProgress(0);

          // Simüle edilmiş progress
          const progressInterval = setInterval(() => {
            setUploadProgress((prev) => {
              if (prev >= 90) {
                clearInterval(progressInterval);
                return 90;
              }
              return prev + 10;
            });
          }, 200);

          const uploadResult = await fileUploadService.uploadDocument(selectedFile);
          
          clearInterval(progressInterval);
          setUploadProgress(100);
          documentUrl = uploadResult.documentUrl;
          setUploading(false);
        } catch (uploadErr: any) {
          console.error('File upload error:', uploadErr);
          setError(uploadErr.message || 'Dosya yüklenirken bir hata oluştu');
          setLoading(false);
          setUploading(false);
          setUploadProgress(0);
          return;
        }
      }

      // Edit modunda dosya yüklenmemişse mevcut URL'i kullan
      if (isEditMode && !documentUrl.trim() && document) {
        documentUrl = document.documentUrl;
      }

      if (!documentUrl.trim()) {
        setError('Döküman URL zorunludur');
        setLoading(false);
        return;
      }
      
      if (isEditMode && document) {
        const updateData: UpdateDocumentContentRequest = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          documentUrl: documentUrl.trim(),
          documentType: 'pdf',
          order: formData.order === '' ? undefined : (typeof formData.order === 'number' ? formData.order : parseInt(formData.order.toString()) || undefined),
          isActive: formData.isActive,
        };
        await contentService.updateDocument(document.id, updateData);
      } else {
        const createData: CreateDocumentContentRequest = {
          lessonId,
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          documentUrl: documentUrl.trim(),
          documentType: 'pdf',
          order: formData.order === '' ? undefined : (typeof formData.order === 'number' ? formData.order : parseInt(formData.order.toString()) || undefined),
          isActive: formData.isActive,
        };
        await contentService.createDocument(lessonId, createData);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Save document error:', err);
      setError(err.message || 'Döküman kaydedilirken bir hata oluştu');
    } finally {
      setLoading(false);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {isEditMode ? 'Dökümanı Düzenle' : 'Yeni Döküman Ekle'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

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
                    rows={3}
                  />
                </div>

                {!isEditMode && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        PDF Dosyası <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handleFileChange}
                          className="hidden"
                          id="document-file"
                          disabled={uploading}
                        />
                        <label
                          htmlFor="document-file"
                          className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                        >
                          <Upload className="w-5 h-5 text-gray-500" />
                        <span className="text-sm text-gray-700">
                          {selectedFile ? selectedFile.name : 'PDF seçin (Max 20MB)'}
                        </span>
                      </label>
                      
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sıra
                      </label>
                      <input
                        type="number"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: e.target.value === '' ? '' : parseInt(e.target.value) || '' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-10"
                        min="1"
                        placeholder="Otomatik"
                      />
                    </div>
                  </div>
                )}
                
                {isEditMode && (
                  <>
                    <div className="grid grid-cols-2 gap-4 items-start">
                      <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mevcut Döküman URL
                        </label>
                        <a
                          href={formData.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors h-10 text-sm font-medium text-gray-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Linke Git
                        </a>
                      </div>

                      <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sıra
                        </label>
                        <input
                          type="number"
                          value={formData.order}
                          onChange={(e) => setFormData({ ...formData, order: e.target.value === '' ? '' : parseInt(e.target.value) || '' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-10"
                          min="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="isActive" className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">Aktif</span>
                      </label>
                    </div>
                  </>
                )}

                {!isEditMode && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">
                      Aktif
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
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

