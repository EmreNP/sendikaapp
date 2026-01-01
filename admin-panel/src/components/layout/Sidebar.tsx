import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, Newspaper, BookOpen, ChevronLeft, ChevronRight, MessageSquare, HelpCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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
];

export default function Sidebar() {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  // Kullanıcının rolüne göre menü öğelerini filtrele
  const filteredItems = sidebarItems.filter((item) =>
    item.roles.includes(user?.role as 'admin' | 'branch_manager')
  );

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
              <Icon className="w-5 h-5 flex-shrink-0" />
              {isExpanded && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Expand/Collapse Button */}
      <div className={`px-2 pt-4 border-t border-gray-200 ${isExpanded ? 'px-4' : 'px-2'}`}>
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
    </aside>
  );
}

