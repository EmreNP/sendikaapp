import { useEffect, useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { KONYA_DISTRICTS } from '@shared/constants/districts';
import { EDUCATION_LEVEL_OPTIONS } from '@shared/constants/education';
import { logger } from '@/utils/logger';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserCreateModal({ isOpen, onClose, onSuccess }: Props) {
  const { user: currentUser } = useAuth();
  const [step, setStep] = useState<'basic' | 'success' | 'details'>('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [branchName, setBranchName] = useState<string>('');
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);

  // Form fields - Basic
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [district, setDistrict] = useState('');
  const [kadroUnvani, setKadroUnvani] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');

  // Detailed fields
  const [branchId, setBranchId] = useState<string>('');
  const [tcKimlikNo, setTcKimlikNo] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [education, setEducation] = useState('');
  const [kurumSicil, setKurumSicil] = useState('');
  const [kadroUnvanKodu, setKadroUnvanKodu] = useState('');
  const [isMemberOfOtherUnion, setIsMemberOfOtherUnion] = useState<boolean | ''>('');

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setStep('basic');
      setCreatedUserId(null);
      // Reset fields
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setPassword('');
      setBirthDate('');
      setDistrict('');
      setKadroUnvani('');
      setGender('');
      setBranchId(currentUser?.branchId || '');
      setTcKimlikNo('');
      setFatherName('');
      setMotherName('');
      setBirthPlace('');
      setEducation('');
      setKurumSicil('');
      setKadroUnvanKodu('');
      setIsMemberOfOtherUnion('');

      if (currentUser?.role === 'admin' || currentUser?.role === 'superadmin') {
        fetchBranches();
      } else if (currentUser?.branchId) {
        // Branch manager: fetch only their branch name for display
        fetchBranchById(currentUser.branchId);
      }
    }
  }, [isOpen]);

  const fetchBranches = async () => {
    try {
      const data = await apiRequest<{ branches: Array<{ id: string; name: string }>}>("/api/branches");
      setBranches(data.branches || []);
    } catch (err: any) {
      logger.error('Error fetching branches:', err);
    }
  };

  const fetchBranchById = async (id?: string) => {
    if (!id) return;
    // If we already have it, set name and return
    const existing = branches.find(b => b.id === id);
    if (existing) {
      setBranchName(existing.name);
      return;
    }

    try {
      const data = await apiRequest<{ branch: { id: string; name: string } }>(`/api/branches/${id}`);
      if (data?.branch) {
        setBranchName(data.branch.name || '');
        setBranches(prev => [...prev, data.branch]);
      }
    } catch (err: any) {
      logger.error('Error fetching single branch:', err);
    }
  };

  const handleBasicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName || !lastName || !phone || !email || !birthDate || !district || !kadroUnvani || !gender) {
      setError('Tüm zorunlu alanlar doldurulmalıdır');
      return;
    }

    // Default password if empty
    const finalPassword = password || '123456';

    const body = {
      firstName,
      lastName,
      phone,
      email,
      password: finalPassword,
      birthDate,
      district,
      kadroUnvani,
      gender,
    };

    try {
      setLoading(true);
      const response = await apiRequest<{
        uid: string;
        email: string;
        customToken?: string;
        nextStep: string;
      }>('/api/auth/register/basic', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      // Basic registration successful
      setCreatedUserId(response.uid);
      setStep('success');
    } catch (err: any) {
      logger.error('Error creating user (basic):', err);
      setError(err.message || 'Kullanıcı oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDetailsSubmit = async () => {
    setError(null);

    // Tüm zorunlu alanları kontrol et
    if (!branchId || !tcKimlikNo || !fatherName || !motherName || 
        !birthPlace || !education || !kurumSicil || 
        !kadroUnvanKodu || isMemberOfOtherUnion === '') {
      setError('Tüm alanlar zorunludur');
      return;
    }

    if (!createdUserId) {
      setError('Kullanıcı bilgisi bulunamadı');
      return;
    }

    const body: any = {
      userId: createdUserId,
      branchId,
      tcKimlikNo,
      fatherName,
      motherName,
      birthPlace,
      education,
      kurumSicil,
      kadroUnvanKodu,
      isMemberOfOtherUnion: typeof isMemberOfOtherUnion === 'boolean' ? isMemberOfOtherUnion : undefined,
    };

    try {
      setLoading(true);
      
      // Use register/details endpoint for admin-created users
      await apiRequest('/api/auth/register/details', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      // Success - close and refresh
      onSuccess();
      onClose();
    } catch (err: any) {
      logger.error('Error updating user details:', err);
      setError(err.message || 'Detaylar kaydedilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipDetails = () => {
    // Close modal and refresh list
    onSuccess();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-slate-700 sticky top-0 z-10">
            <h2 className="text-sm font-medium text-white">
              {step === 'basic' && 'Yeni Üye Oluştur - Temel Bilgiler'}
              {step === 'success' && 'Kayıt Başarılı'}
              {step === 'details' && 'Detaylı Bilgileri Doldur'}
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

            {/* Step 1: Basic Registration Form */}
            {step === 'basic' && (
              <form onSubmit={handleBasicSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                      Telefon <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                      placeholder="5xxxxxxxxx"
                      maxLength={11}
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
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parola <span className="text-gray-500 text-xs">(opsiyonel)</span>
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                      placeholder="Boş bırakılırsa: 123456"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Parola boş bırakılırsa varsayılan parola "123456" kullanılacaktır
                    </p>
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
                      Görev İlçesi <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                      required
                    >
                      <option value="">Seçiniz</option>
                      {KONYA_DISTRICTS.map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kadro Ünvanı <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={kadroUnvani}
                      onChange={(e) => setKadroUnvani(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                      placeholder="Öğretmen, Müdür, vb."
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
                    {loading ? 'Oluşturuluyor...' : 'Devam Et'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Success Message */}
            {step === 'success' && (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    İlk Kayıt Başarı ile Oluşturuldu!
                  </h3>
                  <p className="text-gray-600 text-center max-w-md">
                    Temel bilgiler kaydedildi. Şimdi detaylı bilgileri doldurabilir veya daha sonra tamamlayabilirsiniz.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleSkipDetails}
                    className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Kapat
                  </button>
                  <button
                    onClick={() => setStep('details')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Detaylı Bilgileri Doldur
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Details Form */}
            {step === 'details' && (
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
                        {branchName || branches.find(b => b.id === currentUser?.branchId)?.name || currentUser?.branchId || '-'}
                      </div>
                    )}
                  </div>
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
                      {EDUCATION_LEVEL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
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
                      Kadro Ünvan Kodu <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={kadroUnvanKodu}
                      onChange={(e) => setKadroUnvanKodu(e.target.value)}
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
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleSkipDetails}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Kapat
                  </button>
                  <button
                    onClick={handleDetailsSubmit}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
