import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Map as MapIcon,
  Grid,
  Filter,
  Star,
  X,
  SlidersHorizontal,
  TrendingUp,
  Navigation,
  ArrowDownUp,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ChevronLeft,
  ChevronRight } from
'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { api } from '../lib/api';
import { CardSkeleton } from '../components/Skeleton';
import { LandmarkCard } from '../components/LandmarkCard';
import { EmptyState } from '../components/EmptyState';
// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});
// Categories are derived from the mockData dataset itself (categoryDisplayMap
// unique values). Keeps the filter in sync with whatever the data contains.

const ratingOptions = [
{
  value: 0,
  label: 'All ratings'
},
{
  value: 3,
  label: '3.0+'
},
{
  value: 4,
  label: '4.0+'
},
{
  value: 4.5,
  label: '4.5+'
}];

type SortMode = 'default' | 'top' | 'nearby' | 'priceAsc' | 'priceDesc';
const sortOptions: {
  value: SortMode;
  label: string;
  icon: any;
}[] = [
{
  value: 'default',
  label: 'Default',
  icon: ArrowDownUp
},
{
  value: 'top',
  label: 'Top Rated',
  icon: TrendingUp
},
{
  value: 'nearby',
  label: 'Nearby',
  icon: Navigation
},
{
  value: 'priceAsc',
  label: 'Price: Low → High',
  icon: ArrowUpNarrowWide
},
{
  value: 'priceDesc',
  label: 'Price: High → Low',
  icon: ArrowDownWideNarrow
}];

const MAX_PRICE = 1500;
const PAGE_SIZE = 9;
// Egypt geographic center — used as a fallback origin for "Nearby" sort when
// the user denies geolocation or their browser doesn't support it.
const EGYPT_CENTER: [number, number] = [26.8206, 30.8025];
function haversine(a: [number, number], b: [number, number]): number {
  const toRad = (deg: number) => deg * Math.PI / 180;
  const R = 6371; // km
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const x =
  Math.sin(dLat / 2) ** 2 +
  Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}
