import { useEffect, useState } from 'react';
import { X, User as UserIcon, Mail, Phone, Calendar, Briefcase, Building2, CheckCircle, XCircle, ArrowLeft, ArrowRight, Upload, File, Clock, History, Trash2, Edit, FileText, ExternalLink } from 'lucide-react';
import { apiRequest } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { uploadUserRegistrationForm } from '@/utils/fileUpload';
import { batchFetchUserNames } from '@/services/api/userNameService';
import UserStatusModal from './UserStatusModal';
import { EDUCATION_LEVEL_LABELS } from '@shared/constants/education';
import { formatDate } from '@/utils/dateFormatter';

interface UserDetail {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  branchId?: string;
  documentUrl?: string;
  isActive: boolean;
  emailVerified?: boolean;
  birthDate?: any;
  gender?: string;
  tcKimlikNo?: string;
  fatherName?: string;
  motherName?: string;
  birthPlace?: string;
  education?: string;
  kurumSicil?: string;
  kadroUnvani?: string;
  kadroUnvanKodu?: string;
  address?: string;
  city?: string;
  district?: string;
  isMemberOfOtherUnion?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

interface RegistrationLog {
  id?: string;
  userId: string;
  action: 'register_basic' | 'register_details' | 'branch_manager_approval' | 'branch_manager_rejection' | 'admin_approval' | 'admin_rejection' | 'admin_return' | 'branch_manager_return' | 'user_update' | 'status_update' | 'role_update';
  performedBy: string;
  performedByRole: 'admin' | 'branch_manager' | 'user';
  previousStatus?: string;
  newStatus?: string;
  note?: string;
  documentUrl?: string;
  previousDocumentUrl?: string;
  metadata?: {
    branchId?: string;
    email?: string;
    updatedFields?: string[];
    fieldChanges?: Record<string, { oldValue: any; newValue: any }>;
  };
  timestamp: any;
}

interface UserDetailModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'details' | 'logs';
  onUserDeleted?: () => void;
}

