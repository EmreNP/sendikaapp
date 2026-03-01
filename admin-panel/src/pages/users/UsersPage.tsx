import { useState } from 'react';
import * as XLSX from 'xlsx';
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

  // Excel export
  const [isExporting, setIsExporting] = useState(false);

  const STATUS_LABEL: Record<string, string> = {
    active: 'Sendika Üyesi',
    pending_branch_review: 'Şube Onayı Bekleniyor',
    pending_details: 'Detaylar Bekleniyor',
    rejected: 'Reddedildi',
    resigned: 'İstifa Etti',
  };

  const GENDER_LABEL: Record<string, string> = {
    male: 'Erkek',
    female: 'Kadın',
  };

  const ROLE_LABEL: Record<string, string> = {
    superadmin: 'Süper Admin',
    admin: 'Admin',
    branch_manager: 'Şube Yöneticisi',
    user: 'Kullanıcı',
  };

  const formatTimestamp = (ts: any): string => {
    if (!ts) return '';
    if (ts instanceof Date) return ts.toLocaleDateString('tr-TR');
    if (ts._seconds || ts.seconds) {
      const secs = ts._seconds ?? ts.seconds;
      return new Date(secs * 1000).toLocaleDateString('tr-TR');
    }
    return String(ts);
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const response = await apiRequest<{ users: any[]; total: number }>('/api/users/export');
      const allUsers = response.users;

      // Şube id → adı map'i
      const branchMap: Record<string, string> = {};
      branches.forEach((b) => { branchMap[b.id] = b.name; });

      const rows = allUsers.map((u) => ({
        'Ad': u.firstName || '',
        'Soyad': u.lastName || '',
        'E-posta': u.email || '',
        'Telefon': u.phone || '',
        'Cinsiyet': GENDER_LABEL[u.gender] || u.gender || '',
        'Doğum Tarihi': formatTimestamp(u.birthDate),
        'Görev İlçesi': u.district || '',
        'Kadro Ünvanı': u.kadroUnvani || '',
        'TC Kimlik No': u.tcKimlikNo || '',
        'Baba Adı': u.fatherName || '',
        'Anne Adı': u.motherName || '',
        'Doğum Yeri': u.birthPlace || '',
        'Öğrenim': u.education || '',
        'Kurum Sicil': u.kurumSicil || '',
        'Başka Sendika Üyesi': u.isMemberOfOtherUnion ? 'Evet' : 'Hayır',
        'Şube': branchMap[u.branchId] || u.branchId || '',
        'Rol': ROLE_LABEL[u.role] || u.role || '',
        'Durum': STATUS_LABEL[u.status] || u.status || '',
        'Hesap Aktif': u.isActive ? 'Evet' : 'Hayır',
        'Kayıt Tarihi': formatTimestamp(u.createdAt),
        'Güncelleme Tarihi': formatTimestamp(u.updatedAt),
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Kullanıcılar');

      // Kolon genişliklerini otomatik ayarla
      const colWidths = Object.keys(rows[0] || {}).map((key) => ({
        wch: Math.max(key.length, ...rows.map((r: any) => String(r[key] || '').length)) + 2,
      }));
      ws['!cols'] = colWidths;

      const date = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
      XLSX.writeFile(wb, `kullanicilar_${date}.xlsx`);
    } catch (error) {
      logger.error('Excel export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };
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
          branchFilter={branchFilter}
          setBranchFilter={setBranchFilter}
          branches={branches}
          onCreateUser={() => setIsCreateModalOpen(true)}
          onExportExcel={handleExportExcel}
          isExporting={isExporting}
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
