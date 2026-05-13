import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmDanger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmDanger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-navy/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-card rounded-[30px] shadow-2xl w-full max-w-sm p-6 text-center"
          >
            <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${confirmDanger ? 'bg-red-50 dark:bg-red-500/10' : 'bg-gold/10'}`}>
              {confirmDanger ? (
                <AlertTriangle className="w-7 h-7 text-red-500" />
              ) : (
                <AlertTriangle className="w-7 h-7 text-gold" />
              )}
            </div>
            <h3 className="text-xl font-serif font-bold text-navy dark:text-slate-100 mb-2">
              {title}
            </h3>
            <p className="text-sm text-navy/60 dark:text-slate-400 mb-6">
              {message}
            </p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={loading}
                className="flex-1 px-5 py-3 border-2 border-sand dark:border-slate-border rounded-xl font-medium text-navy dark:text-slate-100 hover:bg-sand/30 dark:hover:bg-slate-border transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 px-5 py-3 rounded-xl font-medium text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                  confirmDanger
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-gold hover:bg-gold/90'
                }`}
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {confirmLabel}
              </button>
            </div>
            <button
              onClick={onCancel}
              className="mt-4 text-xs text-navy/40 dark:text-slate-500 hover:text-navy/60 dark:hover:text-slate-400 transition-colors"
            >
              <X className="w-4 h-4 inline" /> Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
