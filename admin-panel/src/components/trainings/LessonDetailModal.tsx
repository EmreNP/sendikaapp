import { useEffect, useState } from 'react';
import { X, Edit, Trash2, Eye, EyeOff, BookOpen, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { lessonService } from '@/services/api/lessonService';
import type { Lesson } from '@/types/training';
import { logger } from '@/utils/logger';

interface LessonDetailModalProps {
  lesson: Lesson | null;
  trainingId: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onRefresh: () => void;
}

export default function LessonDetailModal({
  lesson,
  trainingId,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleActive,
  onRefresh,
}: LessonDetailModalProps) {
  const navigate = useNavigate();
  const [lessonData, setLessonData] = useState<Lesson | null>(lesson);

  useEffect(() => {
    if (isOpen && lesson) {
      // Lesson detayını yeniden yükle
      const loadLesson = async () => {
        try {
          const response = await lessonService.getLesson(lesson.id);
          setLessonData(response.lesson);
        } catch (err) {
          logger.error('Load lesson error:', err);
        }
      };
      loadLesson();
    }
  }, [isOpen, lesson]);

  if (!isOpen || !lessonData) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200 bg-slate-700">
            <h3 className="text-sm font-medium text-white">Ders Detayı</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">

            <div className="space-y-4">
              {/* Başlık */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Başlık
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {lessonData.title}
                </p>
              </div>

              {/* Açıklama */}
              {lessonData.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg whitespace-pre-wrap">
                    {lessonData.description.replace(/<[^>]*>/g, '')}
                  </p>
                </div>
              )}

              {/* Sıra */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sıra
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {lessonData.order}
                </p>
              </div>

              {/* Durum */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durum
                </label>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    lessonData.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {lessonData.isActive ? 'Aktif' : 'Pasif'}
                </span>
              </div>

              {/* Oluşturulma Tarihi */}
              {lessonData.createdAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Oluşturulma Tarihi
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {new Date(lessonData.createdAt).toLocaleString('tr-TR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}

              {/* Güncelleme Tarihi */}
              {lessonData.updatedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Güncelleme Tarihi
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {new Date(lessonData.updatedAt).toLocaleString('tr-TR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* İşlemler */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse sm:justify-between">
            <div className="flex gap-2 sm:flex-row-reverse">
              <button
                type="button"
                onClick={() => {
                  navigate(`/admin/trainings/${trainingId}/lessons/${lessonData.id}`);
                  onClose();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                İçeriklere Git
              </button>
              <button
                type="button"
                onClick={onEdit}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
              >
                <Edit className="w-4 h-4" />
                Düzenle
              </button>
              <button
                type="button"
                onClick={onToggleActive}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
                  lessonData.isActive
                    ? 'border-orange-300 bg-orange-50 text-orange-800 hover:bg-orange-100 focus:ring-orange-500'
                    : 'border-green-300 bg-green-50 text-green-800 hover:bg-green-100 focus:ring-green-500'
                }`}
              >
                {lessonData.isActive ? (
                  <>
                    <XCircle className="w-4 h-4" />
                    Pasifleştir
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Aktifleştir
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-red-300 shadow-sm px-4 py-2 bg-red-50 text-base font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Sil
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

