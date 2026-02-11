import { useState, useEffect } from "react";
import { ChevronLeft, Play, FileText, ClipboardCheck, Clock, CheckCircle2, Circle, Download, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useAuth } from "../context/AuthContext";
import { trainingService, Training, Lesson, LessonContent } from "../services/api";

interface CourseDetailPageProps {
  trainingId: string;
  lessonId: string;
  onBack: () => void;
}

export function CourseDetailPage({ trainingId, lessonId, onBack }: CourseDetailPageProps) {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [training, setTraining] = useState<Training | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [contents, setContents] = useState<LessonContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { canAccessTrainings } = useAuth();

  useEffect(() => {
    async function loadData() {
      if (!canAccessTrainings) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Eğitim, ders ve ders içeriklerini paralel olarak yükle
        const [trainingData, lessonData, contentsData] = await Promise.all([
          trainingService.getTraining(trainingId),
          trainingService.getLesson(lessonId),
          trainingService.getLessonContents(lessonId),
        ]);

        setTraining(trainingData);
        setLesson(lessonData);
        setContents(contentsData);
      } catch (err: any) {
        console.error("Ders detayları yüklenemedi:", err);
        setError(err.message || "Ders detayları yüklenirken hata oluştu");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [trainingId, lessonId, canAccessTrainings]);

  const toggleComplete = (id: string) => {
    setCompletedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const isCompleted = (content: LessonContent) => {
    return completedItems.has(content.id);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return Play;
      case 'document':
        return FileText;
      case 'test':
        return ClipboardCheck;
      default:
        return Circle;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'text-blue-600 bg-blue-50';
      case 'document':
        return 'text-emerald-600 bg-emerald-50';
      case 'test':
        return 'text-amber-600 bg-amber-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Ders yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-6">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6 mt-20">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="w-8 h-8" />
            <h2 className="text-xl font-bold">Hata</h2>
          </div>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={onBack}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  // Erişim kontrolü
  if (!canAccessTrainings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-6">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6 mt-20">
          <div className="flex items-center gap-3 text-amber-600 mb-4">
            <AlertCircle className="w-8 h-8" />
            <h2 className="text-xl font-bold">Erişim Yok</h2>
          </div>
          <p className="text-slate-600 mb-4">
            Bu içeriğe erişmek için üyelik onayınızın tamamlanması gerekmektedir.
          </p>
          <button
            onClick={onBack}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  if (!training || !lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-6">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6 mt-20">
          <div className="flex items-center gap-3 text-amber-600 mb-4">
            <AlertCircle className="w-8 h-8" />
            <h2 className="text-xl font-bold">Bulunamadı</h2>
          </div>
          <p className="text-slate-600 mb-4">Aradığınız ders bulunamadı.</p>
          <button
            onClick={onBack}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  const videos = contents.filter(c => c.type === 'video');
  const documents = contents.filter(c => c.type === 'document');
  const tests = contents.filter(c => c.type === 'test');

  const completedCount = contents.filter(c => isCompleted(c)).length;
  const progress = contents.length > 0 ? Math.round((completedCount / contents.length) * 100) : 0;

  const renderContentItem = (content: LessonContent) => {
    const Icon = getTypeIcon(content.type);
    const completed = isCompleted(content);

    return (
      <button
        key={content.id}
        onClick={() => toggleComplete(content.id)}
        className="w-full bg-white rounded-xl p-3 sm:p-4 border-2 border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 ${getTypeColor(content.type)} rounded-lg`}>
            <Icon className="w-5 h-5" strokeWidth={2} />
          </div>
          
          <div className="flex-1 text-left">
            <h3 className="text-slate-800 mb-1 group-hover:text-blue-600 transition-colors" style={{ fontWeight: 600, fontSize: "clamp(0.95rem, 3.8vw, 1.05rem)" }}>
              {content.title}
            </h3>
            {content.duration && (
              <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                <Clock className="w-3.5 h-3.5" />
                <span>{content.duration}</span>
              </div>
            )}
            {content.description && (
              <p className="text-slate-500 text-sm mt-1 line-clamp-2">
                {content.description}
              </p>
            )}
          </div>

          <div className="flex-shrink-0">
            {completed ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-500" strokeWidth={2.5} />
            ) : (
              <Circle className="w-6 h-6 text-slate-300" strokeWidth={2} />
            )}
          </div>
        </div>

        {content.type === 'video' && content.url && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Video dersi başlat</span>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
        )}

        {content.type === 'document' && content.url && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Dokümanı görüntüle</span>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
        )}

        {content.type === 'test' && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Testi başlat</span>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-lg transition-all active:scale-95"
              aria-label="Geri"
            >
              <ChevronLeft className="w-6 h-6 text-white" strokeWidth={2.5} />
            </button>
            <div className="flex-1">
              <Badge variant="secondary" className="mb-2 text-[10px] sm:text-xs bg-white/20 text-white border-0">
                {training.title}
              </Badge>
              <h1 className="text-white tracking-tight leading-tight" style={{ fontWeight: 700, fontSize: "clamp(1.125rem, 4.5vw, 1.375rem)" }}>
                {lesson.title}
              </h1>
              {lesson.description && (
                <p className="text-blue-100 text-sm mt-1 line-clamp-2">
                  {lesson.description}
                </p>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-sm" style={{ fontWeight: 600 }}>
                İlerleme Durumu
              </span>
              <span className="text-white text-sm" style={{ fontWeight: 700 }}>
                %{progress}
              </span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-blue-100">
              <span>
                {completedCount} / {contents.length} tamamlandı
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="px-4 py-6 pb-24">
        {contents.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Bu derste henüz içerik bulunmuyor.</p>
          </div>
        ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="flex w-full gap-2 mb-6 bg-white shadow-sm overflow-x-auto no-scrollbar">
            <TabsTrigger value="all" className="min-w-[90px] flex-none text-xs sm:text-sm">
              Tümü ({contents.length})
            </TabsTrigger>
            <TabsTrigger value="videos" className="min-w-[90px] flex-none text-xs sm:text-sm">
              Videolar ({videos.length})
            </TabsTrigger>
            <TabsTrigger value="documents" className="min-w-[90px] flex-none text-xs sm:text-sm">
              Dokümanlar ({documents.length})
            </TabsTrigger>
            <TabsTrigger value="tests" className="min-w-[90px] flex-none text-xs sm:text-sm">
              Testler ({tests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-0">
            {contents.map(renderContentItem)}
          </TabsContent>

          <TabsContent value="videos" className="space-y-3 mt-0">
            {videos.length > 0 ? (
              videos.map(renderContentItem)
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Play className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Henüz video bulunmuyor</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-3 mt-0">
            {documents.length > 0 ? (
              documents.map(renderContentItem)
            ) : (
              <div className="text-center py-12 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Henüz doküman bulunmuyor</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tests" className="space-y-3 mt-0">
            {tests.length > 0 ? (
              tests.map(renderContentItem)
            ) : (
              <div className="text-center py-12 text-slate-500">
                <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Henüz test bulunmuyor</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        )}
      </div>
    </div>
  );
}
