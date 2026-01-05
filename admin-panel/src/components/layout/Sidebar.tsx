import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, Newspaper, BookOpen, ChevronLeft, ChevronRight, MessageSquare, HelpCircle, Bell, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ProfileModal from '@/components/common/ProfileModal';
import { contactService } from '@/services/api/contactService';

interface SidebarItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  roles: ('admin' | 'branch_manager')[];
}

const sidebarItems: SidebarItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '/admin/dashboard',
    roles: ['admin', 'branch_manager'],
  },
  {
    icon: Users,
    label: 'Kullanıcılar',
    path: '/admin/users',
    roles: ['admin', 'branch_manager'],
  },
  {
    icon: Building2,
    label: 'Şubeler',
    path: '/admin/branches',
    roles: ['admin'],
  },
  {
    icon: Newspaper,
    label: 'Haberler & Duyurular',
    path: '/admin/news',
    roles: ['admin'],
  },
  {
    icon: BookOpen,
    label: 'Eğitimler',
    path: '/admin/trainings',
    roles: ['admin'],
  },
  {
    icon: Calendar,
    label: 'Aktiviteler',
    path: '/admin/activities',
    roles: ['admin', 'branch_manager'],
  },
  {
    icon: HelpCircle,
    label: 'Sıkça Sorulan Sorular',
    path: '/admin/faq',
    roles: ['admin'],
  },
  {
    icon: MessageSquare,
    label: 'İletişim Mesajları',
    path: '/admin/contact-messages',
    roles: ['admin', 'branch_manager'],
  },
  {
    icon: Bell,
    label: 'Bildirim Geçmişi',
    path: '/admin/notifications',
    roles: ['admin', 'branch_manager'],
  },
];

export default function Sidebar() {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Kullanıcının rolüne göre menü öğelerini filtrele
  const filteredItems = sidebarItems.filter((item) =>
    item.roles.includes(user?.role as 'admin' | 'branch_manager')
  );

  // Okunmamış mesaj sayısını al
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'branch_manager')) {
      const fetchUnreadCount = async () => {
        try {
          const data = await contactService.getContactMessages({
            page: 1,
            limit: 1,
            isRead: false,
          });
          setUnreadCount(data.total || 0);
        } catch (err) {
          console.error('Error fetching unread messages count:', err);
        }
      };

      fetchUnreadCount();
      // Her 30 saniyede bir güncelle
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <aside 
      className={`bg-white border-r border-gray-200 flex flex-col py-4 transition-all duration-300 ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo/Icon at top */}
      <div className={`mb-6 ${isExpanded ? 'px-4' : 'px-2'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          {isExpanded && (
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate">SendikaApp</h2>
              <p className="text-xs text-gray-500 truncate">
                {user?.role === 'admin' ? 'Admin Paneli' : 'Şube Paneli'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation icons */}
      <nav className={`flex-1 space-y-2 ${isExpanded ? 'px-4' : 'px-2'}`}>
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isContactMessages = item.path === '/admin/contact-messages';
          const showBadge = isContactMessages && unreadCount > 0;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg transition-colors group relative ${
                  isActive
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                } ${isExpanded ? 'px-3 py-3' : 'p-3 justify-center'}`
              }
              title={!isExpanded ? item.label : undefined}
            >
              <div className="relative flex-shrink-0">
                <Icon className="w-5 h-5" />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              {isExpanded && (
                <span className="text-sm font-medium truncate flex-1">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Profile Button */}
      <div className={`px-2 pt-4 border-t border-gray-200 ${isExpanded ? 'px-4' : 'px-2'}`}>
        <button
          onClick={() => setShowProfileModal(true)}
          className="w-full flex items-center gap-3 p-3 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title={!isExpanded ? 'Profil' : undefined}
        >
          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
            {user?.firstName?.[0] || 'U'}
          </div>
          {isExpanded && (
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {user?.role === 'admin' ? 'Admin' : 'Şube Yöneticisi'}
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Expand/Collapse Button */}
      <div className={`px-2 pt-2 ${isExpanded ? 'px-4' : 'px-2'}`}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center gap-3 p-3 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title={isExpanded ? 'Daralt' : 'Genişlet'}
        >
          {isExpanded ? (
            <>
              <ChevronLeft className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">Daralt</span>
            </>
          ) : (
            <ChevronRight className="w-5 h-5 flex-shrink-0 mx-auto" />
          )}
        </button>
      </div>

      {/* Profile Modal */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </aside>
  );
}

