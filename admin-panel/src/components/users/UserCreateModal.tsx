import { useEffect, useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

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
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [customToken, setCustomToken] = useState<string | null>(null);

  // Form fields - Basic
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');

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
  const [kadroUnvanKodu, setKadroUnvanKodu] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setStep('basic');
      setCreatedUserId(null);
      setCustomToken(null);
      // Reset fields
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setBirthDate('');
      setGender('');
      setBranchId(currentUser?.branchId || '');
      setPhone('');
      setTcKimlikNo('');
      setFatherName('');
      setMotherName('');
      setBirthPlace('');
      setEducation('');
      setKurumSicil('');
      setKadroUnvani('');
      setKadroUnvanKodu('');
      setAddress('');
      setCity('');
      setDistrict('');

      if (currentUser?.role === 'admin') {
        fetchBranches();
      }
    }
  }, [isOpen]);

  const fetchBranches = async () => {
    try {
      const data = await apiRequest<{ branches: Array<{ id: string; name: string }>}>("/api/branches");
      setBranches(data.branches || []);
    } catch (err: any) {
      console.error('Error fetching branches:', err);
    }
  };

  const handleBasicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName || !lastName || !email || !birthDate || !gender) {
      setError('Ad, soyad, e-posta, doğum tarihi ve cinsiyet zorunludur');
      return;
    }

    // Default password if empty
    const finalPassword = password || 'parola123.';

    const body = {
      firstName,
      lastName,
      email,
      password: finalPassword,
      birthDate,
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
      setCustomToken(response.customToken || null);
      setStep('success');
    } catch (err: any) {
      console.error('Error creating user (basic):', err);
      setError(err.message || 'Kullanıcı oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDetailsSubmit = async () => {
    setError(null);

    if (!branchId) {
      setError('Şube seçimi zorunludur');
      return;
    }

    if (!createdUserId) {
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
    if (kadroUnvanKodu) body.kadroUnvanKodu = kadroUnvanKodu;
    if (phone) body.phone = phone;
    if (address) body.address = address;
    if (city) body.city = city;
    if (district) body.district = district;

    try {
      setLoading(true);
      
      // Use the new admin endpoint to complete details
      await apiRequest(`/api/users/${createdUserId}/complete-details`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });

      // Success - close and refresh
      onSuccess();
    } catch (err: any) {
      console.error('Error updating user details:', err);
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
                      placeholder="Boş bırakılırsa: parola123."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Parola boş bırakılırsa varsayılan parola "parola123." kullanılacaktır
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
                    {currentUser?.role === 'admin' ? (
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
                        {branches.find(b => b.id === currentUser?.branchId)?.name || currentUser?.branchId || '-'}
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
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Baba Adı</label>
                    <input
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Anne Adı</label>
                    <input
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Doğum Yeri</label>
                    <input
                      value={birthPlace}
                      onChange={(e) => setBirthPlace(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Eğitim Seviyesi</label>
                    <select
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="">Seçiniz</option>
                      <option value="primary">İlkokul</option>
                      <option value="middle">Ortaokul</option>
                      <option value="high">Lise</option>
                      <option value="associate">Ön Lisans</option>
                      <option value="bachelor">Lisans</option>
                      <option value="master">Yüksek Lisans</option>
                      <option value="doctorate">Doktora</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kurum Sicil</label>
                    <input
                      value={kurumSicil}
                      onChange={(e) => setKurumSicil(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kadro Ünvanı</label>
                    <input
                      value={kadroUnvani}
                      onChange={(e) => setKadroUnvani(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kadro Ünvan Kodu</label>
                    <input
                      value={kadroUnvanKodu}
                      onChange={(e) => setKadroUnvanKodu(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İlçe</label>
                    <input
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                      rows={3}
                    />
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
