import { useState, useEffect } from "react";
import { ChevronLeft, ChevronDown, Loader2, AlertCircle, BookOpen, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { trainingService, Training, Lesson } from "../services/api";

interface CoursesPageProps {
  onBack: () => void;
  onCourseSelect: (trainingId: string, lessonId: string) => void;
}

// Renk haritası - eğitimlere dinamik renk atamak için
const colorPalette = [
  { gradient: "from-blue-600 to-blue-700", light: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  { gradient: "from-emerald-600 to-emerald-700", light: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
  { gradient: "from-amber-600 to-amber-700", light: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  { gradient: "from-purple-600 to-purple-700", light: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  { gradient: "from-rose-600 to-rose-700", light: "bg-rose-50", text: "text-rose-600", border: "border-rose-200" },
];

export function CoursesPage({ onBack, onCourseSelect }: CoursesPageProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [lessonsMap, setLessonsMap] = useState<Record<string, Lesson[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingLessons, setLoadingLessons] = useState<string | null>(null);
  
  const { isAuthenticated, canAccessTrainings, status, isLoading: authLoading } = useAuth();

  // Eğitimleri yükle
  useEffect(() => {
    async function loadTrainings() {
      if (!canAccessTrainings) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const data = await trainingService.getTrainings();
        setTrainings(data);
        setError(null);
      } catch (err: any) {
        console.error("Eğitimler yüklenemedi:", err);
        setError(err.message || "Eğitimler yüklenirken hata oluştu");
      } finally {
        setLoading(false);
      }
    }
    
    if (!authLoading) {
      loadTrainings();
    }
  }, [canAccessTrainings, authLoading]);

  // Bir eğitimin derslerini yükle
  const loadLessons = async (trainingId: string) => {
    if (lessonsMap[trainingId]) return; // Zaten yüklü
    
    try {
      setLoadingLessons(trainingId);
      const lessons = await trainingService.getTrainingLessons(trainingId);
      setLessonsMap(prev => ({ ...prev, [trainingId]: lessons }));
    } catch (err) {
      console.error("Dersler yüklenemedi:", err);
    } finally {
      setLoadingLessons(null);
    }
  };

  // Kategori genişletildiğinde dersleri yükle
  const handleCategoryToggle = (trainingId: string) => {
    const isExpanded = expandedCategory === trainingId;
    setExpandedCategory(isExpanded ? null : trainingId);
    
    if (!isExpanded) {
      loadLessons(trainingId);
    }
  };

  // Auth loading durumu
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-600">Yükleniyor...</p>
      </div>
    );
  }

  // Giriş yapmamış kullanıcılar
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-12 h-12 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Bu Alan Üyelere Özeldir</h2>
        <p className="text-slate-600 mb-8 max-w-sm mx-auto">
          Eğitim içeriklerine erişebilmek için lütfen giriş yapınız.
        </p>
        <button 
          onClick={onBack}
          className="w-full max-w-xs py-3 px-6 bg-white border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  // Aktif olmayan kullanıcılar (pending durumları)
  if (!canAccessTrainings) {
    const statusMessages: Record<string, { title: string; message: string }> = {
      pending_details: {
        title: "Kayıt İşleminizi Tamamlayın",
        message: "Eğitim içeriklerine erişebilmek için lütfen üyelik bilgilerinizi tamamlayın."
      },
      pending_branch_review: {
        title: "Onay Bekleniyor",
        message: "Üyelik başvurunuz şube müdürü tarafından inceleniyor. Onaylandıktan sonra eğitimlere erişebileceksiniz."
      },
      pending_admin_approval: {
        title: "Onay Bekleniyor",
        message: "Üyelik başvurunuz yönetici onayı bekliyor. Onaylandıktan sonra eğitimlere erişebileceksiniz."
      },
      rejected: {
        title: "Üyelik Başvurunuz Reddedildi",
        message: "Maalesef üyelik başvurunuz onaylanmadı. Detaylı bilgi için lütfen iletişime geçin."
      },
    };

    const statusInfo = statusMessages[status || ''] || {
      title: "Erişim Kısıtlı",
      message: "Bu içeriğe erişim yetkiniz bulunmuyor."
    };

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
        <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mb-6">
          <Clock className="w-12 h-12 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{statusInfo.title}</h2>
        <p className="text-slate-600 mb-8 max-w-sm mx-auto">
          {statusInfo.message}
        </p>
        <button 
          onClick={onBack}
          className="w-full max-w-xs py-3 px-6 bg-white border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  // Yükleniyor
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-600">Eğitimler yükleniyor...</p>
      </div>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-12 h-12 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Bir Hata Oluştu</h2>
        <p className="text-slate-600 mb-8 max-w-sm mx-auto">{error}</p>
        <button 
          onClick={onBack}
          className="w-full max-w-xs py-3 px-6 bg-white border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  // Eğitim yok
  if (trainings.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <BookOpen className="w-12 h-12 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Henüz Eğitim Yok</h2>
        <p className="text-slate-600 mb-8 max-w-sm mx-auto">
          Şu anda görüntülenebilecek eğitim bulunmuyor. Yakında yeni eğitimler eklenecek.
        </p>
        <button 
          onClick={onBack}
          className="w-full max-w-xs py-3 px-6 bg-white border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-lg transition-all active:scale-95"
            aria-label="Geri"
          >
            <ChevronLeft className="w-6 h-6 text-white" strokeWidth={2.5} />
          </button>
          <div className="flex-1">
            <h1 className="text-white tracking-tight" style={{ fontWeight: 700, fontSize: "clamp(1.25rem, 5vw, 1.5rem)" }}>
              Eğitimler
            </h1>
            <p className="text-blue-100 text-sm mt-0.5">
              {trainings.length} eğitim
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 pb-24 space-y-4">
        {trainings.map((training, index) => {
          const colors = colorPalette[index % colorPalette.length];
          const isExpanded = expandedCategory === training.id;
          const lessons = lessonsMap[training.id] || [];
          const isLoadingThisLessons = loadingLessons === training.id;

          return (
            <div
              key={training.id}
              className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden transition-all duration-300"
            >
              {/* Training Header */}
              <button
                onClick={() => handleCategoryToggle(training.id)}
                className="w-full p-4 sm:p-5 flex items-center gap-3 hover:bg-slate-50 transition-colors"
              >
                <div className={`p-3 bg-gradient-to-br ${colors.gradient} rounded-xl shadow-lg`}>
                  <BookOpen className="w-7 h-7 text-white" strokeWidth={2} />
                </div>
                <div className="flex-1 text-left">
                  <h2 className="text-slate-800 mb-1" style={{ fontWeight: 700, fontSize: "clamp(1.125rem, 4.5vw, 1.25rem)" }}>
                    {training.title}
                  </h2>
                  {training.description && (
                    <p className="text-slate-600 text-sm line-clamp-2">
                      {training.description}
                    </p>
                  )}
                </div>
                {isLoadingThisLessons ? (
                  <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                ) : (
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>

              {/* Lessons */}
              {isExpanded && (
                <div className={`${colors.light} border-t ${colors.border}`}>
                  <div className="p-3 sm:p-4 space-y-3">
                    {isLoadingThisLessons ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                        <span className="ml-2 text-slate-500">Dersler yükleniyor...</span>
                      </div>
                    ) : lessons.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        Bu eğitimde henüz ders bulunmuyor.
                      </div>
                    ) : (
                      lessons.map((lesson) => (
                        <button
                          key={lesson.id}
                          onClick={() => onCourseSelect(training.id, lesson.id)}
                          className="w-full bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all group"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-slate-800 text-left mb-1" style={{ fontWeight: 600, fontSize: "clamp(1rem, 4vw, 1.125rem)" }}>
                                {lesson.title}
                              </h3>
                              {lesson.description && (
                                <p className="text-slate-600 text-sm text-left line-clamp-2">
                                  {lesson.description}
                                </p>
                              )}
                            </div>
                            <ChevronDown className="w-5 h-5 text-slate-400 -rotate-90 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
