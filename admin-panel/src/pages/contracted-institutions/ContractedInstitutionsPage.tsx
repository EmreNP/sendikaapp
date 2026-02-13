import { useState, useEffect, useCallback } from 'react';
import { Briefcase, Tag } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import InstitutionsTab from '@/components/contracted-institutions/InstitutionsTab';
import CategoriesTab from '@/components/contracted-institutions/CategoriesTab';
import { institutionCategoryService } from '@/services/api/institutionCategoryService';
import type { InstitutionCategory } from '@/types/contracted-institution';
import type { User as UserType } from '@/types/user';
import { logger } from '@/utils/logger';

type TabType = 'institutions' | 'categories';

export default function ContractedInstitutionsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('institutions');
  const [userCache, setUserCache] = useState<Record<string, UserType>>({});
  const [categories, setCategories] = useState<InstitutionCategory[]>([]);

  const handleUserCacheUpdate = useCallback((newEntries: Record<string, UserType>) => {
    setUserCache(prev => ({ ...prev, ...newEntries }));
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await institutionCategoryService.getCategories({ includeInactive: true });
      setCategories(data.categories || []);
    } catch (err: any) {
      logger.error('Error fetching categories:', err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('institutions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'institutions'
                  ? 'border-slate-700 text-slate-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Anlaşmalı Kurumlar
              </div>
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'categories'
                  ? 'border-slate-700 text-slate-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Kategoriler
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'institutions' ? (
          <InstitutionsTab
            userCache={userCache}
            onUserCacheUpdate={handleUserCacheUpdate}
            categories={categories}
          />
        ) : (
          <CategoriesTab
            categories={categories}
            onCategoriesChange={fetchCategories}
          />
        )}
      </div>
    </AdminLayout>
  );
}
