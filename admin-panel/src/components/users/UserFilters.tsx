import React from 'react';
import { Search } from 'lucide-react';
import type { Branch } from '@/hooks/useUsers';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tüm Durumlar' },
  { value: 'active', label: 'Sendika Üyesi' },
  { value: 'pending_branch_review', label: 'Şube Onayı Bekleniyor' },
  { value: 'pending_details', label: 'Detaylar Bekleniyor' },
  { value: 'rejected', label: 'Reddedildi' },
  { value: 'resigned', label: 'İstifa Etti' },
];

interface UserFiltersProps {
  userRole?: string;
  userTypeFilter: 'users' | 'managers';
  setUserTypeFilter: (value: 'users' | 'managers') => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  branchFilter: string;
  setBranchFilter: (value: string) => void;
  branches: Branch[];
  onCreateUser: () => void;
  onExportExcel?: () => void;
  isExporting?: boolean;
}

const UserFilters = React.memo(function UserFilters({
  userRole,
  userTypeFilter,
  setUserTypeFilter,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  branchFilter,
  setBranchFilter,
  branches,
  onCreateUser,
  onExportExcel,
  isExporting,
}: UserFiltersProps) {
  const isAdminOrSuper = userRole === 'admin' || userRole === 'superadmin';

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setUserTypeFilter('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              userTypeFilter === 'users'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Kullanıcılar
          </button>
          {isAdminOrSuper && (
            <button
              onClick={() => setUserTypeFilter('managers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                userTypeFilter === 'managers'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Yöneticiler
            </button>
          )}
        </nav>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Kullanıcı ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter Dropdown - Only for users tab */}
          {userTypeFilter === 'users' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-xs font-medium appearance-none"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {/* Branch Filter - Only for admin/superadmin */}
          {isAdminOrSuper && (
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-xs font-medium appearance-none"
            >
              <option value="all">Tüm Şubeler</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          )}

          {/* Excel Export - Only for admin/superadmin */}
          {isAdminOrSuper && onExportExcel && (
            <button
              onClick={onExportExcel}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-xs font-medium"
            >
              {isExporting ? (
                <>
                  <span className="animate-spin inline-block w-3 h-3 border border-white border-t-transparent rounded-full" />
                  İndiriliyor...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M3 15h18M9 3v18" />
                  </svg>
                  Excel İndir
                </>
              )}
            </button>
          )}

          {/* Add Member Button */}
          {userRole && userRole !== 'user' && (
            <button
              onClick={onCreateUser}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Yeni Üye Ekle
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default UserFilters;
