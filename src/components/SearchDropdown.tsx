import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, ArrowRight, Tag, Star } from 'lucide-react';
import { landmarks } from '../data/mockData';
export type SearchScope = 'all' | 'name' | 'region' | 'category';
interface SearchDropdownProps {
  query: string;
  scope?: SearchScope;
  /**
   * Whether the dropdown should currently render. Parent controls this so it
   * can close on blur/escape from outside.
   */
  open: boolean;
  onClose: () => void;
  /**
   * Called when the user picks "See all results" or hits enter on the input.
   * Parent can either intercept this or fall back to default /discover nav.
   */
  onSubmit?: (query: string) => void;
  /**
   * Visual tone — Landing uses a glassy panel on a light hero, NotFound uses
   * a softer surface. Both fall back to a sensible default.
   */
  align?: 'left' | 'center';
}
const MAX_RESULTS = 6;
export function SearchDropdown({
  query,
  scope = 'all',
  open,
  onClose,
  onSubmit,
}: SearchDropdownProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];
    return landmarks.
    filter((l) => {
      const matchName = l.name.toLowerCase().includes(q);
      const matchRegion = l.region.toLowerCase().includes(q);
      const matchCategory = l.category.toLowerCase().includes(q);
      const matchCity = (l.city || '').toLowerCase().includes(q);
      const matchArea = (l.area || '').toLowerCase().includes(q);
      const matchEra = (l.era || '').toLowerCase().includes(q);
      if (scope === 'name') return matchName;
      if (scope === 'region') return matchRegion || matchCity || matchArea;
      if (scope === 'category') return matchCategory;
      return (
        matchName ||
        matchRegion ||
        matchCategory ||
        matchCity ||
        matchArea ||
        matchEra);

    }).
    slice(0, MAX_RESULTS);
  }, [query, scope]);
  // Reset highlight when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [query, scope]);
  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
      containerRef.current &&
      !containerRef.current.contains(e.target as Node))
      {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);
  // Keyboard navigation — listens globally while open so it works regardless
  // of which input field has focus.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(results.length, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        if (activeIndex < results.length) {
          e.preventDefault();
          const picked = results[activeIndex];
          if (picked) {
            navigate(`/landmark/${picked.id}`);
            onClose();
          }
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, results, activeIndex, navigate, onClose]);
  if (!open || query.trim().length < 1) return null;
  const submit = () => {
    const q = query.trim();
    if (!q) return;
    if (onSubmit) {
      onSubmit(q);
    } else {
      navigate(`/discover?q=${encodeURIComponent(q)}`);
    }
    onClose();
  };
  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{
          opacity: 0,
          y: -6
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        exit={{
          opacity: 0,
          y: -6
        }}
        transition={{
          duration: 0.15
        }}
        className={`absolute top-full left-0 right-0 z-50 mt-2 w-full bg-white dark:bg-slate-card border border-sand dark:border-slate-border rounded-2xl shadow-2xl overflow-hidden`}
        role="listbox">
        
        {results.length === 0 ?
        <div className="px-5 py-6 text-center">
            <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-sand/40 dark:bg-slate-border flex items-center justify-center">
              <Search className="w-4 h-4 text-navy/40 dark:text-slate-400" />
            </div>
            <p className="text-sm text-navy/70 dark:text-slate-300">
              No matches for{' '}
              <span className="font-semibold text-navy dark:text-slate-100">
                "{query}"
              </span>
            </p>
            <p className="text-xs text-navy/50 dark:text-slate-400 mt-1">
              Try a different name, region, or category.
            </p>
          </div> :

        <>
            <div className="max-h-[360px] overflow-y-auto py-2">
              {results.map((l, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={l.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => {
                    navigate(`/landmark/${l.id}`);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isActive ? 'bg-sand/40 dark:bg-slate-border/60' : 'hover:bg-sand/30 dark:hover:bg-slate-border/40'}`}>
                  
                    <img
                    src={l.image}
                    alt={l.name}
                    onError={(e) => {
                      const img = e.currentTarget;
                      const fb = (l as any).fallbackImage;
                      if (fb && img.src !== fb) img.src = fb;
                    }}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy dark:text-slate-100 truncate">
                        <HighlightMatch text={l.name} query={query} />
                      </p>
                      <p className="flex items-center gap-1 text-xs text-navy/60 dark:text-slate-400 truncate">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <HighlightMatch text={l.region} query={query} />
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-royal/10 dark:bg-gold/10 text-royal dark:text-gold px-2 py-0.5 rounded">
                        <Tag className="w-2.5 h-2.5" />
                        {l.category}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-navy/60 dark:text-slate-400">
                        <Star className="w-2.5 h-2.5 fill-gold text-gold" />
                        {l.rating}
                      </span>
                    </div>
                  </button>);

            })}
            </div>
            <button
            type="button"
            onClick={submit}
            className={`w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium border-t border-sand dark:border-slate-border transition-colors ${activeIndex === results.length ? 'bg-gold/10 dark:bg-gold/20 text-gold' : 'text-royal dark:text-gold hover:bg-gold/5 dark:hover:bg-gold/10'}`}
            onMouseEnter={() => setActiveIndex(results.length)}>
            
              <span>
                See all results for <span className="font-bold">"{query}"</span>
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        }
      </motion.div>
    </AnimatePresence>);

}
function HighlightMatch({ text, query }: {text: string;query: string;}) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="bg-gold/20 text-navy dark:text-slate-100 rounded px-0.5">
        {text.slice(idx, idx + q.length)}
      </span>
      {text.slice(idx + q.length)}
    </>);

}