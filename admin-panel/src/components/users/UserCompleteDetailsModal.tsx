import { useEffect, useState } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { apiRequest } from '@/utils/api';
import { api } from '@/config/api';
import { authService } from '@/services/auth/authService';
import { useAuth } from '@/context/AuthContext';
import { EDUCATION_LEVEL_OPTIONS } from '@shared/constants/education';
import { logger } from '@/utils/logger';

interface Props {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserCompleteDetailsModal({ userId, isOpen, onClose, onSuccess }: Props) {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [branchName, setBranchName] = useState<string>('');
  const [userData, setUserData] = useState<any>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // Detailed fields
  const [branchId, setBranchId] = useState<string>('');
  const [phone, setPhone] = useState('');
  const [tcKimlikNo, setTcKimlikNo] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [education, setEducation] = useState('');
  const [kurumSicil, setKurumSicil] = useState('');
  const [kadroUnvani, setKadroUnvani] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');

  useEffect(() => {
    if (isOpen && userId) {
      setError(null);
      setPdfFile(null);
      setPdfUrl(null);
      fetchUserData();
      if (currentUser?.role === 'admin' || currentUser?.role === 'superadmin') {
        fetchBranches();
      } else if (currentUser?.branchId) {
        setBranchId(currentUser.branchId);
        // Branch manager için branch ismini getir
        fetchBranchById(currentUser.branchId);
      }
    }
  }, [isOpen, userId]);

  const fetchBranches = async () => {
    try {
      const data = await apiRequest<{ branches: Array<{ id: string; name: string }> }>('/api/branches');
      setBranches(data.branches || []);
    } catch (err: any) {
      logger.error('Error fetching branches:', err);
    }
  };

  const fetchBranchById = async (branchId?: string) => {
    if (!branchId) return;
    // Eğer zaten varsa tekrar getirme
    if (branches.find(b => b.id === branchId)) return;

    try {
      const data = await apiRequest<{ branch: { id: string; name: string } }>(`/api/branches/${branchId}`);
      if (data.branch) {
        setBranches(prev => [...prev, data.branch]);
        if (data.branch.name) setBranchName(data.branch.name);
      }
    } catch (err: any) {
      logger.error('❌ Error fetching branch by id:', err);
    }
  };

  useEffect(() => {
    if (branchId) {
      const found = branches.find(b => b.id === branchId);
      if (found) {
        setBranchName(found.name);
      } else {
        // try to fetch single branch if not present locally
        fetchBranchById(branchId);
      }
    } else {
      setBranchName('');
    }
  }, [branchId, branches]);

  const fetchUserData = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const data = await apiRequest<{ user: any }>(`/api/users/${userId}`);
      setUserData(data.user);
      
      // Mevcut verileri doldur
      const resolvedBranchId = data.user.branchId || currentUser?.branchId || '';
      setBranchId(resolvedBranchId);
      // Eğer branch bilgimiz yoksa tekil olarak getir
      if (resolvedBranchId) {
        fetchBranchById(resolvedBranchId);
      }
      setPhone(data.user.phone || '');
      setTcKimlikNo(data.user.tcKimlikNo || '');
      setFatherName(data.user.fatherName || '');
      setMotherName(data.user.motherName || '');
      setBirthPlace(data.user.birthPlace || '');
      setEducation(data.user.education || '');
      setKurumSicil(data.user.kurumSicil || '');
      setKadroUnvani(data.user.kadroUnvani || '');
      setAddress(data.user.address || '');
      setCity(data.user.city || '');
      setDistrict(data.user.district || '');
      
