'use client';

import React, { useId, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useDialogA11y } from '../../utils/useDialogA11y';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  /** Deskripsi tambahan yang dibacakan pembaca layar setelah judul. */
  description?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  description,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const titleId = title ? `${generatedId}-title` : undefined;
  const descriptionId = description ? `${generatedId}-description` : undefined;

  // Escape, jebakan fokus, kunci gulir, dan pengembalian fokus.
  useDialogA11y(isOpen, onClose, panelRef);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[90vh] focus:outline-none',
              className
            )}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-foreground/5">
                <h2 id={titleId} className="text-lg font-semibold text-foreground">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Tutup dialog"
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            )}
            <div
              id={descriptionId}
              className="p-6 overflow-y-auto flex-1 text-muted-foreground"
            >
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
