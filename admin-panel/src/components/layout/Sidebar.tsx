import { useState, useEffect, useRef, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, Newspaper, BookOpen, ChevronLeft, ChevronRight, MessageSquare, Bell, Calendar, LogOut, User as UserIcon, BarChart3, Briefcase } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ProfileModal from '@/components/common/ProfileModal';
import { contactService } from '@/services/api/contactService';
import { logger } from '@/utils/logger';

interface SidebarItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  roles: ('admin' | 'branch_manager' | 'superadmin')[];
}

const sidebarItems: SidebarItem[] = [

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
    roles: ['admin', 'branch_manager'],
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
    icon: Briefcase,
    label: 'Anlaşmalı Kurumlar',
    path: '/admin/contracted-institutions',
    roles: ['admin'],
  },
  {
    icon: MessageSquare,
    label: 'İletişim Mesajları',
    path: '/admin/contact-messages',
    roles: ['admin', 'branch_manager'],
  },
  {
    icon: BarChart3,
    label: 'Performans Raporları',
    path: '/admin/performance',
    roles: ['admin'],
  },
  {
    icon: Bell,
    label: 'Bildirim Geçmişi',
    path: '/admin/notifications',
    roles: ['admin', 'branch_manager'],
  },
];

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showProfileOptions, setShowProfileOptions] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Kullanıcının rolüne göre menü öğelerini filtrele (superadmin tüm öğeleri görür)
  const filteredItems = useMemo(() =>
    sidebarItems.filter((item) =>
      user?.role === 'superadmin' || item.roles.includes(user?.role as 'admin' | 'branch_manager' | 'superadmin')
    ),
    [user?.role]
  );

  // Okunmamış mesaj sayısını al
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'superadmin' || user.role === 'branch_manager')) {
      const fetchUnreadCount = async () => {
        try {
          const data = await contactService.getContactMessages({
            page: 1,
            limit: 1,
            isRead: false,
          });
          setUnreadCount(data.total || 0);
        } catch (err) {
          logger.error('Error fetching unread messages count:', err);
        }
      };

      fetchUnreadCount();
      // Her 30 saniyede bir güncelle
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Click outside and ESC handler to close dropdown
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (showProfileOptions && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowProfileOptions(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (showProfileOptions && e.key === 'Escape') setShowProfileOptions(false);
    };

    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showProfileOptions]);

  // Close dropdown and profile modal when sidebar collapses
  useEffect(() => {
    if (!isExpanded) {
      setShowProfileOptions(false);
      setShowProfileModal(false);
    }
  }, [isExpanded]);

  return (
    <aside 
      className={`bg-white border-r border-gray-200 flex flex-col py-4 transition-all duration-300 fixed left-0 top-0 h-screen overflow-y-auto z-50 ${
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
              <h2 className="text-lg font-semibold text-gray-900 truncate">TDV Konya</h2>
              <p className="text-xs text-gray-500 truncate">
                {user?.role === 'admin' || user?.role === 'superadmin' ? 'Admin Paneli' : 'Şube Paneli'}
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

      {/* Profile & Logout */}
      <div ref={containerRef} className={`relative overflow-visible px-2 pt-4 border-t border-gray-200 ${isExpanded ? 'px-4' : 'px-2'}`}>
        <button
          onClick={(e) => { e.stopPropagation(); setShowProfileOptions((s) => !s); }}
          className="w-full flex items-center gap-3 p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title={!isExpanded ? 'Profil' : undefined}
          aria-expanded={showProfileOptions}
          aria-haspopup="menu"
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
                {user?.role === 'admin' || user?.role === 'superadmin' ? 'Admin' : 'İlçe Temsilcisi'}
              </div>
            </div>
          )}
        </button>

        {/* Compact dropdown: opens upwards and is anchored near the button */}
        {showProfileOptions && (
          <div role="menu" className={`absolute bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-md z-50 w-44 ${isExpanded ? 'right-2' : 'left-1/2 -translate-x-1/2'}`}>
            <button
              role="menuitem"
              onClick={() => { setShowProfileModal(true); setShowProfileOptions(false); }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
            >
              <UserIcon className="w-4 h-4" />
              {isExpanded ? 'Profilimi Düzenle' : 'Profil'}
            </button>
            <button
              role="menuitem"
              onClick={async () => {
                try {
                  await signOut();
                } catch (err) {
                  logger.error('Sign out failed', err);
                }
                setShowProfileOptions(false);
                navigate('/login');
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-red-600"
            >
              <LogOut className="w-4 h-4" />
              {isExpanded ? 'Çıkış Yap' : 'Çıkış'}
            </button>
          </div>
        )}
      </div>

      {/* close dropdown on outside click or ESC */}

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
      <ProfileModal isOpen={showProfileModal} onClose={() => { setShowProfileModal(false); setShowProfileOptions(false); }} />
    </aside>
  );
}

