import { useEffect, useState, useRef } from 'react';
import { X, Upload, FileText, Download } from 'lucide-react';
import { apiRequest } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { uploadUserRegistrationForm } from '@/utils/fileUpload';
import { generateUserRegistrationPDF, generateMergedRegistrationPDF } from '@/utils/pdfGenerator';
import { logger } from '@/utils/logger';

interface UserStatusModalProps {
  userId: string | null;
  currentStatus: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserStatusModal({ userId, currentStatus, isOpen, onClose, onSuccess }: UserStatusModalProps) {
  const { user: currentUser } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<string>(currentStatus);
  const [note, setNote] = useState<string>('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [previewMode, setPreviewMode] = useState<'kayit' | 'merged'>('kayit');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDownloadOptions(false);
      }
    };
    if (showDownloadOptions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDownloadOptions]);

  useEffect(() => {
    if (isOpen) {
      setSelectedStatus(currentStatus);
      setNote('');
      setPdfFile(null);
      setUploadProgress(0);
      setError(null);
      setPreviewPdfUrl(null);
      setShowDownloadOptions(false);
      setPreviewMode('kayit');
      
      // Fetch user data and branches
      if (userId) {
        fetchUserData();
        fetchBranches();
      }
    }
  }, [isOpen, currentStatus, userId]);

  const fetchUserData = async () => {
    if (!userId) return;
    try {
      const data = await apiRequest<{ user: any }>(`/api/users/${userId}`);
      setUserData(data.user);
    } catch (err) {
      logger.error('Error fetching user data:', err);
    }
  };

  const fetchBranches = async () => {
    try {
      const data = await apiRequest<{ branches: Array<{ id: string; name: string }> }>('/api/branches');
      setBranches(data.branches || []);
    } catch (err) {
      logger.error('Error fetching branches:', err);
    }
  };

  const handleGeneratePDF = async (mode: 'kayit' | 'merged' = 'kayit') => {
    if (!userData) {
      setError('Kullanıcı bilgileri yüklenemedi');
      return;
    }
    
    try {
      setError(null);
      setShowDownloadOptions(false);
      setPreviewMode(mode);
      const userBranch = branches.find(b => b.id === userData.branchId);
      // Generate EDITABLE PDF for preview
      let url: string;
      if (mode === 'merged') {
        url = await generateMergedRegistrationPDF(userData, userBranch, { download: false, isReadOnly: false });
      } else {
        url = await generateUserRegistrationPDF(userData, userBranch, { download: false, isReadOnly: false });
      }
      setPreviewPdfUrl(url);
    } catch (err: any) {
      setError(err?.message || 'PDF oluşturulurken bir hata oluştu');
    }
  };

  const handleDownloadFinalPDF = async () => {
     if (!userData) {
      setError('Kullanıcı bilgileri yüklenemedi');
      return;
    }
    try {
      const userBranch = branches.find(b => b.id === userData.branchId);
      // Download READ-ONLY (flattened) PDF based on current preview mode
      if (previewMode === 'merged') {
        await generateMergedRegistrationPDF(userData, userBranch, { download: true, isReadOnly: true });
      } else {
        await generateUserRegistrationPDF(userData, userBranch, { download: true, isReadOnly: true });
      }
    } catch (err: any) {
      console.error(err);
      setError('PDF indirilirken bir hata oluştu');
    }
  };

  const closePreview = () => {
    if (previewPdfUrl) {
      // Clean up the object URL to avoid memory leaks
      // Note: If we want to keep it valid for a bit longer or if browser handles it, we can be less aggressive.
      // But typically we should revoke it. However, if user clicks download in the iframe, it needs to be valid.
      // We'll trust the component unmount or next generation to clean up, or just let it be for the session.
      // URL.revokeObjectURL(previewPdfUrl); 
      setPreviewPdfUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      let documentUrl: string | undefined;

      // PDF yükle (varsa)
      if (pdfFile) {
        try {
          documentUrl = await uploadUserRegistrationForm(
            userId,
            pdfFile,
            (progress) => setUploadProgress(progress)
          );
        } catch (uploadError: any) {
          throw new Error(`Dosya yüklenemedi: ${uploadError.message}`);
        }
      }

      const body: { status: string; note?: string; documentUrl?: string } = { 
        status: selectedStatus 
      };
      
      if (note) body.note = note;
      if (documentUrl) {
        body.documentUrl = documentUrl;
      }

      await apiRequest(`/api/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      logger.error('Error updating user status:', err);
      setError(err.message || 'Durum güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_details':
        return 'Detaylar Bekleniyor';
      case 'pending_branch_review':
        return 'Şube İncelemesi';
      case 'active':
        return 'Aktif';
      case 'rejected':
        return 'Reddedildi';
      default:
        return status;
    }
  };

  // Mevcut kullanıcının rolüne ve hedef kullanıcının durumuna göre seçilebilir durumları filtrele
  const getAvailableStatuses = () => {
    const userRole = currentUser?.role;
    
    // Superadmin ve Admin tüm durumları seçebilir
    if (userRole === 'superadmin' || userRole === 'admin') {
      return [
        { value: 'pending_details', label: 'Detaylar Bekleniyor' },
        { value: 'pending_branch_review', label: 'Şube İncelemesi' },
        { value: 'active', label: 'Aktif' },
        { value: 'rejected', label: 'Reddedildi' },
      ];
    }
    
    // Branch Manager aktif kullanıcıların durumunu değiştiremez
    if (userRole === 'branch_manager') {
      if (currentStatus === 'active') {
        // Aktif kullanıcılar için durum değişikliği izni yok
        return [
          { value: currentStatus, label: getStatusLabel(currentStatus) },
        ];
      }
      
      // Aktif olmayan tüm durumlarda değişiklik yapabilir
      return [
        { value: 'pending_details', label: 'Detaylar Bekleniyor' },
        { value: 'pending_branch_review', label: 'Şube İncelemesi' },
        { value: 'active', label: 'Aktif' },
        { value: 'rejected', label: 'Reddedildi' },
      ];
    }
    
    // Varsayılan
    return [
      { value: currentStatus, label: getStatusLabel(currentStatus) },
    ];
  };

  if (!isOpen) return null;

  const availableStatuses = getAvailableStatuses();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200 bg-slate-700">
            <h2 className="text-sm font-medium text-white">Durum Değiştir</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Current Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mevcut Durum
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-700">
                  {getStatusLabel(currentStatus)}
                </div>
              </div>

              {/* New Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yeni Durum <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setError(null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={availableStatuses.length === 1}
                >
                  {availableStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* PDF Upload (optional for all roles) */}
              {selectedStatus === 'active' && (
                <div>
                  <div className="p-4 border-[0.5px] border-black/60 rounded-md bg-transparent">
                    <label className="block text-sm font-medium text-gray-900 mb-1">Kayıt Formu PDF</label>
                    <p className="text-xs text-gray-700 mb-3">Kullanıcının kayıt formu PDF'sini buradan yükleyebilir veya template indirebilirsiniz. Maksimum 10MB, yalnızca PDF.</p>

                    {/* Mevcut PDF Durumu */}
                    {userData?.documentUrl && !pdfFile && (
                      <div className="flex items-center gap-3 p-3 mb-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-blue-900">Mevcut PDF Dökümanı</p>
                          <p className="text-xs text-blue-700 truncate">Yüklü döküman mevcut</p>
                        </div>
                        <a
                          href={userData.documentUrl}
                          download
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex-shrink-0"
                        >
                          <Download className="w-4 h-4" />
                          İndir
                        </a>
                      </div>
                    )}

                    {/* Eylemler: Yükle ve Template İndir */}
                    <div className="flex items-center gap-2">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.type !== 'application/pdf') {
                                setError('Sadece PDF dosyası yüklenebilir');
                                return;
                              }
                              if (file.size > 10 * 1024 * 1024) {
                                setError('Dosya boyutu 10MB\'dan küçük olmalıdır');
                                return;
                              }
                              setPdfFile(file);
                              setError(null);
                            }
                          }}
                          className="hidden"
                          id="pdf-upload"
                        />
                        <div className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                          <Upload className="w-4 h-4" />
                          <span>{pdfFile ? 'Dosyayı Değiştir' : (userData?.documentUrl ? 'Yeni PDF Yükle' : 'PDF Yükle')}</span>
                        </div>
                      </label>

                      <div className="relative" ref={dropdownRef}>
                        <button
                          type="button"
                          onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                          className="inline-flex items-center justify-center gap-2 px-4 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Template İndir</span>
                          <svg className={`w-3 h-3 transition-transform ${showDownloadOptions ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {showDownloadOptions && (
                          <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                            <button
                              type="button"
                              onClick={() => handleGeneratePDF('kayit')}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <FileText className="w-4 h-4 text-blue-600" />
                              <span>Kayıt Formu</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleGeneratePDF('merged')}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <FileText className="w-4 h-4 text-green-600" />
                              <span>Kayıt Formu + İstifa Formu</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {pdfFile && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-700">
                        <FileText className="w-4 h-4 text-gray-600" />
                        <span className="truncate max-w-sm">{pdfFile.name}</span>
                        <button type="button" onClick={() => setPdfFile(null)} className="text-sm text-gray-500 hover:text-gray-700 ml-2">Sil</button>
                      </div>
                    )}

                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="w-full bg-gray-200 rounded-full h-1 mt-2 overflow-hidden">
                        <div className="bg-blue-600 h-1 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* Note (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Not (Opsiyonel)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Varsa ek not ekleyin..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading || availableStatuses.length === 1}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Güncelleniyor...' : 'Güncelle'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* PDF Preview Overlay */}
      {previewPdfUrl && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                PDF Önizleme & Düzenleme
                {previewMode === 'merged' && (
                  <span className="ml-2 text-sm font-normal text-green-600">(Kayıt + İstifa Formu)</span>
                )}
              </h3>
              <button onClick={closePreview} className="text-gray-400 hover:text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 bg-gray-100 p-4 overflow-hidden relative">
              <iframe 
                src={previewPdfUrl} 
                className="w-full h-full rounded border border-gray-300 bg-white"
                title="PDF Preview"
              />
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
              <p className="mr-auto text-sm text-gray-500 my-auto">
                <span className="font-semibold text-gray-700">Not:</span> Form üzerinde doğrudan düzenleme yapabilirsiniz. İndirdikten sonra düzenlemeler korunacaktır.
              </p>
              <button
                type="button"
                onClick={closePreview}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Kapat
              </button>
              <button
                type="button"
                onClick={handleDownloadFinalPDF}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                İndir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
