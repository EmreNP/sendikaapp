// Onay Bekleme Sayfası - Pending Approval Page

import { Clock, CheckCircle, RefreshCw, Home, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PendingApprovalPageProps {
  onBack: () => void;
}

export function PendingApprovalPage({ onBack }: PendingApprovalPageProps) {
  const { status, refreshUser, logout, isLoading, user } = useAuth();

  const handleRefresh = async () => {
    await refreshUser();
  };

  const handleLogout = async () => {
    await logout();
    onBack();
  };

  // Status mesajları
  const getStatusMessage = () => {
    switch (status) {
      case 'pending_branch_review':
        return {
          icon: <Clock className="w-16 h-16 text-yellow-500" />,
          title: 'Başvurunuz İnceleniyor',
          subtitle: 'Şube Müdürü Onayı Bekleniyor',
          message: 'Üyelik başvurunuz şube müdürümüz tarafından incelenmektedir. Bu süreç genellikle 1-3 iş günü içinde tamamlanmaktadır.',
          color: 'yellow',
        };
      case 'pending_admin_approval':
        return {
          icon: <CheckCircle className="w-16 h-16 text-blue-500" />,
          title: 'Şube Onayı Alındı',
          subtitle: 'Yönetici Onayı Bekleniyor',
          message: 'Başvurunuz şube müdürümüz tarafından onaylandı ve şimdi yönetici onayı beklemektedir. Bu son aşamadır.',
          color: 'blue',
        };
      default:
        return {
          icon: <Clock className="w-16 h-16 text-gray-500" />,
          title: 'Başvuru Durumu',
          subtitle: 'İşlem Devam Ediyor',
          message: 'Başvurunuz işleme alınmıştır. Lütfen bekleyiniz.',
          color: 'gray',
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          {statusInfo.icon}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {statusInfo.title}
        </h1>

        {/* Subtitle */}
        <p className="text-blue-600 font-medium mb-4">
          {statusInfo.subtitle}
        </p>

        {/* Message */}
        <p className="text-gray-600 mb-8">
          {statusInfo.message}
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

        {/* Status Timeline */}
        <div className="flex justify-center items-center space-x-2 mb-8">
          <div className={`w-3 h-3 rounded-full ${status === 'pending_branch_review' || status === 'pending_admin_approval' ? 'bg-green-500' : 'bg-gray-300'}`} />
          <div className={`w-12 h-1 ${status === 'pending_admin_approval' ? 'bg-green-500' : 'bg-gray-300'}`} />
          <div className={`w-3 h-3 rounded-full ${status === 'pending_admin_approval' ? 'bg-green-500' : status === 'pending_branch_review' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-300'}`} />
          <div className="w-12 h-1 bg-gray-300" />
          <div className={`w-3 h-3 rounded-full ${status === 'pending_admin_approval' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`} />
        </div>
        <div className="flex justify-center text-xs text-gray-500 mb-8">
          <span className="w-16 text-center">Kayıt</span>
          <span className="w-16 text-center">Şube</span>
          <span className="w-16 text-center">Yönetici</span>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Kontrol Ediliyor...' : 'Durumu Kontrol Et'}
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
          Sorularınız için bizimle iletişime geçebilirsiniz.
        </p>
      </div>
    </div>
  );
}
