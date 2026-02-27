import { useEffect } from 'react';

/**
 * Hook that calls the provided callback when the Escape key is pressed.
 * Useful for closing modals, drawers, or popups with keyboard.
 *
 * @param isActive  - Only listen when this is true (e.g., modal isOpen)
 * @param onEscape  - Callback to invoke on Escape key
 */
export function useEscapeKey(isActive: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onEscape();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onEscape]);
}
