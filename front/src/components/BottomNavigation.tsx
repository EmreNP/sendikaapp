import { Home, BookOpen, MapPin } from "lucide-react";

type Tab = "home" | "courses" | "branches";

interface BottomNavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-gray-200/60 shadow-2xl shadow-blue-900/10 z-50 safe-area-inset-bottom">
      {/* Subtle decorative line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
      
      <div className="flex items-center justify-around h-16 max-w-7xl mx-auto relative">
        <button
          onClick={() => onTabChange("home")}
          className={`relative flex flex-col items-center justify-center flex-1 h-full transition-all group ${
            activeTab === "home" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {activeTab === "home" && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-b-full"></div>
          )}
          <Home className="w-6 h-6 transition-transform group-hover:scale-110" strokeWidth={activeTab === "home" ? 2.5 : 2} />
          <span className="text-xs mt-1">Ana Sayfa</span>
        </button>

        <button
          onClick={() => onTabChange("courses")}
          className={`relative flex flex-col items-center justify-center flex-1 h-full transition-all group ${
            activeTab === "courses" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {activeTab === "courses" && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-b-full"></div>
          )}
          <BookOpen className="w-6 h-6 transition-transform group-hover:scale-110" strokeWidth={activeTab === "courses" ? 2.5 : 2} />
          <span className="text-xs mt-1">Eğitimler</span>
        </button>

        <button
          onClick={() => onTabChange("branches")}
          className={`relative flex flex-col items-center justify-center flex-1 h-full transition-all group ${
            activeTab === "branches" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {activeTab === "branches" && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-b-full"></div>
          )}
          <MapPin className="w-6 h-6 transition-transform group-hover:scale-110" strokeWidth={activeTab === "branches" ? 2.5 : 2} />
          <span className="text-xs mt-1">Şubeler</span>
        </button>
      </div>
    </nav>
  );
}
