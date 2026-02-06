// Başvuru Reddedildi Sayfası - Rejected Page

import { XCircle, Home, LogOut, MessageCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface RejectedPageProps {
  onBack: () => void;
}

export function RejectedPage({ onBack }: RejectedPageProps) {
  const { user, logout, refreshUser, isLoading } = useAuth();

  const handleLogout = async () => {
    await logout();
    onBack();
  };

  const handleRefresh = async () => {
    await refreshUser();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <XCircle className="w-16 h-16 text-red-500" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Başvurunuz Reddedildi
        </h1>

        {/* Subtitle */}
        <p className="text-red-600 font-medium mb-4">
          Üyelik başvurunuz onaylanmadı
        </p>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          Maalesef üyelik başvurunuz değerlendirme sonucunda reddedilmiştir. 
          Detaylı bilgi için lütfen şubeniz veya genel merkez ile iletişime geçiniz.
        </p>

        {/* User Info */}
        {user && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500">Başvuru Sahibi</p>
            <p className="font-medium text-gray-900">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-medium text-yellow-800 mb-2">Ne Yapabilirsiniz?</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Şubenizle iletişime geçerek ret nedenini öğrenebilirsiniz</li>
            <li>• Eksik veya hatalı bilgilerinizi düzeltebilirsiniz</li>
            <li>• Yeni bir başvuru yapabilirsiniz</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            Durumu Yeniden Kontrol Et
          </button>

          <button
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            <Home className="w-5 h-5" />
            Ana Sayfaya Dön
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700 font-medium py-2 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Çıkış Yap
          </button>
        </div>

        {/* Help Text */}
        <p className="mt-6 text-xs text-gray-400">
          Başvurunuzun neden reddedildiğini öğrenmek için bizimle iletişime geçebilirsiniz.
        </p>
      </div>
    </div>
  );
}
