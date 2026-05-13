import React, { useEffect, useMemo, useState, useRef, Component } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Compass,
  Shield,
  Sparkles,
  ArrowRight,
  Bot,
  Star,
  ChevronDown,
  Check,
  Landmark,
  Building2,
  Church,
  Trees,
  Theater,
  MapPin } from
'lucide-react';

import { LandmarkCard } from '../components/LandmarkCard';
import { SearchDropdown, SearchScope } from '../components/SearchDropdown';
import { api } from '../lib/api';
export function Landing() {
  const navigate = useNavigate();
  const [searchTab, setSearchTab] = useState<
    'Name' | 'Governorate' | 'Category'>(
    'Name');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [topLandmarks, setTopLandmarks] = useState<any[]>([]);
  const [wallReviews, setWallReviews] = useState<any[]>([]);
  const [allLandmarks, setAllLandmarks] = useState<any[]>([]);
  const governorates = useMemo(() =>
    Array.from(new Set(allLandmarks.map((l: any) => l.region))).sort(),
    [allLandmarks]
  );
  useEffect(() => {
    api.get<any>('/landmarks?sort=rating&per_page=100').then(res => {
      const items = res.data || [];
      setAllLandmarks(items);
      const sorted = [...items].sort((a: any, b: any) => b.rating - a.rating || (b.reviews_count ?? 0) - (a.reviews_count ?? 0));
      setTopLandmarks(sorted.slice(0, 3));
    }).catch(() => {});
  }, []);
  useEffect(() => {
    api.get<any>('/reviews/random').then(res => {
      setWallReviews(res.data || []);
    }).catch(() => {});
  }, []);
  const scope: SearchScope =
  searchTab === 'Name' ?
  'name' :
  searchTab === 'Governorate' ?
  'region' :
  'category';
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/discover?q=${encodeURIComponent(q)}&type=${scope}`);
  };
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6">
        {/* Background elements */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-sand/30 to-offwhite dark:from-midnight/60 dark:to-midnight z-10" />
          <motion.div
            initial={{
              opacity: 0,
              scale: 1.1
            }}
            animate={{
              opacity: 1,
              scale: 1
            }}
            transition={{
              duration: 1.5
            }}
            className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1572252009286-268acec5ca0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-20 mix-blend-multiply" />
          
          {/* Decorative floating shapes */}
          <motion.div
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, 0]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="absolute top-1/4 left-10 w-32 h-32 bg-gold/10 rounded-full blur-3xl" />
          
          <motion.div
            animate={{
              y: [0, 30, 0],
              rotate: [0, -5, 0]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="absolute bottom-1/4 right-10 w-48 h-48 bg-royal/10 rounded-full blur-3xl" />
          
        </div>

        <div className="relative z-20 max-w-4xl mx-auto text-center mt-10">
          <motion.h1
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              duration: 0.8
            }}
            className="text-5xl md:text-7xl font-serif font-bold text-navy dark:text-slate-100 mb-6 leading-tight text-balance">
            
            Discover the Timeless <br />
            <span className="text-royal dark:text-gold">Magic of Egypt</span>
          </motion.h1>

          <motion.p
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              duration: 0.8,
              delay: 0.2
            }}
            className="text-lg md:text-xl text-navy/70 dark:text-slate-300 mb-12 max-w-2xl mx-auto">
            
            Experience archaeological wonders, religious sanctuaries, and
            breathtaking recreational escapes with our intelligent travel
            companion.
          </motion.p>

          {/* Search Hub */}
          <motion.div
            initial={{
              opacity: 0,
              y: 30
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              duration: 0.8,
              delay: 0.4
            }}
            className="glass rounded-[30px] p-4 max-w-3xl mx-auto shadow-2xl border border-white/50 relative">
            
            <div className="flex gap-2 mb-4 px-2">
              {(['Name', 'Governorate', 'Category'] as const).map((tab) =>
              <button
                key={tab}
                onClick={() => {
                  setSearchTab(tab);
                  setSearchQuery('');
                }}
                className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${searchTab === tab ? 'bg-royal text-white shadow-md' : 'text-navy/60 dark:text-slate-300 hover:bg-royal/5 dark:hover:bg-gold/10'}`}>
                
                  {tab}
                </button>
              )}
            </div>

            <form
              onSubmit={handleSearch}
              className="relative flex items-center"
              autoComplete="off">
              
              <Search className="absolute left-4 w-5 h-5 text-navy/40 dark:text-slate-400 z-10" />

              {searchTab === 'Category' ?
              <CategoryDropdown
                value={searchQuery}
                onChange={setSearchQuery} /> :

              searchTab === 'Governorate' ?
              <GovernorateDropdown
                value={searchQuery}
                onChange={setSearchQuery}
                governorates={governorates} /> :


              <input
                type="text"
                placeholder={`Search by ${searchTab.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                aria-label={`Search by ${searchTab.toLowerCase()}`}
                className="w-full bg-white/50 dark:bg-slate-card/40 border border-sand dark:border-slate-border rounded-2xl py-4 pl-12 pr-32 focus:outline-none focus:ring-2 focus:ring-gold/50 text-navy dark:text-slate-100 placeholder:text-navy/40 dark:placeholder:text-slate-400" />

              }

              <button
                type="submit"
                className="absolute right-2 bg-gold text-white px-6 py-2.5 rounded-xl font-medium hover:bg-gold/90 transition-colors shadow-glow">
                
                Explore
              </button>

              {searchTab === 'Name' &&
              <SearchDropdown
                query={searchQuery}
                scope={scope}
                open={searchFocused && searchQuery.trim().length > 0}
                onClose={() => setSearchFocused(false)}
                onSubmit={(q) =>
                navigate(
                  `/discover?q=${encodeURIComponent(q)}&type=${scope}`
                )
                } />

              }
            </form>
          </motion.div>
        </div>
      </section>

      {/* Top Destinations */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-4xl font-serif font-bold mb-2 text-navy dark:text-gold">
              Top Destinations
            </h2>
            <p className="text-navy/70 dark:text-slate-300">
              Explore our most popular Egyptian landmarks
            </p>
          </div>
          <Link
            to="/discover"
            className="hidden md:flex items-center gap-2 text-royal font-medium hover:text-gold transition-colors">
            
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {topLandmarks.slice(0, 3).map((landmark, idx) =>
          <motion.div
            key={landmark.id}
            initial={{
              opacity: 0,
              y: 20
            }}
            whileInView={{
              opacity: 1,
              y: 0
            }}
            viewport={{
              once: true
            }}
            transition={{
              delay: idx * 0.1
            }}>
            
              <LandmarkCard landmark={landmark} variant="tall" />
            </motion.div>
          )}
        </div>
      </section>

      {/* Why Tutbot */}
      <section className="py-20 bg-sand/30 dark:bg-slate-card/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold mb-4 text-navy dark:text-gold">
              Why Choose TUTBOT
            </h2>
            <p className="max-w-2xl mx-auto text-navy/70 dark:text-slate-300">
              We combine modern technology with ancient wonders to provide an
              unparalleled travel experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
            {
              icon: Bot,
              title: 'AI Assistant',
              desc: 'Smart recommendations tailored to your budget and interests.'
            },
            {
              icon: Compass,
              title: '360° Previews',
              desc: 'Explore landmarks virtually before you book your trip.'
            },
            {
              icon: Shield,
              title: 'Secure Booking',
              desc: 'Trusted platform for all your Egyptian travel needs.'
            },
            {
              icon: Sparkles,
              title: 'Gamified Journey',
              desc: 'Earn badges and level up as you explore historical sites.'
            }].
            map((feature, idx) =>
            <motion.div
              key={idx}
              initial={{
                opacity: 0,
                y: 20
              }}
              whileInView={{
                opacity: 1,
                y: 0
              }}
              viewport={{
                once: true
              }}
              transition={{
                delay: idx * 0.1
              }}
              className="bg-white rounded-[25px] p-8 shadow-soft border border-sand hover:border-gold/30 transition-colors">
              
                <div className="w-14 h-14 bg-royal/5 rounded-2xl flex items-center justify-center mb-6 text-royal">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-serif font-bold text-navy mb-3">
                  {feature.title}
                </h3>
                <p className="text-navy/60 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Wall of Love */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold mb-4 text-navy dark:text-gold">
            Wall of Love
          </h2>
          <p className="text-navy/70 dark:text-slate-300">
            Hear from travelers who have explored Egypt with us.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {wallReviews.slice(0, 4).map((review, idx) =>
          <motion.div
            key={review.id}
            initial={{
              opacity: 0,
              scale: 0.95
            }}
            whileInView={{
              opacity: 1,
              scale: 1
            }}
            viewport={{
              once: true
            }}
            transition={{
              delay: idx * 0.1
            }}
            className={`bg-white dark:bg-slate-card rounded-[25px] p-6 shadow-soft border border-sand dark:border-slate-border flex flex-col ${idx % 2 !== 0 ? 'md:mt-8' : ''}`}>
            
              <div className="flex gap-1 mb-4">
                {[...Array(review.rating)].map((_, i) =>
              <Star key={i} className="w-4 h-4 fill-gold text-gold" />
              )}
              </div>
              <p className="text-navy/80 dark:text-slate-300 text-sm italic mb-6 flex-1">
                "{review.text}"
              </p>
              <div className="flex items-center gap-3 mt-auto">
                <img
                src={review.avatar}
                alt={review.name}
                className="w-10 h-10 rounded-full object-cover cursor-pointer"
                onClick={() => review.user_id && navigate(`/user/${review.user_id}`)} />
              
                <div>
                  <h4
                    className="font-medium text-navy dark:text-slate-100 text-sm cursor-pointer hover:text-royal dark:hover:text-gold transition-colors"
                    onClick={() => review.user_id && navigate(`/user/${review.user_id}`)}>
                    {review.name}
                  </h4>
                  <p className="text-xs text-navy/50 dark:text-slate-400">
                    {review.landmark_name}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </div>);

}
// =====================================================================
// CategoryDropdown — modern custom select used by the hero search hub
// =====================================================================
const CATEGORY_OPTIONS = [
{
  value: 'Archaeological',
  icon: Landmark
},
{
  value: 'Museum',
  icon: Building2
},
{
  value: 'Religious',
  icon: Church
},
{
  value: 'Recreational',
  icon: Trees
},
{
  value: 'Cultural',
  icon: Theater
}] as
const;
function CategoryDropdown({
  value,
  onChange



}: {value: string;onChange: (v: string) => void;}) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selected = CATEGORY_OPTIONS.find((o) => o.value === value);
  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);
  // Keyboard handling
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (
    !open && (
    e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown'))
    {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (open) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => (i + 1) % CATEGORY_OPTIONS.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => i === 0 ? CATEGORY_OPTIONS.length - 1 : i - 1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const picked = CATEGORY_OPTIONS[activeIdx];
        onChange(picked.value);
        setOpen(false);
      }
    }
  };
  return (
    <div ref={wrapperRef} className="w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center gap-3 bg-white/50 dark:bg-slate-card/40 border border-sand dark:border-slate-border rounded-2xl py-4 pl-12 pr-32 focus:outline-none focus:ring-2 focus:ring-gold/50 text-left transition-colors hover:bg-white/70 dark:hover:bg-slate-card/60">
        
        {selected ?
        <>
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gold/15 text-gold">
              <selected.icon className="w-4 h-4" />
            </span>
            <span className="text-navy dark:text-slate-100 font-medium">
              {selected.value}
            </span>
          </> :

        <span className="text-navy/40 dark:text-slate-400">
            Choose a category...
          </span>
        }
        <ChevronDown
          className={`ml-auto mr-24 w-4 h-4 text-navy/40 dark:text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        
      </button>

      <AnimatePresence>
        {open &&
        <motion.ul
          role="listbox"
          initial={{
            opacity: 0,
            y: -6,
            scale: 0.98
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1
          }}
          exit={{
            opacity: 0,
            y: -6,
            scale: 0.98
          }}
          transition={{
            duration: 0.15,
            ease: 'easeOut'
          }}
          className="absolute left-0 right-0 top-full mt-2 z-30 glass rounded-2xl p-2 shadow-2xl border border-white/40 dark:border-slate-border backdrop-blur-xl">
          
            {CATEGORY_OPTIONS.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isActive = idx === activeIdx;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${isActive ? 'bg-royal/10 dark:bg-gold/10' : 'hover:bg-royal/5 dark:hover:bg-gold/5'}`}>
                
                  <span
                  className={`flex items-center justify-center w-9 h-9 rounded-xl transition-colors ${isSelected ? 'bg-gold text-white' : 'bg-royal/10 dark:bg-gold/10 text-royal dark:text-gold'}`}>
                  
                    <opt.icon className="w-4 h-4" />
                  </span>
                  <span
                  className={`flex-1 text-sm font-medium ${isSelected ? 'text-royal dark:text-gold' : 'text-navy dark:text-slate-100'}`}>
                  
                    {opt.value}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-gold" />}
                </li>);

          })}
          </motion.ul>
        }
      </AnimatePresence>
    </div>);

}
// =====================================================================
// GovernorateDropdown — searchable dropdown of Egyptian governorates,
// derived dynamically from the landmarks dataset.
// =====================================================================
function GovernorateDropdown({
  value,
  onChange,
  governorates = []
}: {value: string;onChange: (v: string) => void;governorates: string[];}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const filtered = governorates.filter((g) =>
  g.toLowerCase().includes(filter.toLowerCase())
  );
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setFilter('');
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);
  return (
    <div ref={wrapperRef} className="w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center gap-3 bg-white/50 dark:bg-slate-card/40 border border-sand dark:border-slate-border rounded-2xl py-4 pl-12 pr-32 focus:outline-none focus:ring-2 focus:ring-gold/50 text-left transition-colors hover:bg-white/70 dark:hover:bg-slate-card/60">
        
        {value ?
        <>
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gold/15 text-gold">
              <MapPin className="w-4 h-4" />
            </span>
            <span className="text-navy dark:text-slate-100 font-medium truncate">
              {value}
            </span>
          </> :

        <span className="text-navy/40 dark:text-slate-400">
            Choose a governorate...
          </span>
        }
        <ChevronDown
          className={`ml-auto mr-24 w-4 h-4 text-navy/40 dark:text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        
      </button>

      <AnimatePresence>
        {open &&
        <motion.div
          initial={{
            opacity: 0,
            y: -6,
            scale: 0.98
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1
          }}
          exit={{
            opacity: 0,
            y: -6,
            scale: 0.98
          }}
          transition={{
            duration: 0.15,
            ease: 'easeOut'
          }}
          className="absolute left-0 right-0 top-full mt-2 z-30 glass rounded-2xl p-2 shadow-2xl border border-white/40 dark:border-slate-border backdrop-blur-xl">
          
            <div className="relative mb-2 px-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40 dark:text-slate-400" />
              <input
              autoFocus
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search governorate..."
              className="w-full bg-white/60 dark:bg-slate-card/60 border border-sand dark:border-slate-border rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 text-navy dark:text-slate-100 placeholder:text-navy/40 dark:placeholder:text-slate-400" />
            
            </div>
            <ul role="listbox" className="max-h-72 overflow-y-auto pr-1">
              {filtered.length === 0 ?
            <li className="px-3 py-4 text-center text-sm text-navy/50 dark:text-slate-400">
                  No governorates match "{filter}"
                </li> :

            filtered.map((gov) => {
              const isSelected = gov === value;
              return (
                <li
                  key={gov}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(gov);
                    setOpen(false);
                    setFilter('');
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${isSelected ? 'bg-royal/10 dark:bg-gold/10' : 'hover:bg-royal/5 dark:hover:bg-gold/5'}`}>
                  
                      <span
                    className={`flex items-center justify-center w-9 h-9 rounded-xl transition-colors ${isSelected ? 'bg-gold text-white' : 'bg-royal/10 dark:bg-gold/10 text-royal dark:text-gold'}`}>
                    
                        <MapPin className="w-4 h-4" />
                      </span>
                      <span
                    className={`flex-1 text-sm font-medium ${isSelected ? 'text-royal dark:text-gold' : 'text-navy dark:text-slate-100'}`}>
                    
                        {gov}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-gold" />}
                    </li>);

            })
            }
            </ul>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}