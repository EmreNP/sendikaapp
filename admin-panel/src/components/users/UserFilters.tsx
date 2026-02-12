import React from 'react';
import { Search } from 'lucide-react';
import type { Branch } from '@/hooks/useUsers';

interface UserFiltersProps {
  userRole?: string;
  userTypeFilter: 'users' | 'managers';
  setUserTypeFilter: (value: 'users' | 'managers') => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  pendingStatus: string | null;
  pendingCount: number;
  branchFilter: string;
  setBranchFilter: (value: string) => void;
  branches: Branch[];
  onCreateUser: () => void;
}

const UserFilters = React.memo(function UserFilters({
  userRole,
  userTypeFilter,
  setUserTypeFilter,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  pendingStatus,
  pendingCount,
  branchFilter,
  setBranchFilter,
  branches,
  onCreateUser,
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

      {/* Add Member Button */}
      <div className="flex justify-end mt-2">
        {userRole && userRole !== 'user' && (
          <button
            onClick={onCreateUser}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Yeni Üye Ekle
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex items-center justify-between gap-4">
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

        <div className="flex items-center gap-3">
          {/* Status Filter - Only for users */}
          {userTypeFilter === 'users' && (
            <div className="inline-flex bg-gray-100 rounded-lg p-1">
              <button
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setStatusFilter('all')}
              >
                Tümü
              </button>
              <button
                className={`relative px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === pendingStatus
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => pendingStatus && setStatusFilter(pendingStatus)}
              >
                Bekleyen
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] px-1 shadow-sm">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )}
              </button>
            </div>
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
        </div>
      </div>
    </div>
  );
});

export default UserFilters;
