import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  closeOnBackdropClick?: boolean;
  bare?: boolean;
  className?: string;
  portal?: boolean;
  zIndex?: number;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  children,
  closeOnBackdropClick = false,
  bare = false,
  className,
  portal = false,
  zIndex = 50,
}) => {
  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          style={{ zIndex }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={closeOnBackdropClick ? onClose : undefined}
        >
          {bare ? (
            children
          ) : (
            <motion.div
              className={cn('bg-card rounded-2xl shadow-2xl p-6 max-w-md w-full', className)}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return portal ? createPortal(content, document.body) : content;
};