      // Mevcut PDF URL'i varsa göster
      if (data.user.documentUrl) {
        setPdfUrl(data.user.documentUrl);
      }
    } catch (err: any) {
      logger.error('Error fetching user data:', err);
      setError(err.message || 'Kullanıcı bilgileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const uploadPdfToStorage = async (file: File, userId: string): Promise<string> => {
    try {
      setUploadingPdf(true);
      
      // FormData oluştur
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      
      // Backend API'ye yükle
      const token = await authService.getIdToken();
      const url = api.url('/api/files/user-documents/upload');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'PDF yüklenirken bir hata oluştu');
      }
      
      const documentUrl = data.data?.documentUrl || data.data?.fileUrl || data.data?.imageUrl;
      
      if (!documentUrl) {
        throw new Error('Yükleme başarılı ancak URL alınamadı');
      }
      
      setPdfUrl(documentUrl);
      return documentUrl;
    } catch (err: any) {
      logger.error('❌ Error uploading PDF:', err);
      throw new Error('PDF yüklenirken bir hata oluştu: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    if (!branchId) {
      setError('Şube seçimi zorunludur');
      return;
    }

    if (!userId) {
      setError('Kullanıcı bilgisi bulunamadı');
      return;
    }

    const body: any = {
      branchId,
    };

    // Optional fields
    if (tcKimlikNo) body.tcKimlikNo = tcKimlikNo;
    if (fatherName) body.fatherName = fatherName;
    if (motherName) body.motherName = motherName;
    if (birthPlace) body.birthPlace = birthPlace;
    if (education) body.education = education;
    if (kurumSicil) body.kurumSicil = kurumSicil;
    if (kadroUnvani) body.kadroUnvani = kadroUnvani;
    if (phone) body.phone = phone;
    if (address) body.address = address;
    if (city) body.city = city;
    if (district) body.district = district;

    try {
      setLoading(true);
      
      // PDF varsa önce yükle
      let documentUrl = pdfUrl; // Mevcut PDF URL'i kullan
      if (pdfFile && userId) {
        documentUrl = await uploadPdfToStorage(pdfFile, userId);
      }
      
      // Body'ye documentUrl ekle
      if (documentUrl) {
        body.documentUrl = documentUrl;
      }
      
      await apiRequest(`/api/users/${userId}/complete-details`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });

      // Success
      onSuccess();
    } catch (err: any) {
      logger.error('Error completing user details:', err);
      setError(err.message || 'Detaylar kaydedilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !userId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-slate-700 sticky top-0 z-10">
            <h2 className="text-sm font-medium text-white">
              Kullanıcı Detaylarını Tamamla
            </h2>
            <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {userData && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Kullanıcı Bilgileri</h3>
                <div className="text-sm text-blue-800">
                  <p><span className="font-medium">Ad Soyad:</span> {userData.firstName} {userData.lastName}</p>
                  <p><span className="font-medium">E-posta:</span> {userData.email}</p>
                  <p><span className="font-medium">Durum:</span> {userData.status === 'pending_details' ? 'Detaylar Bekleniyor' : userData.status}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Şube <span className="text-red-500">*</span>
                  </label>
                  {(currentUser?.role === 'admin' || currentUser?.role === 'superadmin') ? (
                    <select
                      value={branchId}
                      onChange={(e) => setBranchId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                      required
                      disabled={loading}
                    >
                      <option value="">Şube seçiniz</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-3 py-2 bg-gray-100 rounded-lg">
                      {branchName || (branches.find(b => b.id === branchId)?.name) || '-'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">TC Kimlik No</label>
                  <input
                    value={tcKimlikNo}
                    onChange={(e) => setTcKimlikNo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                    maxLength={11}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Baba Adı</label>
                  <input
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Anne Adı</label>
                  <input
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doğum Yeri</label>
                  <input
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Eğitim Seviyesi</label>
                  <select
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                    disabled={loading}
                  >
                    <option value="">Seçiniz</option>
                    {EDUCATION_LEVEL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kurum Sicil</label>
                  <input
                    value={kurumSicil}
                    onChange={(e) => setKurumSicil(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kadro Ünvanı</label>
                  <input
                    value={kadroUnvani}
                    onChange={(e) => setKadroUnvani(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İlçe</label>
                  <input
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                    disabled={loading}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                    rows={3}
                    disabled={loading}
                  />
                </div>

                {/* PDF Yükleme Alanı (Opsiyonel) */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kayıt Belgesi (PDF) <span className="text-gray-500 text-xs">(Opsiyonel)</span>
                  </label>
                  
                  {pdfUrl && !pdfFile ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-800 flex-1">Mevcut belge yüklü</span>
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 underline"
                      >
                        Görüntüle
                      </a>
                      <button
                        type="button"
                        onClick={() => setPdfUrl(null)}
                        className="text-xs text-red-600 hover:text-red-700"
                        disabled={loading}
                      >
                        Kaldır
                      </button>
                    </div>
                  ) : pdfFile ? (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-800 flex-1">{pdfFile.name}</span>
                      <span className="text-xs text-gray-500">
                        {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <button
                        type="button"
                        onClick={() => setPdfFile(null)}
                        className="text-xs text-red-600 hover:text-red-700"
                        disabled={loading}
                      >
                        Kaldır
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.type !== 'application/pdf') {
                              setError('Sadece PDF dosyaları yüklenebilir');
                              return;
                            }
                            if (file.size > 10 * 1024 * 1024) {
                              setError('PDF dosyası 10MB\'dan küçük olmalıdır');
                              return;
                            }
                            setPdfFile(file);
                            setError(null);
                          }
                        }}
                        className="hidden"
                        id="pdf-upload"
                        disabled={loading}
                      />
                      <label
                        htmlFor="pdf-upload"
                        className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors ${
                          loading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          PDF yüklemek için tıklayın
                        </span>
                      </label>
                      <p className="mt-1 text-xs text-gray-500">
                        Maksimum dosya boyutu: 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={loading || uploadingPdf}
                >
                  İptal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || uploadingPdf}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {uploadingPdf ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      PDF Yükleniyor...
                    </>
                  ) : loading ? (
                    'Kaydediliyor...'
                  ) : (
                    'Kaydet'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
