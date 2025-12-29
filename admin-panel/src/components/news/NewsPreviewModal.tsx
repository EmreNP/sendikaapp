import { useState, useEffect } from 'react';
import { X, Newspaper, Calendar, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import type { News } from '@/types/news';
import { authService } from '@/services/auth/authService';
import type { User } from '@/types/user';

interface NewsPreviewModalProps {
  news: News | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function NewsPreviewModal({ news, isOpen, onClose }: NewsPreviewModalProps) {
  const [createdByUser, setCreatedByUser] = useState<User | null>(null);

  useEffect(() => {
    if (news?.createdBy) {
      authService.getUserData(news.createdBy).then((user) => {
        if (user) setCreatedByUser(user);
      });
    }
  }, [news?.createdBy]);

  if (!isOpen || !news) return null;

  const formatDate = (date: string | Date | { seconds?: number; nanoseconds?: number } | undefined) => {
    if (!date) return '-';
    
    let d: Date;
    
    // Firestore timestamp formatı kontrolü
    if (typeof date === 'object' && 'seconds' in date && date.seconds) {
      d = new Date(date.seconds * 1000 + (date.nanoseconds || 0) / 1000000);
    } else if (typeof date === 'string' || date instanceof Date) {
      d = new Date(date);
    } else {
      return '-';
    }
    
    // Invalid date kontrolü
    if (isNaN(d.getTime())) {
      return '-';
    }
    
    return d.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Newspaper className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Haber Önizleme</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Görsel */}
            {news.imageUrl && (
              <div className="mb-6">
                <img
                  src={news.imageUrl}
                  alt={news.title}
                  className="w-full h-64 object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Başlık */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{news.title}</h1>

            {/* Meta Bilgiler */}
            <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Oluşturulma: {formatDate(news.createdAt)}</span>
              </div>
              {news.publishedAt && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Yayınlanma: {formatDate(news.publishedAt)}</span>
                </div>
              )}
              {createdByUser && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <UserIcon className="w-4 h-4" />
                  <span>Oluşturan: {createdByUser.firstName} {createdByUser.lastName}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                {news.isPublished ? (
                  <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800 flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    Yayında
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700 flex items-center gap-1">
                    <EyeOff className="w-3 h-3" />
                    Taslak
                  </span>
                )}
              </div>
            </div>

            {/* İçerik */}
            <div className="mb-6">
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: news.content || '' }}
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