export function Discover() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(MAX_PRICE);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const [locationStatus, setLocationStatus] = useState<
    'idle' | 'requesting' | 'granted' | 'denied'>(
    'idle');
  const [filtersOpenMobile, setFiltersOpenMobile] = useState(false);
  const [allLandmarks, setAllLandmarks] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [dataLoading, setDataLoading] = useState<'loading' | 'error' | 'loaded'>('loading');
  useEffect(() => {
    api.get<any>('/landmarks?per_page=200').then(res => {
      const items = Array.isArray(res) ? res : (res.data ?? []);
      setAllLandmarks(items);
      setCategories(Array.from(new Set<string>(items.map((l: any) => l.category))).sort());
      setDataLoading('loaded');
    }).catch(() => { setDataLoading('error'); });
  }, []);
  // Hydrate filters from URL params on first mount so search from Landing/
  // NotFound actually carries through. If `type=category` and `q` matches an
  // existing category, promote it to a category chip and clear the search box.
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const type = searchParams.get('type') || '';
    if (!q) return;
    if (type === 'category') {
      const match = categories.find((c) => c.toLowerCase() === q.toLowerCase());
      if (match) {
        setSelectedCategory((prev) =>
        prev.includes(match) ? prev : [...prev, match]
        );
        return;
      }
    }
    setSearchQuery(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const toggleCategory = (cat: string) => {
    setSelectedCategory((prev) =>
    prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };
  // Ask for geolocation when the user picks "Nearby" — falls back to the
  // geographic center of Egypt if denied or unavailable so the sort still works.
  useEffect(() => {
    if (sortMode !== 'nearby') return;
    if (userLocation || locationStatus !== 'idle') return;
    if (!('geolocation' in navigator)) {
      setLocationStatus('denied');
      return;
    }
    setLocationStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setLocationStatus('granted');
      },
      () => setLocationStatus('denied'),
      {
        timeout: 8000
      }
    );
  }, [sortMode, userLocation, locationStatus]);
  const filteredLandmarks = useMemo(() => {
    const filtered = allLandmarks.filter((l) => {
      const matchesSearch =
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.region.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
      selectedCategory.length === 0 || selectedCategory.includes(l.category);
      const matchesPrice = l.price <= maxPrice;
      const matchesRating = l.rating >= minRating;
      return matchesSearch && matchesCategory && matchesPrice && matchesRating;
    });
    if (sortMode === 'top') {
      return [...filtered].sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.reviews - a.reviews;
      });
    }
    if (sortMode === 'nearby') {
      const origin = userLocation ?? EGYPT_CENTER;
      return [...filtered].sort(
        (a, b) =>
        haversine(origin, [a.lat, a.lng]) - haversine(origin, [b.lat, b.lng])
      );
    }
    if (sortMode === 'priceAsc') {
      return [...filtered].sort((a, b) => a.price - b.price);
    }
    if (sortMode === 'priceDesc') {
      return [...filtered].sort((a, b) => b.price - a.price);
    }
    return filtered;
  }, [
  allLandmarks,
  searchQuery,
  selectedCategory,
  maxPrice,
  minRating,
  sortMode,
  userLocation]
  );
  // Pagination — 9 landmarks per page in grid view. Map view shows all pins.
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredLandmarks.length / PAGE_SIZE)
  );
  // Reset to first page whenever the filtered list or sort changes so users
  // never get stranded on an empty/out-of-range page.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, maxPrice, minRating, sortMode]);
  // Clamp page if the underlying data shrinks below the current page index.
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);
  const paginatedLandmarks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredLandmarks.slice(start, start + PAGE_SIZE);
  }, [filteredLandmarks, currentPage]);
  const activeFilterCount =
  selectedCategory.length + (
  maxPrice < MAX_PRICE ? 1 : 0) + (
  minRating > 0 ? 1 : 0);
  const resetFilters = () => {
    setSelectedCategory([]);
    setMaxPrice(MAX_PRICE);
    setMinRating(0);
    setSearchQuery('');
    setSortMode('default');
  };
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row gap-8 min-h-[80vh]">
      <aside className="hidden md:block w-72 flex-shrink-0">
        <FilterPanel
          selectedCategory={selectedCategory}
          toggleCategory={toggleCategory}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          minRating={minRating}
          setMinRating={setMinRating}
          activeFilterCount={activeFilterCount}
          onReset={resetFilters}
          resultCount={filteredLandmarks.length}
          categories={categories} />

      </aside>

      <div className="flex-1">
        {/* Top Bar */}
        <div className="glass rounded-[20px] p-4 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between sticky top-24 z-30">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40 dark:text-slate-400" />
            <input
              type="text"
              placeholder="Search landmarks, regions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/50 dark:bg-slate-card/60 border border-sand dark:border-slate-border rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-gold/50 text-sm text-navy dark:text-slate-100" />
            
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setFiltersOpenMobile(true)}
              className="md:hidden relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-slate-card text-navy dark:text-slate-100 border border-sand dark:border-slate-border">
              
              <SlidersHorizontal className="w-4 h-4" /> Filters
              {activeFilterCount > 0 &&
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-white text-xs rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              }
            </button>

            <div className="flex bg-sand/50 dark:bg-slate-border p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-card shadow-sm text-royal dark:text-gold' : 'text-navy/60 dark:text-slate-300 hover:text-navy'}`}>
                
                <Grid className="w-4 h-4" /> Grid
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'map' ? 'bg-white dark:bg-slate-card shadow-sm text-royal dark:text-gold' : 'text-navy/60 dark:text-slate-300 hover:text-navy'}`}>
                
                <MapIcon className="w-4 h-4" /> Map
              </button>
            </div>
          </div>
        </div>

        {/* Sort row */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs font-medium text-navy/60 dark:text-slate-400 mr-1">
            Sort by:
          </span>
          {sortOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = sortMode === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setSortMode(opt.value)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${isActive ? 'bg-royal dark:bg-gold text-white shadow-sm' : 'bg-white dark:bg-slate-card text-navy/70 dark:text-slate-300 border border-sand dark:border-slate-border hover:border-royal/30 dark:hover:border-gold/30'}`}>
                
                <Icon className="w-3.5 h-3.5" /> {opt.label}
              </button>);

          })}
          {sortMode === 'nearby' &&
          <span className="text-xs text-navy/50 dark:text-slate-400 ml-1">
              {locationStatus === 'requesting' && 'Finding your location…'}
              {locationStatus === 'granted' && 'Sorted from your location'}
              {locationStatus === 'denied' &&
            'Location unavailable — sorted from Egypt center'}
            </span>
          }
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 &&
        <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs font-medium text-navy/60 dark:text-slate-400">
              Active filters:
            </span>
            {selectedCategory.map((cat) =>
          <button
            key={cat}
            onClick={() => toggleCategory(cat)}
            className="inline-flex items-center gap-1 bg-royal/10 dark:bg-gold/10 text-royal dark:text-gold px-3 py-1 rounded-lg text-xs font-medium hover:bg-royal/20 dark:hover:bg-gold/20">
            
                {cat} <X className="w-3 h-3" />
              </button>
          )}
            {maxPrice < MAX_PRICE &&
          <button
            onClick={() => setMaxPrice(MAX_PRICE)}
            className="inline-flex items-center gap-1 bg-gold/10 text-gold px-3 py-1 rounded-lg text-xs font-medium hover:bg-gold/20">
            
                Under {maxPrice} EGP <X className="w-3 h-3" />
              </button>
          }
            {minRating > 0 &&
          <button
            onClick={() => setMinRating(0)}
            className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-lg text-xs font-medium hover:bg-amber-200">
            
                <Star className="w-3 h-3 fill-current" /> {minRating}+
                <X className="w-3 h-3" />
              </button>
          }
            <button
            onClick={resetFilters}
            className="text-xs text-navy/50 dark:text-slate-400 hover:text-navy underline ml-2">
            
              Clear all
            </button>
          </div>
        }

        {dataLoading === 'loading' ?
        <div className="flex items-center justify-center min-h-[40vh]">
            <div className="animate-spin w-10 h-10 border-4 border-gold border-t-transparent rounded-full" />
          </div> :

        dataLoading === 'error' ?
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
            <p className="text-navy/60 dark:text-slate-300/60 mb-4">Failed to load landmarks. Check your connection and try again.</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => window.location.reload()}
              className="bg-gold text-white px-6 py-2.5 rounded-xl font-medium hover:bg-gold/90 transition-colors"
            >
              Retry
            </motion.button>
          </div> :

        viewMode === 'grid' ?
        filteredLandmarks.length === 0 ?
        <EmptyState
          icon={Search}
          title="No landmarks match your filters"
          description="Try adjusting your filters or search query to discover more places."
          action={{ label: 'Reset filters', onClick: resetFilters }}
        /> :

        <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedLandmarks.map((landmark, idx) =>
            <motion.div
              key={landmark.id}
              initial={{
                opacity: 0,
                y: 20
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                delay: Math.min(idx * 0.03, 0.3)
              }}>
              
                    <LandmarkCard landmark={landmark} />
                  </motion.div>
            )}
              </div>
              <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalResults={filteredLandmarks.length}
            pageSize={PAGE_SIZE}
            onChange={(p) => {
              setCurrentPage(p);
              window.scrollTo({
                top: 0,
                behavior: 'smooth'
              });
            }} />
          
            </> :


        <div className="h-[600px] bg-white dark:bg-slate-card rounded-[25px] p-2 shadow-soft dark:shadow-soft-dark border border-sand dark:border-slate-border relative z-0">
            <MapContainer
            center={[26.8206, 30.8025]}
            zoom={6}
            scrollWheelZoom={false}
            className="w-full h-full rounded-[20px]">
            
              <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
              {filteredLandmarks.map((landmark) =>
            <Marker
              key={landmark.id}
              position={[landmark.lat, landmark.lng]}>
              
                  <Popup className="rounded-xl">
                    <div className="p-1 min-w-[200px]">
                      <img
                    src={landmark.image}
                    alt={landmark.name}
                    className="w-full h-24 object-cover rounded-lg mb-2" />
                  
                      <h4 className="font-serif font-bold text-navy">
                        {landmark.name}
                      </h4>
                      <p className="text-xs text-navy/60 mb-2">
                        {landmark.region}
                      </p>
                      <button
                    onClick={() => navigate(`/landmark/${landmark.id}`)}
                    className="w-full bg-royal text-white text-xs py-1.5 rounded-lg hover:bg-royal/90">
                    
                        View Details
                      </button>
                    </div>
                  </Popup>
                </Marker>
            )}
            </MapContainer>
          </div>
        }
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {filtersOpenMobile &&
        <motion.div
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          exit={{
            opacity: 0
          }}
          className="md:hidden fixed inset-0 bg-navy/50 backdrop-blur-sm z-50 flex items-end"
          onClick={() => setFiltersOpenMobile(false)}>
          
            <motion.div
            initial={{
              y: '100%'
            }}
            animate={{
              y: 0
            }}
            exit={{
              y: '100%'
            }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300
            }}
            onClick={(e) => e.stopPropagation()}
            className="bg-offwhite dark:bg-midnight w-full rounded-t-[30px] max-h-[85vh] overflow-y-auto">
            
              <div className="flex items-center justify-between p-6 sticky top-0 bg-offwhite dark:bg-midnight border-b border-sand dark:border-slate-border">
                <h2 className="text-xl font-serif font-bold text-navy dark:text-slate-100">
                  Filters
                </h2>
                <button
                onClick={() => setFiltersOpenMobile(false)}
                className="w-9 h-9 rounded-full hover:bg-sand/50 dark:hover:bg-slate-border flex items-center justify-center">
                
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <FilterPanel
                selectedCategory={selectedCategory}
                toggleCategory={toggleCategory}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                minRating={minRating}
                setMinRating={setMinRating}
                activeFilterCount={activeFilterCount}
                onReset={resetFilters}
                resultCount={filteredLandmarks.length}
                categories={categories}
                noWrapper />
              
                <button
                onClick={() => setFiltersOpenMobile(false)}
                className="w-full mt-6 bg-gold text-white py-3 rounded-xl font-medium hover:bg-gold/90 transition-colors">
                
                  Show {filteredLandmarks.length} results
                </button>
              </div>
            </motion.div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}
