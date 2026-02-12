import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiRequest } from '@/utils/api';
import { logger } from '@/utils/logger';

export interface UserItem {
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

export interface Branch {
  id: string;
  name: string;
}

interface UseUsersParams {
  userRole?: string;
  userBranchId?: string;
}

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  variant: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
}

export function useUsers({ userRole, userBranchId }: UseUsersParams) {
  // Data state
  const [users, setUsers] = useState<UserItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [managersTotal, setManagersTotal] = useState(0);
  const [_totalPages, setTotalPages] = useState(0);

  // Loading/error state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [userTypeFilter, setUserTypeFilter] = useState<'users' | 'managers'>('users');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Selection state
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'warning',
    onConfirm: () => {},
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch on filter change
  useEffect(() => {
    setCurrentPage(1);
    fetchUsers(1);
    if (userRole === 'admin' || userRole === 'superadmin') {
      fetchBranches();
    } else if (userRole === 'branch_manager' && userBranchId) {
      setBranchFilter(userBranchId);
    }
  }, [statusFilter, branchFilter, userTypeFilter, userRole, userBranchId, debouncedSearch]);

  // Fetch on page change
  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  const fetchBranches = async () => {
    try {
      const data = await apiRequest<{
        branches: Branch[];
        total?: number;
        page: number;
        limit: number;
        hasMore: boolean;
        nextCursor?: string;
      }>('/api/branches');
      setBranches(data.branches || []);
    } catch (error: any) {
      logger.error('Error fetching branches:', error);
    }
  };

  const fetchUsers = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      let url = `/api/users?page=${page}&limit=${pageSize}`;
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      if (debouncedSearch) {
        url += `&search=${encodeURIComponent(debouncedSearch)}`;
      }
      if (branchFilter !== 'all') {
        url += `&branchId=${branchFilter}`;
      }

      if (userTypeFilter === 'users') {
        url += `&role=user`;
      } else if (userTypeFilter === 'managers') {
        url += `&role=managers`;
      }

      logger.log('📡 Fetching users from:', url);

      const data = await apiRequest<{
        users: UserItem[];
        total?: number;
        page: number;
        limit: number;
        hasMore: boolean;
        nextCursor?: string;
      }>(url);

      logger.log('✅ Users data received:', data);
      setUsers(data.users || []);

      const total = data.total || 0;
      if (userTypeFilter === 'users') {
        setTotalUsers(total);
      } else {
        setManagersTotal(total);
      }
      setTotalPages(Math.ceil(total / pageSize));
      setHasMore(data.hasMore || false);
    } catch (error: any) {
      logger.error('❌ Error fetching users:', error);
      setError(error.message || 'Kullanıcılar yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch, branchFilter, userTypeFilter, pageSize]);

  // Keep setHasMore as a no-op since we removed the state variable
  const setHasMore = (_value: boolean) => {
    // intentionally empty – hasMore was unused
  };

  const getStatusLabel = useCallback((status: string) => {
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
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedUserIds(new Set(users.map(u => u.uid)));
    } else {
      setSelectedUserIds(new Set());
    }
  }, [users]);

  const handleSelectUser = useCallback((userId: string, checked: boolean) => {
    setSelectedUserIds(prev => {
      const newSelected = new Set(prev);
      if (checked) {
        newSelected.add(userId);
      } else {
        newSelected.delete(userId);
      }
      return newSelected;
    });
  }, []);

  const handleDeactivateUser = useCallback(async (userId: string) => {
    try {
      setProcessing(true);
      await apiRequest(`/api/users/${userId}/deactivate`, { method: 'PATCH' });
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, isActive: false } : u));
      setSelectedUserIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    } catch (error: any) {
      logger.error('Error deactivating user:', error);
      setError(error.message || 'Kullanıcı deaktif edilirken bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  }, []);

  const handleActivateUser = useCallback(async (userId: string) => {
    try {
      setProcessing(true);
      await apiRequest(`/api/users/${userId}/activate`, { method: 'PATCH' });
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, isActive: true } : u));
      setSelectedUserIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    } catch (error: any) {
      logger.error('Error activating user:', error);
      setError(error.message || 'Kullanıcı aktif edilirken bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  }, []);

  const handleBulkDelete = useCallback(async () => {
    try {
      setProcessing(true);
      const userIds = Array.from(selectedUserIds);

      if (userRole !== 'admin') {
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

      if (result.successCount > 0) {
        const failedUserIds = new Set(result.errors?.map(e => e.userId) || []);
        const successfulUserIds = userIds.filter(id => !failedUserIds.has(id));
        setUsers(prev => prev.filter(u => !successfulUserIds.includes(u.uid)));
      }

      setSelectedUserIds(new Set());
    } catch (error: any) {
      logger.error('Error bulk deleting users:', error);
      setError(error.message || 'Toplu silme işlemi sırasında bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  }, [selectedUserIds, userRole]);

  const handleBulkDeactivate = useCallback(async () => {
    try {
      setProcessing(true);
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

      if (result.successCount > 0) {
        const failedUserIds = new Set(result.errors?.map(e => e.userId) || []);
        const successfulUserIds = userIds.filter(id => !failedUserIds.has(id));
        setUsers(prev => prev.map(u => successfulUserIds.includes(u.uid) ? { ...u, isActive: false } : u));
      }

      setSelectedUserIds(new Set());
    } catch (error: any) {
      logger.error('Error bulk deactivating users:', error);
      setError(error.message || 'Toplu deaktif etme işlemi sırasında bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  }, [selectedUserIds]);

  const handleBulkActivate = useCallback(async () => {
    try {
      setProcessing(true);
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

      if (result.successCount > 0) {
        const failedUserIds = new Set(result.errors?.map(e => e.userId) || []);
        const successfulUserIds = userIds.filter(id => !failedUserIds.has(id));
        setUsers(prev => prev.map(u => successfulUserIds.includes(u.uid) ? { ...u, isActive: true } : u));
      }

      setSelectedUserIds(new Set());
    } catch (error: any) {
      logger.error('Error bulk activating users:', error);
      setError(error.message || 'Toplu aktif etme işlemi sırasında bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  }, [selectedUserIds]);

  // Computed: pending status based on role
  const getPendingStatus = () => {
    if (userRole === 'branch_manager') {
      return 'pending_branch_review';
    } else if (userRole === 'admin' || userRole === 'superadmin') {
      return 'pending_branch_review';
    }
    return null;
  };

  const pendingStatus = useMemo(() => getPendingStatus(), [userRole]);
  const pendingCount = useMemo(() => {
    return userTypeFilter === 'users' && pendingStatus
      ? users.filter((u) => u.status === pendingStatus).length
      : 0;
  }, [userTypeFilter, pendingStatus, users]);

  // Update a single user in the local list (used by modal onSuccess callbacks)
  const updateUserInList = useCallback((uid: string, updates: Partial<UserItem>) => {
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, ...updates } : u));
  }, []);

  return {
    // Data
    users,
    branches,
    totalUsers,
    managersTotal,

    // Loading / error
    loading,
    error,
    processing,
    setError,

    // Filters
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    branchFilter,
    setBranchFilter,
    userTypeFilter,
    setUserTypeFilter,

    // Pagination
    currentPage,
    setCurrentPage,
    pageSize,

    // Selection
    selectedUserIds,
    setSelectedUserIds,

    // Confirm dialog
    confirmDialog,
    setConfirmDialog,

    // Computed
    pendingStatus,
    pendingCount,
    getStatusLabel,

    // Actions
    fetchUsers,
    handleSelectAll,
    handleSelectUser,
    handleDeactivateUser,
    handleActivateUser,
    handleBulkDelete,
    handleBulkDeactivate,
    handleBulkActivate,
    updateUserInList,
  };
}
