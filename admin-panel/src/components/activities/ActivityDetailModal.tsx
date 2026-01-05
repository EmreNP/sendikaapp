import { useState, useEffect } from 'react';
import { X, Calendar, Tag, Building2, FileText, User, Clock } from 'lucide-react';
import type { Activity, ActivityCategory } from '@/types/activity';

interface ActivityDetailModalProps {
  activity: Activity;
  categories: ActivityCategory[];
  branches?: Array<{ id: string; name: string }>;
  onClose: () => void;
}

export default function ActivityDetailModal({ activity, categories, branches, onClose }: ActivityDetailModalProps) {
  const categoryName = categories.find(c => c.id === activity.categoryId)?.name || 'Bilinmeyen Kategori';
  
  // Branch name bulma
  const branch = branches?.find(b => b.id === activity.branchId);
  const branchName = branch?.name || 'Merkez Şube';
  
  // User names için state
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  
  // User name bulma
  const createdByName = userNames[activity.createdBy] || activity.createdBy;
  const updatedByName = activity.updatedBy ? (userNames[activity.updatedBy] || activity.updatedBy) : null;

  // User bilgilerini çekme
  useEffect(() => {
    const fetchUserNames = async () => {
      const userIds = [activity.createdBy];
      if (activity.updatedBy) {
        userIds.push(activity.updatedBy);
      }
      
      const uniqueUserIds = Array.from(new Set(userIds));
      const newUserNames: Record<string, string> = {};
      
      for (const userId of uniqueUserIds) {
        try {
          // API'den kullanıcı bilgisi çek (örnek implementation)
          const { apiRequest } = await import('@/utils/api');
          const userData = await apiRequest<{ user: { firstName: string; lastName: string } }>(`/api/users/${userId}`);
          if (userData.user) {
            newUserNames[userId] = `${userData.user.firstName} ${userData.user.lastName}`;
          }
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
          newUserNames[userId] = userId; // Hata durumunda ID göster
        }
      }
      
      setUserNames(newUserNames);
    };
    
    fetchUserNames();
  }, [activity.createdBy, activity.updatedBy]);

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const images = activity.images || [];
  const documents = activity.documents || [];

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
            <h2 className="text-sm font-medium text-white">Aktivite Detayı</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Images Grid */}
            {images.length > 0 && (
              <div className="mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {images.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden rounded-lg border border-gray-200 hover:border-gray-300 transition-colors aspect-square"
                    >
                      <img
                        src={url}
                        alt={`Aktivite resmi ${idx + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{activity.name}</h1>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-4 mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(activity.activityDate)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Tag className="w-4 h-4" />
                <span>{categoryName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building2 className="w-4 h-4" />
                <span>{branchName}</span>
              </div>
            </div>

            {/* Description */}
            <div className="prose max-w-none mb-6">
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {activity.description}
              </div>
            </div>

            {/* Documents */}
            {documents.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Dokümanlar
                </h3>
                <div className="space-y-2">
                  {documents.map((url, idx) => {
                    const fileName = url.split('/').pop() || `Doküman ${idx + 1}`;
                    
                    return (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                      >
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span className="flex-1 text-gray-700 truncate">{fileName}</span>
                        <span className="text-gray-400 text-xs">Yeni sekmede aç</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>Oluşturan: {createdByName}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Oluşturulma: {formatDate(activity.createdAt)}</span>
              </div>
              {updatedByName && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>Güncelleyen: {updatedByName}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Güncellenme: {formatDate(activity.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
