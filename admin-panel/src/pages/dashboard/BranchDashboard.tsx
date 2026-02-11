import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Users, FileText, CheckCircle, XCircle } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';

export default function BranchDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { apiRequest } = await import('@/utils/api');
      
      const data = await apiRequest<{ stats: { 
        total: number; 
        byStatus: { 
          pending_details: number;
          pending_branch_review: number; 
          active: number;
          rejected: number;
        } 
      } }>('/api/users/stats');
      
      setStats({
        total: data.stats?.total || 0,
        pending: (data.stats?.byStatus?.pending_branch_review || 0),
        approved: data.stats?.byStatus?.active || 0,
        rejected: data.stats?.byStatus?.rejected || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hoş Geldiniz, {user?.firstName}!</h2>
          <p className="text-gray-600 mt-1">Şube yönetici paneline başarıyla giriş yaptınız.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-slate-700" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">Şube Üyeleri</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-slate-700" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
                <div className="text-sm text-gray-600">Bekleyen Başvuru</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.approved}</div>
                <div className="text-sm text-gray-600">Onaylanan</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.rejected}</div>
                <div className="text-sm text-gray-600">Reddedilen</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

