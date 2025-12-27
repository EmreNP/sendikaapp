import { useState, useEffect } from 'react';

interface Activity {
  id: string;
  message: string;
  time: string;
  type: 'login' | 'status_change' | 'block' | 'other';
}

export default function RightSidebar() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    // Mock activities - gerçek uygulamada API'den gelecek
    setActivities([
      {
        id: '1',
        message: 'Yeni kullanıcı #538403 otomatik olarak engellendi (şüpheli aktivite)',
        time: '12 saniye önce',
        type: 'block',
      },
      {
        id: '2',
        message: 'Santiago Valentin yeni durum "Dönen" aldı',
        time: '2 dakika önce',
        type: 'status_change',
      },
      {
        id: '3',
        message: 'Carmen Beltrán sisteme giriş yaptı',
        time: '1 saat önce',
        type: 'login',
      },
    ]);
  };

  return (
    <aside className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Activity Log Section */}
      <div className="flex-1 overflow-y-auto p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AKTİVİTE GÜNLÜĞÜ</h3>
        
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="text-sm">
              <div className="text-gray-900">{activity.message}</div>
              <div className="text-xs text-gray-500 mt-1">{activity.time}</div>
            </div>
          ))}
        </div>

        <button className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
          Tüm aktivite günlüğünü göster
        </button>
      </div>
    </aside>
  );
}

