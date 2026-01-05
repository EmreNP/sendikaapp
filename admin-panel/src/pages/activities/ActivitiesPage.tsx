import { useState, useEffect } from 'react';
import { Plus, Search, Clock, Edit, Trash2, Calendar, X, Tag } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ActionButton from '@/components/common/ActionButton';
import ActivityFormModal from '@/components/activities/ActivityFormModal';
import ActivityDetailModal from '@/components/activities/ActivityDetailModal';
import CategoryFormModal from '@/components/activities/CategoryFormModal';
import { activityService } from '@/services/api/activityService';
import { useAuth } from '@/context/AuthContext';
import type { Activity, ActivityCategory, CreateActivityRequest, UpdateActivityRequest } from '@/types/activity';

interface BranchOption {
  id: string;
  name: string;
}

type TabType = 'activities' | 'categories';

export default function ActivitiesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('activities');
  
  // Activities states
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedActivityForDetail, setSelectedActivityForDetail] = useState<Activity | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Categories states
  const [categories, setCategories] = useState<ActivityCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | null>(null);
  const [isCategoryFormModalOpen, setIsCategoryFormModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'activity' | 'category'; id: string; name: string } | null>(null);

  // Branches (admin only)
  const [branches, setBranches] = useState<BranchOption[]>([]);

  // Fetch activities
  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await activityService.getActivities();
      setActivities(response.activities);
    } catch (err: any) {
      setError(err.message || 'Aktiviteler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await activityService.getCategories();
      setCategories(response.categories);
    } catch (err: any) {
      setError(err.message || 'Kategoriler yüklenirken hata oluştu');
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    const loadBranchesIfNeeded = async () => {
      try {
        if (user?.role !== 'admin') return;
        const { apiRequest } = await import('@/utils/api');
        const data = await apiRequest<{ branches: BranchOption[] }>('/api/branches');
        setBranches(data.branches || []);
      } catch (e) {
        // ignore
      }
    };

    loadBranchesIfNeeded();
    
    // Always fetch categories on mount (needed for activity form)
    fetchCategories();

    if (activeTab === 'activities') {
      fetchActivities();
    }
  }, [activeTab, user?.role]);

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Activity handlers
  const handleCreateActivity = () => {
    setSelectedActivity(null);
    setIsFormModalOpen(true);
  };

  const handleEditActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsFormModalOpen(true);
  };

  const handleViewActivity = (activity: Activity) => {
    setSelectedActivityForDetail(activity);
    setIsDetailModalOpen(true);
  };

  const handleDeleteActivity = (activity: Activity) => {
    setItemToDelete({ type: 'activity', id: activity.id, name: activity.name });
    setDeleteConfirmOpen(true);
  };

  // Category handlers
  const handleCreateCategory = () => {
    setSelectedCategory(null);
    setIsCategoryFormModalOpen(true);
  };

  const handleEditCategory = (category: ActivityCategory) => {
    setSelectedCategory(category);
    setIsCategoryFormModalOpen(true);
  };

  const handleDeleteCategory = (category: ActivityCategory) => {
    setItemToDelete({ type: 'category', id: category.id, name: category.name });
    setDeleteConfirmOpen(true);
  };

  // Delete handler
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setProcessing(true);
      if (itemToDelete.type === 'activity') {
        await activityService.deleteActivity(itemToDelete.id);
        await fetchActivities();
      } else {
        await activityService.deleteCategory(itemToDelete.id);
        await fetchCategories();
      }
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Silme işlemi başarısız oldu');
    } finally {
      setProcessing(false);
    }
  };

  // Form handlers
  const handleActivityFormSubmit = async (data: CreateActivityRequest | UpdateActivityRequest) => {
    try {
      setProcessing(true);
      if (selectedActivity) {
        await activityService.updateActivity(selectedActivity.id, data as UpdateActivityRequest);
      } else {
        await activityService.createActivity(data as CreateActivityRequest);
      }
      setIsFormModalOpen(false);
      setSelectedActivity(null);
      await fetchActivities();
    } catch (err: any) {
      setError(err.message || 'Kaydetme işlemi başarısız oldu');
    } finally {
      setProcessing(false);
    }
  };

  const handleCategoryFormSubmit = async (data: any) => {
    try {
      setProcessing(true);
      if (selectedCategory) {
        await activityService.updateCategory(selectedCategory.id, data);
      } else {
        await activityService.createCategory(data);
      }
      setIsCategoryFormModalOpen(false);
      setSelectedCategory(null);
      await fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Kaydetme işlemi başarısız oldu');
    } finally {
      setProcessing(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Bilinmeyen Kategori';
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminLayout>
      <div className="p-6">

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tabs (NewsPage style) */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex items-center justify-between">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('activities')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'activities'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Aktiviteler
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'categories'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Kategoriler
              </button>
            </nav>

            {activeTab === 'activities' && (
              <button
                onClick={handleCreateActivity}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                Yeni Aktivite
              </button>
            )}

            {activeTab === 'categories' && (
              <button
                onClick={handleCreateCategory}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                Yeni Kategori
              </button>
            )}
          </div>
        </div>

        {/* Activities Tab */}
        {activeTab === 'activities' && (
          <div>
            {/* Filters Card (TrainingsPage style) */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex-1 relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Aktivite ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* List Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Yükleniyor...</p>
                </div>
              ) : filteredActivities.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aktivite bulunamadı</h3>
                  <p className="text-gray-600">Filtreleri temizleyip tekrar deneyin veya yeni aktivite oluşturun.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Aktivite</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kategori</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tarih</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredActivities.map((activity) => {
                        const categoryName = getCategoryName(activity.categoryId);
                        return (
                          <tr 
                            key={activity.id} 
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleViewActivity(activity)}
                          >
                            <td className="px-6 py-4">
                              <div className="min-w-[260px]">
                                <div className="font-semibold text-gray-900">{activity.name}</div>
                                <div className="text-sm text-gray-600 line-clamp-1">{activity.description}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                {categoryName}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <div>
                                  <div>{formatDate(activity.activityDate)}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-2">
                                <ActionButton
                                  icon={Edit}
                                  variant="edit"
                                  onClick={() => handleEditActivity(activity)}
                                  title="Düzenle"
                                  disabled={processing}
                                />
                                <ActionButton
                                  icon={Trash2}
                                  variant="delete"
                                  onClick={() => handleDeleteActivity(activity)}
                                  title="Sil"
                                  disabled={processing}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {categoriesLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Yükleniyor...</p>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-12">
                  <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Kategori bulunamadı</h3>
                  <p className="text-gray-600">Yeni kategori oluşturabilirsiniz.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kategori</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Açıklama</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {categories
                        .slice()
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((category) => (
                          <tr key={category.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-900">{category.name}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-700 line-clamp-2 min-w-[260px]">
                                {category.description || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-end gap-2">
                                {user?.role === 'admin' && (
                                  <>
                                    <ActionButton
                                      icon={Edit}
                                      variant="edit"
                                      onClick={() => handleEditCategory(category)}
                                      title="Düzenle"
                                      disabled={processing}
                                    />
                                    <ActionButton
                                      icon={Trash2}
                                      variant="delete"
                                      onClick={() => handleDeleteCategory(category)}
                                      title="Sil"
                                      disabled={processing}
                                    />
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activity Form Modal */}
        {isFormModalOpen && (
          <ActivityFormModal
            activity={selectedActivity}
            categories={categories}
            branches={branches}
            currentUserRole={(user?.role as 'admin' | 'branch_manager') || 'branch_manager'}
            currentUserBranchId={user?.branchId}
            onSubmit={handleActivityFormSubmit}
            onCancel={() => {
              setIsFormModalOpen(false);
              setSelectedActivity(null);
            }}
            disabled={processing}
          />
        )}

        {/* Activity Detail Modal */}
        {isDetailModalOpen && selectedActivityForDetail && (
          <ActivityDetailModal
            activity={selectedActivityForDetail}
            categories={categories}
            branches={branches}
            onClose={() => {
              setIsDetailModalOpen(false);
              setSelectedActivityForDetail(null);
            }}
          />
        )}

        {/* Category Form Modal */}
        {isCategoryFormModalOpen && (
          <CategoryFormModal
            category={selectedCategory}
            onSubmit={handleCategoryFormSubmit}
            onCancel={() => {
              setIsCategoryFormModalOpen(false);
              setSelectedCategory(null);
            }}
            disabled={processing}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteConfirmOpen}
          title={`${itemToDelete?.type === 'activity' ? 'Aktivite' : 'Kategori'} Sil`}
          message={`${itemToDelete?.name} ${itemToDelete?.type === 'activity' ? 'aktivitesini' : 'kategorisini'} silmek istediğinizden emin misiniz?`}
          confirmText="Sil"
          cancelText="İptal"
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleteConfirmOpen(false);
            setItemToDelete(null);
          }}
        />
      </div>
    </AdminLayout>
  );
}
