import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Video, FileText, ClipboardList, Search } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import ActionButton from '@/components/common/ActionButton';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import VideoFormModal from '@/components/trainings/VideoFormModal';
import DocumentFormModal from '@/components/trainings/DocumentFormModal';
import TestFormModal from '@/components/trainings/TestFormModal';
import TestQuestionsModal from '@/components/trainings/TestQuestionsModal';
import { lessonService } from '@/services/api/lessonService';
import { contentService } from '@/services/api/contentService';
import type { Lesson, Content, VideoContent, DocumentContent, TestContent } from '@/types/training';
import { logger } from '@/utils/logger';

type ContentTab = 'all' | 'video' | 'document' | 'test';

export default function LessonDetailPage() {
  const { trainingId, lessonId } = useParams<{ trainingId: string; lessonId: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ContentTab>('all');
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isTestQuestionsModalOpen, setIsTestQuestionsModalOpen] = useState(false);
  const [selectedTestForQuestions, setSelectedTestForQuestions] = useState<TestContent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    if (lessonId) {
      loadLesson();
      loadContents();
    } else {
      setError('Ders ID bulunamadı');
      setLoading(false);
    }
  }, [lessonId]);

  const loadLesson = async () => {
    if (!lessonId) return;
    try {
      setLoading(true);
      const response = await lessonService.getLesson(lessonId);
      setLesson(response.lesson);
    } catch (err: any) {
      logger.error('Load lesson error:', err);
      setError(err.message || 'Ders yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadContents = async () => {
    if (!lessonId) return;
    try {
      const response = await contentService.getContents(lessonId);
      setContents(response.contents);
    } catch (err: any) {
      logger.error('Load contents error:', err);
    }
  };

  const handleDeleteContent = async (content: Content) => {
    try {
      logger.log('🗑️ Deleting content:', { id: content.id, type: content.type, title: content.title });
      if (content.type === 'video') {
        await contentService.deleteVideo(content.id);
      } else if (content.type === 'document') {
        await contentService.deleteDocument(content.id);
      } else if (content.type === 'test') {
        await contentService.deleteTest(content.id);
      }
      logger.log('✅ Content deleted successfully');
      await loadContents();
    } catch (err: any) {
      logger.error('❌ Delete content error:', err);
      logger.error('Error details:', {
        message: err.message,
        response: err.response,
        status: err.status,
      });
      alert(err.message || 'İçerik silinirken bir hata oluştu');
    }
  };

  const filteredContents = contents.filter((content) => {
    // Tab filtresi
    if (activeTab !== 'all' && content.type !== activeTab) return false;
    
    // Search filtresi
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        content.title.toLowerCase().includes(searchLower) ||
        (content.description && content.description.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

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

  if (error || !lesson) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error || 'Ders bulunamadı'}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/admin/trainings/${trainingId || lesson.trainingId}`)}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
              {lesson.description && (
                <p className="mt-1 text-sm text-gray-500 line-clamp-1">
                  {lesson.description.replace(/<[^>]*>/g, '').substring(0, 100)}
                  {lesson.description.replace(/<[^>]*>/g, '').length > 100 ? '...' : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Search and Action Buttons */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="İçerik ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm w-full"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedContent(null);
                setIsVideoModalOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              <Video className="w-4 h-4" />
              Video
            </button>
            <button
              onClick={() => {
                setSelectedContent(null);
                setIsDocumentModalOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              <FileText className="w-4 h-4" />
              Döküman
            </button>
            <button
              onClick={() => {
                setSelectedContent(null);
                setIsTestModalOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              <ClipboardList className="w-4 h-4" />
              Test
            </button>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'all'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tümü ({contents.length})
              </button>
              <button
                onClick={() => setActiveTab('video')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'video'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Video ({contents.filter(c => c.type === 'video').length})
              </button>
              <button
                onClick={() => setActiveTab('document')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'document'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Döküman ({contents.filter(c => c.type === 'document').length})
              </button>
              <button
                onClick={() => setActiveTab('test')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'test'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Test ({contents.filter(c => c.type === 'test').length})
              </button>
            </nav>
          </div>

          {/* Contents List */}
          <div className="p-6">
            {filteredContents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz içerik eklenmemiş'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredContents.map((content) => (
                  <div
                    key={content.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={(e) => {
                      // Butonlara tıklama durumunda modal açılmasın
                      if ((e.target as HTMLElement).closest('button')) {
                        return;
                      }
                      
                      if (content.type === 'video') {
                        const videoContent = content as VideoContent;
                        if (videoContent.videoUrl) {
                          window.open(videoContent.videoUrl, '_blank', 'noopener,noreferrer');
                        }
                      } else if (content.type === 'document') {
                        const documentContent = content as DocumentContent;
                        if (documentContent.documentUrl) {
                          window.open(documentContent.documentUrl, '_blank', 'noopener,noreferrer');
                        }
                      } else if (content.type === 'test') {
                        setSelectedTestForQuestions(content as TestContent);
                        setIsTestQuestionsModalOpen(true);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {content.type === 'video' && <Video className="w-5 h-5 text-blue-600 flex-shrink-0" />}
                          {content.type === 'document' && <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />}
                          {content.type === 'test' && <ClipboardList className="w-5 h-5 text-purple-600 flex-shrink-0" />}
                          <h3 className="font-medium text-gray-900">{content.title}</h3>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              content.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {content.isActive ? 'Aktif' : 'Pasif'}
                          </span>
                        </div>
                        {content.description && (
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{content.description}</p>
                        )}
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                          <span>Sıra: {content.order}</span>
                          {content.createdAt && (
                            <span>
                              {new Date(content.createdAt).toLocaleString('tr-TR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                        <ActionButton
                          icon={Edit}
                          variant="edit"
                          onClick={() => {
                            setSelectedContent(content);
                            if (content.type === 'video') {
                              setIsVideoModalOpen(true);
                            } else if (content.type === 'document') {
                              setIsDocumentModalOpen(true);
                            } else if (content.type === 'test') {
                              setIsTestModalOpen(true);
                            }
                          }}
                          title="Düzenle"
                        />
                        <ActionButton
                          icon={Trash2}
                          variant="delete"
                          onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              title: 'İçeriği Sil',
                              message: `"${content.title}" içeriğini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
                              onConfirm: () => {
                                handleDeleteContent(content);
                                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                              },
                            });
                          }}
                          title="Sil"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        />

        {/* Content Form Modals */}
        <VideoFormModal
          video={selectedContent?.type === 'video' ? selectedContent as VideoContent : null}
          lessonId={lessonId!}
          isOpen={isVideoModalOpen}
          onClose={() => {
            setIsVideoModalOpen(false);
            setSelectedContent(null);
          }}
          onSuccess={() => {
            loadContents();
            setIsVideoModalOpen(false);
            setSelectedContent(null);
          }}
        />

        <DocumentFormModal
          document={selectedContent?.type === 'document' ? selectedContent as DocumentContent : null}
          lessonId={lessonId!}
          isOpen={isDocumentModalOpen}
          onClose={() => {
            setIsDocumentModalOpen(false);
            setSelectedContent(null);
          }}
          onSuccess={() => {
            loadContents();
            setIsDocumentModalOpen(false);
            setSelectedContent(null);
          }}
        />

        <TestFormModal
          test={selectedContent?.type === 'test' ? selectedContent as TestContent : null}
          lessonId={lessonId!}
          isOpen={isTestModalOpen}
          onClose={() => {
            setIsTestModalOpen(false);
            setSelectedContent(null);
          }}
          onSuccess={() => {
            loadContents();
            setIsTestModalOpen(false);
            setSelectedContent(null);
          }}
        />

        <TestQuestionsModal
          test={selectedTestForQuestions}
          isOpen={isTestQuestionsModalOpen}
          onClose={() => {
            setIsTestQuestionsModalOpen(false);
            setSelectedTestForQuestions(null);
          }}
        />
      </div>
    </AdminLayout>
  );
}

