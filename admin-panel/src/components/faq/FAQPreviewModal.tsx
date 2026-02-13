import { useState, useEffect } from 'react';
import { X, HelpCircle, Calendar, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import type { FAQ } from '@/types/faq';
import { authService } from '@/services/auth/authService';
import type { User } from '@/types/user';
import { formatDate } from '@/utils/dateFormatter';

interface FAQPreviewModalProps {
  faq: FAQ | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function FAQPreviewModal({ faq, isOpen, onClose }: FAQPreviewModalProps) {
  const [createdByUser, setCreatedByUser] = useState<User | null>(null);

  useEffect(() => {
    if (faq?.createdBy) {
      authService.getUserData(faq.createdBy)
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
  }, [faq?.createdBy]);

  if (!isOpen || !faq) return null;

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
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-white" />
              <h2 className="text-sm font-medium text-white">FAQ Önizleme</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Soru */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{faq.question}</h1>

            {/* Meta Bilgiler */}
            <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Oluşturulma: {formatDate(faq.createdAt)}</span>
              </div>
              {createdByUser && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <UserIcon className="w-4 h-4" />
                  <span>Oluşturan: {createdByUser.firstName} {createdByUser.lastName}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                {faq.isPublished ? (
                  <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800 flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    Yayında
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700 flex items-center gap-1">
                    <EyeOff className="w-3 h-3" />
                    Taslak
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600">
                Sıralama: <span className="font-medium">{faq.order}</span>
              </div>
            </div>

            {/* Cevap */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Cevap:</h3>
              <div className="text-gray-700 whitespace-pre-wrap">
                {faq.answer || ''}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

