import { useState } from 'react';
import { Tag, Plus, Edit, Trash2, XCircle, X } from 'lucide-react';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { institutionCategoryService } from '@/services/api/institutionCategoryService';
import type { InstitutionCategory, CreateInstitutionCategoryRequest, UpdateInstitutionCategoryRequest } from '@/types/contracted-institution';
import { logger } from '@/utils/logger';

interface CategoriesTabProps {
  categories: InstitutionCategory[];
  onCategoriesChange: () => void;
}

interface CategoryFormData {
  name: string;
  isActive: boolean;
}

const INITIAL_FORM: CategoryFormData = {
  name: '',
  isActive: true,
};

export default function CategoriesTab({ categories, onCategoriesChange }: CategoriesTabProps) {
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<InstitutionCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(INITIAL_FORM);

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

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData(INITIAL_FORM);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (category: InstitutionCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      isActive: category.isActive,
    });
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData(INITIAL_FORM);
    setError(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Kategori adı zorunludur');
      return;
    }
    if (formData.name.trim().length < 2) {
      setError('Kategori adı en az 2 karakter olmalıdır');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      if (editingCategory) {
        const updateData: UpdateInstitutionCategoryRequest = {
          name: formData.name.trim(),
          isActive: formData.isActive,
        };
        await institutionCategoryService.updateCategory(editingCategory.id, updateData);
      } else {
        const createData: CreateInstitutionCategoryRequest = {
          name: formData.name.trim(),
          isActive: formData.isActive,
        };
        await institutionCategoryService.createCategory(createData);
      }

      closeModal();
      onCategoriesChange();
    } catch (err: any) {
      logger.error('Error saving category:', err);
      setError(err.message || 'Kategori kaydedilirken bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = (category: InstitutionCategory) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Kategoriyi Sil',
      message: `"${category.name}" kategorisini silmek istediğinize emin misiniz? Bu kategoriye bağlı kurumlar varsa silme işlemi başarısız olacaktır.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          setProcessing(true);
          await institutionCategoryService.deleteCategory(category.id);
          onCategoriesChange();
        } catch (err: any) {
          logger.error('Error deleting category:', err);
          setError(err.message || 'Kategori silinirken bir hata oluştu');
        } finally {
          setProcessing(false);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleToggleActive = async (category: InstitutionCategory) => {
    try {
      setProcessing(true);
      await institutionCategoryService.updateCategory(category.id, {
        isActive: !category.isActive,
      });
      onCategoriesChange();
    } catch (err: any) {
      logger.error('Error toggling category:', err);
      setError(err.message || 'İşlem başarısız oldu');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Kategoriler</h2>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Yeni Kategori
          </button>
        </div>

        {/* Error (outside modal) */}
        {!isModalOpen && error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Categories List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {categories.length === 0 ? (
            <div className="text-center py-16">
              <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Henüz kategori eklenmemiş</p>
              <button
                onClick={openAddModal}
                className="mt-3 text-sm text-slate-700 hover:text-slate-800 font-medium"
              >
                İlk kategoriyi ekleyin →
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">Sıra</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori Adı</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-500">#{category.order}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">{category.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(category)}
                        disabled={processing}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                          category.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {category.isActive ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(category)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Sil"
                          disabled={processing}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Total Count */}
        {categories.length > 0 && (
          <div className="text-sm text-gray-500 text-center py-2">
            Toplam {categories.length} kategori
          </div>
        )}
      </div>

      {/* Category Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Error inside modal */}
              {error && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
                  <span>{error}</span>
                  <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  placeholder="Ör: Sağlık"
                  maxLength={100}
                  autoFocus
                />
              </div>

              {/* Active Toggle */}
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-gray-300 text-slate-700 focus:ring-slate-500"
                  />
                  Aktif
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={processing}
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                disabled={processing}
              >
                {processing ? 'Kaydediliyor...' : editingCategory ? 'Güncelle' : 'Kaydet'}
              </button>
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
    </>
  );
}
