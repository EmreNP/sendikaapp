import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Users as UsersIcon } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import Pagination from '@/components/common/Pagination';
import UserDetailModal from '@/components/users/UserDetailModal';
import UserRoleModal from '@/components/users/UserRoleModal';
import UserStatusModal from '@/components/users/UserStatusModal';
import UserEditModal from '@/components/users/UserEditModal';
import UserCreateModal from '@/components/users/UserCreateModal';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import UserFilters from '@/components/users/UserFilters';
import UserTableRow from '@/components/users/UserTableRow';
import BulkActionsBar from '@/components/users/BulkActionsBar';
import { useUsers } from '@/hooks/useUsers';
import type { UserItem } from '@/hooks/useUsers';
import { apiRequest } from '@/utils/api';
import { logger } from '@/utils/logger';

export default function UsersPage() {
  const { user } = useAuth();

  const {
    users,
    branches,
    totalUsers,
    managersTotal,
    loading,
    error,
    processing,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    branchFilter,
    setBranchFilter,
    userTypeFilter,
    setUserTypeFilter,
    currentPage,
    setCurrentPage,
    pageSize,
    selectedUserIds,
    setSelectedUserIds,
    confirmDialog,
    setConfirmDialog,
    pendingStatus,
    pendingCount,
    getStatusLabel,
    fetchUsers,
    handleSelectAll,
    handleSelectUser,
    handleDeactivateUser,
    handleActivateUser,
    handleBulkDelete,
    handleBulkDeactivate,
    handleBulkActivate,
    updateUserInList,
  } = useUsers({ userRole: user?.role, userBranchId: user?.branchId });

  // Modal state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserIdForRole, setSelectedUserIdForRole] = useState<string | null>(null);
  const [selectedUserRole, setSelectedUserRole] = useState<string>('');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUserIdForStatus, setSelectedUserIdForStatus] = useState<string | null>(null);
  const [selectedUserStatus, setSelectedUserStatus] = useState<string>('');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedUserIdForEdit, setSelectedUserIdForEdit] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Row action handlers that open confirm dialogs / modals
  const onDeactivateUser = (userItem: UserItem) => {
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
  };

  const onActivateUser = (userItem: UserItem) => {
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
  };

  const onChangeRole = (userItem: UserItem) => {
    setSelectedUserIdForRole(userItem.uid);
    setSelectedUserRole(userItem.role);
    setIsRoleModalOpen(true);
  };

  const onChangeStatus = (userItem: UserItem) => {
    setSelectedUserIdForStatus(userItem.uid);
    setSelectedUserStatus(userItem.status);
    setIsStatusModalOpen(true);
  };

  // Bulk action wrappers that open confirm dialogs
  const confirmBulkDelete = () => {
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
  };

  const confirmBulkDeactivate = () => {
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
  };

  const confirmBulkActivate = () => {
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
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Filters */}
        <UserFilters
          userRole={user?.role}
          userTypeFilter={userTypeFilter}
          setUserTypeFilter={setUserTypeFilter}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          pendingStatus={pendingStatus}
          pendingCount={pendingCount}
          branchFilter={branchFilter}
          setBranchFilter={setBranchFilter}
          branches={branches}
          onCreateUser={() => setIsCreateModalOpen(true)}
        />

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
          ) : users.length === 0 ? (
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
                          checked={users.length > 0 && selectedUserIds.size === users.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300 text-slate-700 focus:ring-slate-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İsim</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
                      {userTypeFilter === 'users' && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                      )}
                      {userTypeFilter === 'managers' && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((userItem) => (
                      <UserTableRow
                        key={userItem.uid}
                        userItem={userItem}
                        userRole={user?.role}
                        userUid={user?.uid}
                        userTypeFilter={userTypeFilter}
                        branches={branches}
                        selectedUserIds={selectedUserIds}
                        processing={processing}
                        getStatusLabel={getStatusLabel}
                        onSelectUser={handleSelectUser}
                        onViewUser={(uid) => { setSelectedUserId(uid); setIsModalOpen(true); }}
                        onDeactivateUser={onDeactivateUser}
                        onActivateUser={onActivateUser}
                        onChangeRole={onChangeRole}
                        onEditUser={(uid) => { setSelectedUserIdForEdit(uid); setIsEditModalOpen(true); }}
                        onChangeStatus={onChangeStatus}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                total={userTypeFilter === 'users' ? totalUsers : managersTotal}
                limit={pageSize}
                onPageChange={setCurrentPage}
                totalLabel={userTypeFilter === 'users' ? `Toplam üye sayısı: ${totalUsers}` : `Toplam yönetici sayısı: ${managersTotal}`}
                showPageNumbers={true}
              />
            </>
          )}
        </div>

        {/* Bulk Actions */}
        <BulkActionsBar
          selectedCount={selectedUserIds.size}
          userRole={user?.role}
          processing={processing}
          onBulkDelete={confirmBulkDelete}
          onBulkDeactivate={confirmBulkDeactivate}
          onBulkActivate={confirmBulkActivate}
          onClearSelection={() => setSelectedUserIds(new Set())}
        />
      </div>

      {/* Modals */}
      <UserCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => { setIsCreateModalOpen(false); fetchUsers(); }}
      />

      <UserEditModal
        userId={selectedUserIdForEdit}
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedUserIdForEdit(null); }}
        onSuccess={() => { setIsEditModalOpen(false); setSelectedUserIdForEdit(null); fetchUsers(); }}
      />

      <UserDetailModal
        userId={selectedUserId}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedUserId(null); }}
        initialTab="details"
        onUserDeleted={() => fetchUsers()}
      />

      <UserRoleModal
        userId={selectedUserIdForRole}
        currentRole={selectedUserRole}
        isOpen={isRoleModalOpen}
        onClose={() => { setIsRoleModalOpen(false); setSelectedUserIdForRole(null); setSelectedUserRole(''); }}
        onSuccess={async () => {
          if (selectedUserIdForRole) {
            try {
              const data = await apiRequest<{ user: { uid: string; role: string; branchId?: string } }>(`/api/users/${selectedUserIdForRole}`);
              updateUserInList(selectedUserIdForRole, { role: data.user.role, branchId: data.user.branchId });
            } catch (error) {
              logger.error('Error fetching updated user:', error);
              fetchUsers();
            }
          }
        }}
      />

      <UserStatusModal
        userId={selectedUserIdForStatus}
        currentStatus={selectedUserStatus}
        isOpen={isStatusModalOpen}
        onClose={() => { setIsStatusModalOpen(false); setSelectedUserIdForStatus(null); setSelectedUserStatus(''); }}
        onSuccess={async () => {
          if (selectedUserIdForStatus) {
            try {
              const data = await apiRequest<{ user: { uid: string; status: string } }>(`/api/users/${selectedUserIdForStatus}`);
              updateUserInList(selectedUserIdForStatus, { status: data.user.status });
            } catch (error) {
              logger.error('Error fetching updated user:', error);
              fetchUsers();
            }
          }
        }}
      />

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
