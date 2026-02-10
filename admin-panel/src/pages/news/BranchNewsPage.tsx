import { useState, useEffect } from 'react';
import { Newspaper, Megaphone, Search, Bell, User, X, Eye, EyeOff, Plus } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { newsService } from '@/services/api/newsService';
import { announcementService } from '@/services/api/announcementService';
import { authService } from '@/services/auth/authService';
import SendNotificationSimpleModal from '@/components/notifications/SendNotificationSimpleModal';
import NewsPreviewModal from '@/components/news/NewsPreviewModal';
import ActionButton from '@/components/common/ActionButton';
import AnnouncementFormModal from '@/components/announcements/AnnouncementFormModal';
import type { News } from '@/types/news';
import type { Announcement } from '@/types/announcement';
import type { User as UserType } from '@/types/user';
import type { NotificationType } from '@shared/constants/notifications';

type TabType = 'news' | 'announcements';

export default function BranchNewsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('news');
  
  // News states
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userCache, setUserCache] = useState<Record<string, UserType>>({});
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [isNewsPreviewModalOpen, setIsNewsPreviewModalOpen] = useState(false);
  
  // Announcements states
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState<string | null>(null);
  const [announcementsSearchTerm, setAnnouncementsSearchTerm] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isAnnouncementPreviewModalOpen, setIsAnnouncementPreviewModalOpen] = useState(false);
  const [isAnnouncementFormModalOpen, setIsAnnouncementFormModalOpen] = useState(false);
  
  // Notification modal states
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationData, setNotificationData] = useState<{
    type: NotificationType;
    contentId: string;
    title: string;
    body: string;
    imageUrl?: string;
  } | null>(null);

  useEffect(() => {
    if (activeTab === 'news') {
      fetchNews();
    } else {
      fetchAnnouncements();
    }
  }, [activeTab, searchTerm, announcementsSearchTerm]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await newsService.getNews({
        page: 1,
        limit: 100,
        isPublished: true, // Sadece yayındakiler
        search: searchTerm || undefined,
      });

      setNews(data.news || []);

      // Kullanıcı bilgilerini cache'le
      const uniqueUserIds = new Set<string>();
      data.news?.forEach((item) => {
        if (item.createdBy) uniqueUserIds.add(item.createdBy);
      });

      // Cache'de olmayan kullanıcıları getir
      const userIdsToFetch = Array.from(uniqueUserIds).filter(uid => !userCache[uid]);
      
      if (userIdsToFetch.length > 0) {
        const userPromises = userIdsToFetch.map(async (uid) => {
          try {
            const userData = await authService.getUserData(uid);
            return userData ? { uid, user: userData } : null;
          } catch (error) {
            console.error(`Error fetching user ${uid}:`, error);
            return null;
          }
        });

        const userResults = await Promise.all(userPromises);
        const newUserCache: Record<string, UserType> = {};
        userResults.forEach((result) => {
          if (result) {
            newUserCache[result.uid] = result.user;
          }
        });

        setUserCache(prev => ({ ...prev, ...newUserCache }));
      }
    } catch (error: any) {
      console.error('❌ Error fetching news:', error);
      setError(error.message || 'Haberler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setAnnouncementsLoading(true);
      setAnnouncementsError(null);

      const data = await announcementService.getAnnouncements({
        page: 1,
        limit: 100,
        isPublished: true, // Sadece yayındakiler
        search: announcementsSearchTerm || undefined,
      });

      setAnnouncements(data.announcements || []);

      // Kullanıcı bilgilerini cache'le
      const uniqueUserIds = new Set<string>();
      data.announcements?.forEach((item) => {
        if (item.createdBy) uniqueUserIds.add(item.createdBy);
      });

      // Cache'de olmayan kullanıcıları getir
      const userIdsToFetch = Array.from(uniqueUserIds).filter(uid => !userCache[uid]);
      
      if (userIdsToFetch.length > 0) {
        const userPromises = userIdsToFetch.map(async (uid) => {
          try {
            const userData = await authService.getUserData(uid);
            return userData ? { uid, user: userData } : null;
          } catch (error) {
            console.error(`Error fetching user ${uid}:`, error);
            return null;
          }
        });

        const userResults = await Promise.all(userPromises);
        const newUserCache: Record<string, UserType> = {};
        userResults.forEach((result) => {
          if (result) {
            newUserCache[result.uid] = result.user;
          }
        });

        setUserCache(prev => ({ ...prev, ...newUserCache }));
      }
    } catch (error: any) {
      console.error('❌ Error fetching announcements:', error);
      setAnnouncementsError(error.message || 'Duyurular yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
      setAnnouncements([]);
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  const getUserName = (uid: string | undefined): string => {
    if (!uid) return '-';
    const user = userCache[uid];
    if (user) {
      return `${user.firstName} ${user.lastName}`;
    }
    return 'Yükleniyor...';
  };

  // HTML içeriğinden düz metin çıkar ve kısalt
  const extractPlainText = (html: string, maxLength: number = 200): string => {
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.textContent || div.innerText || '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Bildirim gönderme modalını aç
  const handleOpenNotificationModal = (item: News | Announcement, type: NotificationType) => {
    const content = 'content' in item ? item.content : '';
    const body = content ? extractPlainText(content, 200) : item.title;
    
    setNotificationData({
      type,
      contentId: item.id,
      title: item.title,
      body,
      imageUrl: item.imageUrl,
    });
    setIsNotificationModalOpen(true);
  };

  const formatDate = (date: string | Date | { seconds?: number; nanoseconds?: number } | undefined) => {
    if (!date) return '-';
    
    let d: Date;
    
    // Firestore timestamp formatı kontrolü
    if (typeof date === 'object' && 'seconds' in date && date.seconds) {
      d = new Date(date.seconds * 1000 + ((date.nanoseconds || 0) / 1000000));
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredNews = news.filter((item) => {
    const matchesSearch =
      searchTerm === '' ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredAnnouncements = announcements.filter((item) => {
    const matchesSearch =
      announcementsSearchTerm === '' ||
      item.title.toLowerCase().includes(announcementsSearchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleNewsRowClick = (newsItem: News) => {
    setSelectedNews(newsItem);
    setIsNewsPreviewModalOpen(true);
  };

  const handleAnnouncementRowClick = (announcementItem: Announcement) => {
    setSelectedAnnouncement(announcementItem);
    setIsAnnouncementPreviewModalOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-end">
          {activeTab === 'announcements' && (
            <button
              onClick={() => {
                setSelectedAnnouncement(null);
                setIsAnnouncementFormModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Yeni Duyuru
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('news')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'news'
                  ? 'border-slate-700 text-slate-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Newspaper className="w-4 h-4" />
                Haberler
              </div>
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'announcements'
                  ? 'border-slate-700 text-slate-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4" />
                Duyurular
              </div>
            </button>
          </nav>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === 'news' ? 'Haber ara...' : 'Duyuru ara...'}
              value={activeTab === 'news' ? searchTerm : announcementsSearchTerm}
              onChange={(e) => activeTab === 'news' ? setSearchTerm(e.target.value) : setAnnouncementsSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Error Message */}
        {(activeTab === 'news' ? error : announcementsError) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-red-800">{activeTab === 'news' ? error : announcementsError}</p>
              <button
                onClick={() => activeTab === 'news' ? setError(null) : setAnnouncementsError(null)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'news' ? (
          /* News Table */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Yükleniyor...</p>
              </div>
            ) : filteredNews.length === 0 ? (
              <div className="p-8 text-center">
                <Newspaper className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Haber bulunamadı</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Başlık
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Yayınlanma
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Oluşturan
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredNews.map((item) => (
                      <tr 
                        key={item.id} 
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleNewsRowClick(item)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900">
                              {item.title}
                            </div>
                            {item.isFeatured && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded bg-yellow-100 text-yellow-800">
                                Öne Çıkan
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded ${
                              item.isPublished
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {item.isPublished ? 'Yayında' : 'Taslak'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-600">
                            {item.publishedAt ? formatDate(item.publishedAt) : '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>{getUserName(item.createdBy)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <ActionButton
                              icon={Bell}
                              variant="custom"
                              onClick={() => handleOpenNotificationModal(item, 'news')}
                              title="Bildirim Gönder"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Announcements Table */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {announcementsLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Yükleniyor...</p>
              </div>
            ) : filteredAnnouncements.length === 0 ? (
              <div className="p-8 text-center">
                <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Duyuru bulunamadı</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Başlık
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Yayınlanma
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Oluşturan
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAnnouncements.map((item) => (
                      <tr 
                        key={item.id} 
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleAnnouncementRowClick(item)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900">
                              {item.title}
                            </div>
                            {item.isFeatured && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded bg-yellow-100 text-yellow-800">
                                Öne Çıkan
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded ${
                              item.isPublished
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {item.isPublished ? 'Yayında' : 'Taslak'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-600">
                            {item.publishedAt ? formatDate(item.publishedAt) : '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>{getUserName(item.createdBy)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <ActionButton
                              icon={Bell}
                              variant="custom"
                              onClick={() => handleOpenNotificationModal(item, 'announcement')}
                              title="Bildirim Gönder"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* News Preview Modal */}
        <NewsPreviewModal
          news={selectedNews}
          isOpen={isNewsPreviewModalOpen}
          onClose={() => {
            setIsNewsPreviewModalOpen(false);
            setSelectedNews(null);
          }}
        />

        {/* Announcement Preview Modal */}
        {isAnnouncementPreviewModalOpen && selectedAnnouncement && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => {
                setIsAnnouncementPreviewModalOpen(false);
                setSelectedAnnouncement(null);
              }}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200 bg-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Megaphone className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Duyuru Önizleme</h2>
                  </div>
                  <button
                    onClick={() => {
                      setIsAnnouncementPreviewModalOpen(false);
                      setSelectedAnnouncement(null);
                    }}
                    className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Görsel */}
                  {selectedAnnouncement.imageUrl && (
                    <div className="mb-6">
                      <img
                        src={selectedAnnouncement.imageUrl}
                        alt={selectedAnnouncement.title}
                        className="w-full h-64 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Başlık */}
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedAnnouncement.title}</h1>

                  {/* Meta Bilgiler */}
                  <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      {selectedAnnouncement.isPublished ? (
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
                    {selectedAnnouncement.isFeatured && (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800">
                        Öne Çıkan
                      </span>
                    )}
                  </div>

                  {/* İçerik veya Dış Link */}
                  {selectedAnnouncement.content && (
                    <div className="mb-6">
                      <div
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: selectedAnnouncement.content }}
                      />
                    </div>
                  )}
                  {selectedAnnouncement.externalUrl && (
                    <div className="mb-6">
                      <p className="text-gray-700 mb-2">
                        <strong>Dış Link:</strong>
                      </p>
                      <a
                        href={selectedAnnouncement.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {selectedAnnouncement.externalUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Announcement Form Modal */}
        <AnnouncementFormModal
          announcement={null}
          isOpen={isAnnouncementFormModalOpen}
          onClose={() => {
            setIsAnnouncementFormModalOpen(false);
          }}
          onSuccess={() => {
            setIsAnnouncementFormModalOpen(false);
            fetchAnnouncements();
          }}
        />

        {/* Notification Modal */}
        {isNotificationModalOpen && notificationData && (
          <SendNotificationSimpleModal
            isOpen={isNotificationModalOpen}
            type={notificationData.type}
            contentId={notificationData.contentId}
            title={notificationData.title}
            body={notificationData.body}
            imageUrl={notificationData.imageUrl}
            onClose={() => {
              setIsNotificationModalOpen(false);
              setNotificationData(null);
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}
