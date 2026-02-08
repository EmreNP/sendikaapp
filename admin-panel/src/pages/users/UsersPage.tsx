import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Users as UsersIcon, Search, XCircle, CheckCircle, UserCog, Edit } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import ActionButton from '@/components/common/ActionButton';
import UserDetailModal from '@/components/users/UserDetailModal';
import UserRoleModal from '@/components/users/UserRoleModal';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import UserCreateModal from '@/components/users/UserCreateModal';
import UserCompleteDetailsModal from '@/components/users/UserCompleteDetailsModal';

interface User {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  branchId?: string;
  isActive: boolean;
}

interface Branch {
  id: string;
  name: string;
}

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [userTypeFilter, setUserTypeFilter] = useState<'users' | 'managers'>('users');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserIdForRole, setSelectedUserIdForRole] = useState<string | null>(null);
  const [selectedUserRole, setSelectedUserRole] = useState<string>('');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUserIdForDetails, setSelectedUserIdForDetails] = useState<string | null>(null);
  const [isCompleteDetailsModalOpen, setIsCompleteDetailsModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'warning',
    onConfirm: () => {},
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchUsers();
    if (user?.role === 'admin') {
      fetchBranches();
    } else if (user?.role === 'branch_manager' && user?.branchId) {
      // Branch manager için otomatik olarak kendi şubesini filtrele
      setBranchFilter(user.branchId);
    }
  }, [statusFilter, branchFilter, user?.role, user?.branchId]);

  const fetchBranches = async () => {
    try {
      const { apiRequest } = await import('@/utils/api');
      const data = await apiRequest<{ branches: Branch[] }>('/api/branches');
      setBranches(data.branches || []);
    } catch (error: any) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = '/api/users?page=1&limit=100';
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }

      const { apiRequest } = await import('@/utils/api');
      
      console.log('📡 Fetching users from:', url);
      
      const data = await apiRequest<{ users: User[]; total: number; page: number; limit: number }>(url);
      
      console.log('✅ Users data received:', data);
      setUsers(data.users || []);
    } catch (error: any) {
      console.error('❌ Error fetching users:', error);
      setError(error.message || 'Kullanıcılar yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      searchTerm === '' ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBranch = branchFilter === 'all' || u.branchId === branchFilter;
    
    // Kullanıcı tipi filtresi: users veya managers
    const matchesUserType = userTypeFilter === 'users' 
      ? u.role === 'user'
      : (u.role === 'admin' || u.role === 'branch_manager');
    
    return matchesSearch && matchesBranch && matchesUserType;
  });


  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_details':
        return 'Detaylar Bekleniyor';
      case 'pending_branch_review':
        return 'Şube Onayı Bekleniyor';
      case 'active':
        return 'Kabul Edildi';
      case 'rejected':
        return 'Reddedildi';
      default:
        return status;
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(new Set(filteredUsers.map(u => u.uid)));
    } else {
      setSelectedUserIds(new Set());
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUserIds);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUserIds(newSelected);
  };


  const handleDeactivateUser = async (userId: string) => {
    try {
      setProcessing(true);
      const { apiRequest } = await import('@/utils/api');
      await apiRequest(`/api/users/${userId}/deactivate`, { method: 'PATCH' });
      
      // State'deki ilgili kullanıcının isActive değerini güncelle
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, isActive: false } : u));
      setSelectedUserIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    } catch (error: any) {
      console.error('Error deactivating user:', error);
      setError(error.message || 'Kullanıcı deaktif edilirken bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      setProcessing(true);
      const { apiRequest } = await import('@/utils/api');
      await apiRequest(`/api/users/${userId}/activate`, { method: 'PATCH' });
      
      // State'deki ilgili kullanıcının isActive değerini güncelle
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, isActive: true } : u));
      setSelectedUserIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    } catch (error: any) {
      console.error('Error activating user:', error);
      setError(error.message || 'Kullanıcı aktif edilirken bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setProcessing(true);
      const { apiRequest } = await import('@/utils/api');
      const userIds = Array.from(selectedUserIds);
      
      // Sadece admin toplu silme yapabilir
      if (user?.role !== 'admin') {
        setError('Toplu silme işlemi için admin yetkisi gerekli');
        return;
      }

      const result = await apiRequest<{
        success: boolean;
        successCount: number;
        failureCount: number;
        errors?: Array<{ userId: string; error: string }>;
      }>('/api/users/bulk', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete', userIds }),
      });

      if (result.failureCount > 0) {
        setError(`${result.failureCount} kullanıcı silinirken hata oluştu`);
      }

      // Başarılı olanları state'den kaldır
      if (result.successCount > 0) {
        const failedUserIds = new Set(result.errors?.map(e => e.userId) || []);
        const successfulUserIds = userIds.filter(id => !failedUserIds.has(id));
        setUsers(prev => prev.filter(u => !successfulUserIds.includes(u.uid)));
      }

      setSelectedUserIds(new Set());
    } catch (error: any) {
      console.error('Error bulk deleting users:', error);
      setError(error.message || 'Toplu silme işlemi sırasında bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkDeactivate = async () => {
    try {
      setProcessing(true);
      const { apiRequest } = await import('@/utils/api');
      const userIds = Array.from(selectedUserIds);

      const result = await apiRequest<{
        success: boolean;
        successCount: number;
        failureCount: number;
        errors?: Array<{ userId: string; error: string }>;
      }>('/api/users/bulk', {
        method: 'POST',
        body: JSON.stringify({ action: 'deactivate', userIds }),
      });

      if (result.failureCount > 0) {
        setError(`${result.failureCount} kullanıcı deaktif edilirken hata oluştu`);
      }

      // Başarılı olanları state'de deaktif et
      if (result.successCount > 0) {
        const failedUserIds = new Set(result.errors?.map(e => e.userId) || []);
        const successfulUserIds = userIds.filter(id => !failedUserIds.has(id));
        setUsers(prev => prev.map(u => successfulUserIds.includes(u.uid) ? { ...u, isActive: false } : u));
      }

      setSelectedUserIds(new Set());
    } catch (error: any) {
      console.error('Error bulk deactivating users:', error);
      setError(error.message || 'Toplu deaktif etme işlemi sırasında bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkActivate = async () => {
    try {
      setProcessing(true);
      const { apiRequest } = await import('@/utils/api');
      const userIds = Array.from(selectedUserIds);

      const result = await apiRequest<{
        success: boolean;
        successCount: number;
        failureCount: number;
        errors?: Array<{ userId: string; error: string }>;
      }>('/api/users/bulk', {
        method: 'POST',
        body: JSON.stringify({ action: 'activate', userIds }),
      });

      if (result.failureCount > 0) {
        setError(`${result.failureCount} kullanıcı aktif edilirken hata oluştu`);
      }

      // Başarılı olanları state'de aktif et
      if (result.successCount > 0) {
        const failedUserIds = new Set(result.errors?.map(e => e.userId) || []);
        const successfulUserIds = userIds.filter(id => !failedUserIds.has(id));
        setUsers(prev => prev.map(u => successfulUserIds.includes(u.uid) ? { ...u, isActive: true } : u));
      }

      setSelectedUserIds(new Set());
    } catch (error: any) {
      console.error('Error bulk activating users:', error);
      setError(error.message || 'Toplu aktif etme işlemi sırasında bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  // Calculate stats - only for users, not managers
  const totalUsers = userTypeFilter === 'users' 
    ? filteredUsers.length 
    : filteredUsers.length;
  
  // Rol bazlı bekleyen kullanıcı sayısı
  const getPendingStatus = () => {
    if (user?.role === 'branch_manager') {
      return 'pending_branch_review';
    } else if (user?.role === 'admin') {
      // Admin: only show items that require branch manager approval
      return 'pending_branch_review';
    }
    return null;
  };
  
  const pendingStatus = getPendingStatus();
  // Count users that are in the resolved pending status (only 'pending_branch_review')
  const pendingUsers = userTypeFilter === 'users' && pendingStatus
    ? filteredUsers.filter((u) => u.status === pendingStatus).length
    : 0;

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header with Tabs */}
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
            </nav>
          </div>
            {/* Add Member Button */}
            <div className="flex justify-end mt-2">
              {user && user.role !== 'user' && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Yeni Üye Ekle
                </button>
              )}
            </div>
        {/* Filters */}
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
                  {pendingUsers > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] px-1 shadow-sm">
                      {pendingUsers > 99 ? '99+' : pendingUsers}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Branch Filter - Only for admin */}
            {user?.role === 'admin' && (
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

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Yükleniyor...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <UsersIcon className="w-12 h-12 text-red-400 mx-auto mb-2" />
              <p className="text-red-600">{error}</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Kullanıcı bulunamadı</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        <input
                          type="checkbox"
                          checked={filteredUsers.length > 0 && selectedUserIds.size === filteredUsers.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300 text-slate-700 focus:ring-slate-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İsim
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Telefon
                      </th>
                      {userTypeFilter === 'managers' && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rol
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((userItem) => (
                      <tr 
                        key={userItem.uid} 
                        className={`hover:bg-gray-50 transition-colors ${
                          selectedUserIds.has(userItem.uid) ? 'bg-slate-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedUserIds.has(userItem.uid)}
                            onChange={(e) => handleSelectUser(userItem.uid, e.target.checked)}
                            className="rounded border-gray-300 text-slate-700 focus:ring-slate-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td 
                          className="px-4 py-3 cursor-pointer"
                          onClick={() => {
                            setSelectedUserId(userItem.uid);
                            setIsModalOpen(true);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-gray-600 font-medium text-xs">
                                {userItem.firstName[0]}{userItem.lastName[0]}
                              </span>
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {userItem.firstName} {userItem.lastName}
                            </div>
                          </div>
                        </td>
                        <td 
                          className="px-4 py-3 cursor-pointer"
                          onClick={() => {
                            setSelectedUserId(userItem.uid);
                            setIsModalOpen(true);
                          }}
                        >
                          <div className="text-sm text-gray-600 truncate max-w-xs">{userItem.email}</div>
                        </td>
                        <td 
                          className="px-4 py-3 cursor-pointer"
                          onClick={() => {
                            setSelectedUserId(userItem.uid);
                            setIsModalOpen(true);
                          }}
                        >
                          <div className="text-sm text-gray-600">{userItem.phone || '-'}</div>
                        </td>
                        {userTypeFilter === 'managers' && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs text-gray-700">
                              {userItem.role === 'admin'
                                ? 'Admin'
                                : userItem.role === 'branch_manager' && userItem.branchId
                                ? `(${branches.find(b => b.id === userItem.branchId)?.name || ''})`
                                : ''}
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                            {getStatusLabel(userItem.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            {userItem.isActive ? (
                              <ActionButton
                                icon={XCircle}
                                variant="deactivate"
                                onClick={() => {
                                  setConfirmDialog({
                                    isOpen: true,
                                    title: 'Kullanıcıyı Deaktif Et',
                                    message: `${userItem.firstName} ${userItem.lastName} kullanıcısını deaktif etmek istediğinizden emin misiniz?`,
                                    variant: 'warning',
                                    onConfirm: () => {
                                      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                      handleDeactivateUser(userItem.uid);
                                    },
                                  });
                                }}
                                title="Deaktif Et"
                                disabled={processing}
                              />
                            ) : (
                              <ActionButton
                                icon={CheckCircle}
                                variant="activate"
                                onClick={() => {
                                  setConfirmDialog({
                                    isOpen: true,
                                    title: 'Kullanıcıyı Aktif Et',
                                    message: `${userItem.firstName} ${userItem.lastName} kullanıcısını aktif etmek istediğinizden emin misiniz?`,
                                    variant: 'info',
                                    onConfirm: () => {
                                      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                      handleActivateUser(userItem.uid);
                                    },
                                  });
                                }}
                                title="Aktif Et"
                                disabled={processing}
                              />
                            )}
                            {user?.role === 'admin' && (
                              <ActionButton
                                icon={UserCog}
                                variant="role"
                                onClick={() => {
                                  setSelectedUserIdForRole(userItem.uid);
                                  setSelectedUserRole(userItem.role);
                                  setIsRoleModalOpen(true);
                                }}
                                title={userItem.uid === user?.uid ? 'Kendi rolünüzü değiştiremezsiniz' : 'Rol Değiştir'}
                                disabled={processing || userItem.uid === user?.uid}
                              />
                            )}
                            {/* Detay Ekleme Butonu - pending_details statusu için */}
                            {userItem.status === 'pending_details' && (
                              <ActionButton
                                icon={Edit}
                                variant="edit"
                                onClick={() => {
                                  setSelectedUserIdForDetails(userItem.uid);
                                  setIsCompleteDetailsModalOpen(true);
                                }}
                                title="Detay Ekle"
                                disabled={processing}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Total Count */}
              <div className="flex justify-end px-4 py-3 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Toplam üye sayısı: <span className="font-medium text-gray-900">{totalUsers}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        {selectedUserIds.size > 0 && (
          <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
            <span className="text-sm text-gray-600 mr-2">
              {selectedUserIds.size} seçili
            </span>
            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Toplu Silme',
                    message: `${selectedUserIds.size} kullanıcıyı kalıcı olarak silmek istediğinizden emin misiniz?`,
                    variant: 'danger',
                    onConfirm: () => {
                      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                      handleBulkDelete();
                    },
                  });
                }}
                disabled={processing}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                Sil
              </button>
            )}
            <button
              onClick={() => {
                setConfirmDialog({
                  isOpen: true,
                  title: 'Toplu Deaktif Etme',
                  message: `${selectedUserIds.size} kullanıcıyı deaktif etmek istediğinizden emin misiniz?`,
                  variant: 'warning',
                  onConfirm: () => {
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                    handleBulkDeactivate();
                  },
                });
              }}
              disabled={processing}
              className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Deaktif Et
            </button>
            <button
              onClick={() => {
                setConfirmDialog({
                  isOpen: true,
                  title: 'Toplu Aktif Etme',
                  message: `${selectedUserIds.size} kullanıcıyı aktif etmek istediğinizden emin misiniz?`,
                  variant: 'info',
                  onConfirm: () => {
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                    handleBulkActivate();
                  },
                });
              }}
              disabled={processing}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Aktif Et
            </button>
            <button
              onClick={() => setSelectedUserIds(new Set())}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Temizle
            </button>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      <UserCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          fetchUsers();
        }}
      />

      <UserCompleteDetailsModal
        userId={selectedUserIdForDetails}
        isOpen={isCompleteDetailsModalOpen}
        onClose={() => {
          setIsCompleteDetailsModalOpen(false);
          setSelectedUserIdForDetails(null);
        }}
        onSuccess={() => {
          setIsCompleteDetailsModalOpen(false);
          setSelectedUserIdForDetails(null);
          fetchUsers();
        }}
      />

      <UserDetailModal
        userId={selectedUserId}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUserId(null);
        }}
        initialTab="details"
        onUserDeleted={() => {
          // Kullanıcı silindikten sonra listeyi yenile
          fetchUsers();
        }}
      />

      {/* User Role Modal */}
      <UserRoleModal
        userId={selectedUserIdForRole}
        currentRole={selectedUserRole}
        isOpen={isRoleModalOpen}
        onClose={() => {
          setIsRoleModalOpen(false);
          setSelectedUserIdForRole(null);
          setSelectedUserRole('');
        }}
        onSuccess={async () => {
          // Rol değişikliği sonrası sadece o kullanıcıyı güncelle
          if (selectedUserIdForRole) {
            try {
              const { apiRequest } = await import('@/utils/api');
              const data = await apiRequest<{ user: { uid: string; role: string; branchId?: string } }>(`/api/users/${selectedUserIdForRole}`);
              setUsers(prev => prev.map(u => u.uid === selectedUserIdForRole ? { ...u, role: data.user.role, branchId: data.user.branchId } : u));
            } catch (error) {
              console.error('Error fetching updated user:', error);
              // Hata durumunda tam listeyi çek
              fetchUsers();
            }
          }
        }}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </AdminLayout>
  );
}


