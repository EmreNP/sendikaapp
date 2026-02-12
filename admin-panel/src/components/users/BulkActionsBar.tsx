import React from 'react';

interface BulkActionsBarProps {
  selectedCount: number;
  userRole?: string;
  processing: boolean;
  onBulkDelete: () => void;
  onBulkDeactivate: () => void;
  onBulkActivate: () => void;
  onClearSelection: () => void;
}

const BulkActionsBar = React.memo(function BulkActionsBar({
  selectedCount,
  userRole,
  processing,
  onBulkDelete,
  onBulkDeactivate,
  onBulkActivate,
  onClearSelection,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  const isAdminOrSuper = userRole === 'admin' || userRole === 'superadmin';

  return (
    <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
      <span className="text-sm text-gray-600 mr-2">
        {selectedCount} seçili
      </span>
      {isAdminOrSuper && (
        <button
          onClick={onBulkDelete}
          disabled={processing}
          className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          Sil
        </button>
      )}
      <button
        onClick={onBulkDeactivate}
        disabled={processing}
        className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
      >
        Deaktif Et
      </button>
      <button
        onClick={onBulkActivate}
        disabled={processing}
        className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
      >
        Aktif Et
      </button>
      <button
        onClick={onClearSelection}
        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
      >
        Temizle
      </button>
    </div>
  );
});

export default BulkActionsBar;
