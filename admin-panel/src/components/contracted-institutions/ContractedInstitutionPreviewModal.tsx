import { useState, useEffect } from 'react';
import { X, Building2, Calendar, User as UserIcon, Eye, EyeOff, Tag, Award } from 'lucide-react';
import type { ContractedInstitution, InstitutionCategory } from '@/types/contracted-institution';
import { authService } from '@/services/auth/authService';
import type { User } from '@/types/user';
import { formatDate } from '@/utils/dateFormatter';

interface ContractedInstitutionPreviewModalProps {
  institution: ContractedInstitution | null;
  isOpen: boolean;
  onClose: () => void;
  categories: InstitutionCategory[];
}

export default function ContractedInstitutionPreviewModal({ 
  institution, 
  isOpen, 
  onClose,
  categories 
}: ContractedInstitutionPreviewModalProps) {
  const [createdByUser, setCreatedByUser] = useState<User | null>(null);

  const getCategoryName = (categoryId: string | undefined): string => {
    if (!categoryId) return '-';
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || institution?.categoryName || categoryId;
  };

  useEffect(() => {
    if (institution?.createdBy) {
      authService.getUserData(institution.createdBy)
        .then((user) => {
          if (user) {
            setCreatedByUser(user);
          } else {
            setCreatedByUser({
              firstName: 'Silinmiş',
              lastName: 'Kullanıcı',
              email: '',
              role: '',
              status: 'deleted',
              isActive: false,
            } as any);
          }
        })
        .catch(() => {
          setCreatedByUser({
            firstName: 'Silinmiş',
            lastName: 'Kullanıcı',
            email: '',
            role: '',
            status: 'deleted',
            isActive: false,
          } as any);
        });
    }
  }, [institution?.createdBy]);

  if (!isOpen || !institution) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Kurum Önizleme
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Cover Image */}
            {institution.coverImageUrl && (
              <div className="relative">
                <img
                  src={institution.coverImageUrl}
                  alt={institution.title}
                  className="w-full h-56 object-cover rounded-lg"
                />
                {/* Badge overlay */}
                <div className="absolute bottom-3 right-3 bg-blue-600 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                  {institution.badgeText}
                </div>
                {/* Category overlay */}
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                  {getCategoryName(institution.categoryId)}
                </div>
              </div>
            )}

            {/* Logo + Title */}
            <div className="flex items-start gap-4">
              {institution.logoUrl && (
                <img
                  src={institution.logoUrl}
                  alt={`${institution.title} logo`}
                  className="w-16 h-16 object-contain rounded-lg border border-gray-200"
                />
              )}
              <div>
                <h3 className="text-xl font-bold text-gray-900">{institution.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    institution.isPublished 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {institution.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {institution.isPublished ? 'Yayında' : 'Taslak'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    <Tag className="w-3 h-3" />
                    {getCategoryName(institution.categoryId)}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    <Award className="w-3 h-3" />
                    {institution.badgeText}
                  </span>
                </div>
              </div>
            </div>

            {/* Anlaşma Detayları */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Anlaşma Detayları</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{institution.description}</p>
              </div>
            </div>

            {/* Nasıl Yararlanırım */}
            {institution.howToUseSteps && institution.howToUseSteps.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Nasıl Yararlanırım?</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  {institution.howToUseSteps.map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {step.stepNumber}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{step.title}</p>
                        <p className="text-sm text-gray-600 mt-0.5">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meta Information */}
            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Oluşturulma: {formatDate(institution.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Güncellenme: {formatDate(institution.updatedAt)}</span>
                </div>
                {createdByUser && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <UserIcon className="w-4 h-4" />
                    <span>Oluşturan: {createdByUser.firstName} {createdByUser.lastName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-500">
                  <span>Sıra: #{institution.order}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