interface FilterPanelProps {
  selectedCategory: string[];
  toggleCategory: (cat: string) => void;
  maxPrice: number;
  setMaxPrice: (n: number) => void;
  minRating: number;
  setMinRating: (n: number) => void;
  activeFilterCount: number;
  onReset: () => void;
  resultCount: number;
  noWrapper?: boolean;
  categories: string[];
}
function FilterPanel({
  selectedCategory,
  toggleCategory,
  maxPrice,
  setMaxPrice,
  minRating,
  setMinRating,
  activeFilterCount,
  onReset,
  resultCount,
  noWrapper,
  categories
}: FilterPanelProps) {
  const content =
  <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-navy dark:text-slate-100 font-serif font-bold text-xl">
          <Filter className="w-5 h-5 text-royal dark:text-gold" /> Filters
          {activeFilterCount > 0 &&
        <span className="text-xs font-sans font-medium bg-gold text-white px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
        }
        </div>
        {activeFilterCount > 0 &&
      <button
        onClick={onReset}
        className="text-xs text-navy/50 dark:text-slate-400 hover:text-navy underline">
        
            Reset
          </button>
      }
      </div>

      <div className="text-xs text-navy/60 dark:text-slate-400 mb-6">
        Showing{' '}
        <span className="font-bold text-navy dark:text-slate-100">
          {resultCount}
        </span>{' '}
        {resultCount === 1 ? 'place' : 'places'}
      </div>

      <div className="mb-8">
        <h3 className="font-medium text-navy dark:text-slate-100 mb-4 text-sm uppercase tracking-wider">
          Category
        </h3>
        <div className="space-y-3">
          {categories.map((cat) =>
        <label
          key={cat}
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => toggleCategory(cat)}>
          
              <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selectedCategory.includes(cat) ? 'bg-royal dark:bg-gold border-royal dark:border-gold' : 'border-navy/20 dark:border-slate-border group-hover:border-royal dark:group-hover:border-gold'}`}>
            
                {selectedCategory.includes(cat) &&
            <div className="w-2 h-2 bg-white rounded-sm" />
            }
              </div>
              <span className="text-sm text-navy/80 dark:text-slate-300 group-hover:text-navy dark:group-hover:text-slate-100">
                {cat}
              </span>
            </label>
        )}
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-navy dark:text-slate-100 text-sm uppercase tracking-wider">
            Price Range
          </h3>
          <span className="text-xs font-bold text-gold bg-gold/10 px-2 py-0.5 rounded-md">
            {maxPrice === MAX_PRICE ?
          'Any' :
          maxPrice === 0 ?
          'Free' :
          `≤ ${maxPrice} EGP`}
          </span>
        </div>
        <input
        type="range"
        min="0"
        max={MAX_PRICE}
        step="10"
        value={maxPrice}
        onChange={(e) => setMaxPrice(Number(e.target.value))}
        className="w-full accent-gold" />
      
        <div className="flex justify-between text-xs text-navy/50 dark:text-slate-400 mt-2">
          <span>Free</span>
          <span>{MAX_PRICE}+ EGP</span>
        </div>
      </div>

      <div className="mb-2">
        <h3 className="font-medium text-navy dark:text-slate-100 mb-4 text-sm uppercase tracking-wider">
          User Rating
        </h3>
        <div className="space-y-2">
          {ratingOptions.map((opt) =>
        <button
          key={opt.value}
          onClick={() => setMinRating(opt.value)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${minRating === opt.value ? 'bg-gold/10 text-navy dark:text-slate-100 font-medium' : 'text-navy/70 dark:text-slate-300 hover:bg-sand/30 dark:hover:bg-slate-border'}`}>
          
              <span className="flex items-center gap-2">
                {opt.value > 0 &&
            <Star className="w-4 h-4 fill-gold text-gold" />
            }
                {opt.label}
              </span>
              <div
            className={`w-4 h-4 rounded-full border-2 ${minRating === opt.value ? 'border-gold bg-gold' : 'border-navy/20 dark:border-slate-border'}`}>
            
                {minRating === opt.value &&
            <div className="w-full h-full rounded-full border-2 border-white" />
            }
              </div>
            </button>
        )}
        </div>
      </div>
    </>;

  if (noWrapper) return content;
  return (
    <div className="sticky top-28 bg-white dark:bg-slate-card rounded-[25px] p-6 shadow-soft dark:shadow-soft-dark border border-sand dark:border-slate-border">
      {content}
    </div>);

}
function Pagination({
  currentPage,
  totalPages,
  totalResults,
  pageSize,
  onChange






}: {currentPage: number;totalPages: number;totalResults: number;pageSize: number;onChange: (page: number) => void;}) {
  if (totalPages <= 1) return null;
  // Build a windowed page list: 1 … current-1, current, current+1 … last
  const pages: (number | 'ellipsis')[] = [];
  const push = (v: number | 'ellipsis') => {
    if (pages[pages.length - 1] !== v) pages.push(v);
  };
  push(1);
  for (let p = currentPage - 1; p <= currentPage + 1; p++) {
    if (p > 1 && p < totalPages) {
      if (p > 2 && pages[pages.length - 1] !== p - 1) push('ellipsis');
      push(p);
    }
  }
  if (totalPages > 1) {
    if (
    pages[pages.length - 1] !== totalPages - 1 &&
    totalPages > currentPage + 2)

    push('ellipsis');
    push(totalPages);
  }
  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalResults);
  return (
    <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-xs text-navy/60 dark:text-slate-400">
        Showing{' '}
        <span className="font-bold text-navy dark:text-slate-100">
          {from}–{to}
        </span>{' '}
        of{' '}
        <span className="font-bold text-navy dark:text-slate-100">
          {totalResults}
        </span>{' '}
        landmarks
      </p>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-slate-card border border-sand dark:border-slate-border text-navy dark:text-slate-200 hover:border-royal/30 dark:hover:border-gold/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((p, i) =>
        p === 'ellipsis' ?
        <span
          key={`e-${i}`}
          className="w-9 h-9 flex items-center justify-center text-navy/40 dark:text-slate-500 text-sm">
          
              …
            </span> :

        <button
          key={p}
          onClick={() => onChange(p)}
          aria-current={p === currentPage ? 'page' : undefined}
          className={`min-w-9 h-9 px-3 rounded-lg text-sm font-medium transition-colors ${p === currentPage ? 'bg-royal dark:bg-gold text-white shadow-sm' : 'bg-white dark:bg-slate-card border border-sand dark:border-slate-border text-navy/70 dark:text-slate-300 hover:border-royal/30 dark:hover:border-gold/30'}`}>
          
              {p}
            </button>

        )}

        <button
          onClick={() => onChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-slate-card border border-sand dark:border-slate-border text-navy dark:text-slate-200 hover:border-royal/30 dark:hover:border-gold/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>);

}
