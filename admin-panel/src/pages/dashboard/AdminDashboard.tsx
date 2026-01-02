import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Shield, Users, FileText, Building2 } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    branches: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { apiRequest } = await import('@/utils/api');
      
      // Kullanıcı istatistikleri
      const usersData = await apiRequest<{ stats: { total: number; active: number; pending: number } }>('/api/users/stats');
      
      setStats({
        total: usersData.stats?.total || 0,
        active: usersData.stats?.active || 0,
        pending: usersData.stats?.pending || 0,
        branches: 0, // Şube sayısını ayrı fetch edebiliriz
      });

      // Şube istatistikleri (sadece admin için)
      if (user?.role === 'admin') {
        const branchesData = await apiRequest<{ branches: Array<{ isActive: boolean }> }>('/api/branches');
        
        setStats(prev => ({
          ...prev,
          branches: branchesData.branches?.filter((b) => b.isActive).length || 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Hoş Geldiniz, {user?.firstName}!</h2>
          <p className="text-gray-600 mt-2">
            {user?.role === 'admin'
              ? 'Admin paneline başarıyla giriş yaptınız.'
              : 'Şube yönetici paneline başarıyla giriş yaptınız.'}
          </p>
        </div>

        {/* Stats Grid - Modern Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stats.total.toLocaleString('tr-TR')}</div>
                <div className="text-sm text-gray-600">
                  {user?.role === 'admin' ? 'Toplam Kullanıcı' : 'Şube Üyeleri'}
                </div>
              </div>
              <div className="w-14 h-14 bg-slate-700 rounded-xl flex items-center justify-center">
                <Users className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stats.pending.toLocaleString('tr-TR')}</div>
                <div className="text-sm text-gray-600">Bekleyen Başvuru</div>
              </div>
              <div className="w-14 h-14 bg-slate-700 rounded-xl flex items-center justify-center">
                <FileText className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          {user?.role === 'admin' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stats.branches.toLocaleString('tr-TR')}</div>
                  <div className="text-sm text-gray-600">Aktif Şube</div>
                </div>
                <div className="w-14 h-14 bg-slate-700 rounded-xl flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stats.active.toLocaleString('tr-TR')}</div>
                <div className="text-sm text-gray-600">Aktif Kullanıcı</div>
              </div>
              <div className="w-14 h-14 bg-slate-700 rounded-xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Son Aktiviteler</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-slate-700" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Yeni kullanıcı kaydı</div>
                  <div className="text-xs text-gray-500">2 dakika önce</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-slate-700" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Başvuru onaylandı</div>
                  <div className="text-xs text-gray-500">15 dakika önce</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İşlemler</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-medium">
                Rapor Oluştur
              </button>
              <button className="p-4 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-medium">
                Başvuru İncele
              </button>
              <button className="p-4 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-medium">
                Ayarlar
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

