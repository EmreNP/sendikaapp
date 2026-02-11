import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { faqService } from '@/services/api/faqService';
import type { FAQ, CreateFAQRequest, UpdateFAQRequest } from '@/types/faq';
import { logger } from '@/utils/logger';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';

interface FAQFormModalProps {
  faq: FAQ | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FAQFormModal({ faq, isOpen, onClose, onSuccess }: FAQFormModalProps) {
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    isPublished: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const { handleClose, showConfirm, handleConfirmClose, handleCancelClose } = useUnsavedChangesWarning(hasChanges, onClose);

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const isEditMode = !!faq;

  useEffect(() => {
    if (isOpen) {
      if (faq) {
        // Edit mode - mevcut verileri doldur
        setFormData({
          question: faq.question || '',
          answer: faq.answer || '',
          isPublished: faq.isPublished || false,
        });
      } else {
        // Create mode - formu temizle (isPublished default true)
        setFormData({
          question: '',
          answer: '',
          isPublished: true,
        });
      }
      setError(null);
      setHasChanges(false);
    }
  }, [isOpen, faq]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.question.trim()) {
      setError('Soru zorunludur');
      return;
    }

    if (!formData.answer.trim()) {
      setError('Cevap zorunludur');
      return;
    }

    try {
      setLoading(true);

      const body: CreateFAQRequest | UpdateFAQRequest = {
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        isPublished: formData.isPublished,
      };

      if (isEditMode) {
        await faqService.updateFAQ(faq!.id, body);
      } else {
        await faqService.createFAQ(body as CreateFAQRequest);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      logger.error('Error saving FAQ:', err);
      setError(err.message || 'FAQ kaydedilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200 bg-slate-700">
            <h2 className="text-sm font-medium text-white">
              {isEditMode ? 'FAQ Düzenle' : 'Yeni FAQ Ekle'}
            </h2>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Soru */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Soru <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => updateFormData({ question: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  required
                  placeholder="Sık sorulan soru"
                  maxLength={200}
                />
              </div>

              {/* Cevap */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cevap <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => updateFormData({ answer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-y"
                  rows={6}
                  required
                  placeholder="Sorunun cevabını buraya yazın..."
                />
              </div>

              {/* Yayın Durumu */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => updateFormData({ isPublished: e.target.checked })}
                    className="w-4 h-4 text-slate-600 rounded focus:ring-slate-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Hemen yayınla</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  İşaretlenmezse FAQ taslak olarak kaydedilir
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Kaydediliyor...' : isEditMode ? 'Güncelle' : 'Oluştur'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Unsaved Changes Confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Kaydedilmemiş Değişiklikler</h3>
            <p className="text-gray-600 mb-4">Kaydedilmemiş değişiklikleriniz var. Çıkmak istediğinizden emin misiniz?</p>
            <div className="flex justify-end gap-3">
              <button onClick={handleCancelClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">İptal</button>
              <button onClick={handleConfirmClose} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">Çık</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

