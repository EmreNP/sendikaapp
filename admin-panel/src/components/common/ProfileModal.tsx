import { useState, useEffect } from 'react';
import { X, MapPin, Building2, FileText, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { userService, UpdateProfileRequest } from '@/services/api/userService';
import type { User as SharedUser } from '../../../../shared/types/user';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState<UpdateProfileRequest>({
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: undefined,
    phone: '',
    address: '',
    city: '',
    district: '',
    tcKimlikNo: '',
    fatherName: '',
    motherName: '',
    birthPlace: '',
    education: undefined,
    kurumSicil: '',
    kadroUnvani: '',
    kadroUnvanKodu: '',
  });

  useEffect(() => {
    if (isOpen && user) {
      // Kullanıcı bilgilerini form'a yükle
      // API'den dönen user SharedUser type'ında olacak
      const sharedUser = user as unknown as SharedUser;
      const birthDate = sharedUser.birthDate
        ? new Date(sharedUser.birthDate instanceof Date ? sharedUser.birthDate : (sharedUser.birthDate as any).toDate?.() || sharedUser.birthDate)
            .toISOString()
            .split('T')[0]
        : '';

      setFormData({
        firstName: sharedUser.firstName || '',
        lastName: sharedUser.lastName || '',
        birthDate: birthDate,
        gender: sharedUser.gender as 'male' | 'female' | undefined,
        phone: sharedUser.phone || '',
        address: sharedUser.address || '',
        city: sharedUser.city || '',
        district: sharedUser.district || '',
        tcKimlikNo: sharedUser.tcKimlikNo || '',
        fatherName: sharedUser.fatherName || '',
        motherName: sharedUser.motherName || '',
        birthPlace: sharedUser.birthPlace || '',
        education: sharedUser.education as 'ilkögretim' | 'lise' | 'yüksekokul' | undefined,
        kurumSicil: sharedUser.kurumSicil || '',
        kadroUnvani: sharedUser.kadroUnvani || '',
        kadroUnvanKodu: sharedUser.kadroUnvanKodu || '',
      });
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, user]);

  const handleChange = (field: keyof UpdateProfileRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const updatedUser = await userService.updateMyProfile(formData);
      setUser(updatedUser.user);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Profil güncellenirken bir hata oluştu');
    } finally {
      setSaving(false);
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
          <h2 className="text-sm font-medium text-white">Profil Bilgilerim</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              Profil bilgileriniz başarıyla güncellendi!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Temel Bilgiler */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                Temel Bilgiler
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Soyad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Doğum Tarihi
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleChange('birthDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cinsiyet
                  </label>
                  <select
                    value={formData.gender || ''}
                    onChange={(e) => handleChange('gender', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  >
                    <option value="">Seçiniz</option>
                    <option value="male">Erkek</option>
                    <option value="female">Kadın</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email adresi değiştirilemez</p>
                </div>
              </div>
            </div>

            {/* Adres Bilgileri */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Adres Bilgileri
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adres
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    İl
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    İlçe
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => handleChange('district', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Kimlik Bilgileri */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Kimlik Bilgileri
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    TC Kimlik No
                  </label>
                  <input
                    type="text"
                    value={formData.tcKimlikNo}
                    onChange={(e) => handleChange('tcKimlikNo', e.target.value)}
                    maxLength={11}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Doğum Yeri
                  </label>
                  <input
                    type="text"
                    value={formData.birthPlace}
                    onChange={(e) => handleChange('birthPlace', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Baba Adı
                  </label>
                  <input
                    type="text"
                    value={formData.fatherName}
                    onChange={(e) => handleChange('fatherName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Anne Adı
                  </label>
                  <input
                    type="text"
                    value={formData.motherName}
                    onChange={(e) => handleChange('motherName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Mesleki Bilgiler */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Mesleki Bilgiler
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Eğitim Seviyesi
                  </label>
                  <select
                    value={formData.education || ''}
                    onChange={(e) => handleChange('education', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  >
                    <option value="">Seçiniz</option>
                    <option value="ilkögretim">İlköğretim</option>
                    <option value="lise">Lise</option>
                    <option value="yüksekokul">Yüksekokul</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kurum Sicil No
                  </label>
                  <input
                    type="text"
                    value={formData.kurumSicil}
                    onChange={(e) => handleChange('kurumSicil', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kadro Unvanı
                  </label>
                  <input
                    type="text"
                    value={formData.kadroUnvani}
                    onChange={(e) => handleChange('kadroUnvani', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kadro Unvan Kodu
                  </label>
                  <input
                    type="text"
                    value={formData.kadroUnvanKodu}
                    onChange={(e) => handleChange('kadroUnvanKodu', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Kaydet
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
}

