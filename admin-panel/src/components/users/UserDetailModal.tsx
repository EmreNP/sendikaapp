import { useEffect, useState } from 'react';
import { X, User as UserIcon, Mail, Phone, Calendar, Briefcase, Building2, CheckCircle, XCircle, ArrowLeft, ArrowRight, Upload, File, Clock, History, Trash2 } from 'lucide-react';
import { apiRequest } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

interface UserDetail {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  branchId?: string;
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
  createdAt?: any;
  updatedAt?: any;
  documentUrl?: string; // PDF belgesi URL'i
}

interface RegistrationLog {
  id?: string;
  userId: string;
  action: 'register_basic' | 'register_details' | 'branch_manager_approval' | 'branch_manager_rejection' | 'admin_approval' | 'admin_rejection' | 'admin_return' | 'branch_manager_return';
  performedBy: string;
  performedByRole: 'admin' | 'branch_manager' | 'user';
  previousStatus?: string;
  newStatus?: string;
  note?: string;
  documentUrl?: string;
  metadata?: {
    branchId?: string;
    email?: string;
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
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showPdfUploadModal, setShowPdfUploadModal] = useState(false);
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [note, setNote] = useState('');
  const [targetStatus, setTargetStatus] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'logs'>(initialTab);
  const [logs, setLogs] = useState<RegistrationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [userNames, setUserNames] = useState<Record<string, { firstName: string; lastName: string }>>({});

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails();
      fetchBranches();
      fetchLogs(); // Always fetch logs when modal opens
    } else {
      setUser(null);
      setError(null);
      setPdfFile(null);
      setPdfUrl(null);
      setShowPdfUploadModal(false);
      setShowStatusChangeModal(false);
      setRejectionReason('');
      setNote('');
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

  const fetchUserNames = async (userIds: string[]) => {
    const uniqueUserIds = [...new Set(userIds)];
    const names: Record<string, { firstName: string; lastName: string }> = {};
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7bfa6cc7-a793-4b51-ac28-4dd595ebead2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UserDetailModal.tsx:138',message:'fetchUserNames called',data:{uniqueUserIds,count:uniqueUserIds.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    await Promise.all(
      uniqueUserIds.map(async (uid) => {
        try {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/7bfa6cc7-a793-4b51-ac28-4dd595ebead2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UserDetailModal.tsx:145',message:'fetching user name',data:{uid},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          const userData = await apiRequest<{ user: UserDetail }>(`/api/users/${uid}`);
          if (userData.user) {
            names[uid] = {
              firstName: userData.user.firstName,
              lastName: userData.user.lastName,
            };
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/7bfa6cc7-a793-4b51-ac28-4dd595ebead2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UserDetailModal.tsx:151',message:'user name fetched successfully',data:{uid,firstName:userData.user.firstName,lastName:userData.user.lastName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
          }
        } catch (err: any) {
          // 403 hatası (yetkisiz erişim) sessizce ignore edilir
          // Örneğin branch manager admin kullanıcılarını göremez, bu normal bir durum
          const isUnauthorized = err?.response?.status === 403 || err?.code === 'UNAUTHORIZED';
          if (!isUnauthorized) {
            // Sadece 403 dışındaki hataları logla
            console.error(`❌ Error fetching user ${uid}:`, err);
          }
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/7bfa6cc7-a793-4b51-ac28-4dd595ebead2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UserDetailModal.tsx:163',message:'error fetching user name',data:{uid,errorMessage:err?.message,errorCode:err?.code,statusCode:err?.response?.status,isUnauthorized,willIgnore:isUnauthorized},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
        }
      })
    );
    
    setUserNames((prev) => ({ ...prev, ...names }));
  };

  const fetchLogs = async () => {
    if (!userId) return;

    try {
      setLoadingLogs(true);
      setError(null);
      console.log('📡 Fetching logs for user:', userId);
      const data = await apiRequest<{ logs: RegistrationLog[] }>(`/api/users/${userId}/logs`);
      console.log('✅ Logs received:', data);
      console.log('📊 Logs count:', data?.logs?.length || 0);
      
      // Log'ları detaylı logla
      if (data?.logs && data.logs.length > 0) {
        console.log('📋 Log details:');
        data.logs.forEach((log, index) => {
          console.log(`  ${index + 1}. Action: ${log.action}, Role: ${log.performedByRole}, Status: ${log.previousStatus} → ${log.newStatus}`);
        });
      } else {
        console.log('⚠️ No logs found for this user');
      }
      
      setLogs(data.logs || []);
      
      // Log'lardaki performedBy UID'lerini topla ve kullanıcı isimlerini çek
      const userIds = data.logs?.map(log => log.performedBy).filter(Boolean) || [];
      if (userIds.length > 0) {
        console.log('👤 Fetching user names for:', userIds);
        await fetchUserNames(userIds);
      }
    } catch (err: any) {
      console.error('❌ Error fetching logs:', err);
      console.error('❌ Error details:', {
        message: err.message,
        code: err.code,
        details: err.details,
      });
      setError(err.message || 'Loglar yüklenirken bir hata oluştu');
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const formatDate = (date: any, includeTime: boolean = true): string => {
    if (!date) return '-';
    
    try {
      // Firebase Timestamp veya Date objesi olabilir
      let dateObj: Date;
      
      if (date.toDate) {
        // Firebase Timestamp (client SDK)
        dateObj = date.toDate();
      } else if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else if (date.seconds !== undefined) {
        // Firestore Timestamp (server SDK - { seconds: number, nanoseconds?: number })
        dateObj = new Date(date.seconds * 1000 + (date.nanoseconds || 0) / 1000000);
      } else if (typeof date === 'number') {
        // Unix timestamp (milliseconds)
        dateObj = new Date(date);
      } else {
        return '-';
      }
      
      // Geçersiz tarih kontrolü
      if (isNaN(dateObj.getTime())) {
        return '-';
      }
      
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      
      if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
      }
      
      return new Intl.DateTimeFormat('tr-TR', options).format(dateObj);
    } catch (error) {
      console.error('Date formatting error:', error, date);
      return '-';
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
        return 'Şube Yöneticisi';
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
        return 'Şube Yöneticisi Onayı';
      case 'branch_manager_rejection':
        return 'Şube Yöneticisi Reddi';
      case 'admin_approval':
        return 'Admin Onayı';
      case 'admin_rejection':
        return 'Admin Reddi';
      case 'admin_return':
        return 'Admin Geri Gönderimi';
      case 'branch_manager_return':
        return 'Şube Yöneticisi Geri Gönderimi';
      default:
        return action;
    }
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // PDF yükleme fonksiyonu - Backend API kullanarak
  const uploadPdfToStorage = async (file: File, userId: string): Promise<string> => {
    try {
      setUploadingPdf(true);
      
      // FormData oluştur
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      
      // Backend API'ye yükle
      const { api } = await import('@/config/api');
      const { authService } = await import('@/services/auth/authService');
      
      const token = await authService.getIdToken();
      const url = api.url('/api/files/user-documents/upload');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Content-Type header'ını eklemeyin, FormData otomatik ekler
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'PDF yüklenirken bir hata oluştu');
      }
      
      const documentUrl = data.data?.documentUrl || data.data?.fileUrl || data.data?.imageUrl;
      
      if (!documentUrl) {
        throw new Error('Yükleme başarılı ancak URL alınamadı');
      }
      
      setPdfUrl(documentUrl);
      return documentUrl;
    } catch (err: any) {
      console.error('❌ Error uploading PDF:', err);
      throw new Error('PDF yüklenirken bir hata oluştu: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setUploadingPdf(false);
    }
  };

  // Status değiştirme fonksiyonu
  const handleStatusChange = async (newStatus: string, reason?: string) => {
    console.log('🔄 handleStatusChange called:', {
      userId,
      currentUserRole: currentUser?.role,
      currentStatus: user?.status,
      newStatus,
      reason: reason ? 'provided' : 'not provided',
      note: note ? 'provided' : 'not provided',
    });

    if (!user || !userId) {
      console.warn('⚠️ handleStatusChange: Missing user or userId', { user: !!user, userId: !!userId });
      return;
    }

    try {
      console.log('✅ Starting status update process...');
      setUpdatingStatus(true);
      setError(null);

      // Onaylama (active) durumunda PDF zorunlu (branch_manager)
      if (newStatus === 'active' && currentUser?.role === 'branch_manager') {
        console.log('📎 Branch Manager approving user - checking PDF...');
        if (!pdfFile) {
          console.error('❌ PDF file is required for admin approval but not provided');
          setError('Admin onayına göndermek için PDF belgesi yüklemelisiniz');
          setUpdatingStatus(false);
          return;
        }

        // PDF'i yükle
        console.log('📤 Uploading PDF file...', { fileName: pdfFile.name, size: pdfFile.size });
        let pdfUrlToSend = pdfUrl;
        if (!pdfUrlToSend && pdfFile) {
          pdfUrlToSend = await uploadPdfToStorage(pdfFile, userId);
          console.log('✅ PDF uploaded successfully:', pdfUrlToSend);
        } else {
          console.log('✅ PDF URL already available:', pdfUrlToSend);
        }

        const body: any = { 
          status: newStatus,
          documentUrl: pdfUrlToSend,
          note: note.trim() || undefined, // Opsiyonel not
        };
        
        console.log('📤 Sending PATCH request (Branch Manager):', {
          url: `/api/users/${userId}/status`,
          body: {
            ...body,
            documentUrl: body.documentUrl ? 'present' : 'missing',
          },
        });
        
        const response = await apiRequest(`/api/users/${userId}/status`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        
        console.log('✅ Status update response (Branch Manager):', response);
        
        // Log bilgisini kontrol et
        if (response && (response as any).logInfo) {
          const logInfo = (response as any).logInfo;
          console.log('📋 Log creation info (Branch Manager):', {
            created: logInfo.created,
            error: logInfo.error,
            role: logInfo.role,
          });
          
          if (!logInfo.created && logInfo.error) {
            console.error('❌ Log creation failed:', logInfo.error);
          } else if (logInfo.created) {
            console.log('✅ Log created successfully');
          }
        }
      } else {
        // Diğer durumlar için normal işlem
        const body: any = { 
          status: newStatus,
          note: note.trim() || undefined, // Opsiyonel not
        };
        if (reason) {
          body.rejectionReason = reason;
          console.log('📝 Rejection reason included in body');
        }

        console.log('📤 Sending PATCH request:', {
          url: `/api/users/${userId}/status`,
          currentUserRole: currentUser?.role,
          body: {
            status: body.status,
            note: body.note ? 'provided' : 'not provided',
            rejectionReason: body.rejectionReason ? 'provided' : 'not provided',
          },
        });

        const response = await apiRequest(`/api/users/${userId}/status`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        
        console.log('✅ Status update response:', response);
        
        // Log bilgisini kontrol et (response direkt data döndürür)
        if (response && (response as any).logInfo) {
          const logInfo = (response as any).logInfo;
          console.log('📋 Log creation info:', {
            created: logInfo.created,
            error: logInfo.error,
            role: logInfo.role,
          });
          
          if (!logInfo.created && logInfo.error) {
            console.error('❌ Log creation failed:', logInfo.error);
          } else if (logInfo.created) {
            console.log('✅ Log created successfully');
          } else {
            console.warn('⚠️ Log was not created (no error, but not created)');
          }
        } else {
          console.warn('⚠️ No log info in response');
        }
      }

      // Kullanıcı bilgilerini yenile
      console.log('🔄 Refreshing user details...');
      await fetchUserDetails();
      console.log('✅ User details refreshed');
      
      // Log'ları yenile (her zaman, çünkü artık details tab'ında da görünüyor)
      console.log('📋 Refreshing logs...');
      await fetchLogs();
      console.log('✅ Logs refreshed');
      
      // Modal'ları kapat ve state'i temizle
      console.log('🧹 Cleaning up modals and state...');
      setShowRejectionModal(false);
      setShowStatusChangeModal(false);
      setShowPdfUploadModal(false);
      setRejectionReason('');
      setNote('');
      setTargetStatus(null);
      setPdfFile(null);
      setPdfUrl(null);
      console.log('✅ Status change completed successfully');
    } catch (err: any) {
      console.error('❌ Error updating status:', err);
      console.error('❌ Error details:', {
        message: err.message,
        code: err.code,
        response: err.response,
        stack: err.stack,
      });
      setError(err.message || 'Durum güncellenirken bir hata oluştu');
    } finally {
      setUpdatingStatus(false);
      console.log('🏁 Status update process finished (finally block)');
    }
  };

  // Status değiştirme butonuna tıklandığında
  const onStatusButtonClick = (newStatus: string) => {
    console.log('🔘 Status button clicked:', {
      newStatus,
      currentStatus: user?.status,
      currentUserRole: currentUser?.role,
      userId,
    });
    
    setTargetStatus(newStatus);
    console.log('✅ Target status set to:', newStatus);
    
    // Onaylama durumunda (active) PDF yükleme modal'ını göster
    if (newStatus === 'active' && currentUser?.role === 'branch_manager') {
      console.log('📎 Branch Manager approving user - showing PDF upload modal');
      setShowPdfUploadModal(true);
      return;
    }

    if (newStatus === 'rejected') {
      // Rejection için modal göster
      console.log('❌ Rejection status selected - showing rejection modal');
      setShowRejectionModal(true);
    } else {
      // Diğer durumlar için status change modal göster
      console.log('📝 Other status selected - showing status change modal');
      setShowStatusChangeModal(true);
    }
  };

  // PDF yükleme modal'ında onay butonuna basıldığında
  const onPdfUploadConfirm = async () => {
    console.log('✅ PDF upload confirm clicked:', {
      targetStatus,
      hasPdfFile: !!pdfFile,
      pdfFileName: pdfFile?.name,
      pdfFileSize: pdfFile?.size,
      note: note ? 'provided' : 'not provided',
    });

    if (!pdfFile) {
      console.error('❌ PDF file is required but not selected');
      setError('Lütfen PDF belgesi seçin');
      return;
    }

    if (targetStatus) {
      console.log('🚀 Calling handleStatusChange from PDF upload confirm');
      await handleStatusChange(targetStatus);
    } else {
      console.warn('⚠️ Target status is not set, cannot proceed');
    }
  };

  // Status change modal'ında onay butonuna basıldığında
  const onStatusChangeConfirm = () => {
    console.log('✅ Status change confirm clicked:', {
      targetStatus,
      note: note ? 'provided' : 'not provided',
      noteLength: note?.length || 0,
    });

    if (targetStatus) {
      console.log('🚀 Calling handleStatusChange from status change confirm');
      handleStatusChange(targetStatus);
    } else {
      console.warn('⚠️ Target status is not set, cannot proceed');
    }
  };

  // Rejection confirm
  const onRejectionConfirm = () => {
    console.log('✅ Rejection confirm clicked:', {
      targetStatus,
      hasRejectionReason: !!rejectionReason,
      rejectionReasonLength: rejectionReason?.length || 0,
      rejectionReasonTrimmed: rejectionReason?.trim() || '',
    });

    if (targetStatus && rejectionReason.trim()) {
      console.log('🚀 Calling handleStatusChange from rejection confirm');
      handleStatusChange(targetStatus, rejectionReason.trim());
    } else {
      if (!targetStatus) {
        console.warn('⚠️ Target status is not set');
      }
      if (!rejectionReason.trim()) {
        console.warn('⚠️ Rejection reason is empty or whitespace only');
      }
    }
  };

  // Branch Manager için izin verilen status geçişleri
  const canBranchManagerChangeStatus = (currentStatus: string, newStatus: string): boolean => {
    if (currentStatus === 'pending_branch_review') {
      return newStatus === 'active' || newStatus === 'rejected' || newStatus === 'pending_details';
    }
    return false;
  };

  // Mevcut kullanıcının status değiştirme yetkisi var mı?
  const canChangeStatus = (newStatus: string): boolean => {
    if (!user || !currentUser) return false;
    
    if (currentUser.role === 'admin') {
      return true; // Admin her şeyi yapabilir
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
                    {/* PDF Belgesi Link (Admin için) */}
                    {currentUser?.role === 'admin' && user.documentUrl && (
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
                {currentUser?.role === 'admin' && user && user.uid !== currentUser.uid && (
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
                {user && (currentUser?.role === 'admin' || currentUser?.role === 'branch_manager') && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 font-medium">Durum:</span>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(user.status)}`}>
                          {getStatusLabel(user.status)}
                        </span>
                        <span className="text-xs text-gray-400">→</span>
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              onStatusButtonClick(e.target.value);
                              e.target.value = '';
                            }
                          }}
                          disabled={updatingStatus || uploadingPdf}
                          className="text-xs border border-gray-300 rounded-md px-2.5 py-1 bg-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          defaultValue=""
                        >
                          <option value="">Durum Değiştir...</option>
                          {/* Branch Manager Seçenekleri */}
                          {currentUser?.role === 'branch_manager' && user.status === 'pending_branch_review' && (
                            <>
                              <option value="active">Onayla (Belge Yükle)</option>
                              <option value="rejected">Reddet</option>
                              <option value="pending_details">Veri Doldurmaya Geri Gönder</option>
                            </>
                          )}
                          {/* Admin Seçenekleri */}
                          {currentUser?.role === 'admin' && (
                            <>
                              {user.status !== 'active' && canChangeStatus('active') && (
                                <option value="active">Onayla (Aktif)</option>
                              )}
                              {user.status !== 'rejected' && canChangeStatus('rejected') && (
                                <option value="rejected">Reddet</option>
                              )}
                              {user.status !== 'pending_details' && canChangeStatus('pending_details') && (
                                <option value="pending_details">Detaylar Bekleniyor</option>
                              )}
                              {user.status !== 'pending_branch_review' && canChangeStatus('pending_branch_review') && (
                                <option value="pending_branch_review">Şube İncelemesi</option>
                              )}
                            </>
                          )}
                        </select>
                      </div>
                      {updatingStatus && (
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
                            
                            {/* Note - Sadece varsa göster, kompakt */}
                            {log.note && (
                              <div className="mt-1.5 text-xs text-gray-600 italic">
                                "{log.note}"
                              </div>
                            )}
                            
                            {/* PDF Link - Kompakt */}
                            {log.documentUrl && (
                              <a
                                href={log.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1.5 inline-flex items-center gap-1 text-xs text-slate-700 hover:text-slate-800"
                              >
                                <File className="w-3 h-3" />
                                <span>PDF Görüntüle</span>
                              </a>
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

          {/* Rejection Reason Modal */}
          {showRejectionModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reddetme Nedeni</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Kullanıcıyı reddetmek için bir neden belirtmeniz gerekmektedir.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reddetme Nedeni <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Reddetme nedenini yazın..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                      rows={4}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowRejectionModal(false);
                      setRejectionReason('');
                      setNote('');
                      setTargetStatus(null);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={onRejectionConfirm}
                    disabled={!rejectionReason.trim() || updatingStatus}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Reddet
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PDF Upload Modal */}
          {showPdfUploadModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <File className="w-5 h-5 text-slate-700" />
                  PDF Belgesi Yükle <span className="text-red-500">*</span>
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Admin onayına göndermek için PDF belgesi yüklemek zorunludur.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Belge Seç (PDF) <span className="text-red-500">* Zorunlu</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <Upload className="w-4 h-4" />
                        <span>{uploadingPdf ? 'Yükleniyor...' : 'Dosya Seç'}</span>
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          disabled={uploadingPdf}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && file.type === 'application/pdf') {
                              setPdfFile(file);
                              setPdfUrl(null);
                              setError(null);
                            } else {
                              setError('Lütfen geçerli bir PDF dosyası seçin');
                              setPdfFile(null);
                            }
                          }}
                        />
                      </label>
                      {pdfFile && (
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                          <File className="w-4 h-4" />
                          {pdfFile.name}
                        </span>
                      )}
                    </div>
                    {!pdfFile && (
                      <p className="text-xs text-red-500 mt-2">
                        Lütfen PDF belgesi seçin
                      </p>
                    )}
                  </div>
                  
                  {/* Note input ekle */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Not (Opsiyonel)
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="İşlem hakkında not ekleyin..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowPdfUploadModal(false);
                      setPdfFile(null);
                      setPdfUrl(null);
                      setTargetStatus(null);
                      setNote('');
                      setError(null);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={onPdfUploadConfirm}
                    disabled={!pdfFile || updatingStatus || uploadingPdf}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {uploadingPdf ? 'Yükleniyor...' : 'Yükle ve Gönder'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Status Change Modal */}
          {showStatusChangeModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Durum Değiştir</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Durumu <strong>{targetStatus && getStatusLabel(targetStatus)}</strong> olarak değiştirmek üzeresiniz.
                </p>
                
                {/* Note input ekle */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Not (Opsiyonel)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="İşlem hakkında not ekleyin..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowStatusChangeModal(false);
                      setTargetStatus(null);
                      setNote('');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={onStatusChangeConfirm}
                    disabled={updatingStatus}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Onayla
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

