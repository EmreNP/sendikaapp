import React from 'react';
import { XCircle, CheckCircle, UserCog, RefreshCw, Edit } from 'lucide-react';
import ActionButton from '@/components/common/ActionButton';
import type { UserItem, Branch } from '@/hooks/useUsers';

interface UserTableRowProps {
  userItem: UserItem;
  userRole?: string;
  userUid?: string;
  userTypeFilter: 'users' | 'managers';
  branches: Branch[];
  selectedUserIds: Set<string>;
  processing: boolean;
  getStatusLabel: (status: string) => string;
  onSelectUser: (userId: string, checked: boolean) => void;
  onViewUser: (userId: string) => void;
  onDeactivateUser: (userItem: UserItem) => void;
  onActivateUser: (userItem: UserItem) => void;
  onChangeRole: (userItem: UserItem) => void;
  onEditUser: (userId: string) => void;
  onChangeStatus: (userItem: UserItem) => void;
}

const UserTableRow = React.memo(function UserTableRow({
  userItem,
  userRole,
  userUid,
  userTypeFilter,
  branches,
  selectedUserIds,
  processing,
  getStatusLabel,
  onSelectUser,
  onViewUser,
  onDeactivateUser,
  onActivateUser,
  onChangeRole,
  onEditUser,
  onChangeStatus,
}: UserTableRowProps) {
  const isAdminOrSuper = userRole === 'admin' || userRole === 'superadmin';

  return (
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
          onChange={(e) => onSelectUser(userItem.uid, e.target.checked)}
          className="rounded border-gray-300 text-slate-700 focus:ring-slate-500"
          onClick={(e) => e.stopPropagation()}
        />
      </td>
      <td
        className="px-4 py-3 cursor-pointer"
        onClick={() => onViewUser(userItem.uid)}
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
        onClick={() => onViewUser(userItem.uid)}
      >
        <div className="text-sm text-gray-600 truncate max-w-xs">{userItem.email}</div>
      </td>
      <td
        className="px-4 py-3 cursor-pointer"
        onClick={() => onViewUser(userItem.uid)}
      >
        <div className="text-sm text-gray-600">{userItem.phone || '-'}</div>
      </td>
      {userTypeFilter === 'users' && (
        <td className="px-4 py-3 whitespace-nowrap">
          <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
            {getStatusLabel(userItem.status)}
          </span>
        </td>
      )}
      {userTypeFilter === 'managers' && (
        <td className="px-4 py-3 whitespace-nowrap">
          <span className="text-xs text-gray-700">
            {userItem.role === 'superadmin'
              ? 'Superadmin'
              : userItem.role === 'admin'
              ? 'Admin'
              : userItem.role === 'branch_manager' && userItem.branchId
              ? `(${branches.find(b => b.id === userItem.branchId)?.name || ''})`
              : ''}
          </span>
        </td>
      )}
      <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          {userItem.isActive ? (
            <ActionButton
              icon={XCircle}
              variant="deactivate"
              onClick={() => onDeactivateUser(userItem)}
              title="Deaktif Et"
              disabled={processing}
            />
          ) : (
            <ActionButton
              icon={CheckCircle}
              variant="activate"
              onClick={() => onActivateUser(userItem)}
              title="Aktif Et"
              disabled={processing}
            />
          )}
          {isAdminOrSuper && (
            <ActionButton
              icon={UserCog}
              variant="role"
              onClick={() => onChangeRole(userItem)}
              title={
                userItem.uid === userUid
                  ? 'Kendi rolünüzü değiştiremezsiniz'
                  : userRole === 'admin' && (userItem.role === 'admin' || userItem.role === 'superadmin')
                  ? 'Admin, diğer admin veya superadmin rollerini değiştiremez'
                  : 'Rol Değiştir'
              }
              disabled={
                processing ||
                userItem.uid === userUid ||
                (userRole === 'admin' && (userItem.role === 'admin' || userItem.role === 'superadmin'))
              }
            />
          )}
          {(isAdminOrSuper || userRole === 'branch_manager') && (
            <ActionButton
              icon={Edit}
              variant="edit"
              onClick={() => onEditUser(userItem.uid)}
              title={
                userRole === userItem.role
                  ? 'Aynı yetkiye sahip kullanıcıları düzenleyemezsiniz'
                  : userRole === 'admin' && (userItem.role === 'admin' || userItem.role === 'superadmin')
                  ? 'Admin, diğer admin veya superadmin kullanıcılarını düzenleyemez'
                  : userRole === 'branch_manager' && userItem.role !== 'user'
                  ? 'Şube yöneticileri sadece kullanıcıları düzenleyebilir'
                  : 'Kullanıcıyı Düzenle'
              }
              disabled={
                processing ||
                userRole === userItem.role ||
                (userRole === 'admin' && (userItem.role === 'admin' || userItem.role === 'superadmin')) ||
                (userRole === 'branch_manager' && userItem.role !== 'user')
              }
            />
          )}
          {userTypeFilter === 'users' && (isAdminOrSuper || (userRole === 'branch_manager' && userItem.status !== 'active')) && (
            <ActionButton
              icon={RefreshCw}
              variant="status"
              onClick={() => onChangeStatus(userItem)}
              title="Durum Değiştir"
              disabled={processing}
            />
          )}
        </div>
      </td>
    </tr>
  );
});

export default UserTableRow;
