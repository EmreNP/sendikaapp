import { X, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Evet',
  cancelText = 'İptal',
  onConfirm,
  onCancel,
  variant = 'warning',
}: ConfirmModalProps) {
  useEffect(() => {
    if (isOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onCancel();
        }
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const variantColors = {
    danger: 'text-red-600 bg-red-50',
    warning: 'text-yellow-600 bg-yellow-50',
    info: 'text-blue-600 bg-blue-50',
  };

  const confirmButtonColors = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-blue-600 hover:bg-blue-700',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-start justify-between p-6 border-b">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${variantColors[variant]}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-700 whitespace-pre-line">{message}</p>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
            }}
            className={`px-4 py-2 text-white rounded-lg transition-colors ${confirmButtonColors[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
