import { useEffect, useState } from 'react';
import { X, Upload, FileText, Download, ExternalLink } from 'lucide-react';
import { apiRequest } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { uploadUserRegistrationForm } from '@/utils/fileUpload';
import { generateUserRegistrationPDF } from '@/utils/pdfGenerator';

interface Props {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface UserData {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | '';
  tcKimlikNo?: string;
  fatherName?: string;
  motherName?: string;
  birthPlace?: string;
  education?: string;
  kurumSicil?: string;
  kadroUnvani?: string;
  kadroUnvanKodu?: string;
  address?: string;
  city?: string;
  district?: string;
  isMemberOfOtherUnion?: boolean;
  branchId?: string;
  role?: string;
  documentUrl?: string;
}

export default function UserEditModal({ userId, isOpen, onClose, onSuccess }: Props) {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [branchName, setBranchName] = useState<string>('');
  const [isMissingDoc, setIsMissingDoc] = useState(false);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [branchId, setBranchId] = useState<string>('');
  const [tcKimlikNo, setTcKimlikNo] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [education, setEducation] = useState('');
  const [kurumSicil, setKurumSicil] = useState('');
  const [kadroUnvani, setKadroUnvani] = useState('');
  const [kadroUnvanKodu, setKadroUnvanKodu] = useState('');
  const [district, setDistrict] = useState('');
  const [isMemberOfOtherUnion, setIsMemberOfOtherUnion] = useState<boolean | ''>('');
  const [note, setNote] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserData();
      if (currentUser?.role === 'admin' || currentUser?.role === 'superadmin') {
        fetchBranches();
      }
    } else {
      resetForm();
    }
  }, [isOpen, userId]);

  const fetchUserData = async () => {
    if (!userId) return;

    try {
      setFetchingUser(true);
      setError(null);
      setIsMissingDoc(false);
      
      const data = await apiRequest<{ user: UserData }>(`/api/users/${userId}`);
      const user = data.user;

      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      // Normalize birthDate to YYYY-MM-DD for <input type="date"> (API returns ISO strings or Timestamps)
      if (user.birthDate) {
        try {
          const d = new Date(user.birthDate);
          if (!isNaN(d.getTime())) {
            setBirthDate(d.toISOString().split('T')[0]);
          } else {
            setBirthDate(String(user.birthDate));
          }
        } catch {
          setBirthDate(String(user.birthDate));
        }
      } else {
        setBirthDate('');
      }
      setGender(user.gender || '');
      setBranchId(user.branchId || '');
      // if branchId present, fetch branch name for display (for branch managers / when branches list not loaded)
      if (user.branchId) {
        try {
          const bdata = await apiRequest<{ branch: { id: string; name: string } }>(`/api/branches/${user.branchId}`);
          if (bdata?.branch?.name) setBranchName(bdata.branch.name);
        } catch (err: any) {
          console.error('Error fetching branch name:', err);
        }
      }
      setTcKimlikNo(user.tcKimlikNo || '');
      setFatherName(user.fatherName || '');
      setMotherName(user.motherName || '');
      setBirthPlace(user.birthPlace || '');
      setEducation(user.education || '');
      setKurumSicil(user.kurumSicil || '');
      setKadroUnvani(user.kadroUnvani || '');
      setKadroUnvanKodu(user.kadroUnvanKodu || '');
      setDistrict(user.district || '');
      setIsMemberOfOtherUnion(user.isMemberOfOtherUnion === undefined ? '' : user.isMemberOfOtherUnion);
      setDocumentUrl(user.documentUrl || '');
    } catch (err: any) {
      // Eğer kullanıcı bulunamadı hatası alırsak, eksik kayıt moduna geç
      if (err.response?.status === 404 || err.message?.toLowerCase().includes('bulunamadı') || err.code === 'NOT_FOUND') {
        console.warn('User doc invalid/missing. Switching to Registration Completion mode.');
        setIsMissingDoc(true);
        // Şube yöneticisi ise şubesini otomatik ata ve şube ismini getir
        if (currentUser?.branchId) {
           setBranchId(currentUser.branchId);
           try {
             const bdata = await apiRequest<{ branch: { id: string; name: string } }>(`/api/branches/${currentUser.branchId}`);
             if (bdata?.branch?.name) setBranchName(bdata.branch.name);
           } catch (err: any) {
             console.error('Error fetching branch name for branch manager:', err);
           }
        }
      } else {
        console.error('Error fetching user:', err);
        setError(err.message || 'Kullanıcı bilgileri yüklenirken hata oluştu');
      }
    } finally {
      setFetchingUser(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const data = await apiRequest<{ branches: Array<{ id: string; name: string }> }>("/api/branches");
      setBranches(data.branches || []);
    } catch (err: any) {
      console.error('Error fetching branches:', err);
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setBirthDate('');
    setGender('');
    setBranchId('');
    setTcKimlikNo('');
    setFatherName('');
    setMotherName('');
    setBirthPlace('');
    setEducation('');
    setKurumSicil('');
    setKadroUnvani('');
    setKadroUnvanKodu('');
    setDistrict('');
    setIsMemberOfOtherUnion('');
    setNote('');
    setDocumentUrl('');
    setPdfFile(null);
    setUploadProgress(0);
    setError(null);
    setIsMissingDoc(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setError(null);

    // Temel alanlar her zaman zorunlu
    if (!firstName || !lastName || !email) {
      setError('Ad, soyad ve e-posta zorunludur');
      return;
    }

    // Tüm detay alanları zorunlu (not hariç)
    if (!tcKimlikNo || !phone || !branchId || !birthDate || !gender || 
        !fatherName || !motherName || !birthPlace || !education || 
        !kurumSicil || !kadroUnvani || !kadroUnvanKodu || 
        !district || isMemberOfOtherUnion === '') {
      
      setError('Tüm alanlar zorunludur (Not alanı hariç)');
      return;
    }

    const body: any = {
      firstName,
      lastName,
      email,
    };

    // Optional fields logic (normal update için)
    // Eksik kayıt modunda hepsi body'e eklenmeli
    const fields = [
       { key: 'phone', val: phone },
       { key: 'birthDate', val: birthDate },
       { key: 'gender', val: gender },
       { key: 'branchId', val: branchId },
       { key: 'tcKimlikNo', val: tcKimlikNo },
       { key: 'fatherName', val: fatherName },
       { key: 'motherName', val: motherName },
       { key: 'birthPlace', val: birthPlace },
       { key: 'education', val: education },
       { key: 'kurumSicil', val: kurumSicil },
       { key: 'kadroUnvani', val: kadroUnvani },
       { key: 'kadroUnvanKodu', val: kadroUnvanKodu },
       { key: 'district', val: district },
       { key: 'note', val: note }
    ];

    fields.forEach(f => {
        if (f.val) body[f.key] = f.val;
    });
    
    // isMemberOfOtherUnion boolean alanını ekle
    if (typeof isMemberOfOtherUnion === 'boolean') {
      body.isMemberOfOtherUnion = isMemberOfOtherUnion;
    }
    
    try {
      setLoading(true);
      
      // Upload PDF if selected
      let newDocumentUrl = documentUrl;
      if (pdfFile) {
        try {
          newDocumentUrl = await uploadUserRegistrationForm(
            userId,
            pdfFile,
            (progress) => setUploadProgress(progress)
          );
        } catch (uploadError: any) {
          throw new Error(`Dosya yüklenemedi: ${uploadError.message}`);
        }
      }
      
      // documentUrl'i ekle (varsa)
      if (newDocumentUrl) {
        body.documentUrl = newDocumentUrl;
      }
      
      if (isMissingDoc) {
        // Register Details Endpoint Kullan
        body.userId = userId;
        // Tüm alanların gittiğinden emin ol (yukarıdaki if(val) kontrolü validation geçtiyse sorun olmaz ama 
        // registerDetail endpoint hepsini bekler, boş string ise hata verebilir veya kabul edebilir.
        // Validation dolu olmasını zorunlu kıldı (isMissingDoc bloğunda).
        
        await apiRequest('/api/auth/register/details', {
          method: 'POST',
          body: JSON.stringify(body),
        });
      } else {
        // Normal Update
        await apiRequest(`/api/users/${userId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.message || 'Kullanıcı güncellenirken hata oluştu');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-slate-700 sticky top-0 z-10">
            <h2 className="text-sm font-medium text-white">
                {isMissingDoc ? 'Kullanıcı Kaydını Tamamla (Eksik Kayıt)' : 'Kullanıcı Bilgilerini Düzenle'}
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

            {fetchingUser ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="ml-3 text-gray-600">Kullanıcı bilgileri yükleniyor...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Temel Bilgiler */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ad <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Soyad <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-posta <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefon <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Doğum Tarihi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cinsiyet <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                      required
                    >
                      <option value="">Seçiniz</option>
                      <option value="male">Erkek</option>
                      <option value="female">Kadın</option>
                    </select>
                  </div>

                  {/* Şube - Admin/superadmin için düzenlenebilir, şube yöneticisi için görünür ama disabled */}
                  {(currentUser?.role === 'admin' || currentUser?.role === 'superadmin' || currentUser?.role === 'branch_manager') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                          Şube <span className="text-red-500">*</span>
                      </label>

                      {currentUser?.role === 'branch_manager' ? (
                        <input
                          type="text"
                          value={branches.find(b => b.id === branchId)?.name || branchName || branchId || ''}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                        />
                      ) : (
                        <select
                          value={branchId}
                          onChange={(e) => setBranchId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                          required
                        >
                          <option value="">Şube seçiniz</option>
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {/* Detaylı Bilgiler */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        TC Kimlik No <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={tcKimlikNo}
                      onChange={(e) => setTcKimlikNo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                      maxLength={11}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Baba Adı <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Anne Adı <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Doğum Yeri <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={birthPlace}
                      onChange={(e) => setBirthPlace(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Öğrenim <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                      required
                    >
                      <option value="">Seçiniz</option>
                      <option value="ilköğretim">İlköğretim</option>
                      <option value="lise">Lise</option>
                      <option value="yüksekokul">Yüksek Okul</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kurum Sicil <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={kurumSicil}
                      onChange={(e) => setKurumSicil(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kadro Ünvanı <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={kadroUnvani}
                      onChange={(e) => setKadroUnvani(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kadro Ünvan Kodu <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={kadroUnvanKodu}
                      onChange={(e) => setKadroUnvanKodu(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        İlçe <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Başka Bir Sendikaya Üye mi? <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={isMemberOfOtherUnion === '' ? '' : isMemberOfOtherUnion ? 'true' : 'false'}
                      onChange={(e) => setIsMemberOfOtherUnion(e.target.value === '' ? '' : e.target.value === 'true')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                      required
                    >
                      <option value="">Seçiniz</option>
                      <option value="false">Hayır</option>
                      <option value="true">Evet</option>
                    </select>
                  </div>
                  
                  {/* PDF Document Section */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kayıt Formu PDF (Opsiyonel)
                    </label>
                    
                    {/* Current Document */}
                    {documentUrl && !pdfFile && (
                      <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-900 flex-1">
                          Mevcut Döküman Yüklü
                        </span>
                        <a
                          href={documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span className="text-xs">Görüntüle</span>
                        </a>
                      </div>
                    )}
                    
                    {/* Generate PDF Template Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const userBranch = branches.find(b => b.id === branchId);
                        generateUserRegistrationPDF({
                          firstName,
                          lastName,
                          email,
                          phone,
                          birthDate,
                          gender,
                          tcKimlikNo,
                          fatherName,
                          motherName,
                          birthPlace,
                          education,
                          kurumSicil,
                          kadroUnvani,
                          kadroUnvanKodu,
                          district,
                          branchId,
                          isMemberOfOtherUnion: typeof isMemberOfOtherUnion === 'boolean' ? isMemberOfOtherUnion : undefined,
                        }, userBranch);
                      }}
                      className="w-full mb-3 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Kullanıcı Bilgileriyle PDF Oluştur ve İndir
                    </button>
                    
                    {/* Upload New Document */}
                    <div className="space-y-2">
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
                            id="pdf-upload-edit"
                          />
                          <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors">
                            <Upload className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {pdfFile ? 'Dosya değiştir' : documentUrl ? 'Yeni döküman yükle' : 'PDF dosyası seç'}
                            </span>
                          </div>
                        </label>
                      </div>
                      
                      {pdfFile && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                          <FileText className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-900 flex-1 truncate">
                            {pdfFile.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPdfFile(null)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      
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
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Not (Opsiyonel)</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                      rows={2}
                      placeholder="Güncelleme ile ilgili not ekleyin..."
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Güncelleniyor...' : (isMissingDoc ? 'Kaydı Tamamla' : 'Güncelle')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
