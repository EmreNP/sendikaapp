import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Clock, Eye, User, ChevronRight, TrendingUp, Loader2, AlertCircle } from "lucide-react";
import { IslamicTileBackground } from "./IslamicTileBackground";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { motion } from "motion/react";
import { newsService, News } from "../services/api";

interface NewsPageProps {
  onBack: () => void;
}

// Kategori renkleri
const getCategoryColor = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'eğitim':
      return 'bg-emerald-100 text-emerald-800';
    case 'etkinlik':
      return 'bg-purple-100 text-purple-800';
    case 'duyuru':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Tarih formatlama
const formatDate = (dateStr: string | Date) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const newsCategories = [
  { id: "all", name: "Tümü" },
  { id: "education", name: "Eğitim" },
  { id: "event", name: "Etkinlik" },
  { id: "announcement", name: "Duyuru" },
];

export function NewsPage({ onBack }: NewsPageProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Haberleri yükle
  useEffect(() => {
    async function loadNews() {
      try {
        setLoading(true);
        const data = await newsService.getNews();
        setNews(data);
        setError(null);
      } catch (err: any) {
        console.error("Haberler yüklenemedi:", err);
        setError(err.message || "Haberler yüklenirken hata oluştu");
      } finally {
        setLoading(false);
      }
    }
    loadNews();
  }, []);

  const featuredNews = news.find(n => n.featured);
  const regularNews = news.filter(n => !n.featured);

  const filteredNews = selectedCategory === "all" 
    ? regularNews 
    : regularNews.filter(n => {
        if (selectedCategory === "education") return n.category?.toLowerCase() === "eğitim";
        if (selectedCategory === "event") return n.category?.toLowerCase() === "etkinlik";
        if (selectedCategory === "announcement") return n.category?.toLowerCase() === "duyuru";
        return true;
      });

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Haberler yükleniyor...</p>
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

  // Haber detay sayfası
  if (selectedNewsId !== null) {
    const selectedNews = news.find(n => n.id === selectedNewsId);
    if (!selectedNews) return null;

    return (
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 pb-24">
        <IslamicTileBackground />
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-700 via-blue-700 to-blue-800 shadow-lg shadow-blue-900/30 px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <button
              onClick={() => setSelectedNewsId(null)}
              className="p-2 text-white hover:bg-white/10 rounded-xl transition-all hover:shadow-lg backdrop-blur-sm border border-white/10 hover:border-white/20"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-white text-xl">Haber Detayı</h1>
          </div>
        </div>

        {/* Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 px-4 sm:px-6 lg:px-8 py-6"
        >
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl shadow-blue-900/10 border border-white/80">
              {/* Image */}
              {selectedNews.imageUrl && (
                <div className="relative h-64 sm:h-80 overflow-hidden">
                  <ImageWithFallback 
                    src={selectedNews.imageUrl} 
                    alt={selectedNews.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  {selectedNews.category && (
                    <div className="absolute bottom-4 left-4">
                      <span className={`${getCategoryColor(selectedNews.category)} px-4 py-2 rounded-lg shadow-lg`}>
                        {selectedNews.category}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="p-6 sm:p-8">
                <h1 className="text-gray-900 text-2xl font-bold mb-4">{selectedNews.title}</h1>
                
                {/* Meta */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">
                  {selectedNews.author && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{selectedNews.author}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(selectedNews.publishedAt || selectedNews.createdAt)}</span>
                  </div>
                  {selectedNews.views !== undefined && (
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <span>{selectedNews.views} görüntülenme</span>
                    </div>
                  )}
                </div>

                {/* Article Content */}
                <div className="prose prose-lg max-w-none">
                  {selectedNews.summary && (
                    <p className="text-gray-700 leading-relaxed mb-4 font-medium">{selectedNews.summary}</p>
                  )}
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedNews.content}</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 pb-24">
      <IslamicTileBackground />
      
      {/* Header */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-700 to-blue-800 shadow-lg shadow-blue-900/30 px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-white hover:bg-white/10 rounded-xl transition-all hover:shadow-lg backdrop-blur-sm border border-white/10 hover:border-white/20"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white text-xl">Haberler</h1>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Featured News */}
          {featuredNews && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h2 className="text-gray-900 font-semibold">Öne Çıkan Haber</h2>
              </div>
              <button
                onClick={() => setSelectedNewsId(featuredNews.id)}
                className="relative w-full bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl shadow-blue-900/15 hover:shadow-2xl hover:shadow-blue-900/20 transition-all duration-500 border border-white/80 hover:border-blue-200/60 group hover:-translate-y-1"
              >
                <div className="relative h-48 sm:h-64 overflow-hidden">
                  {featuredNews.imageUrl ? (
                    <ImageWithFallback 
                      src={featuredNews.imageUrl} 
                      alt={featuredNews.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                  {featuredNews.category && (
                    <div className="absolute top-4 left-4">
                      <span className={`${getCategoryColor(featuredNews.category)} px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm`}>
                        {featuredNews.category}
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 right-4 text-left">
                    <h3 className="text-white text-xl font-bold mb-2 drop-shadow-lg">{featuredNews.title}</h3>
                    {featuredNews.summary && (
                      <p className="text-sm text-white/90 line-clamp-2 mb-3">{featuredNews.summary}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-white/80">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(featuredNews.publishedAt || featuredNews.createdAt)}</span>
                      </div>
                      {featuredNews.views !== undefined && (
                        <div className="flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{featuredNews.views}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          )}

          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
          >
            {newsCategories.map((category, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  px-5 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all duration-300 shadow-md
                  ${selectedCategory === category.id 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30 scale-105' 
                    : 'bg-white/90 backdrop-blur-xl text-gray-700 hover:shadow-lg hover:scale-105 border border-white/80'
                  }
                `}
              >
                {category.name}
              </motion.button>
            ))}
          </motion.div>

          {/* News Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNews.map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                whileHover={{ scale: 1.02, y: -4 }}
                onClick={() => setSelectedNewsId(item.id)}
                className="relative bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden shadow-lg shadow-blue-900/10 hover:shadow-xl hover:shadow-blue-900/15 transition-all duration-300 border border-white/80 hover:border-blue-200/60 text-left group"
              >
                {/* Image */}
                <div className="relative h-40 overflow-hidden">
                  {item.imageUrl ? (
                    <ImageWithFallback 
                      src={item.imageUrl} 
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  {item.category && (
                    <div className="absolute top-3 left-3">
                      <span className={`${getCategoryColor(item.category)} px-3 py-1.5 rounded-lg text-xs shadow-lg backdrop-blur-sm`}>
                        {item.category}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-gray-900 text-sm font-semibold mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">
                    {item.title}
                  </h3>
                  {item.summary && (
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">{item.summary}</p>
                  )}
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex flex-col gap-1 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(item.publishedAt || item.createdAt)}</span>
                      </div>
                      {item.views !== undefined && (
                        <div className="flex items-center gap-1.5">
                          <Eye className="w-3 h-3" />
                          <span>{item.views}</span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* No Results */}
          {filteredNews.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-gray-500">Bu kategoride henüz haber bulunmamaktadır.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
