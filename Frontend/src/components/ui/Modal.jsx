import React, { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';

const SIZE_CLASSES = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  full: 'max-w-[min(96vw,72rem)]',
};

/**
 * Shared modal — soft depth, rounded-3xl, focus trap basics via Escape + backdrop.
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className = '',
  showClose = true,
}) => {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
    >
      <button
        type="button"
        className="absolute inset-0 bg-neutral-950/45 backdrop-blur-sm border-0 cursor-default"
        aria-label="Close dialog"
        onClick={onClose}
      />

      <div
        className={[
          'relative z-10 w-full bg-white shadow-xl flex flex-col max-h-[92dvh]',
          'rounded-t-3xl sm:rounded-3xl border border-neutral-100',
          'animate-fade-in',
          SIZE_CLASSES[size] || SIZE_CLASSES.md,
          className,
        ].join(' ')}
      >
        {(title || showClose) && (
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-neutral-100 shrink-0">
            {title ? (
              <h2 id={titleId} className="text-lg font-bold text-neutral-900 truncate">
                {title}
              </h2>
            ) : (
              <span />
            )}
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 transition-colors"
                aria-label="Close"
              >
                <FiX className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        <div className="p-5 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="px-5 py-4 border-t border-neutral-100 shrink-0 bg-neutral-25/80">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
