import { useState, useEffect } from 'react';
import { Newspaper, Plus, Search, Trash2, Edit, Eye, EyeOff, User, Megaphone, X, XCircle, CheckCircle, Bell } from 'lucide-react';
import DOMPurify from 'dompurify';
import AdminLayout from '@/components/layout/AdminLayout';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ActionButton from '@/components/common/ActionButton';
import NewsFormModal from '@/components/news/NewsFormModal';
import NewsPreviewModal from '@/components/news/NewsPreviewModal';
import AnnouncementFormModal from '@/components/announcements/AnnouncementFormModal';
import SendNotificationSimpleModal from '@/components/notifications/SendNotificationSimpleModal';
import { newsService } from '@/services/api/newsService';
import { announcementService } from '@/services/api/announcementService';
import { authService } from '@/services/auth/authService';
import { useAuth } from '@/context/AuthContext';
import type { News } from '@/types/news';
import type { Announcement } from '@/types/announcement';
import type { User as UserType } from '@/types/user';
import type { NotificationType } from '@shared/constants/notifications';
import { logger } from '@/utils/logger';

type TabType = 'news' | 'announcements';

export default function NewsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('news');
  
  // Rol bazlı yetkilendirme: admin ve superadmin oluşturabilir
  const canCreateNews = user?.role === 'admin' || user?.role === 'superadmin';
  const canCreateAnnouncement = user?.role === 'admin' || user?.role === 'superadmin';
  
  // News states
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [filterPublished, setFilterPublished] = useState<boolean | null>(null);
  const [filterFeatured, setFilterFeatured] = useState<boolean | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(25);
  const [userCache, setUserCache] = useState<Record<string, UserType>>({});
  const [selectedNewsIds, setSelectedNewsIds] = useState<Set<string>>(new Set());
  
  // Announcements states
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState<string | null>(null);
  const [announcementsSearchTerm, setAnnouncementsSearchTerm] = useState('');
  const [announcementsProcessing, setAnnouncementsProcessing] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isAnnouncementFormModalOpen, setIsAnnouncementFormModalOpen] = useState(false);
  const [isAnnouncementPreviewModalOpen, setIsAnnouncementPreviewModalOpen] = useState(false);
  const [announcementsFilterPublished, setAnnouncementsFilterPublished] = useState<boolean | null>(null);
  const [announcementsFilterFeatured, setAnnouncementsFilterFeatured] = useState<boolean | null>(null);
  const [announcementsPage, setAnnouncementsPage] = useState(1);
  const [announcementsTotal, setAnnouncementsTotal] = useState(0);
  const [announcementsLimit] = useState(25);
  const [selectedAnnouncementIds, setSelectedAnnouncementIds] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'warning',
    onConfirm: () => {},
  });

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
  }, [activeTab, page, filterPublished, filterFeatured, searchTerm, announcementsPage, announcementsFilterPublished, announcementsFilterFeatured, announcementsSearchTerm]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await newsService.getNews({
        page,
        limit: 25,
        isPublished: filterPublished ?? undefined,
        isFeatured: filterFeatured ?? undefined,
        search: searchTerm || undefined,
      });

      setNews(data.news || []);
      setTotal(data.total || 0);

      // Kullanıcı bilgilerini cache'le
      const uniqueUserIds = new Set<string>();
      data.news?.forEach((item) => {
        if (item.createdBy) uniqueUserIds.add(item.createdBy);
        if (item.updatedBy) uniqueUserIds.add(item.updatedBy);
      });

      // Cache'de olmayan kullanıcıları getir
      const userIdsToFetch = Array.from(uniqueUserIds).filter(uid => !userCache[uid]);
      
      if (userIdsToFetch.length > 0) {
        const userPromises = userIdsToFetch.map(async (uid) => {
          try {
            const userData = await authService.getUserData(uid);
            return userData ? { uid, user: userData } : null;
          } catch (error) {
            logger.error(`Error fetching user ${uid}:`, error);
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
      logger.error('❌ Error fetching news:', error);
      setError(error.message || 'Haberler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
      setNews([]);
    } finally {
      setLoading(false);
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNewsIds(new Set(news.map(n => n.id)));
    } else {
      setSelectedNewsIds(new Set());
    }
  };

  const handleSelectNews = (newsId: string, checked: boolean) => {
    const newSelected = new Set(selectedNewsIds);
    if (checked) {
      newSelected.add(newsId);
    } else {
      newSelected.delete(newsId);
    }
    setSelectedNewsIds(newSelected);
  };

  const handleDeleteNews = async (newsId: string) => {
    try {
      setProcessing(true);
      await newsService.deleteNews(newsId);
      setNews(prev => prev.filter(n => n.id !== newsId));
      setSelectedNewsIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(newsId);
        return newSet;
      });
    } catch (error: any) {
      logger.error('Error deleting news:', error);
      setError(error.message || 'Haber silinirken bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const handleTogglePublished = async (newsId: string, currentPublished: boolean) => {
    try {
      setProcessing(true);
      await newsService.updateNews(newsId, {
        isPublished: !currentPublished,
      });
      await fetchNews();
    } catch (error: any) {
      logger.error('Error toggling published:', error);
      setError(error.message || 'Haber durumu güncellenirken bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setProcessing(true);
      const newsIds = Array.from(selectedNewsIds);

      const result = await newsService.bulkAction('delete', newsIds);

      if (result.failureCount > 0) {
        setError(`${result.failureCount} haber silinirken hata oluştu`);
      }

      // Başarılı olanları state'den kaldır
      if (result.successCount > 0) {
        setNews(prev => prev.filter(n => !newsIds.includes(n.id)));
      }

      setSelectedNewsIds(new Set());
    } catch (error: any) {
      logger.error('Error bulk deleting news:', error);
      setError(error.message || 'Toplu silme işlemi sırasında bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkPublish = async () => {
    try {
      setProcessing(true);
      const newsIds = Array.from(selectedNewsIds);

      const result = await newsService.bulkAction('publish', newsIds);

      if (result.failureCount > 0) {
        setError(`${result.failureCount} haber yayınlanırken hata oluştu`);
      }

      await fetchNews();
      setSelectedNewsIds(new Set());
    } catch (error: any) {
      logger.error('Error bulk publishing news:', error);
      setError(error.message || 'Toplu yayınlama işlemi sırasında bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkUnpublish = async () => {
    try {
      setProcessing(true);
      const newsIds = Array.from(selectedNewsIds);

      const result = await newsService.bulkAction('unpublish', newsIds);

      if (result.failureCount > 0) {
        setError(`${result.failureCount} haber yayından kaldırılırken hata oluştu`);
      }

      await fetchNews();
      setSelectedNewsIds(new Set());
    } catch (error: any) {
      logger.error('Error bulk unpublishing news:', error);
      setError(error.message || 'Toplu yayından kaldırma işlemi sırasında bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  // Announcements functions
  const fetchAnnouncements = async () => {
    try {
      setAnnouncementsLoading(true);
      setAnnouncementsError(null);

      const data = await announcementService.getAnnouncements({
        page: announcementsPage,
        limit: 25,
        isPublished: announcementsFilterPublished ?? undefined,
        isFeatured: announcementsFilterFeatured ?? undefined,
        search: announcementsSearchTerm || undefined,
      });

      setAnnouncements(data.announcements || []);
      setAnnouncementsTotal(data.total || 0);

      // Kullanıcı bilgilerini cache'le
      const uniqueUserIds = new Set<string>();
      data.announcements?.forEach((item) => {
        if (item.createdBy) uniqueUserIds.add(item.createdBy);
        if (item.updatedBy) uniqueUserIds.add(item.updatedBy);
      });

      // Cache'de olmayan kullanıcıları getir
      const userIdsToFetch = Array.from(uniqueUserIds).filter(uid => !userCache[uid]);
      
      if (userIdsToFetch.length > 0) {
        const userPromises = userIdsToFetch.map(async (uid) => {
          try {
            const userData = await authService.getUserData(uid);
            return userData ? { uid, user: userData } : null;
          } catch (error) {
            logger.error(`Error fetching user ${uid}:`, error);
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
      logger.error('❌ Error fetching announcements:', error);
      setAnnouncementsError(error.message || 'Duyurular yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
      setAnnouncements([]);
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  const handleSelectAllAnnouncements = (checked: boolean) => {
    if (checked) {
      setSelectedAnnouncementIds(new Set(announcements.map(a => a.id)));
    } else {
      setSelectedAnnouncementIds(new Set());
    }
  };

  const handleSelectAnnouncement = (announcementId: string, checked: boolean) => {
    const newSelected = new Set(selectedAnnouncementIds);
    if (checked) {
      newSelected.add(announcementId);
    } else {
      newSelected.delete(announcementId);
    }
    setSelectedAnnouncementIds(newSelected);
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    try {
      setAnnouncementsProcessing(true);
      await announcementService.deleteAnnouncement(announcementId);
      setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
      setSelectedAnnouncementIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(announcementId);
        return newSet;
      });
    } catch (error: any) {
      logger.error('Error deleting announcement:', error);
      setAnnouncementsError(error.message || 'Duyuru silinirken bir hata oluştu');
    } finally {
      setAnnouncementsProcessing(false);
    }
  };

  const handleToggleAnnouncementPublished = async (announcementId: string, currentPublished: boolean) => {
    try {
      setAnnouncementsProcessing(true);
      await announcementService.updateAnnouncement(announcementId, {
        isPublished: !currentPublished,
      });
      await fetchAnnouncements();
    } catch (error: any) {
      logger.error('Error toggling announcement published:', error);
      setAnnouncementsError(error.message || 'Duyuru durumu güncellenirken bir hata oluştu');
    } finally {
      setAnnouncementsProcessing(false);
    }
  };

  const handleBulkDeleteAnnouncements = async () => {
    try {
      setAnnouncementsProcessing(true);
      const announcementIds = Array.from(selectedAnnouncementIds);

      const result = await announcementService.bulkAction('delete', announcementIds);

      if (result.failureCount > 0) {
        setAnnouncementsError(`${result.failureCount} duyuru silinirken hata oluştu`);
      }

      if (result.successCount > 0) {
        setAnnouncements(prev => prev.filter(a => !announcementIds.includes(a.id)));
      }

      setSelectedAnnouncementIds(new Set());
    } catch (error: any) {
      logger.error('Error bulk deleting announcements:', error);
      setAnnouncementsError(error.message || 'Toplu silme işlemi sırasında bir hata oluştu');
    } finally {
      setAnnouncementsProcessing(false);
    }
  };

  const handleBulkPublishAnnouncements = async () => {
    try {
      setAnnouncementsProcessing(true);
      const announcementIds = Array.from(selectedAnnouncementIds);

      const result = await announcementService.bulkAction('publish', announcementIds);

      if (result.failureCount > 0) {
        setAnnouncementsError(`${result.failureCount} duyuru yayınlanırken hata oluştu`);
      }

      await fetchAnnouncements();
      setSelectedAnnouncementIds(new Set());
    } catch (error: any) {
      logger.error('Error bulk publishing announcements:', error);
      setAnnouncementsError(error.message || 'Toplu yayınlama işlemi sırasında bir hata oluştu');
    } finally {
      setAnnouncementsProcessing(false);
    }
  };

  const handleBulkUnpublishAnnouncements = async () => {
    try {
      setAnnouncementsProcessing(true);
      const announcementIds = Array.from(selectedAnnouncementIds);

      const result = await announcementService.bulkAction('unpublish', announcementIds);

      if (result.failureCount > 0) {
        setAnnouncementsError(`${result.failureCount} duyuru yayından kaldırılırken hata oluştu`);
      }

      await fetchAnnouncements();
      setSelectedAnnouncementIds(new Set());
    } catch (error: any) {
      logger.error('Error bulk unpublishing announcements:', error);
      setAnnouncementsError(error.message || 'Toplu yayından kaldırma işlemi sırasında bir hata oluştu');
    } finally {
      setAnnouncementsProcessing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-end">
          {((activeTab === 'news' && canCreateNews) || (activeTab === 'announcements' && canCreateAnnouncement)) && (
            <button
              onClick={() => {
                if (activeTab === 'news') {
                  setSelectedNews(null);
                  setIsFormModalOpen(true);
                } else {
                  setSelectedAnnouncement(null);
                  setIsAnnouncementFormModalOpen(true);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {activeTab === 'news' ? 'Yeni Haber' : 'Yeni Duyuru'}
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

        {/* Filters */}
        <div className="flex items-center justify-between gap-4">
          {/* Search Bar */}
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
          
          <div className="flex items-center gap-3">
            {/* Status Filter */}
            <div className="inline-flex bg-gray-100 rounded-lg p-1">
              <button
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  (activeTab === 'news' ? filterPublished : announcementsFilterPublished) === null
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => activeTab === 'news' ? setFilterPublished(null) : setAnnouncementsFilterPublished(null)}
              >
                Tümü
              </button>
              <button
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  (activeTab === 'news' ? filterPublished : announcementsFilterPublished) === true
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => activeTab === 'news' ? setFilterPublished(true) : setAnnouncementsFilterPublished(true)}
              >
                Yayında
              </button>
              <button
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  (activeTab === 'news' ? filterPublished : announcementsFilterPublished) === false
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => activeTab === 'news' ? setFilterPublished(false) : setAnnouncementsFilterPublished(false)}
              >
                Taslak
              </button>
            </div>

            {/* Featured Filter */}
            <div className="inline-flex bg-gray-100 rounded-lg p-1">
              <button
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  (activeTab === 'news' ? filterFeatured : announcementsFilterFeatured) === null
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => activeTab === 'news' ? setFilterFeatured(null) : setAnnouncementsFilterFeatured(null)}
              >
                Tümü
              </button>
              <button
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  (activeTab === 'news' ? filterFeatured : announcementsFilterFeatured) === true
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => activeTab === 'news' ? setFilterFeatured(true) : setAnnouncementsFilterFeatured(true)}
              >
                Öne Çıkan
              </button>
              <button
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  (activeTab === 'news' ? filterFeatured : announcementsFilterFeatured) === false
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => activeTab === 'news' ? setFilterFeatured(false) : setAnnouncementsFilterFeatured(false)}
              >
                Normal
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {(activeTab === 'news' ? error : announcementsError) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800">{activeTab === 'news' ? error : announcementsError}</p>
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
          ) : news.length === 0 ? (
            <div className="p-8 text-center">
              <Newspaper className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Haber bulunamadı</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        <input
                          type="checkbox"
                          checked={news.length > 0 && selectedNewsIds.size === news.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300 text-slate-700 focus:ring-slate-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Başlık
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Oluşturulma
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
                    {news.map((item, index) => (
                      <tr 
                        key={item.id || `news-${index}`} 
                        className={`hover:bg-gray-50 transition-colors ${
                          selectedNewsIds.has(item.id) ? 'bg-slate-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedNewsIds.has(item.id)}
                            onChange={(e) => handleSelectNews(item.id, e.target.checked)}
                            className="rounded border-gray-300 text-slate-700 focus:ring-slate-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td 
                          className="px-4 py-3 cursor-pointer"
                          onClick={() => {
                            setSelectedNews(item);
                            setIsPreviewModalOpen(true);
                          }}
                        >
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
                        <td 
                          className="px-4 py-3 cursor-pointer"
                          onClick={() => {
                            setSelectedNews(item);
                            setIsPreviewModalOpen(true);
                          }}
                        >
                          <div className="text-sm text-gray-600">
                            {formatDate(item.createdAt)}
                          </div>
                        </td>
                        <td 
                          className="px-4 py-3 cursor-pointer"
                          onClick={() => {
                            setSelectedNews(item);
                            setIsPreviewModalOpen(true);
                          }}
                        >
                          <div className="text-sm text-gray-600">
                            {item.publishedAt ? formatDate(item.publishedAt) : '-'}
                          </div>
                        </td>
                        <td 
                          className="px-4 py-3 cursor-pointer"
                          onClick={() => {
                            setSelectedNews(item);
                            setIsPreviewModalOpen(true);
                          }}
                        >
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>{getUserName(item.createdBy)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <ActionButton
                              icon={Eye}
                              variant="preview"
                              onClick={() => {
                                setSelectedNews(item);
                                setIsPreviewModalOpen(true);
                              }}
                              title="Önizle"
                            />
                            {canCreateNews && (
                              <>
                                <ActionButton
                                  icon={Edit}
                                  variant="edit"
                                  onClick={() => {
                                    setSelectedNews(item);
                                    setIsFormModalOpen(true);
                                  }}
                                  title="Düzenle"
                                  disabled={processing}
                                />
                                <ActionButton
                                  icon={item.isPublished ? XCircle : CheckCircle}
                                  variant={item.isPublished ? 'unpublish' : 'publish'}
                                  onClick={() => {
                                    setConfirmDialog({
                                      isOpen: true,
                                      title: item.isPublished ? 'Haber Yayından Kaldır' : 'Haber Yayınla',
                                      message: `${item.title} haberini ${
                                        item.isPublished ? 'yayından kaldırmak' : 'yayınlamak'
                                      } istediğinizden emin misiniz?`,
                                      variant: item.isPublished ? 'warning' : 'info',
                                      onConfirm: () => {
                                        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                        handleTogglePublished(item.id, item.isPublished);
                                      },
                                    });
                                  }}
                                  title={item.isPublished ? 'Yayından Kaldır' : 'Yayınla'}
                                  disabled={processing}
                                />
                              </>
                            )}
                            <ActionButton
                              icon={Bell}
                              variant="info"
                              onClick={() => handleOpenNotificationModal(item, 'news')}
                              title="Bildirim Gönder"
                              disabled={processing}
                            />
                            {canCreateNews && (
                              <ActionButton
                                icon={Trash2}
                                variant="delete"
                                onClick={() => {
                                  setConfirmDialog({
                                    isOpen: true,
                                    title: 'Haber Sil',
                                    message: `${item.title} haberini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
                                    variant: 'danger',
                                    onConfirm: () => {
                                      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                      handleDeleteNews(item.id);
                                    },
                                  });
                                }}
                                title="Sil"
                                disabled={processing}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Toplam {total} haberden {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} arası gösteriliyor
                </div>
                {Math.ceil(total / limit) > 1 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
                    >
                      Önceki
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700">
                      Sayfa {page} / {Math.ceil(total / limit)}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(Math.ceil(total / limit), p + 1))}
                      disabled={page === Math.ceil(total / limit)}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
                    >
                      Sonraki
                    </button>
                  </div>
                )}
              </div>
            </>
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
            ) : announcements.length === 0 ? (
              <div className="p-8 text-center">
                <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Duyuru bulunamadı</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                          <input
                            type="checkbox"
                            checked={announcements.length > 0 && selectedAnnouncementIds.size === announcements.length}
                            onChange={(e) => handleSelectAllAnnouncements(e.target.checked)}
                            className="rounded border-gray-300 text-slate-700 focus:ring-slate-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Başlık
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Durum
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Oluşturulma
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
                      {announcements.map((item, index) => (
                        <tr 
                          key={item.id || `announcement-${index}`} 
                          className={`hover:bg-gray-50 transition-colors ${
                            selectedAnnouncementIds.has(item.id) ? 'bg-slate-50' : ''
                          }`}
                        >
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedAnnouncementIds.has(item.id)}
                              onChange={(e) => handleSelectAnnouncement(item.id, e.target.checked)}
                              className="rounded border-gray-300 text-slate-700 focus:ring-slate-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td 
                            className="px-4 py-3 cursor-pointer"
                            onClick={() => {
                              setSelectedAnnouncement(item);
                              setIsAnnouncementPreviewModalOpen(true);
                            }}
                          >
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
                          <td 
                            className="px-4 py-3 cursor-pointer"
                            onClick={() => {
                              setSelectedAnnouncement(item);
                              setIsAnnouncementPreviewModalOpen(true);
                            }}
                          >
                            <div className="text-sm text-gray-600">
                              {formatDate(item.createdAt)}
                            </div>
                          </td>
                          <td 
                            className="px-4 py-3 cursor-pointer"
                            onClick={() => {
                              setSelectedAnnouncement(item);
                              setIsAnnouncementPreviewModalOpen(true);
                            }}
                          >
                            <div className="text-sm text-gray-600">
                              {item.publishedAt ? formatDate(item.publishedAt) : '-'}
                            </div>
                          </td>
                          <td 
                            className="px-4 py-3 cursor-pointer"
                            onClick={() => {
                              setSelectedAnnouncement(item);
                              setIsAnnouncementPreviewModalOpen(true);
                            }}
                          >
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="w-4 h-4 text-gray-400" />
                              <span>{getUserName(item.createdBy)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <ActionButton
                                icon={Eye}
                                variant="preview"
                                onClick={() => {
                                  setSelectedAnnouncement(item);
                                  setIsAnnouncementPreviewModalOpen(true);
                                }}
                                title="Önizle"
                              />
                              {canCreateAnnouncement && (
                                <>
                                  <ActionButton
                                    icon={Edit}
                                    variant="edit"
                                    onClick={() => {
                                      setSelectedAnnouncement(item);
                                      setIsAnnouncementFormModalOpen(true);
                                    }}
                                    title="Düzenle"
                                    disabled={announcementsProcessing}
                                  />
                                  <ActionButton
                                    icon={item.isPublished ? XCircle : CheckCircle}
                                    variant={item.isPublished ? 'unpublish' : 'publish'}
                                    onClick={() => {
                                      setConfirmDialog({
                                        isOpen: true,
                                        title: item.isPublished ? 'Duyuru Yayından Kaldır' : 'Duyuru Yayınla',
                                        message: `${item.title} duyurusunu ${
                                          item.isPublished ? 'yayından kaldırmak' : 'yayınlamak'
                                        } istediğinizden emin misiniz?`,
                                        variant: item.isPublished ? 'warning' : 'info',
                                        onConfirm: () => {
                                          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                          handleToggleAnnouncementPublished(item.id, item.isPublished);
                                        },
                                      });
                                    }}
                                    title={item.isPublished ? 'Yayından Kaldır' : 'Yayınla'}
                                    disabled={announcementsProcessing}
                                  />
                                </>
                              )}
                              <ActionButton
                                icon={Bell}
                                variant="info"
                                onClick={() => handleOpenNotificationModal(item, 'announcement')}
                                title="Bildirim Gönder"
                                disabled={announcementsProcessing}
                              />
                              {canCreateAnnouncement && (
                                <ActionButton
                                  icon={Trash2}
                                  variant="delete"
                                  onClick={() => {
                                    setConfirmDialog({
                                      isOpen: true,
                                      title: 'Duyuru Sil',
                                      message: `${item.title} duyurusunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
                                      variant: 'danger',
                                      onConfirm: () => {
                                        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                        handleDeleteAnnouncement(item.id);
                                      },
                                    });
                                  }}
                                  title="Sil"
                                  disabled={announcementsProcessing}
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Toplam {announcementsTotal} duyurudan {((announcementsPage - 1) * announcementsLimit) + 1}-{Math.min(announcementsPage * announcementsLimit, announcementsTotal)} arası gösteriliyor
                  </div>
                  {Math.ceil(announcementsTotal / announcementsLimit) > 1 && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAnnouncementsPage((p) => Math.max(1, p - 1))}
                        disabled={announcementsPage === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
                      >
                        Önceki
                      </button>
                      <span className="px-4 py-2 text-sm text-gray-700">
                        Sayfa {announcementsPage} / {Math.ceil(announcementsTotal / announcementsLimit)}
                      </span>
                      <button
                        onClick={() => setAnnouncementsPage((p) => Math.min(Math.ceil(announcementsTotal / announcementsLimit), p + 1))}
                        disabled={announcementsPage === Math.ceil(announcementsTotal / announcementsLimit)}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
                      >
                        Sonraki
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {activeTab === 'news' ? (
          selectedNewsIds.size > 0 && canCreateNews && (
            <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
              <span className="text-sm text-gray-600 mr-2">
                {selectedNewsIds.size} seçili
              </span>
              <button
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Toplu Silme',
                    message: `${selectedNewsIds.size} haberi kalıcı olarak silmek istediğinizden emin misiniz?`,
                    variant: 'danger',
                    onConfirm: () => {
                      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                      handleBulkDelete();
                    },
                  });
                }}
                disabled={processing}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                Sil
              </button>
              <button
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Toplu Yayınlama',
                    message: `${selectedNewsIds.size} haberi yayınlamak istediğinizden emin misiniz?`,
                    variant: 'info',
                    onConfirm: () => {
                      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                      handleBulkPublish();
                    },
                  });
                }}
                disabled={processing}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                Yayınla
              </button>
              <button
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Toplu Yayından Kaldırma',
                    message: `${selectedNewsIds.size} haberi yayından kaldırmak istediğinizden emin misiniz?`,
                    variant: 'warning',
                    onConfirm: () => {
                      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                      handleBulkUnpublish();
                    },
                  });
                }}
                disabled={processing}
                className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                Yayından Kaldır
              </button>
              <button
                onClick={() => setSelectedNewsIds(new Set())}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                Temizle
              </button>
            </div>
          )
        ) : (
          selectedAnnouncementIds.size > 0 && canCreateAnnouncement && (
            <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
              <span className="text-sm text-gray-600 mr-2">
                {selectedAnnouncementIds.size} seçili
              </span>
              <button
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Toplu Silme',
                    message: `${selectedAnnouncementIds.size} duyuruyu kalıcı olarak silmek istediğinizden emin misiniz?`,
                    variant: 'danger',
                    onConfirm: () => {
                      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                      handleBulkDeleteAnnouncements();
                    },
                  });
                }}
                disabled={announcementsProcessing}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                Sil
              </button>
              <button
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Toplu Yayınlama',
                    message: `${selectedAnnouncementIds.size} duyuruyu yayınlamak istediğinizden emin misiniz?`,
                    variant: 'info',
                    onConfirm: () => {
                      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                      handleBulkPublishAnnouncements();
                    },
                  });
                }}
                disabled={announcementsProcessing}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                Yayınla
              </button>
              <button
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Toplu Yayından Kaldırma',
                    message: `${selectedAnnouncementIds.size} duyuruyu yayından kaldırmak istediğinizden emin misiniz?`,
                    variant: 'warning',
                    onConfirm: () => {
                      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                      handleBulkUnpublishAnnouncements();
                    },
                  });
                }}
                disabled={announcementsProcessing}
                className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                Yayından Kaldır
              </button>
              <button
                onClick={() => setSelectedAnnouncementIds(new Set())}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                Temizle
              </button>
            </div>
          )
        )}

      </div>

      {/* News Form Modal */}
      <NewsFormModal
        news={selectedNews}
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedNews(null);
        }}
        onSuccess={() => {
          setIsFormModalOpen(false);
          setSelectedNews(null);
          fetchNews();
        }}
      />

      {/* News Preview Modal */}
      <NewsPreviewModal
        news={selectedNews}
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setSelectedNews(null);
        }}
      />

      {/* Announcement Form Modal */}
      <AnnouncementFormModal
        announcement={selectedAnnouncement}
        isOpen={isAnnouncementFormModalOpen}
        onClose={() => {
          setIsAnnouncementFormModalOpen(false);
          setSelectedAnnouncement(null);
        }}
        onSuccess={() => {
          setIsAnnouncementFormModalOpen(false);
          setSelectedAnnouncement(null);
          fetchAnnouncements();
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
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedAnnouncement.content) }}
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
                      className="text-blue-600 hover:underline break-all"
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

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Notification Modal */}
      {notificationData && (
        <SendNotificationSimpleModal
          isOpen={isNotificationModalOpen}
          onClose={() => {
            setIsNotificationModalOpen(false);
            setNotificationData(null);
          }}
          onSuccess={() => {
            // İsteğe bağlı: başarılı gönderim sonrası işlemler
          }}
          type={notificationData.type}
          contentId={notificationData.contentId}
          title={notificationData.title}
          body={notificationData.body}
          imageUrl={notificationData.imageUrl}
        />
      )}
    </AdminLayout>
  );
}
