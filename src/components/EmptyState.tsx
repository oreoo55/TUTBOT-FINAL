import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export const EmptyState = React.memo(function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full py-16 text-center bg-sand/20 dark:bg-slate-border/40 rounded-[24px] border border-dashed border-sand dark:border-slate-border"
    >
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-card mx-auto mb-4 flex items-center justify-center shadow-sm border border-sand dark:border-slate-border">
          <Icon className="w-7 h-7 text-navy/40 dark:text-slate-400" />
        </div>
      )}
      <p className="text-navy/60 dark:text-slate-400 font-medium">{title}</p>
      {description && (
        <p className="text-sm text-navy/40 dark:text-slate-500 mt-1 max-w-sm mx-auto">{description}</p>
      )}
      {action && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={action.onClick}
          className="mt-5 bg-gold text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-gold/90 transition-colors"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
});
