import { useState, useCallback } from 'react';
import { Newspaper, Megaphone } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import NewsTab from '@/components/news/NewsTab';
import AnnouncementsTab from '@/components/announcements/AnnouncementsTab';
import type { User as UserType } from '@/types/user';

type TabType = 'news' | 'announcements';

export default function NewsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('news');
  const [userCache, setUserCache] = useState<Record<string, UserType>>({});

  const handleUserCacheUpdate = useCallback((newEntries: Record<string, UserType>) => {
    setUserCache(prev => ({ ...prev, ...newEntries }));
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-4">
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

        {/* Tab Content */}
        {activeTab === 'news' ? (
          <NewsTab
            userCache={userCache}
            onUserCacheUpdate={handleUserCacheUpdate}
          />
        ) : (
          <AnnouncementsTab
            userCache={userCache}
            onUserCacheUpdate={handleUserCacheUpdate}
          />
        )}
      </div>
    </AdminLayout>
  );
}