export default function UserDetailModal({ userId, isOpen, onClose, initialTab = 'details', onUserDeleted }: UserDetailModalProps) {
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'logs'>(initialTab);
  const [logs, setLogs] = useState<RegistrationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [userNames, setUserNames] = useState<Record<string, { firstName: string; lastName: string }>>({});

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails();
      fetchBranches();
      if (initialTab === 'logs') {
        fetchLogs();
      }
    } else {
      setUser(null);
      setError(null);
      setShowStatusModal(false);
      setLogs([]);
      setBranches([]);
      setUserNames({});
      setActiveTab(initialTab);
    }
  }, [isOpen, userId, initialTab]);

  useEffect(() => {
    if (isOpen && userId && activeTab === 'logs') {
      fetchLogs(); // Refresh logs when switching to logs tab
    }
  }, [activeTab, isOpen, userId]);

  const fetchUserDetails = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await apiRequest<{ user: UserDetail }>(`/api/users/${userId}`);
      setUser(data.user);

      // Eğer branch bilgisi local branches listesinde yoksa, tekil olarak getir ve ekle
      if (data.user?.branchId) {
        await fetchBranchById(data.user.branchId);
      }
    } catch (err: any) {
      console.error('❌ Error fetching user details:', err);
      setError(err.message || 'Kullanıcı bilgileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const data = await apiRequest<{ branches: Array<{ id: string; name: string }> }>('/api/branches');
      setBranches(data.branches || []);
    } catch (err: any) {
      console.error('❌ Error fetching branches:', err);
    }
  };

  const fetchBranchById = async (branchId?: string) => {
    if (!branchId) return;
    // Eğer zaten varsa tekrar getirme
    if (branches.find(b => b.id === branchId)) return;

    try {
      const data = await apiRequest<{ branch: { id: string; name: string } }>(`/api/branches/${branchId}`);
      if (data.branch) {
        setBranches(prev => [...prev, data.branch]);
      }
    } catch (err: any) {
      console.error('❌ Error fetching branch by id:', err);
    }
  };

  const fetchUserNames = async (userIds: string[]) => {
    try {
      const names = await batchFetchUserNames(userIds);
      setUserNames((prev) => ({ ...prev, ...names }));
    } catch (err: any) {
      console.error('❌ Error batch fetching user names:', err);
    }
  };

  const fetchLogs = async () => {
    if (!userId) return;

    try {
      setLoadingLogs(true);
      setError(null);
      const data = await apiRequest<{ logs: RegistrationLog[] }>(`/api/users/${userId}/logs`);
      
      setLogs(data.logs || []);
      
      // Log'lardaki performedBy UID'lerini topla ve kullanıcı isimlerini çek
      const userIds = data.logs?.map(log => log.performedBy).filter(Boolean) || [];
      if (userIds.length > 0) {
        await fetchUserNames(userIds);
      }
    } catch (err: any) {
      console.error('Error fetching logs:', err);
      setError(err.message || 'Loglar yüklenirken bir hata oluştu');
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending_details':
      case 'pending_branch_review':
        return 'bg-amber-100 text-amber-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_details':
        return 'Detaylar Bekleniyor';
      case 'pending_branch_review':
        return 'Şube İncelemesi';
      case 'active':
        return 'Aktif';
      case 'rejected':
        return 'Reddedildi';
      default:
        return status;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
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

  const getPerformerLabel = (log: RegistrationLog) => {
    const userName = userNames[log.performedBy];
    const name = userName ? `${userName.firstName} ${userName.lastName}` : 'Bilinmeyen';
    const roleLabel = getRoleLabel(log.performedByRole);
    return `${name} (${roleLabel})`;
  };

  const getBranchName = (branchId?: string) => {
    if (!branchId) return '-';
    const branch = branches.find(b => b.id === branchId);
    return branch?.name || branchId;
  };

  const getGenderLabel = (gender?: string) => {
    switch (gender) {
      case 'male':
        return 'Erkek';
      case 'female':
        return 'Kadın';
      default:
        return gender || '-';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'register_basic':
        return 'Temel Kayıt';
      case 'register_details':
        return 'Detaylı Kayıt';
      case 'branch_manager_approval':
        return 'İlçe Temsilcisi Onayı';
      case 'branch_manager_rejection':
        return 'İlçe Temsilcisi Reddi';
      case 'admin_approval':
        return 'Admin Onayı';
      case 'admin_rejection':
        return 'Admin Reddi';
      case 'admin_return':
        return 'Admin Geri Gönderimi';
      case 'branch_manager_return':
        return 'İlçe Temsilcisi Geri Gönderimi';
      case 'user_update':
        return 'Kullanıcı Güncelleme';
      case 'status_update':
        return 'Durum Güncelleme';
      case 'role_update':
        return 'Rol Güncelleme';
      default:
        return action;
    }
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      firstName: 'Ad',
      lastName: 'Soyad',
      email: 'E-posta',
      phone: 'Telefon',
      birthDate: 'Doğum Tarihi',
      gender: 'Cinsiyet',
      tcKimlikNo: 'TC Kimlik No',
      fatherName: 'Baba Adı',
      motherName: 'Anne Adı',
      birthPlace: 'Doğum Yeri',
      education: 'Eğitim Seviyesi',
      kurumSicil: 'Kurum Sicil',
      kadroUnvani: 'Kadro Unvanı',
      kadroUnvanKodu: 'Kadro Unvan Kodu',
      district: 'İlçe',
      address: 'Adres',
      city: 'Şehir',
      branchId: 'Şube',
      role: 'Rol',
      status: 'Durum',
      documentUrl: 'Kayıt Formu PDF',
      isMemberOfOtherUnion: 'Başka Sendika Üyeliği',
    };
    return labels[field] || field;
  };

  const formatFieldValue = (field: string, value: any): string => {
    if (value === null || value === undefined) return '-';
    if (value === '') return '(Boş)';
    
    // Boolean değerler
    if (typeof value === 'boolean') {
      return value ? 'Evet' : 'Hayır';
    }
    
    // Tarih alanları
    if (field === 'birthDate') {
      try {
        if (typeof value === 'string') {
          const date = new Date(value);
          return date.toLocaleDateString('tr-TR');
        }
        if (value.toDate) {
          return value.toDate().toLocaleDateString('tr-TR');
        }
      } catch (e) {
        return String(value);
      }
    }
    
    // Enum değerler
    if (field === 'gender') {
      return value === 'male' ? 'Erkek' : value === 'female' ? 'Kadın' : value;
    }
    
    if (field === 'education') {
      return (EDUCATION_LEVEL_LABELS as Record<string, string>)[value] || value;
    }
    
    if (field === 'status') {
      return getStatusLabel(value);
    }
    
    if (field === 'role') {
      const roleLabels: Record<string, string> = {
        'user': 'Kullanıcı',
        'branch_manager': 'İlçe Temsilcisi',
        'admin': 'Admin',
        'superadmin': 'Süper Admin',
      };
      return roleLabels[value] || value;
    }
    
    // Şube ID'si - isim olarak göster
    if (field === 'branchId') {
      return getBranchName(value);
    }
    
    // URL alanları
    if (field === 'documentUrl') {
      return 'PDF Belgesi';
    }
    
    return String(value);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'register_basic':
      case 'register_details':
        return <UserIcon className="w-5 h-5" />;
      case 'branch_manager_approval':
      case 'admin_approval':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'admin_rejection':
      case 'branch_manager_rejection':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'admin_return':
      case 'branch_manager_return':
        return <ArrowLeft className="w-5 h-5 text-orange-600" />;
      case 'user_update':
        return <Edit className="w-5 h-5 text-blue-600" />;
      case 'status_update':
        return <ArrowRight className="w-5 h-5 text-purple-600" />;
      case 'role_update':
        return <UserIcon className="w-5 h-5 text-indigo-600" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'register_basic':
      case 'register_details':
        return 'bg-slate-100 text-slate-800';
      case 'branch_manager_approval':
      case 'admin_approval':
        return 'bg-green-100 text-green-800';
      case 'admin_rejection':
      case 'branch_manager_rejection':
        return 'bg-red-100 text-red-800';
      case 'admin_return':
      case 'branch_manager_return':
        return 'bg-amber-100 text-amber-800';
      case 'user_update':
        return 'bg-blue-100 text-blue-800';
      case 'status_update':
        return 'bg-purple-100 text-purple-800';
      case 'role_update':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Status değiştirme fonksiyonu
  const handleStatusSuccess = async () => {
    // Kullanıcı bilgilerini ve logları yenile
    await fetchUserDetails();
    await fetchLogs();
  };

  // Status değiştirme butonuna tıklandığında
  const onStatusButtonClick = () => {
    setShowStatusModal(true);
  };

  // Branch Manager için izin verilen status geçişleri
  const canBranchManagerChangeStatus = (currentStatus: string, newStatus: string): boolean => {
    // Branch manager aktif kullanıcıların durumunu değiştiremez
    if (currentStatus === 'active') {
      return false;
    }
    
    // Aktif olmayan tüm durumlarda değişiklik yapabilir
    if (currentStatus === 'pending_branch_review') {
      return newStatus === 'active' || newStatus === 'rejected' || newStatus === 'pending_details';
    }
    if (currentStatus === 'pending_details') {
      return newStatus === 'pending_branch_review' || newStatus === 'active' || newStatus === 'rejected';
    }
    if (currentStatus === 'rejected') {
      return newStatus === 'pending_details' || newStatus === 'pending_branch_review' || newStatus === 'active';
    }
    return false;
  };

  // Mevcut kullanıcının status değiştirme yetkisi var mı?
  const canChangeStatus = (newStatus: string): boolean => {
    if (!user || !currentUser) return false;
    
    if (currentUser.role === 'superadmin' || currentUser.role === 'admin') {
      return true; // Superadmin ve Admin her şeyi yapabilir
    }
    
    if (currentUser.role === 'branch_manager') {
      // Branch Manager sadece kendi şubesindeki kullanıcıları yönetebilir
      if (user.branchId !== currentUser.branchId) {
        return false;
      }
      return canBranchManagerChangeStatus(user.status, newStatus);
    }
    
    return false;
  };

  // Kullanıcı silme fonksiyonu
  const handleDeleteUser = async () => {
    if (!userId || !user) return;

    try {
      setDeletingUser(true);
      setError(null);
      await apiRequest(`/api/users/${userId}`, { method: 'DELETE' });
      
      // Modal'ı kapat ve callback'i çağır
      onClose();
      if (onUserDeleted) {
        onUserDeleted();
      }
    } catch (err: any) {
      console.error('❌ Error deleting user:', err);
      setError(err.message || 'Kullanıcı silinirken bir hata oluştu');
    } finally {
      setDeletingUser(false);
      setShowDeleteConfirm(false);
    }
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
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200 bg-slate-700">
            <h2 className="text-sm font-medium text-white">Kullanıcı Detayları</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 bg-white">
            <div className="flex">
              <button
                onClick={() => setActiveTab('details')}
                className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
                  activeTab === 'details'
                    ? 'text-slate-700 border-b-2 border-slate-700 bg-slate-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <UserIcon className="w-3 h-3" />
                  Bilgiler
                </div>
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
                  activeTab === 'logs'
                    ? 'text-slate-700 border-b-2 border-slate-700 bg-slate-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <History className="w-3 h-3" />
                  Kayıt Geçmişi
                </div>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'details' ? (
              <>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
                    <p className="ml-3 text-gray-600">Yükleniyor...</p>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{error}</p>
                  </div>
                ) : user ? (
                  <div className="space-y-6">
                {/* Kişisel Bilgiler */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-slate-700" />
                      Kişisel Bilgiler
                    </h3>
                    {/* PDF Belgesi Link (Admin / Superadmin için) */}
                    {(currentUser?.role === 'admin' || currentUser?.role === 'superadmin') && user.documentUrl && (
                      <a
                        href={user.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-800 transition-colors"
                      >
                        <File className="w-5 h-5 text-red-600" />
                        <span>Kullanıcı Kayıt Formu</span>
                      </a>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Ad</label>
                      <div className="text-gray-900 font-medium">{user.firstName}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Soyad</label>
                      <div className="text-gray-900 font-medium">{user.lastName}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">E-posta</label>
                      <div className="text-gray-900 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {user.email}
                        {user.emailVerified && (
                          <span className="text-xs text-green-600 font-medium">✓ Doğrulanmış</span>
                        )}
                      </div>
                    </div>
                    {user.phone && (
                      <div>
                        <label className="text-sm text-gray-600">Telefon</label>
                        <div className="text-gray-900 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {user.phone}
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-sm text-gray-600">Doğum Tarihi</label>
                      <div className="text-gray-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(user.birthDate, false)}
                      </div>
                    </div>
                    {user.gender && (
                      <div>
                        <label className="text-sm text-gray-600">Cinsiyet</label>
                        <div className="text-gray-900">{getGenderLabel(user.gender)}</div>
                      </div>
                    )}
                    {user.tcKimlikNo && (
                      <div>
                        <label className="text-sm text-gray-600">TC Kimlik No</label>
                        <div className="text-gray-900">{user.tcKimlikNo}</div>
                      </div>
                    )}
                    {user.fatherName && (
                      <div>
                        <label className="text-sm text-gray-600">Baba Adı</label>
                        <div className="text-gray-900">{user.fatherName}</div>
                      </div>
                    )}
                    {user.motherName && (
                      <div>
                        <label className="text-sm text-gray-600">Anne Adı</label>
                        <div className="text-gray-900">{user.motherName}</div>
                      </div>
                    )}
                    {user.birthPlace && (
                      <div>
                        <label className="text-sm text-gray-600">Doğum Yeri</label>
                        <div className="text-gray-900">{user.birthPlace}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Diğer Bilgiler */}
                {(user.education || user.kurumSicil || user.kadroUnvani || user.kadroUnvanKodu || user.branchId) && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-slate-700" />
                      Diğer Bilgiler
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {user.education && (
                        <div>
                          <label className="text-sm text-gray-600">Eğitim Seviyesi</label>
                          <div className="text-gray-900">{user.education}</div>
                        </div>
                      )}
                      {user.kurumSicil && (
                        <div>
                          <label className="text-sm text-gray-600">Kurum Sicil</label>
                          <div className="text-gray-900">{user.kurumSicil}</div>
                        </div>
                      )}
                      {user.kadroUnvani && (
                        <div>
                          <label className="text-sm text-gray-600">Kadro Unvanı</label>
                          <div className="text-gray-900">{user.kadroUnvani}</div>
                        </div>
                      )}
                      {user.kadroUnvanKodu && (
                        <div>
                          <label className="text-sm text-gray-600">Kadro Unvan Kodu</label>
                          <div className="text-gray-900">{user.kadroUnvanKodu}</div>
                        </div>
                      )}
                      {user.branchId && (
                        <div>
                          <label className="text-sm text-gray-600">Şube</label>
                          <div className="text-gray-900 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            {getBranchName(user.branchId)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sil Butonu - İçerik Alanının En Altı */}
                {(currentUser?.role === 'admin' || currentUser?.role === 'superadmin' || 
                  (currentUser?.role === 'branch_manager' && user?.role === 'user' && user?.branchId === currentUser?.branchId)) && 
                  user && user.uid !== currentUser.uid && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={deletingUser}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      {deletingUser ? 'Siliniyor...' : 'Kullanıcıyı Sil'}
                    </button>
                  </div>
                )}

                  </div>
                ) : null}
              </>
            ) : (
              /* Logs Tab */
              <>
                {/* Status Yönetimi - Kompakt Tasarım */}
                {user && (currentUser?.role === 'admin' || currentUser?.role === 'superadmin' || 
                  (currentUser?.role === 'branch_manager' && (user.status === 'pending_branch_review' || user.status === 'pending_details'))) && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 font-medium">Durum:</span>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(user.status)}`}>
                          {getStatusLabel(user.status)}
                        </span>
                        <span className="text-xs text-gray-400">→</span>
                        <button
                          onClick={onStatusButtonClick}
                          className="text-xs border border-gray-300 rounded-md px-2.5 py-1 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                        >
                          Durum Değiştir...
                        </button>
                      </div>
                      <div className="h-4" />
                      {false && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-slate-600"></div>
                          <span>Güncelleniyor...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Kayıt Geçmişi - Kompakt ve Düzenli */}
                {loadingLogs ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <p className="ml-2 text-sm text-gray-600">Yükleniyor...</p>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Kayıt geçmişi bulunmuyor</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-700">Kayıt Geçmişi</h3>
                      <span className="text-xs text-gray-500">{logs.length} kayıt</span>
                    </div>
                    
                    <div className="space-y-2">
                      {logs.map((log, index) => (
                        <div key={log.id || index} className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                          {/* Icon */}
                          <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${getActionColor(log.action)}`}>
                            {getActionIcon(log.action)}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className={`text-xs font-medium ${getActionColor(log.action)}`}>
                                {getActionLabel(log.action)}
                              </span>
                              <span className="text-xs text-gray-400 flex-shrink-0">
                                {formatDate(log.timestamp)}
                              </span>
                            </div>
                            
                            {/* Status Change - Sadece önemliyse göster */}
                            {log.newStatus && log.previousStatus !== log.newStatus && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1">
                                <span className="text-gray-400">{getStatusLabel(log.previousStatus || '')}</span>
                                <ArrowRight className="w-3 h-3 text-gray-400" />
                                <span className="font-medium text-gray-700">{getStatusLabel(log.newStatus)}</span>
                              </div>
                            )}
                            
                            {/* Performer - Kompakt */}
                            <div className="text-xs text-gray-500">
                              {getPerformerLabel(log)}
                            </div>
                            
                            {/* Field Changes - user_update için */}
                            {log.action === 'user_update' && log.metadata?.fieldChanges && Object.keys(log.metadata.fieldChanges).length > 0 && (
                              <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100">
                                <div className="text-xs font-medium text-blue-800 mb-1.5">Güncellenen Alanlar:</div>
                                <div className="space-y-1">
                                  {Object.entries(log.metadata.fieldChanges).map(([field, changes]) => (
                                    <div key={field} className="text-xs text-gray-700">
                                      <span className="font-medium text-gray-900">{getFieldLabel(field)}:</span>
                                      <div className="ml-2 mt-0.5 flex items-center gap-1.5">
                                        <span className="text-red-600 line-through">{formatFieldValue(field, changes.oldValue)}</span>
                                        <ArrowRight className="w-3 h-3 text-gray-400" />
                                        <span className="text-green-600 font-medium">{formatFieldValue(field, changes.newValue)}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Note - Sadece varsa göster, kompakt */}
                            {log.note && (
                              <div className="mt-1.5 text-xs text-gray-600 italic">
                                "{log.note}"
                              </div>
                            )}
                            
                            {/* PDF Links - Kompakt */}
                            {(log.documentUrl || log.previousDocumentUrl) && (
                              <div className="mt-2 space-y-1">
                                {log.previousDocumentUrl && (
                                  <a
                                    href={log.previousDocumentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                                  >
                                    <File className="w-3 h-3" />
                                    <span>Eski PDF</span>
                                  </a>
                                )}
                                {log.documentUrl && (
                                  <a
                                    href={log.documentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-slate-700 hover:text-slate-800 ml-3"
                                  >
                                    <File className="w-3 h-3" />
                                    <span>{log.previousDocumentUrl ? 'Yeni PDF' : 'PDF Görüntüle'}</span>
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Tarih Bilgileri - Küçük Text */}
          {user && (
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                <span>Kayıt: {formatDate(user.createdAt)}</span>
                <span>•</span>
                <span>Güncelleme: {formatDate(user.updatedAt)}</span>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Kullanıcıyı Sil</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {user?.firstName} {user?.lastName} kullanıcısını kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deletingUser}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleDeleteUser}
                    disabled={deletingUser}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {deletingUser ? 'Siliniyor...' : 'Sil'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Status Modal */}
          <UserStatusModal
            userId={userId}
            currentStatus={user?.status || ''}
            isOpen={showStatusModal}
            onClose={() => setShowStatusModal(false)}
            onSuccess={handleStatusSuccess}
          />
        </div>
      </div>
    </div>
  );
}

