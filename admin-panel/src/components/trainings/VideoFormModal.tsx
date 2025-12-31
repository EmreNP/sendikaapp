import { useEffect, useState, useRef } from 'react';
import { X, Upload, Video, ExternalLink } from 'lucide-react';
import { contentService } from '@/services/api/contentService';
import { fileUploadService } from '@/services/api/fileUploadService';
import type { VideoContent, CreateVideoContentRequest, UpdateVideoContentRequest, VideoSource } from '@/types/training';

interface VideoFormModalProps {
  video: VideoContent | null;
  lessonId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function VideoFormModal({ video, lessonId, isOpen, onClose, onSuccess }: VideoFormModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    videoSource: 'uploaded' as VideoSource, // Default olarak 'uploaded'
    thumbnailUrl: '',
    order: '' as string | number,
    isActive: true,
  });
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!video;

  useEffect(() => {
    if (isOpen) {
      if (video) {
        setFormData({
          title: video.title || '',
          description: video.description || '',
          videoUrl: video.videoUrl || '',
          videoSource: video.videoSource || 'uploaded',
          thumbnailUrl: video.thumbnailUrl || '',
          order: video.order || '',
          isActive: video.isActive ?? true,
        });
      } else {
        setFormData({
          title: '',
          description: '',
          videoUrl: '',
          videoSource: 'uploaded', // Default
          thumbnailUrl: '',
          order: '',
          isActive: true,
        });
      }
      setSelectedVideoFile(null);
      setSelectedThumbnailFile(null);
      setUploadProgress(0);
      setError(null);
    }
  }, [isOpen, video]);

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Video dosyası kontrolü
    const allowedTypes = ['video/mp4', 'video/webm'];
    const maxSize = 500 * 1024 * 1024; // 500MB

    if (!allowedTypes.includes(file.type)) {
      setError('Sadece MP4 ve WebM video dosyaları yüklenebilir');
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
      return;
    }

    if (file.size > maxSize) {
      setError('Video dosyası en fazla 500MB olabilir');
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
      return;
    }

    setSelectedVideoFile(file);
    setError(null);
  };

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Thumbnail dosyası kontrolü
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!allowedTypes.includes(file.type)) {
      setError('Sadece JPEG, PNG ve WebP görsel dosyaları yüklenebilir');
      if (thumbnailInputRef.current) {
        thumbnailInputRef.current.value = '';
      }
      return;
    }

    if (file.size > maxSize) {
      setError('Thumbnail görseli en fazla 2MB olabilir');
      if (thumbnailInputRef.current) {
        thumbnailInputRef.current.value = '';
      }
      return;
    }

    setSelectedThumbnailFile(file);
    setError(null);
  };

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
      let thumbnailUrl = formData.thumbnailUrl;

      // Video yükleme (sadece uploaded kaynağı için)
      if (formData.videoSource === 'uploaded') {
        if (!isEditMode && !selectedVideoFile) {
          setError('Lütfen bir video dosyası seçin');
          setLoading(false);
          return;
        }

        if (!isEditMode || selectedVideoFile) {
          try {
            setUploading(true);
            setUploadProgress(0);

            const progressInterval = setInterval(() => {
              setUploadProgress((prev) => {
                if (prev >= 90) {
                  clearInterval(progressInterval);
                  return 90;
                }
                return prev + 10;
              });
            }, 200);

            const uploadResult = await fileUploadService.uploadVideo(selectedVideoFile!);
            
            clearInterval(progressInterval);
            setUploadProgress(100);
            videoUrl = uploadResult.documentUrl;
            setUploading(false);
          } catch (uploadErr: any) {
            console.error('Video upload error:', uploadErr);
            setError(uploadErr.message || 'Video yüklenirken bir hata oluştu');
            setLoading(false);
            setUploading(false);
            setUploadProgress(0);
            return;
          }
        }
      } else {
        // YouTube veya Vimeo için URL kontrolü
        if (!formData.videoUrl.trim()) {
          setError('Video URL zorunludur');
          setLoading(false);
          return;
        }
        videoUrl = formData.videoUrl.trim();
      }

      // Thumbnail yükleme
      if (selectedThumbnailFile) {
        try {
          setUploading(true);
          setUploadProgress(0);

          const progressInterval = setInterval(() => {
            setUploadProgress((prev) => {
              if (prev >= 90) {
                clearInterval(progressInterval);
                return 90;
              }
              return prev + 10;
            });
          }, 200);

          const uploadResult = await fileUploadService.uploadThumbnail(selectedThumbnailFile);
          
          clearInterval(progressInterval);
          setUploadProgress(100);
          thumbnailUrl = uploadResult.documentUrl;
          setUploading(false);
        } catch (uploadErr: any) {
          console.error('Thumbnail upload error:', uploadErr);
          setError(uploadErr.message || 'Thumbnail yüklenirken bir hata oluştu');
          setLoading(false);
          setUploading(false);
          setUploadProgress(0);
          return;
        }
      }

      // Edit modunda ve dosya seçilmemişse mevcut URL'leri kullan
      if (isEditMode && video) {
        if (!videoUrl) videoUrl = video.videoUrl;
        if (!thumbnailUrl) thumbnailUrl = video.thumbnailUrl || '';
      }

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
          videoSource: formData.videoSource,
          thumbnailUrl: thumbnailUrl || undefined,
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
          videoSource: formData.videoSource,
          thumbnailUrl: thumbnailUrl || undefined,
          order: formData.order === '' ? undefined : (typeof formData.order === 'number' ? formData.order : parseInt(formData.order.toString()) || undefined),
          isActive: formData.isActive,
        };
        await contentService.createVideo(lessonId, createData);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Save video error:', err);
      setError(err.message || 'Video kaydedilirken bir hata oluştu');
    } finally {
      setLoading(false);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {isEditMode ? 'Videoyu Düzenle' : 'Yeni Video Ekle'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

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
                  <div className="flex flex-col">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Video Kaynağı <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.videoSource}
                      onChange={(e) => setFormData({ ...formData, videoSource: e.target.value as VideoSource })}
                      disabled={isEditMode}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-10 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    >
                      <option value="uploaded">Yüklenen Video</option>
                      <option value="youtube">YouTube</option>
                      <option value="vimeo">Vimeo</option>
                    </select>
                  </div>

                  {formData.videoSource === 'uploaded' ? (
                    <div className="flex flex-col">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Video Dosyası <span className="text-red-500">*</span>
                      </label>
                      {isEditMode ? (
                        <a
                          href={formData.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors h-10 text-sm font-medium text-gray-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Linke Git
                        </a>
                      ) : (
                        <>
                          <input
                            ref={videoInputRef}
                            type="file"
                            accept="video/mp4,video/webm"
                            onChange={handleVideoFileChange}
                            className="hidden"
                            id="video-file"
                            disabled={uploading}
                          />
                          <label
                            htmlFor="video-file"
                            className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors h-10"
                          >
                            <Video className="w-5 h-5 text-gray-500" />
                            <span className="text-sm text-gray-700 truncate">
                              {selectedVideoFile ? selectedVideoFile.name : 'Video dosyası seçin (MP4, WebM - Max 500MB)'}
                            </span>
                          </label>
                          {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Video URL <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="url"
                        value={formData.videoUrl}
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                        readOnly={isEditMode}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-10 ${isEditMode ? 'bg-gray-50' : ''}`}
                        required
                        placeholder={formData.videoSource === 'youtube' ? 'https://www.youtube.com/watch?v=...' : 'https://vimeo.com/...'}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 items-start">
                  <div className="flex flex-col">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thumbnail Görseli
                    </label>
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleThumbnailFileChange}
                      className="hidden"
                      id="thumbnail-file"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="thumbnail-file"
                      className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors h-10"
                    >
                      <Upload className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-700 truncate">
                        {selectedThumbnailFile ? selectedThumbnailFile.name : 'Thumbnail görseli seçin (JPEG, PNG, WebP - Max 2MB)'}
                      </span>
                    </label>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col">
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
                disabled={loading || uploading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {loading || uploading ? 'Kaydediliyor...' : isEditMode ? 'Güncelle' : 'Oluştur'}
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
