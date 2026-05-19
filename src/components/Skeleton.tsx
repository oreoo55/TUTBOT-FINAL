import React from 'react';
import { motion } from 'framer-motion';

export const Skeleton = React.memo(function Skeleton({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
      className={`bg-sand/50 dark:bg-slate-border/50 rounded-xl ${className}`}
    />
  );
});

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-card rounded-[24px] overflow-hidden border border-sand dark:border-slate-border">
      <Skeleton className="h-48 w-full !rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="pt-4 border-t border-sand dark:border-slate-border flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
