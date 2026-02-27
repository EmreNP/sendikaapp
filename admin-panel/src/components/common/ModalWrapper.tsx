import { useEffect, useRef, type ReactNode } from 'react';

interface ModalWrapperProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when the modal should close (Escape key, backdrop click) */
  onClose: () => void;
  /** Modal title for aria-labelledby */
  title: string;
  /** Optional modal description for aria-describedby */
  description?: string;
  /** Content inside the modal */
  children: ReactNode;
  /** Max width class (default: max-w-2xl) */
  maxWidth?: string;
  /** Additional class for the content container */
  contentClassName?: string;
  /** ID for the title element (auto-generated if not provided) */
  titleId?: string;
}

/**
 * Accessible Modal Wrapper
 * 
 * Provides:
 * - role="dialog" with aria-modal="true"
 * - aria-labelledby pointing to the modal title
 * - Focus trap: Tab/Shift+Tab cycles within the modal
 * - Escape key closes the modal
 * - Focus returns to the previously focused element on close
 * - Backdrop click closes the modal
 * - Prevents background scroll when open
 */
export default function ModalWrapper({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-2xl',
  contentClassName = '',
  titleId,
}: ModalWrapperProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const resolvedTitleId = titleId || `modal-title-${title.replace(/\s+/g, '-').toLowerCase()}`;

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap + focus management
  useEffect(() => {
    if (!isOpen) return;

    // Save the previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Prevent background scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Move focus into the modal
    const timer = setTimeout(() => {
      if (modalRef.current) {
        const focusable = getFocusableElements(modalRef.current);
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          modalRef.current.focus();
        }
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      // Return focus to the previously focused element
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  // Focus trap: Tab/Shift+Tab cycles within the modal
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusable = getFocusableElements(modalRef.current);
      if (focusable.length === 0) return;

      const firstFocusable = focusable[0];
      const lastFocusable = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: if focus is on first element, wrap to last
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab: if focus is on last element, wrap to first
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal positioning */}
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Modal dialog */}
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={resolvedTitleId}
          tabIndex={-1}
          className={`relative bg-white rounded-xl shadow-xl ${maxWidth} w-full max-h-[90vh] overflow-y-auto ${contentClassName}`}
        >
          {/* Hidden title for screen readers (the visual title is rendered by the children) */}
          <span id={resolvedTitleId} className="sr-only">
            {title}
          </span>
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(elements).filter(
    el => !el.hasAttribute('aria-hidden') && el.offsetParent !== null
  );
}
