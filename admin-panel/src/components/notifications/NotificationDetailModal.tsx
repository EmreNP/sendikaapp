import { X, Calendar, Users, Building2, CheckCircle, XCircle, Bell, FileText } from 'lucide-react';
import type { NotificationHistory } from '@/services/api/notificationService';
import { formatDate } from '@/utils/dateFormatter';

interface NotificationDetailModalProps {
  notification: NotificationHistory | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDetailModal({
  notification,
  isOpen,
  onClose,
}: NotificationDetailModalProps) {
  if (!isOpen || !notification) return null;

  const getTargetAudienceLabel = (audience: string): string => {
    switch (audience) {
      case 'all':
        return 'Tüm Kullanıcılar';
      case 'active':
        return 'Aktif Kullanıcılar';
      case 'branch':
        return 'Belirli Şube';
      default:
        return audience;
    }
  };

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
              Bildirim Detayı
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Başlık */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Başlık
              </label>
              <div className="text-base text-gray-900 font-medium">
                {notification.title}
              </div>
            </div>

            {/* Mesaj */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mesaj
              </label>
              <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-200">
                {notification.body}
              </div>
            </div>

            {/* Görsel */}
            {notification.imageUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Görsel
                </label>
                <img
                  src={notification.imageUrl}
                  alt={notification.title}
                  className="max-w-full h-auto rounded-lg border border-gray-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Bilgi Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tip */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bildirim Tipi
                </label>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-sm font-medium rounded ${
                    notification.type === 'news'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {notification.type === 'news' ? 'Haber' : 'Duyuru'}
                  </span>
                </div>
              </div>

              {/* Hedef Kitle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hedef Kitle
                </label>
                <div className="flex items-center gap-2 text-sm text-gray-900">
                  <Users className="w-4 h-4 text-gray-400" />
                  {getTargetAudienceLabel(notification.targetAudience)}
                </div>
              </div>

              {/* Şube */}
              {notification.branch && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Şube
                  </label>
                  <div className="flex items-center gap-2 text-sm text-gray-900">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    {notification.branch.name}
                  </div>
                </div>
              )}

              {/* Tarih */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gönderim Tarihi
                </label>
                <div className="flex items-center gap-2 text-sm text-gray-900">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {formatDate(notification.createdAt)}
                </div>
              </div>

              {/* Gönderen */}
              {notification.sentByUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gönderen
                  </label>
                  <div className="text-sm text-gray-900">
                    {notification.sentByUser.firstName} {notification.sentByUser.lastName}
                  </div>
                </div>
              )}

              {/* İçerik ID */}
              {notification.contentId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İçerik ID
                  </label>
                  <div className="text-sm text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-200">
                    {notification.contentId}
                  </div>
                </div>
              )}
            </div>

            {/* Sonuçlar */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Gönderim Sonuçları
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {notification.sentCount}
                    </div>
                    <div className="text-xs text-gray-600">Başarılı</div>
                  </div>
                </div>
                {notification.failedCount > 0 && (
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        {notification.failedCount}
                      </div>
                      <div className="text-xs text-gray-600">Başarısız</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

