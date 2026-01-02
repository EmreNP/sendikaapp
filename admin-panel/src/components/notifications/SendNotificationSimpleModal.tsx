import { useState, useEffect } from 'react';
import { X, Bell, AlertCircle, CheckCircle } from 'lucide-react';
import { notificationService } from '@/services/api/notificationService';
import type { SendNotificationRequest } from '@/services/api/notificationService';
import { NOTIFICATION_TYPE, TARGET_AUDIENCE } from '@shared/constants/notifications';
import type { NotificationType, TargetAudience } from '@shared/constants/notifications';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/utils/api';

interface Branch {
  id: string;
  name: string;
  isActive?: boolean;
}

interface SendNotificationSimpleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  // Pre-filled data
  type: NotificationType;
  contentId: string;
  title: string;
  body: string;
  imageUrl?: string;
}

export default function SendNotificationSimpleModal({
  isOpen,
  onClose,
  onSuccess,
  type,
  contentId,
  title: initialTitle,
  body: initialBody,
  imageUrl,
}: SendNotificationSimpleModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('all');
  const [branchId, setBranchId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);

  // Admin için branch listesini yükle
  useEffect(() => {
    if (isOpen && user?.role === 'admin') {
      fetchBranches();
    }
  }, [isOpen, user]);

  // Modal açıldığında değerleri doldur
  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setBody(initialBody);
      setTargetAudience(user?.role === 'admin' ? 'all' : 'branch');
      setBranchId(user?.role === 'branch_manager' ? user.branchId : undefined);
      setError(null);
      setSuccess(false);
      setResult(null);
    }
  }, [isOpen, initialTitle, initialBody, user]);

  const fetchBranches = async () => {
    try {
      setLoadingBranches(true);
      const data = await apiRequest<{ branches: Branch[] }>('/api/branches');
      setBranches(data.branches || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoadingBranches(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validasyon
    if (!title.trim()) {
      setError('Başlık zorunludur');
      return;
    }

    if (!body.trim()) {
      setError('Mesaj zorunludur');
      return;
    }

    if (title.length > 100) {
      setError('Başlık en fazla 100 karakter olabilir');
      return;
    }

    if (body.length > 500) {
      setError('Mesaj en fazla 500 karakter olabilir');
      return;
    }

    // Branch Manager için branch kontrolü
    if (user?.role === 'branch_manager') {
      if (targetAudience === 'all') {
        setError('Branch manager tüm kullanıcılara bildirim gönderemez');
        return;
      }
      if (targetAudience === 'branch' && !branchId) {
        setError('Şube seçimi zorunludur');
        return;
      }
    }

    // Admin için branch seçimi kontrolü
    if (user?.role === 'admin' && targetAudience === 'branch' && !branchId) {
      setError('Şube seçimi zorunludur');
      return;
    }

    try {
      setLoading(true);

      const requestData: SendNotificationRequest = {
        title: title.trim(),
        body: body.trim(),
        type: type,
        targetAudience: targetAudience,
        contentId: contentId,
        imageUrl: imageUrl,
        branchId: branchId,
      };

      const response = await notificationService.sendNotification(requestData);

      setResult({
        sent: response.sent,
        failed: response.failed,
      });
      setSuccess(true);

      if (onSuccess) {
        onSuccess();
      }

      // 3 saniye sonra modal'ı kapat
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setResult(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error sending notification:', err);
      setError(err.message || 'Bildirim gönderilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isBranchManager = user?.role === 'branch_manager';
  const isAdmin = user?.role === 'admin';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Bildirim Gönder
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {success && result && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                <div className="text-sm font-medium mb-1">✅ Bildirim başarıyla gönderildi!</div>
                <div className="text-sm">
                  Gönderilen: {result.sent}, Başarısız: {result.failed}
                </div>
              </div>
            )}

            {/* Bildirim Tipi (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bildirim Tipi
              </label>
              <input
                type="text"
                value={type === NOTIFICATION_TYPE.NEWS ? 'Haber' : 'Duyuru'}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            {/* Başlık */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Başlık <span className="text-red-500">*</span>
                <span className="text-gray-500 text-xs font-normal ml-2">
                  ({title.length}/100)
                </span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Bildirim başlığı"
                required
              />
            </div>

            {/* Mesaj */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mesaj <span className="text-red-500">*</span>
                <span className="text-gray-500 text-xs font-normal ml-2">
                  ({body.length}/500)
                </span>
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={500}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Bildirim mesajı..."
                required
              />
            </div>

            {/* Hedef Kitle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hedef Kitle <span className="text-red-500">*</span>
              </label>
              <select
                value={targetAudience}
                onChange={(e) => {
                  const audience = e.target.value as TargetAudience;
                  setTargetAudience(audience);
                  if (audience !== 'branch') {
                    setBranchId(undefined);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isBranchManager}
              >
                {isAdmin && (
                  <option value={TARGET_AUDIENCE.ALL}>Tüm Kullanıcılar</option>
                )}
                <option value={TARGET_AUDIENCE.ACTIVE}>Aktif Kullanıcılar</option>
                <option value={TARGET_AUDIENCE.BRANCH}>Belirli Şube</option>
              </select>
              {isBranchManager && (
                <p className="text-xs text-gray-500 mt-1">
                  Branch manager sadece kendi şubesine bildirim gönderebilir
                </p>
              )}
            </div>

            {/* Şube Seçimi (Hedef kitle 'branch' ise) */}
            {targetAudience === 'branch' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Şube <span className="text-red-500">*</span>
                </label>
                {isBranchManager ? (
                  <input
                    type="text"
                    value={user?.branchId || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                ) : (
                  <select
                    value={branchId || ''}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={loadingBranches}
                  >
                    <option value="">Şube Seçin</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading || success}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Gönderiliyor...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Gönderildi
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    Bildirim Gönder
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

