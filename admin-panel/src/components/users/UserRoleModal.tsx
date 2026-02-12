import { useEffect, useState } from 'react';
import { X, User as UserIcon, Building2 } from 'lucide-react';
import { apiRequest } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { logger } from '@/utils/logger';

interface Branch {
  id: string;
  name: string;
  code?: string;
  isActive: boolean;
}

interface UserRoleModalProps {
  userId: string | null;
  currentRole: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserRoleModal({ userId, currentRole, isOpen, onClose, onSuccess }: UserRoleModalProps) {
  const { user: currentUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string>(currentRole);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedRole(currentRole);
      setError(null);
      if (currentRole === 'branch_manager') {
        fetchBranches();
      }
    }
  }, [isOpen, currentRole]);

  useEffect(() => {
    if (selectedRole === 'branch_manager' && branches.length === 0) {
      fetchBranches();
    }
  }, [selectedRole]);

  const fetchBranches = async () => {
    try {
      setBranchesLoading(true);
      const data = await apiRequest<{ 
        branches: Branch[];
        total?: number;
        page: number;
        limit: number;
        hasMore: boolean;
        nextCursor?: string;
      }>('/api/branches');
      setBranches(data.branches.filter(b => b.isActive) || []);
    } catch (err: any) {
      logger.error('Error fetching branches:', err);
      setError('Şubeler yüklenirken bir hata oluştu');
    } finally {
      setBranchesLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (selectedRole === 'branch_manager' && !selectedBranchId) {
      setError('Branch Manager rolü için şube seçimi zorunludur');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const body: { role: string; branchId?: string } = { role: selectedRole };
      if (selectedRole === 'branch_manager') {
        body.branchId = selectedBranchId;
      }

      await apiRequest(`/api/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      logger.error('Error updating user role:', err);
      setError(err.message || 'Rol güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'Superadmin';
      case 'admin':
        return 'Admin';
      case 'branch_manager':
        return 'İlçe Temsilcisi';
      case 'user':
        return 'Kullanıcı';
      default:
        return role;
    }
  };

  // Mevcut kullanıcının rolüne göre seçilebilir rolleri filtrele
  const getAvailableRoles = () => {
    const userRole = currentUser?.role;
    
    // Superadmin tüm rolleri seçebilir
    if (userRole === 'superadmin') {
      return [
        { value: 'user', label: 'Kullanıcı' },
        { value: 'branch_manager', label: 'İlçe Temsilcisi' },
        { value: 'admin', label: 'Admin' },
        { value: 'superadmin', label: 'Superadmin' },
      ];
    }
    
    // Admin sadece user ve branch_manager seçebilir
    if (userRole === 'admin') {
      return [
        { value: 'user', label: 'Kullanıcı' },
        { value: 'branch_manager', label: 'İlçe Temsilcisi' },
      ];
    }
    
    // Varsayılan (branch_manager vb için)
    return [
      { value: 'user', label: 'Kullanıcı' },
    ];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200 bg-slate-700">
            <h2 className="text-sm font-medium text-white">Rol Değiştir</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Current Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mevcut Rol
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-700">
                  {getRoleLabel(currentRole)}
                </div>
              </div>

              {/* New Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yeni Rol <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value);
                    setSelectedBranchId('');
                    setError(null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {getAvailableRoles().map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch Selection (only for branch_manager) */}
              {selectedRole === 'branch_manager' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Şube <span className="text-red-500">*</span>
                  </label>
                  {branchesLoading ? (
                    <div className="px-3 py-2 border border-gray-300 rounded-lg text-gray-500">
                      Şubeler yükleniyor...
                    </div>
                  ) : (
                    <select
                      value={selectedBranchId}
                      onChange={(e) => {
                        setSelectedBranchId(e.target.value);
                        setError(null);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Şube seçiniz</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {branches.length === 0 && !branchesLoading && (
                    <p className="mt-1 text-sm text-gray-500">Aktif şube bulunamadı</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading || (selectedRole === 'branch_manager' && !selectedBranchId)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Güncelleniyor...' : 'Güncelle'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

