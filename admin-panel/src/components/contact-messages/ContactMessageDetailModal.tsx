import { useEffect, useState, useRef } from 'react';
import { X, User, Tag, Building2, Calendar, CheckCircle, Clock } from 'lucide-react';
import { contactService } from '@/services/api/contactService';
import { apiRequest } from '@/utils/api';
import type { ContactMessage } from '@/types/contact';
import { formatDate, formatRelativeDate } from '@/utils/dateFormatter';
import { logger } from '@/utils/logger';

interface ContactMessageDetailModalProps {
  message: ContactMessage;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  topics?: Array<{ id: string; name: string }>; // Topics listesi (mesaj listesinden)
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
  topics = [],
}: ContactMessageDetailModalProps) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [branchInfo, setBranchInfo] = useState<BranchInfo | null>(null);
  const [topicInfo, setTopicInfo] = useState<TopicInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasMarkedAsReadRef = useRef<string | null>(null);

  useEffect(() => {
    if (isOpen && message) {
      // Reset state when modal opens
      setUserInfo(null);
      setBranchInfo(null);
      setTopicInfo(null);
      
      // Önce mesajda zaten populate edilmiş bilgileri kullan
      if (message.user) {
        setUserInfo({
          firstName: message.user.firstName || '',
          lastName: message.user.lastName || '',
          email: message.user.email || '',
        });
      }
      
      if (message.branch) {
        setBranchInfo({
          name: message.branch.name || '',
        });
      }
      
      if (message.topic) {
        setTopicInfo({
          name: message.topic.name || '',
        });
      } else if (topics.length > 0) {
        // Topics listesinden topic ismini bul
        const topic = topics.find(t => t.id === message.topicId);
        if (topic) {
          setTopicInfo({
            name: topic.name || '',
          });
        }
      }
      
      // Eksik bilgileri API'den çek
      fetchRelatedData();
      
      // Mesaj okunmamışsa ve daha önce işaretlenmemişse otomatik olarak okundu işaretle
      // Rate limiting'i önlemek için biraz gecikme ekle
      if (!message.isRead && hasMarkedAsReadRef.current !== message.id) {
        setTimeout(() => {
          markAsReadAutomatically();
        }, 500); // 500ms gecikme
      }
    } else if (!isOpen) {
      // Modal kapandığında ref'i resetle
      hasMarkedAsReadRef.current = null;
    }
  }, [isOpen, message?.id]);

  const markAsReadAutomatically = async () => {
    if (!message || hasMarkedAsReadRef.current === message.id || message.isRead) {
      return; // Prevent multiple calls or if already read
    }
    
    try {
      hasMarkedAsReadRef.current = message.id;
      await contactService.markMessageAsRead(message.id, true);
      // Mesajı güncelle ve sayfayı yenile
      onUpdate();
    } catch (err: any) {
      logger.error('Error marking message as read:', err);
      // Rate limiting hatası ise ref'i sıfırlama, diğer hatalar için sıfırla
      if (err.message && err.message.includes('Çok fazla istek')) {
        // Rate limiting - bir sonraki açılışta tekrar dene
        logger.warn('Rate limit reached, will retry on next open');
      } else {
        hasMarkedAsReadRef.current = null; // Reset on other errors
      }
      // Hata olsa bile devam et
    }
  };

  const fetchRelatedData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // User bilgisini getir (sadece mesajda yoksa)
      if (message.userId && !message.user) {
        try {
          const response = await apiRequest<{ user: UserInfo }>(`/api/users/${message.userId}`);
          if (response?.user) {
            setUserInfo({
              firstName: response.user.firstName || '',
              lastName: response.user.lastName || '',
              email: response.user.email || '',
            });
          }
        } catch (err: any) {
          // 500 hatası veya rate limiting hatası ise sessizce devam et
          if (err.code !== 'INTERNAL_SERVER_ERROR' && !err.message?.includes('Çok fazla istek')) {
            logger.error('Error fetching user:', err);
          }
          // Hata durumunda sessizce devam et
        }
      }

      // Branch bilgisini getir (sadece mesajda yoksa)
      if (message.branchId && !message.branch) {
        try {
          const response = await apiRequest<{ branch: BranchInfo }>(`/api/branches/${message.branchId}`);
          if (response?.branch) {
            setBranchInfo({
              name: response.branch.name || '',
            });
          }
        } catch (err: any) {
          // 500 hatası veya rate limiting hatası ise sessizce devam et
          if (err.code !== 'INTERNAL_SERVER_ERROR' && !err.message?.includes('Çok fazla istek')) {
            logger.error('Error fetching branch:', err);
          }
          // Hata durumunda sessizce devam et
        }
      }

      // Topic bilgisini getir (sadece mesajda ve topics listesinde yoksa)
      if (message.topicId && !message.topic) {
        // Önce topics listesinden kontrol et
        const topicFromList = topics.find(t => t.id === message.topicId);
        if (topicFromList) {
          setTopicInfo({
            name: topicFromList.name || '',
          });
        } else {
          // Topics listesinde yoksa API'den çek
          try {
            const topicData = await contactService.getTopicById(message.topicId);
            if (topicData?.topic) {
              setTopicInfo({
                name: topicData.topic.name || '',
              });
            }
          } catch (err: any) {
            logger.error('Error fetching topic:', err);
            // Hata durumunda sessizce devam et
          }
        }
      }
    } catch (err: any) {
      logger.error('Error fetching related data:', err);
      // Hata durumunda sessizce devam et, kullanıcıya gösterme
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
      logger.error('Error updating message:', err);
      setError(err.message || 'Mesaj güncellenirken bir hata oluştu');
    } finally {
      setUpdating(false);
    }
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
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Konu</label>
                    <p className="text-sm text-gray-900 font-medium">
                      {topicInfo?.name || message.topic?.name || '-'}
                    </p>
                  </div>
                </div>

                {/* User */}
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Gönderen</label>
                    {userInfo || message.user ? (
                      <>
                        <p className="text-sm text-gray-900 font-medium">
                          {(userInfo || message.user)?.firstName} {(userInfo || message.user)?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{(userInfo || message.user)?.email}</p>
                      </>
                    ) : loading ? (
                      <p className="text-sm text-gray-400">Yükleniyor...</p>
                    ) : (
                      <p className="text-sm text-gray-900">-</p>
                    )}
                  </div>
                </div>

                {/* Branch */}
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Şube</label>
                    <p className="text-sm text-gray-900 font-medium">
                      {branchInfo?.name || message.branch?.name || '-'}
                    </p>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Gönderilme Tarihi</label>
                    <p className="text-sm text-gray-900 font-medium">{formatDate(message.createdAt)}</p>
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
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

