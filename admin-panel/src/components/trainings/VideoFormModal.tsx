import { useEffect, useState, memo } from 'react';
import { X } from 'lucide-react';
import { contentService } from '@/services/api/contentService';
import type { VideoContent, CreateVideoContentRequest, UpdateVideoContentRequest } from '@/types/training';
import { logger } from '@/utils/logger';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface VideoFormModalProps {
  video: VideoContent | null;
  lessonId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function VideoFormModal({ video, lessonId, isOpen, onClose, onSuccess }: VideoFormModalProps) {
  useEscapeKey(isOpen, onClose);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    videoSource: 'youtube' as const,
    order: '' as string | number,
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!video;

  useEffect(() => {
    if (isOpen) {
      if (video) {
        setFormData({
          title: video.title || '',
          description: video.description || '',
          videoUrl: video.videoUrl || '',
          videoSource: 'youtube' as const,
          order: video.order || '',
          isActive: video.isActive ?? true,
        });
      } else {
        setFormData({
          title: '',
          description: '',
          videoUrl: '',
          videoSource: 'youtube',
          order: '',
          isActive: true,
        });
      }
      setError(null);
    }
  }, [isOpen, video]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError('Başlık zorunludur');
      return;
    }

    try {
      setLoading(true);
      let videoUrl = formData.videoUrl;

      // YouTube URL kontrolü
      if (!formData.videoUrl.trim()) {
        setError('YouTube URL zorunludur');
        setLoading(false);
        return;
      }
      videoUrl = formData.videoUrl.trim();


      if (!videoUrl) {
        setError('Video URL zorunludur');
        setLoading(false);
        return;
      }
      
      if (isEditMode && video) {
        const updateData: UpdateVideoContentRequest = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          videoUrl: videoUrl,
          videoPath: undefined,
          videoSource: 'youtube',
          thumbnailUrl: undefined,
          thumbnailPath: undefined,
          order: formData.order === '' ? undefined : (typeof formData.order === 'number' ? formData.order : parseInt(formData.order.toString()) || undefined),
          isActive: formData.isActive,
        };
        await contentService.updateVideo(video.id, updateData);
      } else {
        const createData: CreateVideoContentRequest = {
          lessonId,
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          videoUrl: videoUrl,
          videoPath: undefined,
          videoSource: 'youtube',
          thumbnailUrl: undefined,
          thumbnailPath: undefined,
          order: formData.order === '' ? undefined : (typeof formData.order === 'number' ? formData.order : parseInt(formData.order.toString()) || undefined),
          isActive: formData.isActive,
        };
        await contentService.createVideo(lessonId, createData);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      logger.error('Save video error:', err);
      setError((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : 'Video kaydedilirken bir hata oluştu'));
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
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div role="dialog" aria-modal="true" aria-labelledby="video-form-modal-title" className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200 bg-slate-700">
            <h3 id="video-form-modal-title" className="text-sm font-medium text-white">
              {isEditMode ? 'Videoyu Düzenle' : 'Yeni Video Ekle'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Başlık <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 items-start">
                  <div className="flex flex-col col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      YouTube Video URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      readOnly={isEditMode}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-10 ${isEditMode ? 'bg-gray-50' : ''}`}
                      required
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sıra
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: e.target.value === '' ? '' : parseInt(e.target.value) || '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-10"
                    min="1"
                    placeholder="Otomatik"
                  />
                </div>

                <div>
                  <label htmlFor="isActive" className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Aktif</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {loading ? 'Kaydediliyor...' : isEditMode ? 'Güncelle' : 'Oluştur'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default memo(VideoFormModal);
