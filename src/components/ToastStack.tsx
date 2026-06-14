import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Bookmark, Check, X, RotateCcw } from 'lucide-react';
import { useUserCollections } from '../contexts/UserCollectionsContext';
export function ToastStack() {
  const { toasts, toggleFavorite, toggleWishlist } = useUserCollections();
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isRemove = toast.type.endsWith('remove');
          const isFavorite = toast.type.startsWith('favorite');
          return (
            <motion.div
              key={toast.id}
              initial={{
                opacity: 0,
                x: 60,
                scale: 0.9
              }}
              animate={{
                opacity: 1,
                x: 0,
                scale: 1
              }}
              exit={{
                opacity: 0,
                x: 60,
                scale: 0.9
              }}
              transition={{
                type: 'spring',
                damping: 25,
                stiffness: 300
              }}
              className="bg-white dark:bg-slate-card border border-sand dark:border-slate-border rounded-2xl shadow-soft dark:shadow-soft-dark px-4 py-3 flex items-center gap-3 min-w-[240px] pointer-events-auto">
              
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isRemove ? 'bg-navy/10 dark:bg-slate-border text-navy/60 dark:text-slate-300' : isFavorite ? 'bg-red-50 dark:bg-red-500/10 text-red-500' : 'bg-gold/10 text-gold'}`}>
                
                {isRemove ?
                <X className="w-4 h-4" /> :
                isFavorite ?
                <Heart className="w-4 h-4 fill-current" /> :

                <Bookmark className="w-4 h-4 fill-current" />
                }
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-navy dark:text-slate-100">
                  {toast.text}
                </p>
                <p className="text-xs text-navy/50 dark:text-slate-400">
                  Synced to your profile
                </p>
              </div>
              {!isRemove &&
              <Check className="w-4 h-4 text-green-500 shrink-0" />
              }
              {isRemove && toast.landmark &&
              <button
                onClick={() => {
                  if (isFavorite) toggleFavorite(toast.landmark!);else
                  toggleWishlist(toast.landmark!);
                }}
                className="ml-2 flex items-center gap-1 text-xs font-bold text-royal dark:text-gold hover:underline bg-royal/5 dark:bg-gold/10 px-2 py-1 rounded-md transition-colors">
                
                  <RotateCcw className="w-3 h-3" /> Undo
                </button>
              }
            </motion.div>);

        })}
      </AnimatePresence>
    </div>);

}