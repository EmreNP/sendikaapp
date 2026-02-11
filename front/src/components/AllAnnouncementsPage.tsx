import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Clock, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { IslamicTileBackground } from "./IslamicTileBackground";
import { announcementService, Announcement } from "../services/api";

interface AllAnnouncementsPageProps {
  onBack: () => void;
}

// Tarihi formatla
function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

// Öncelik renkleri
function getPriorityColor(priority: Announcement['priority']): string {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-700';
    case 'high':
      return 'bg-orange-100 text-orange-700';
    case 'normal':
      return 'bg-blue-100 text-blue-700';
    case 'low':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-blue-100 text-blue-700';
  }
}

function getPriorityLabel(priority: Announcement['priority']): string {
  switch (priority) {
    case 'urgent':
      return 'Acil';
    case 'high':
      return 'Önemli';
    case 'normal':
      return 'Duyuru';
    case 'low':
      return 'Bilgi';
    default:
      return 'Duyuru';
  }
}

export function AllAnnouncementsPage({ onBack }: AllAnnouncementsPageProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        setIsLoading(true);
        setError(null);
        const { announcements: data } = await announcementService.getAnnouncements(1, 20);
        setAnnouncements(data);
      } catch (err) {
        console.error('Duyurular yüklenirken hata:', err);
        setError('Duyurular yüklenemedi');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAnnouncements();
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 pb-24">
      {/* Background */}
      <IslamicTileBackground />
      
      {/* Header */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-700 to-blue-800 shadow-lg shadow-blue-900/30 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-white hover:bg-white/10 rounded-xl transition-all hover:shadow-lg backdrop-blur-sm border border-white/10 hover:border-white/20"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white text-xl">Tüm Duyurular</h1>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          )}

          {/* Error */}
          {error && !isLoading && (
            <div className="flex items-center justify-center py-20 text-gray-500">
              <AlertCircle className="w-6 h-6 mr-2" />
              <span>{error}</span>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && announcements.length === 0 && (
            <div className="flex items-center justify-center py-20 text-gray-500">
              <span>Henüz duyuru bulunmuyor</span>
            </div>
          )}

          {/* Grid layout */}
          {!isLoading && !error && announcements.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {announcements.map((announcement) => (
                <button
                  key={announcement.id}
                  className="relative bg-white/85 backdrop-blur-xl rounded-2xl p-5 shadow-lg shadow-blue-900/10 hover:shadow-xl hover:shadow-blue-900/15 transition-all duration-300 border border-white/80 hover:border-blue-200/60 text-left group hover:-translate-y-1 flex flex-col h-full"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`${getPriorityColor(announcement.priority)} px-3 py-1.5 rounded-lg text-xs shadow-sm border border-blue-200/30`}>
                        {getPriorityLabel(announcement.priority)}
                      </span>
                    </div>
                    <h3 className="text-gray-900 mb-2 line-clamp-2">{announcement.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{announcement.summary || announcement.content}</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex flex-col gap-1.5 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(announcement.publishedAt || announcement.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTime(announcement.publishedAt || announcement.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
