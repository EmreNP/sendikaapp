import { useEffect, useState } from 'react';
import { X, Building2, MapPin, Phone, Mail, Clock, Calendar, Users, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { apiRequest } from '@/utils/api';
import { formatDate } from '@/utils/dateFormatter';

interface Branch {
  id: string;
  name: string;
  desc?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  phone?: string;
  email?: string;
  workingHours?: {
    weekday?: string;
    saturday?: string;
    sunday?: string;
  };
  isActive: boolean;
  eventCount?: number;
  educationCount?: number;
  managers?: Array<{
    uid: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface BranchDetailModalProps {
  branchId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function BranchDetailModal({ branchId, isOpen, onClose }: BranchDetailModalProps) {
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && branchId) {
      fetchBranchDetails();
    } else {
      setBranch(null);
      setError(null);
    }
  }, [isOpen, branchId]);

  const fetchBranchDetails = async () => {
    if (!branchId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiRequest<{ branch: Branch }>(`/api/branches/${branchId}`);
      setBranch(data.branch);
    } catch (err: any) {
      console.error('Error fetching branch details:', err);
      setError(err.message || 'Şube detayları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const openAddressInMaps = () => {
    if (!branch?.location) return;
    
    const { latitude, longitude } = branch.location;
    window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
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
        <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200 bg-slate-700">
            <h2 className="text-sm font-medium text-white">
              Şube Detayları
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Yükleniyor...</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            ) : branch ? (
              <div className="space-y-6">
                {/* Şube Adı ve Durum */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{branch.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {branch.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            <XCircle className="w-3 h-3" />
                            Pasif
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Açıklama */}
                {branch.desc && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Açıklama
                    </label>
                    <p className="text-gray-900 bg-gray-50 rounded-lg p-3">
                      {branch.desc}
                    </p>
                  </div>
                )}

                {/* İletişim Bilgileri */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Adres */}
                  {branch.address && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Adres
                        {branch.location && (
                          <button
                            onClick={openAddressInMaps}
                            className="ml-2 text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                            title="Haritada aç"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Haritada göster
                          </button>
                        )}
                      </label>
                      <div className="text-gray-900 bg-gray-50 rounded-lg p-3">
                        {branch.address}
                        {branch.location && (
                          <p className="text-xs text-gray-500 mt-1">
                            Koordinat: {branch.location.latitude.toFixed(6)}, {branch.location.longitude.toFixed(6)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Telefon */}
                  {branch.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        Telefon
                      </label>
                      <p className="text-gray-900 bg-gray-50 rounded-lg p-3">
                        {branch.phone}
                      </p>
                    </div>
                  )}

                  {/* E-posta */}
                  {branch.email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        E-posta
                      </label>
                      <p className="text-gray-900 bg-gray-50 rounded-lg p-3">
                        <a href={`mailto:${branch.email}`} className="text-blue-600 hover:text-blue-800">
                          {branch.email}
                        </a>
                      </p>
                    </div>
                  )}
                </div>

                {/* Çalışma Saatleri */}
                {branch.workingHours && (
                  (branch.workingHours.weekday || branch.workingHours.saturday || branch.workingHours.sunday) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Çalışma Saatleri
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {branch.workingHours.weekday && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs font-medium text-gray-600 mb-1">Hafta İçi</div>
                            <div className="text-gray-900">{branch.workingHours.weekday}</div>
                          </div>
                        )}
                        {branch.workingHours.saturday && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs font-medium text-gray-600 mb-1">Cumartesi</div>
                            <div className="text-gray-900">{branch.workingHours.saturday}</div>
                          </div>
                        )}
                        {branch.workingHours.sunday && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs font-medium text-gray-600 mb-1">Pazar</div>
                            <div className="text-gray-900">{branch.workingHours.sunday}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}

                {/* İstatistikler */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-blue-900 mb-1">Etkinlik Sayısı</div>
                    <div className="text-2xl font-bold text-blue-600">{branch.eventCount ?? 0}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-green-900 mb-1">Eğitim Sayısı</div>
                    <div className="text-2xl font-bold text-green-600">{branch.educationCount ?? 0}</div>
                  </div>
                </div>

                {/* Manager'lar */}
                {branch.managers && branch.managers.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Şube Yöneticileri ({branch.managers.length})
                    </label>
                    <div className="space-y-2">
                      {branch.managers.map((manager) => (
                        <div key={manager.uid} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">
                                {manager.firstName} {manager.lastName}
                              </div>
                              <div className="text-sm text-gray-600">{manager.email}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tarih Bilgileri */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Oluşturulma Tarihi
                    </label>
                    <p className="text-gray-900 bg-gray-50 rounded-lg p-3">
                      {formatDate(branch.createdAt)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Son Güncelleme
                    </label>
                    <p className="text-gray-900 bg-gray-50 rounded-lg p-3">
                      {formatDate(branch.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

