import { useEffect, useState } from 'react';
import { X, Building2 } from 'lucide-react';
import { apiRequest } from '@/utils/api';

interface Branch {
  id: string;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  district?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

interface BranchFormModalProps {
  branch: Branch | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedBranch?: Branch) => void;
}

export default function BranchFormModal({ branch, isOpen, onClose, onSuccess }: BranchFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    district: '',
    phone: '',
    email: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!branch;

  useEffect(() => {
    if (isOpen) {
      if (branch) {
        // Edit mode - mevcut verileri doldur
        setFormData({
          name: branch.name || '',
          code: branch.code || '',
          address: branch.address || '',
          city: branch.city || '',
          district: branch.district || '',
          phone: branch.phone || '',
          email: branch.email || '',
          isActive: branch.isActive !== undefined ? branch.isActive : true,
        });
      } else {
        // Create mode - formu temizle
        setFormData({
          name: '',
          code: '',
          address: '',
          city: '',
          district: '',
          phone: '',
          email: '',
          isActive: true,
        });
      }
      setError(null);
    }
  }, [isOpen, branch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Şube adı zorunludur');
      return;
    }

    try {
      setLoading(true);

      const body: any = {
        name: formData.name.trim(),
      };

      if (formData.code.trim()) body.code = formData.code.trim();
      if (formData.address.trim()) body.address = formData.address.trim();
      if (formData.city.trim()) body.city = formData.city.trim();
      if (formData.district.trim()) body.district = formData.district.trim();
      if (formData.phone.trim()) body.phone = formData.phone.trim();
      if (formData.email.trim()) body.email = formData.email.trim();
      if (isEditMode) body.isActive = formData.isActive;

      if (isEditMode) {
        const response = await apiRequest<{ branch: Branch }>(`/api/branches/${branch!.id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        onSuccess(response.branch);
      } else {
        const response = await apiRequest<{ branch: Branch }>('/api/branches', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        onSuccess(response.branch);
      }

      onClose();
    } catch (err: any) {
      console.error('Error saving branch:', err);
      setError(err.message || 'Şube kaydedilirken bir hata oluştu');
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
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">
                {isEditMode ? 'Şube Düzenle' : 'Yeni Şube Ekle'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Şube Adı */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Şube Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="Örn: Kadıköy Şubesi"
                />
              </div>

              {/* Şube Kodu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Şube Kodu
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Örn: KAD-001"
                />
              </div>

              {/* Şehir */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Şehir
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Örn: İstanbul"
                />
              </div>

              {/* İlçe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İlçe
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Örn: Kadıköy"
                />
              </div>

              {/* Adres */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adres
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Tam adres bilgisi"
                />
              </div>

              {/* Telefon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Örn: 0216 123 45 67"
                />
              </div>

              {/* E-posta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-posta
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Örn: kadikoy@sendika.com"
                />
              </div>

              {/* Aktiflik (sadece düzenleme modunda) */}
              {isEditMode && (
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-slate-700 border-gray-300 rounded focus:ring-slate-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Aktif</span>
                  </label>
                </div>
              )}
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
                disabled={loading}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (isEditMode ? 'Güncelleniyor...' : 'Kaydediliyor...') : (isEditMode ? 'Güncelle' : 'Kaydet')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

