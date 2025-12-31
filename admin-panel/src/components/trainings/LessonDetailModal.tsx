import { useEffect, useState } from 'react';
import { X, Edit, Trash2, Eye, EyeOff, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { lessonService } from '@/services/api/lessonService';
import type { Lesson } from '@/types/training';

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
          console.error('Load lesson error:', err);
        }
      };
      loadLesson();
    }
  }, [isOpen, lesson]);

  if (!isOpen || !lessonData) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-gray-700" />
                <h3 className="text-lg font-medium text-gray-900">Ders Detayı</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

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
                  navigate('/admin/lessons/detail', { state: { lessonId: lessonData.id, trainingId: trainingId } });
                  onClose();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
              >
                <BookOpen className="w-4 h-4" />
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
                    ? 'border-yellow-300 bg-yellow-50 text-yellow-800 hover:bg-yellow-100 focus:ring-yellow-500'
                    : 'border-green-300 bg-green-50 text-green-800 hover:bg-green-100 focus:ring-green-500'
                }`}
              >
                {lessonData.isActive ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Pasifleştir
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
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

