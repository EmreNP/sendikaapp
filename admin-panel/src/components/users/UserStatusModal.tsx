import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { apiRequest } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

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
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedStatus(currentStatus);
      setNote('');
      setRejectionReason('');
      setError(null);
    }
  }, [isOpen, currentStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (selectedStatus === 'rejected' && !rejectionReason) {
      setError('Reddetme nedeni zorunludur');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const body: { status: string; note?: string; rejectionReason?: string } = { 
        status: selectedStatus 
      };
      
      if (note) body.note = note;
      if (selectedStatus === 'rejected' && rejectionReason) {
        body.rejectionReason = rejectionReason;
      }

      await apiRequest(`/api/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating user status:', err);
      setError(err.message || 'Durum güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
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
    
    // Branch Manager sadece pending_branch_review durumundan değişiklik yapabilir
    if (userRole === 'branch_manager') {
      if (currentStatus === 'pending_branch_review') {
        return [
          { value: 'pending_details', label: 'Detaylar Bekleniyor' },
          { value: 'active', label: 'Aktif' },
          { value: 'rejected', label: 'Reddedildi' },
        ];
      }
    }
    
    // Varsayılan
    return [
      { value: currentStatus, label: getStatusLabel(currentStatus) },
    ];
  };

  if (!isOpen) return null;

  const availableStatuses = getAvailableStatuses();
  const showRejectionReason = selectedStatus === 'rejected';

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
                    if (e.target.value !== 'rejected') {
                      setRejectionReason('');
                    }
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

              {/* Rejection Reason (only for rejected status) */}
              {showRejectionReason && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reddetme Nedeni <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    required
                    placeholder="Reddetme nedenini açıklayın..."
                  />
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
    </div>
  );
}
