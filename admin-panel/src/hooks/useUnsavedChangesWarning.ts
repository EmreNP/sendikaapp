import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook to detect unsaved changes and warn before closing modal
 * @param hasChanges Whether there are unsaved changes
 * @param onClose Modal close callback
 * @returns Object with close handler and confirmation modal state
 */
export function useUnsavedChangesWarning(
  hasChanges: boolean,
  onClose: () => void
) {
  const hasChangesRef = useRef(hasChanges);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    hasChangesRef.current = hasChanges;
  }, [hasChanges]);

  const handleClose = useCallback(() => {
    if (hasChangesRef.current) {
      setShowConfirm(true);
    } else {
      onClose();
    }
  }, [onClose]);

  const handleConfirmClose = useCallback(() => {
    setShowConfirm(false);
    onClose();
  }, [onClose]);

  const handleCancelClose = useCallback(() => {
    setShowConfirm(false);
  }, []);

  return {
    handleClose,
    showConfirm,
    handleConfirmClose,
    handleCancelClose,
  };
}
