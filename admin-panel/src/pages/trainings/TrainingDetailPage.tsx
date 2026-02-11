import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, BookOpen, Search, Eye, EyeOff, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import LessonFormModal from '@/components/trainings/LessonFormModal';
import LessonDetailModal from '@/components/trainings/LessonDetailModal';
import { trainingService } from '@/services/api/trainingService';
import { lessonService } from '@/services/api/lessonService';
import type { Training, Lesson } from '@/types/training';

export default function TrainingDetailPage() {
  const { trainingId } = useParams<{ trainingId: string }>();
  const navigate = useNavigate();
  const [training, setTraining] = useState<Training | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    if (trainingId) {
      loadTraining();
      loadLessons();
    } else {
      setError('Eğitim ID bulunamadı');
      setLoading(false);
    }
  }, [trainingId]);

  const loadTraining = async () => {
    if (!trainingId) return;
    try {
      setLoading(true);
      const response = await trainingService.getTraining(trainingId);
      setTraining(response.training);
    } catch (err: any) {
      console.error('Load training error:', err);
      setError(err.message || 'Eğitim yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadLessons = async () => {
    if (!trainingId) return;
    try {
      const response = await lessonService.getLessons(trainingId);
      setLessons(response.lessons);
    } catch (err: any) {
      console.error('Load lessons error:', err);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      await lessonService.deleteLesson(lessonId);
      await loadLessons();
    } catch (err: any) {
      console.error('Delete lesson error:', err);
      alert(err.message || 'Ders silinirken bir hata oluştu');
    }
  };

  const handleToggleLessonActive = async (lessonId: string, currentStatus: boolean) => {
    try {
      await lessonService.updateLesson(lessonId, {
        isActive: !currentStatus,
      });
      await loadLessons();
    } catch (err: any) {
      console.error('Toggle lesson active error:', err);
      alert(err.message || 'Ders durumu güncellenirken bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Yükleniyor...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !training) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error || 'Eğitim bulunamadı'}
        </div>
      </AdminLayout>
    );
  }

  const filteredLessons = lessons.filter((lesson) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      lesson.title.toLowerCase().includes(searchLower) ||
      (lesson.description && lesson.description.toLowerCase().includes(searchLower))
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/trainings')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{training.title}</h1>
              {training.description && (
                <p className="mt-1 text-sm text-gray-500 line-clamp-1">
                  {training.description.replace(/<[^>]*>/g, '').substring(0, 100)}
                  {training.description.replace(/<[^>]*>/g, '').length > 100 ? '...' : ''}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedLesson(null);
              setIsFormModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Yeni Ders
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Ders ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm w-full"
            />
          </div>
        </div>

        {/* Lessons List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredLessons.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">
                {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz ders eklenmemiş'}
              </p>
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
                      Açıklama
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLessons.map((lesson) => (
                    <tr 
                      key={lesson.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedLesson(lesson);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">
                          {lesson.title}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {lesson.description ? (
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {lesson.description.replace(/<[^>]*>/g, '').substring(0, 100)}
                            {lesson.description.replace(/<[^>]*>/g, '').length > 100 ? '...' : ''}
                          </p>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/trainings/${trainingId}/lessons/${lesson.id}`);
                            }}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="İçeriklere Git"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleLessonActive(lesson.id, lesson.isActive);
                            }}
                            className={`p-2 rounded-lg transition-colors ${
                              lesson.isActive
                                ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                                : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                            }`}
                            title={lesson.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                          >
                            {lesson.isActive ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLesson(lesson);
                              setIsFormModalOpen(true);
                            }}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Düzenle"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDialog({
                                open: true,
                                title: 'Dersi Sil',
                                message: `"${lesson.title}" dersini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
                                onConfirm: () => {
                                  handleDeleteLesson(lesson.id);
                                  setConfirmDialog({ ...confirmDialog, open: false });
                                },
                              });
                            }}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Confirm Dialog */}
        <ConfirmDialog
          open={confirmDialog.open}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
        />

        {/* Lesson Form Modal */}
        <LessonFormModal
          lesson={selectedLesson}
          trainingId={trainingId!}
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setSelectedLesson(null);
          }}
          onSuccess={() => {
            loadLessons();
            setIsFormModalOpen(false);
            setSelectedLesson(null);
          }}
        />

        {/* Lesson Detail Modal */}
        <LessonDetailModal
          lesson={selectedLesson}
          trainingId={trainingId!}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedLesson(null);
          }}
          onEdit={() => {
            setIsDetailModalOpen(false);
            setIsFormModalOpen(true);
          }}
          onDelete={() => {
            setIsDetailModalOpen(false);
            if (selectedLesson) {
              setConfirmDialog({
                open: true,
                title: 'Dersi Sil',
                message: `"${selectedLesson.title}" dersini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
                onConfirm: () => {
                  handleDeleteLesson(selectedLesson.id);
                  setConfirmDialog({ ...confirmDialog, open: false });
                  setSelectedLesson(null);
                },
              });
            }
          }}
          onToggleActive={() => {
            if (selectedLesson) {
              handleToggleLessonActive(selectedLesson.id, selectedLesson.isActive);
            }
          }}
          onRefresh={loadLessons}
        />
      </div>
    </AdminLayout>
  );
}

