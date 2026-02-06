import { useState, useEffect } from "react";
import { Megaphone, Calendar, Clock, ChevronRight, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { announcementService, Announcement } from "../services/api";

interface AnnouncementSectionProps {
  onViewAll: () => void;
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

export function AnnouncementSection({ onViewAll }: AnnouncementSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Duyuruları yükle
  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        setIsLoading(true);
        setError(null);
        const { announcements: data } = await announcementService.getAnnouncements(1, 5);
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

  // Auto-advance slider every 5 seconds
  useEffect(() => {
    if (announcements.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % announcements.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [announcements.length]);

  // Loading state
  if (isLoading) {
    return (
      <div className="relative px-4 sm:px-6 lg:px-8 py-3 pb-2">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-[28vh]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative px-4 sm:px-6 lg:px-8 py-3 pb-2">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-[28vh] text-gray-500">
            <AlertCircle className="w-6 h-6 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  // No announcements
  if (announcements.length === 0) {
    return (
      <div className="relative px-4 sm:px-6 lg:px-8 py-3 pb-2">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 rounded-xl shadow-lg shadow-blue-600/30">
                <Megaphone className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-gray-800">Duyurular</h2>
            </div>
          </div>
          <div className="flex items-center justify-center h-[20vh] text-gray-500">
            <span>Henüz duyuru bulunmuyor</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative px-4 sm:px-6 lg:px-8 py-3 pb-2">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 rounded-xl shadow-lg shadow-blue-600/30">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-gray-800">Duyurular</h2>
          </div>
          <button 
            onClick={onViewAll}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            Tümü
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Single announcement slider */}
        <div className="relative h-[28vh]">
          {announcements.map((announcement, index) => (
            <div
              key={announcement.id}
              className={`transition-all duration-500 ${
                index === currentSlide ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"
              }`}
            >
              <button className="relative w-full h-full bg-white/85 backdrop-blur-xl rounded-2xl p-3.5 shadow-lg shadow-blue-900/10 hover:shadow-xl hover:shadow-blue-900/15 transition-all duration-300 border border-white/80 hover:border-blue-200/60 text-left group hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-3 h-full">
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`${getPriorityColor(announcement.priority)} px-2 py-0.5 rounded-lg text-xs shadow-sm border border-blue-200/30`}>
                        {getPriorityLabel(announcement.priority)}
                      </span>
                    </div>
                    <h3 className="text-gray-900 mb-1 line-clamp-2">{announcement.title}</h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-3 flex-1">{announcement.summary || announcement.content}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(announcement.publishedAt || announcement.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTime(announcement.publishedAt || announcement.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
