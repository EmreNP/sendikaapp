import { useState, useEffect } from 'react';
import { X, MapPin, Building2, FileText, Save, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { userService, UpdateProfileRequest } from '@/services/api/userService';
import { KONYA_DISTRICTS } from '@shared/constants/districts';
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
    district: '', // Görev İlçesi
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
    let cancelled = false;
    async function loadProfile() {
      if (!isOpen) return;
      setLoading(true);
      try {
        const resp = await userService.getMyProfile();
        const sharedUser = resp.user as unknown as SharedUser;
        // Safely parse birthDate coming from different sources (Date | Firebase Timestamp | ISO string | seconds/nanoseconds object)
        let birthDate = '';
        const parseBirthDate = (raw: any): string => {
          if (!raw) return '';
          try {
            // Date instance
            if (raw instanceof Date) {
              return raw.toISOString().split('T')[0];
            }

            // ISO string
            if (typeof raw === 'string') {
              const d = new Date(raw);
              if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
            }

            // Firestore Timestamp with toDate()
            if (raw?.toDate && typeof raw.toDate === 'function') {
              const d = raw.toDate();
              if (d instanceof Date && !isNaN(d.getTime())) return d.toISOString().split('T')[0];
            }

            // Plain object with seconds/nanoseconds (from serialized Timestamp)
            if (typeof raw === 'object') {
              const seconds = Number(raw.seconds ?? raw._seconds);
              const nanoseconds = Number(raw.nanoseconds ?? raw._nanoseconds ?? 0);
              if (!isNaN(seconds)) {
                const d = new Date(seconds * 1000 + Math.floor(nanoseconds / 1e6));
                if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
              }

              // As a last resort, try Date constructor
              const d2 = new Date(raw as any);
              if (!isNaN(d2.getTime())) return d2.toISOString().split('T')[0];
            }
          } catch (err) {
            console.warn('Error parsing birthDate:', err, raw);
          }

          console.warn('Invalid birthDate value for user:', raw);
          return '';
        };

        birthDate = parseBirthDate(sharedUser.birthDate);

        setFormData({
          firstName: sharedUser.firstName || '',
          lastName: sharedUser.lastName || '',
          birthDate: birthDate,
          gender: sharedUser.gender as 'male' | 'female' | undefined,
          phone: sharedUser.phone || '',
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
      } catch (err: any) {
        console.error('Error loading profile:', err);
        setError('Profil bilgileri yüklenirken bir hata oluştu');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadProfile();
    return () => { cancelled = true; };
  }, [isOpen]);

  const handleChange = (field: keyof UpdateProfileRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Ensure all mandatory fields are filled (all fields are required per request)
    const mandatory: (keyof UpdateProfileRequest)[] = [
      'firstName','lastName','birthDate','gender','phone','district','tcKimlikNo','fatherName','motherName','birthPlace','education','kurumSicil','kadroUnvani','kadroUnvanKodu'
    ];
    for (const k of mandatory) {
      const v = (formData as any)[k];
      // Check for undefined, null, empty string, or whitespace-only string
      if (!v || (typeof v === 'string' && v.trim() === '')) {
        setError('Lütfen tüm zorunlu alanları doldurun');
        return;
      }
    }

    // Validate TC Kimlik No
    const tc = (formData.tcKimlikNo || '').replace(/\D/g, '');
    if (tc.length !== 11) {
      setError('TC Kimlik No 11 haneli olmalıdır');
      return;
    }

    // TC Kimlik No algoritma kontrolü
    const tcDigits = tc.split('').map(Number);
    const sum1 = tcDigits[0] + tcDigits[2] + tcDigits[4] + tcDigits[6] + tcDigits[8];
    const sum2 = tcDigits[1] + tcDigits[3] + tcDigits[5] + tcDigits[7];
    
    if ((sum1 * 7 - sum2) % 10 !== tcDigits[9]) {
      setError('Geçersiz TC Kimlik No (kontrol basamağı hatalı)');
      return;
    }
    
    if ((sum1 + sum2 + tcDigits[9]) % 10 !== tcDigits[10]) {
      setError('Geçersiz TC Kimlik No (son basamak hatalı)');
      return;
    }

    // Normalize/validate phone number
    let phone = (formData.phone || '').trim();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Telefon numarası geçersiz veya eksik');
      return;
    }
    if (digits.length === 10 && digits.startsWith('5')) {
      phone = `+90${digits}`;
    } else if (digits.length === 11 && digits.startsWith('90')) {
      phone = `+${digits}`;
    } else if (phone && !phone.startsWith('+')) {
      // leave as-is
      phone = phone;
    }

    // Ensure district choice is valid
    if (!KONYA_DISTRICTS.includes(formData.district || '')) {
      setError('Lütfen geçerli bir görev ilçesi seçin');
      return;
    }

    // Build payload with only fields present
    const payload: UpdateProfileRequest = {};
    
    // Add all mandatory fields
    mandatory.forEach((k) => {
      const val = (formData as any)[k];
      if (val !== undefined && val !== null && val !== '') {
        (payload as any)[k] = val;
      }
    });

    // Override with normalized values
    payload.phone = phone;
    payload.tcKimlikNo = tc;

    setSaving(true);

    try {
      const updatedUser = await userService.updateMyProfile(payload);
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

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin w-6 h-6 border-2 border-slate-700 border-t-transparent rounded-full mr-3"></div>
              <span>Profil yükleniyor...</span>
            </div>
          ) : (
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
                    Doğum Tarihi <span className="text-red-500">*</span>
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
                    Cinsiyet <span className="text-red-500">*</span>
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
                    Telefon <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    required
                    aria-required="true"
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

{/* Adres Bilgileri removed per request */}

            {/* Kimlik Bilgileri */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Kimlik Bilgileri
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    TC Kimlik No <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.tcKimlikNo}
                    onChange={(e) => {
                      // Sadece rakam girişine izin ver
                      const value = e.target.value.replace(/\D/g, '');
                      handleChange('tcKimlikNo', value);
                    }}
                    maxLength={11}
                    required
                    aria-required="true"
                    placeholder="11 haneli TC Kimlik No"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Doğum Yeri <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.birthPlace}
                    onChange={(e) => handleChange('birthPlace', e.target.value)}
                    required
                    aria-required="true"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Baba Adı <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fatherName}
                    onChange={(e) => handleChange('fatherName', e.target.value)}
                    required
                    aria-required="true"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Anne Adı <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.motherName}
                    onChange={(e) => handleChange('motherName', e.target.value)}
                    required
                    aria-required="true"
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
                    Eğitim Seviyesi <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.education || ''}
                    onChange={(e) => handleChange('education', e.target.value || undefined)}
                    required
                    aria-required="true"
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
                    Görev İlçesi <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.district || ''}
                    onChange={(e) => handleChange('district', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  >
                    <option value="">Seçiniz</option>
                    {KONYA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kurum Sicil <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.kurumSicil}
                    onChange={(e) => handleChange('kurumSicil', e.target.value)}
                    required
                    aria-required="true"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kadro Unvanı <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.kadroUnvani}
                    onChange={(e) => handleChange('kadroUnvani', e.target.value)}
                    required
                    aria-required="true"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kadro Unvan Kodu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.kadroUnvanKodu}
                    onChange={(e) => handleChange('kadroUnvanKodu', e.target.value)}
                    required
                    aria-required="true"
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
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

