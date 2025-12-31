import { useEffect, useState } from 'react';
import { X, User, Tag, Building2, Calendar, CheckCircle, Clock } from 'lucide-react';
import { contactService } from '@/services/api/contactService';
import { apiRequest } from '@/utils/api';
import type { ContactMessage } from '@/types/contact';

interface ContactMessageDetailModalProps {
  message: ContactMessage;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
}

interface BranchInfo {
  name: string;
}

interface TopicInfo {
  name: string;
}

export default function ContactMessageDetailModal({
  message,
  isOpen,
  onClose,
  onUpdate,
}: ContactMessageDetailModalProps) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [branchInfo, setBranchInfo] = useState<BranchInfo | null>(null);
  const [topicInfo, setTopicInfo] = useState<TopicInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && message) {
      fetchRelatedData();
    }
  }, [isOpen, message]);

  const fetchRelatedData = async () => {
    try {
      setLoading(true);
      
      // User bilgisini getir
      if (message.userId) {
        try {
          const userData = await apiRequest<{ user: UserInfo }>(`/api/users/${message.userId}`);
          setUserInfo(userData.user);
        } catch (err) {
          console.error('Error fetching user:', err);
        }
      }

      // Branch bilgisini getir
      if (message.branchId) {
        try {
          const branchData = await apiRequest<{ branch: BranchInfo }>(`/api/branches/${message.branchId}`);
          setBranchInfo(branchData.branch);
        } catch (err) {
          console.error('Error fetching branch:', err);
        }
      }

      // Topic bilgisini getir
      if (message.topicId) {
        try {
          const topicData = await contactService.getTopicById(message.topicId);
          setTopicInfo(topicData.topic);
        } catch (err) {
          console.error('Error fetching topic:', err);
        }
      }
    } catch (err: any) {
      console.error('Error fetching related data:', err);
      setError('İlgili bilgiler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (isRead: boolean) => {
    try {
      setUpdating(true);
      setError(null);
      await contactService.markMessageAsRead(message.id, isRead);
      onUpdate();
    } catch (err: any) {
      console.error('Error updating message:', err);
      setError(err.message || 'Mesaj güncellenirken bir hata oluştu');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (date: string | Date | { seconds?: number; nanoseconds?: number; _seconds?: number; _nanoseconds?: number } | undefined) => {
    if (!date) return '-';
    
    let d: Date;
    
    // Firestore Timestamp formatını kontrol et ({ seconds, nanoseconds } veya { _seconds, _nanoseconds })
    if (typeof date === 'object' && ('seconds' in date || '_seconds' in date)) {
      const seconds = (date as any).seconds || (date as any)._seconds || 0;
      d = new Date(seconds * 1000);
    } else if (typeof date === 'string') {
      d = new Date(date);
    } else if (date instanceof Date) {
      d = date;
    } else {
      return '-';
    }
    
    // Geçerli bir tarih olup olmadığını kontrol et
    if (isNaN(d.getTime())) {
      return '-';
    }
    
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  const formatRelativeDate = (date: string | Date | { seconds?: number; nanoseconds?: number; _seconds?: number; _nanoseconds?: number } | undefined) => {
    if (!date) return '-';
    
    let d: Date;
    
    // Firestore Timestamp formatını kontrol et ({ seconds, nanoseconds } veya { _seconds, _nanoseconds })
    if (typeof date === 'object' && ('seconds' in date || '_seconds' in date)) {
      const seconds = (date as any).seconds || (date as any)._seconds || 0;
      d = new Date(seconds * 1000);
    } else if (typeof date === 'string') {
      d = new Date(date);
    } else if (date instanceof Date) {
      d = date;
    } else {
      return '-';
    }
    
    // Geçerli bir tarih olup olmadığını kontrol et
    if (isNaN(d.getTime())) {
      return '-';
    }
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Az önce';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dakika önce`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat önce`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} gün önce`;
    
    return formatDate(date);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200 bg-slate-700">
          <h2 className="text-sm font-medium text-white">Mesaj Detayı</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
          ) : (
            <>
              {/* Message Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {message.isRead ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-600">Okundu</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5 text-orange-600" />
                      <span className="text-sm font-medium text-orange-600">Okunmadı</span>
                    </>
                  )}
                </div>
                {message.isRead && message.readAt && (
                  <span className="text-xs text-gray-500">
                    {formatRelativeDate(message.readAt)}
                  </span>
                )}
              </div>

              {/* Message Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mesaj</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[150px]">
                  <p className="text-gray-900 whitespace-pre-wrap">{message.message}</p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Topic */}
                <div className="flex items-start gap-3">
                  <Tag className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Konu</label>
                    <p className="text-sm text-gray-900">{topicInfo?.name || '-'}</p>
                  </div>
                </div>

                {/* User */}
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Gönderen</label>
                    <p className="text-sm text-gray-900">
                      {userInfo
                        ? `${userInfo.firstName} ${userInfo.lastName}`
                        : '-'}
                    </p>
                    {userInfo && (
                      <p className="text-xs text-gray-500">{userInfo.email}</p>
                    )}
                  </div>
                </div>

                {/* Branch */}
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Şube</label>
                    <p className="text-sm text-gray-900">{branchInfo?.name || '-'}</p>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Gönderilme Tarihi</label>
                    <p className="text-sm text-gray-900">{formatDate(message.createdAt)}</p>
                    <p className="text-xs text-gray-500">{formatRelativeDate(message.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Kapat
                </button>
                {!message.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(true)}
                    disabled={updating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {updating ? 'İşaretleniyor...' : 'Okundu İşaretle'}
                  </button>
                )}
                {message.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(false)}
                    disabled={updating}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    {updating ? 'İşaretleniyor...' : 'Okunmadı İşaretle'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

