import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Users, Building2, Newspaper, BookOpen, ChevronLeft, ChevronRight, MessageSquare, Bell, Calendar, LogOut, User as UserIcon, BarChart3, Briefcase, X } from 'lucide-react';
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

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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

  // Close mobile drawer on route change
  useEffect(() => {
    onMobileClose();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Click outside and ESC handler to close dropdown
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (showProfileOptions && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowProfileOptions(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (showProfileOptions && e.key === 'Escape') setShowProfileOptions(false);
      if (mobileOpen && e.key === 'Escape') onMobileClose();
    };

    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showProfileOptions, mobileOpen, onMobileClose]);

  // Close dropdown and profile modal when sidebar collapses
  useEffect(() => {
    if (!isExpanded) {
      setShowProfileOptions(false);
      setShowProfileModal(false);
    }
  }, [isExpanded]);

  // Determine if sidebar should show expanded (mobile always expanded, desktop on hover)
  const showExpanded = mobileOpen || isExpanded;

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (err) {
      logger.error('Sign out failed', err);
    }
    setShowProfileOptions(false);
    onMobileClose();
    navigate('/login');
  }, [signOut, navigate, onMobileClose]);

  const sidebarContent = (
    <aside
      className={`bg-white border-r border-gray-200 flex flex-col py-4 transition-all duration-300 h-full overflow-y-auto
        lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:z-50
        ${isExpanded ? 'lg:w-64' : 'lg:w-16'}
        w-72
      `}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo/Icon at top */}
      <div className={`mb-6 ${showExpanded ? 'px-4' : 'lg:px-2 px-4'}`}>
        <div className="flex items-center gap-3">
          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="lg:hidden w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            aria-label="Menüyü kapat"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img src="/logo.png" alt="TDVS Logo" className="w-10 h-10 object-contain" />
          </div>
          {showExpanded && (
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate">TDVS Konya</h2>
              <p className="text-xs text-gray-500 truncate">
                {user?.role === 'admin' || user?.role === 'superadmin' ? 'Admin Paneli' : 'Şube Paneli'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation icons */}
      <nav className={`flex-1 space-y-2 ${showExpanded ? 'px-4' : 'lg:px-2 px-4'}`}>
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
                } ${showExpanded ? 'px-3 py-3' : 'lg:p-3 lg:justify-center px-3 py-3'}`
              }
              title={!showExpanded ? item.label : undefined}
            >
              <div className="relative flex-shrink-0">
                <Icon className="w-5 h-5" />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              {showExpanded ? (
                <span className="text-sm font-medium truncate flex-1">{item.label}</span>
              ) : (
                <span className="text-sm font-medium truncate flex-1 lg:hidden">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Profile & Logout */}
      <div ref={containerRef} className={`relative overflow-visible pt-4 border-t border-gray-200 ${showExpanded ? 'px-4' : 'lg:px-2 px-4'}`}>
        <button
          onClick={(e) => { e.stopPropagation(); setShowProfileOptions((s) => !s); }}
          className="w-full flex items-center gap-3 p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title={!showExpanded ? 'Profil' : undefined}
          aria-expanded={showProfileOptions}
          aria-haspopup="menu"
        >
          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
            {user?.firstName?.[0] || 'U'}
          </div>
          {showExpanded ? (
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {user?.role === 'admin' || user?.role === 'superadmin' ? 'Admin' : 'İlçe Temsilcisi'}
              </div>
            </div>
          ) : (
            <div className="flex-1 min-w-0 text-left lg:hidden">
              <div className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {user?.role === 'admin' || user?.role === 'superadmin' ? 'Admin' : 'İlçe Temsilcisi'}
              </div>
            </div>
          )}
        </button>

        {/* Compact dropdown: opens upwards */}
        {showProfileOptions && (
          <div role="menu" className={`absolute bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-md z-50 w-44 ${showExpanded ? 'right-2' : 'lg:left-1/2 lg:-translate-x-1/2 right-2'}`}>
            <button
              role="menuitem"
              onClick={() => { setShowProfileModal(true); setShowProfileOptions(false); }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
            >
              <UserIcon className="w-4 h-4" />
              {showExpanded ? 'Profilimi Düzenle' : 'Profil'}
            </button>
            <button
              role="menuitem"
              onClick={handleSignOut}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-red-600"
            >
              <LogOut className="w-4 h-4" />
              {showExpanded ? 'Çıkış Yap' : 'Çıkış'}
            </button>
          </div>
        )}
      </div>

      {/* Expand/Collapse Button - Desktop only */}
      <div className={`hidden lg:block pt-2 ${isExpanded ? 'px-4' : 'px-2'}`}>
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

  return (
    <>
      {/* Desktop sidebar - always visible */}
      <div className="hidden lg:block">
        {sidebarContent}
      </div>

      {/* Mobile overlay drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          {/* Drawer */}
          <div className="relative z-50 flex w-72 flex-col bg-white shadow-xl animate-slide-in-left">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

