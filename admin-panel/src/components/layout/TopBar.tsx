import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MessageCircle, Bell, Settings, User, LogOut } from 'lucide-react';

export default function TopBar() {
  const { user, signOut } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mock data - gerçek uygulamada API'den gelecek
  const chatNotifications = 2;
  const bellNotifications = 3;

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-end px-6">
      {/* Right side - Actions */}
      <div className="flex items-center gap-4">
        {/* Chats */}
        <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          <MessageCircle className="w-5 h-5" />
          {chatNotifications > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {chatNotifications}
            </span>
          )}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {bellNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {bellNotifications}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Bildirimler</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="p-4 text-sm text-gray-500 text-center">
                  Yeni bildirim yok
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          <Settings className="w-5 h-5" />
        </button>

        {/* Account */}
        <div className="relative" ref={accountRef}>
          <button
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.firstName?.[0] || 'U'}
            </div>
            <span className="text-sm font-medium">{user?.firstName || 'Kullanıcı'}</span>
          </button>
          {showAccountMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-2">
                <div className="px-3 py-2 text-sm text-gray-700 border-b border-gray-200">
                  <div className="font-medium">{user?.firstName} {user?.lastName}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {user?.role === 'admin' ? 'Admin' : 'Şube Yöneticisi'}
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-2"
                >
                  <LogOut className="w-4 h-4" />
                  Çıkış Yap
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

