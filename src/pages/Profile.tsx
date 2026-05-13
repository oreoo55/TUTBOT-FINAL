import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit2,
  Award,
  ChevronRight,
  ChevronDown,
  X,
  Camera,
  Check,
  Upload,
  Heart,
  Bookmark,
  Info,
  Star,
  MessageSquare,
  MapPin,
  Trophy } from
'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, getAuthToken } from '../lib/api';
import { useUserCollections } from '../contexts/UserCollectionsContext';
export function Profile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab = tabParam === 'wishlist' ? 'Wishlist' : tabParam === 'favorites' ? 'Favorites' : 'Current Trips';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }
    Promise.all([
      api.get<any>('/me'),
      api.get<{ data: any[] }>('/badges'),
    ]).then(([user, badgesRes]) => {
      setAllBadges(badgesRes.data);
      Promise.all([
        api.get<{ data: any[] }>('/me/bookings?status=current&per_page=100'),
        api.get<{ data: any[] }>('/me/bookings?status=previous&per_page=100'),
      ])
          .then(([currentRes, previousRes]) => {
            const mapTrip = (b: any) => ({
              id: b.landmark?.id ?? b.id,
              bookingId: b.id,
              confirmationCode: b.confirmation_code,
              name: b.landmark?.name ?? 'Unknown',
              region: b.landmark?.region ?? '',
              category: b.landmark?.category ?? '',
              image: b.landmark?.image ?? '',
              rating: b.landmark?.rating ?? 0,
              reviews: b.landmark?.reviews ?? 0,
              booking_date: b.booking_date,
              status: b.status,
              cancellation_requested_at: b.cancellation_requested_at,
            });
            setUserData({
              ...user,
              currentTrips: currentRes.data.map(mapTrip),
              previousTrips: previousRes.data.map(mapTrip),
            });
          })
          .catch(() => {
            setUserData({ ...user, currentTrips: [], previousTrips: [] });
          })
          .finally(() => setLoading(false));
      })
      .catch(() => setLoading(false));
  }, []);
  const [saveToast, setSaveToast] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const { favorites, wishlist } = useUserCollections();
  const { toggleFavorite, toggleWishlist } = useUserCollections();
  const tabs = ['Current Trips', 'Previous Trips', 'Wishlist', 'Favorites'];
  const getTabData = () => {
    switch (activeTab) {
      case 'Current Trips':
        return userData.currentTrips;
      case 'Previous Trips':
        return userData.previousTrips;
      case 'Wishlist':
        return wishlist;
      case 'Favorites':
        return favorites;
      default:
        return [];
    }
  };
  const getTabEmptyHint = () => {
    switch (activeTab) {
      case 'Wishlist':
        return 'Tap the bookmark icon on any landmark to save it here.';
      case 'Favorites':
        return 'Tap the heart icon on any landmark to favorite it.';
      default:
        return `No items found in ${activeTab}.`;
    }
  };
  const progressPercentage = (userData?.xp ?? 0) / (userData?.next_level_xp ?? 1) * 100;
  const handleSave = async (updated: any, avatarFile?: File | null) => {
    setSaveError('');
    try {
      if (avatarFile) {
        const fd = new FormData();
        fd.append('name', updated.name);
        fd.append('email', updated.email);
        fd.append('bio', updated.bio ?? '');
        fd.append('location', updated.location ?? '');
        fd.append('avatar', avatarFile);
        await api.post('/me', fd);
      } else {
        await api.post('/me', updated);
      }
      const fresh = await api.get<any>('/me');
      setUserData({
        ...fresh,
        currentTrips: fresh.currentTrips ?? [],
        previousTrips: fresh.previousTrips ?? [],
      });
      setIsEditOpen(false);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2500);
    } catch (err: any) {
      setSaveError(err?.body?.message ?? err?.message ?? 'Failed to save profile');
    }
  };
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-10 h-10 border-4 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 text-center">
        <p className="text-navy/60">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="bg-white dark:bg-slate-card rounded-[30px] p-8 shadow-soft dark:shadow-soft-dark border border-sand dark:border-slate-border mb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-bl-full -z-0" />

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div className="relative">
            <img
              src={userData.avatar}
              alt={userData.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-card shadow-lg" />
            
            <button
              onClick={() => setIsEditOpen(true)}
              aria-label="Edit profile picture"
              className="absolute bottom-0 right-0 bg-royal text-white p-2 rounded-full shadow-md hover:bg-royal/90 transition-colors">
              
              <Edit2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-serif font-bold text-navy dark:text-slate-100">
                  {userData.name}
                </h1>
                <p className="text-navy/60 dark:text-slate-400">
                  {userData.email}
                </p>
                {userData.location &&
                <p className="text-sm text-navy/50 dark:text-slate-400 mt-1">
                    📍 {userData.location}
                  </p>
                }
                {userData.bio &&
                <p className="text-sm text-navy/70 dark:text-slate-300 mt-2 max-w-md">
                    {userData.bio}
                  </p>
                }
              </div>
              <button
                onClick={() => setIsEditOpen(true)}
                className="px-6 py-2 border border-sand dark:border-slate-border rounded-xl text-sm font-medium text-navy dark:text-slate-100 hover:bg-sand/30 dark:hover:bg-slate-border transition-colors">
                
                Edit Profile
              </button>
            </div>

            <div className="bg-sand/30 dark:bg-slate-border rounded-2xl p-4 mt-6">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <span className="text-sm text-navy/60 dark:text-slate-400">
                    Traveler Level
                  </span>
                  <p className="text-xl font-bold text-royal dark:text-gold">
                    Level {userData.level}
                  </p>
                </div>
                <span className="text-xs text-navy/50 dark:text-slate-400 font-medium">
                  {userData.xp} / {userData.next_level_xp} XP
                </span>
              </div>
              <div className="h-2 bg-white dark:bg-slate-card rounded-full overflow-hidden">
                <motion.div
                  initial={{
                    width: 0
                  }}
                  animate={{
                    width: `${progressPercentage}%`
                  }}
                  transition={{
                    duration: 1,
                    ease: 'easeOut'
                  }}
                  className="h-full bg-gold" />
                
              </div>
            </div>

            {/* Quick collection stats */}
            <div className="flex gap-3 mt-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 rounded-xl">
                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                <span className="text-sm font-medium text-navy dark:text-slate-100">
                  {favorites.length}
                </span>
                <span className="text-xs text-navy/60 dark:text-slate-400">
                  favorites
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gold/10 rounded-xl">
                <Bookmark className="w-4 h-4 text-gold fill-gold" />
                <span className="text-sm font-medium text-navy dark:text-slate-100">
                  {wishlist.length}
                </span>
                <span className="text-xs text-navy/60 dark:text-slate-400">
                  wishlisted
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-sand dark:border-slate-border relative z-10">
          <h3 className="text-sm font-medium text-navy/60 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Award className="w-4 h-4" /> Earned Badges
          </h3>
          <div className="flex flex-wrap gap-4">
            {userData.badges.map((badge: any) =>
            <div
              key={badge.id}
              className="flex items-center gap-3 bg-white dark:bg-slate-card border border-gold/30 shadow-sm px-4 py-2 rounded-xl group cursor-help relative">
              
                <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                  <Award className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm text-navy dark:text-slate-100">
                  {badge.name}
                </span>

                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-navy text-white text-xs p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 text-center">
                  {badge.description}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-navy" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* XP & Badges Guide */}
      <div className="bg-white dark:bg-slate-card rounded-2xl border border-sand dark:border-slate-border p-6 mb-8">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-gold" />
            <h3 className="font-serif font-bold text-navy dark:text-slate-100">How XP & Badges Work</h3>
          </div>
          <motion.div animate={{ rotate: showGuide ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-5 h-5 text-navy/50 dark:text-slate-400" />
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {showGuide && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-6 space-y-6">
                {/* XP */}
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-navy dark:text-slate-100 mb-3">
                    <Trophy className="w-4 h-4 text-gold" /> Earning XP
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { icon: MapPin, label: 'Book a trip', xp: '+50 XP', color: 'text-emerald-500' },
                      { icon: Star, label: 'Write a review', xp: '+20 XP', color: 'text-amber-500' },
                      { icon: MessageSquare, label: 'Post in community', xp: '+15 XP', color: 'text-blue-500' },
                      { icon: Heart, label: 'Add favorites', xp: '+5 XP', color: 'text-red-500' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-3 bg-sand/20 dark:bg-slate-border/30 rounded-xl px-4 py-3">
                        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-card flex items-center justify-center">
                          <item.icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-navy dark:text-slate-200">{item.label}</p>
                          <p className="text-xs text-navy/50 dark:text-slate-400">{item.xp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Badges */}
                <div className="pt-4 border-t border-sand dark:border-slate-border">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-navy dark:text-slate-100 mb-3">
                    <Award className="w-4 h-4 text-gold" /> Badges
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {allBadges.map(badge => {
                      const iconMap: Record<string, string> = { Crown: '👑', Waves: '🌊', Sun: '☀️', Landmark: '🏛️', Umbrella: '☂️', BookOpen: '📖', Globe: '🌍', Compass: '🧭' };
                      return (
                        <div key={badge.id} className="flex items-center gap-3 bg-sand/20 dark:bg-slate-border/30 rounded-xl px-4 py-3">
                          <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-card flex items-center justify-center text-base">
                            {iconMap[badge.icon] || '🏅'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-navy dark:text-slate-200">{badge.name}</p>
                            <p className="text-xs text-navy/50 dark:text-slate-400">{badge.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => {
          const count =
          tab === 'Wishlist' ?
          wishlist.length :
          tab === 'Favorites' ?
          favorites.length :
          tab === 'Current Trips' ?
          userData.currentTrips.length :
          userData.previousTrips.length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-6 py-3 rounded-xl text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === tab ? 'text-royal dark:text-gold' : 'text-navy/60 dark:text-slate-400 hover:text-navy dark:hover:text-slate-100 hover:bg-sand/30 dark:hover:bg-slate-border'}`}>
              
              {tab}
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded ${activeTab === tab ? 'bg-gold/20 text-gold' : 'bg-sand/60 dark:bg-slate-border text-navy/60 dark:text-slate-400'}`}>
                
                {count}
              </span>
              {activeTab === tab &&
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-white dark:bg-slate-card shadow-sm border border-sand dark:border-slate-border rounded-xl -z-10"
                transition={{
                  type: 'spring',
                  bounce: 0.2,
                  duration: 0.6
                }} />

              }
            </button>);

        })}
      </div>

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {getTabData().length > 0 ?
          getTabData().map((item: any, idx: number) =>
          <motion.div
            layout
            key={item.id}
            initial={{
              opacity: 0,
              scale: 0.9
            }}
            animate={{
              opacity: 1,
              scale: 1
            }}
            exit={{
              opacity: 0,
              scale: 0.9,
              transition: {
                duration: 0.2
              }
            }}
            transition={{
              delay: idx * 0.05,
              layout: {
                type: 'spring',
                bounce: 0.2,
                duration: 0.6
              }
            }}
            onClick={() => navigate(item.bookingId ? `/trip/${item.bookingId}` : `/landmark/${item.id}`)}
            className="bg-white dark:bg-slate-card rounded-[20px] p-4 shadow-soft dark:shadow-soft-dark border border-sand dark:border-slate-border flex gap-4 group cursor-pointer relative overflow-hidden">
            
                <img
              src={item.image}
              alt={item.name}
              className="w-24 h-24 rounded-xl object-cover" />
            
                <div className="flex-1 flex flex-col justify-center">
                  <h4 className="font-serif font-bold text-navy dark:text-slate-100 group-hover:text-royal dark:group-hover:text-gold transition-colors">
                    {item.name}
                  </h4>
                  <p className="text-xs text-navy/60 dark:text-slate-400 mb-1">
                    {item.region}
                  </p>
                  {(activeTab === 'Current Trips' || activeTab === 'Previous Trips') && item.booking_date &&
                    <p className="text-xs text-navy/50 dark:text-slate-400 mb-1">
                      {item.booking_date}
                    </p>
                  }
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      {(activeTab === 'Current Trips' || activeTab === 'Previous Trips') && item.status &&
                        <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                          item.status === 'cancelled'
                            ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                            : item.cancellation_requested_at
                            ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                            : activeTab === 'Previous Trips' && item.booking_date && item.booking_date < new Date().toISOString().slice(0, 10)
                            ? 'bg-slate-100 dark:bg-slate-border/50 text-navy/60 dark:text-slate-400'
                            : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {item.status === 'cancelled' ? 'Cancelled' : item.cancellation_requested_at ? 'Cancellation Requested' : activeTab === 'Previous Trips' && item.booking_date && item.booking_date < new Date().toISOString().slice(0, 10) ? 'Completed' : 'Confirmed'}
                        </span>
                      }
                      <span className="text-xs font-medium bg-sand dark:bg-slate-border px-2 py-1 rounded-md text-navy/80 dark:text-slate-300">
                        {item.category}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-navy/30 dark:text-slate-400 group-hover:text-royal dark:group-hover:text-gold transition-colors" />
                  </div>
                </div>

                {(activeTab === 'Wishlist' || activeTab === 'Favorites') &&
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (activeTab === 'Wishlist') toggleWishlist(item);else
                toggleFavorite(item);
              }}
              className="absolute top-3 right-3 w-8 h-8 bg-white/90 dark:bg-slate-card/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-sm border border-sand dark:border-slate-border z-10"
              aria-label={`Remove from ${activeTab}`}>
              
                    {activeTab === 'Wishlist' ?
              <Bookmark className="w-4 h-4 fill-gold text-gold" /> :

              <Heart className="w-4 h-4 fill-red-500 text-red-500" />
              }
                  </button>
            }
              </motion.div>
          ) :

          <motion.div
            layout
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            exit={{
              opacity: 0
            }}
            className="col-span-full py-12 text-center bg-sand/20 dark:bg-slate-border/40 rounded-[20px] border border-dashed border-sand dark:border-slate-border">
            
              <p className="text-navy/50 dark:text-slate-400">
                {getTabEmptyHint()}
              </p>
            </motion.div>
          }
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {isEditOpen &&
        <EditProfileModal
          user={userData}
          onClose={() => setIsEditOpen(false)}
          onSave={handleSave} />

        }
      </AnimatePresence>

      <AnimatePresence>
        {saveToast &&
        <motion.div
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          exit={{
            opacity: 0,
            y: 20
          }}
          className="fixed bottom-8 right-8 bg-navy text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50">
          
            <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium">Profile updated</span>
          </motion.div>
        }
        {saveError &&
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-8 right-8 bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg z-50"
        >
          <span className="text-sm font-medium">{saveError}</span>
        </motion.div>
        }
      </AnimatePresence>
    </div>);

}
interface EditProfileModalProps {
  user: {
    name: string;
    email: string;
    avatar: string;
    bio: string;
    location: string;
    [key: string]: any;
  };
  onClose: () => void;
  onSave: (updated: any, avatarFile?: File | null) => void;
}
function EditProfileModal({ user, onClose, onSave }: EditProfileModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio || '',
    location: user.location || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrors({
        ...errors,
        avatar: 'Please upload an image file'
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors({
        ...errors,
        avatar: 'Image must be under 5MB'
      });
      return;
    }
    const url = URL.createObjectURL(file);
    setAvatarFile(file);
    setForm({
      ...form,
      avatar: url
    });
    setErrors({
      ...errors,
      avatar: ''
    });
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (form.bio.length > 200)
    newErrors.bio = 'Bio must be under 200 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    setTimeout(() => {
      onSave({ ...user, ...form }, avatarFile);
      setIsSaving(false);
    }, 600);
  };
  return (
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
      className="fixed inset-0 bg-navy/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}>
      
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.95,
          y: 20
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0
        }}
        exit={{
          opacity: 0,
          scale: 0.95,
          y: 20
        }}
        transition={{
          type: 'spring',
          damping: 25,
          stiffness: 300
        }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-card rounded-[30px] shadow-2xl w-full max-w-lg my-8 max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between p-6 border-b border-sand dark:border-slate-border sticky top-0 bg-white dark:bg-slate-card rounded-t-[30px] z-10">
          <div>
            <h2 className="text-2xl font-serif font-bold text-navy dark:text-slate-100">
              Edit Profile
            </h2>
            <p className="text-sm text-navy/60 dark:text-slate-400 mt-1">
              Update your information and photo
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full hover:bg-sand/50 dark:hover:bg-slate-border flex items-center justify-center text-navy/60 dark:text-slate-400 hover:text-navy transition-colors">
            
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-navy dark:text-slate-100 mb-3">
              Profile picture
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative flex items-center gap-5 p-4 rounded-2xl border-2 border-dashed transition-colors ${isDragging ? 'border-gold bg-gold/5' : 'border-sand dark:border-slate-border bg-sand/20 dark:bg-slate-border/40'}`}>
              
              <div className="relative shrink-0 group">
                <img
                  src={form.avatar}
                  alt="Profile preview"
                  className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-slate-card shadow-md" />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-navy/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Change picture">
                  
                  <Camera className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-sm font-medium text-royal dark:text-gold hover:text-gold transition-colors">
                  
                  <Upload className="w-4 h-4" />
                  Upload new photo
                </button>
                <p className="text-xs text-navy/50 dark:text-slate-400 mt-1">
                  Drag & drop or click. JPG, PNG up to 5MB.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }} />
              
            </div>
            {errors.avatar &&
            <p className="text-red-500 text-xs mt-2">{errors.avatar}</p>
            }
          </div>

          <div>
            <label
              htmlFor="edit-name"
              className="block text-sm font-medium text-navy dark:text-slate-100 mb-2">
              
              Full name
            </label>
            <input
              id="edit-name"
              type="text"
              value={form.name}
              onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value
              })
              }
              className="w-full bg-white dark:bg-slate-card border-2 border-sand dark:border-slate-border focus:border-gold rounded-xl py-2.5 px-4 focus:outline-none transition-colors text-navy dark:text-slate-100"
              placeholder="Your full name" />
            
            {errors.name &&
            <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            }
          </div>

          <div>
            <label
              htmlFor="edit-email"
              className="block text-sm font-medium text-navy dark:text-slate-100 mb-2">
              
              Email
            </label>
            <input
              id="edit-email"
              type="email"
              value={form.email}
              onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value
              })
              }
              className="w-full bg-white dark:bg-slate-card border-2 border-sand dark:border-slate-border focus:border-gold rounded-xl py-2.5 px-4 focus:outline-none transition-colors text-navy dark:text-slate-100"
              placeholder="you@example.com" />
            
            {errors.email &&
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            }
          </div>

          <div>
            <label
              htmlFor="edit-location"
              className="block text-sm font-medium text-navy dark:text-slate-100 mb-2">
              
              Location
            </label>
            <input
              id="edit-location"
              type="text"
              value={form.location}
              onChange={(e) =>
              setForm({
                ...form,
                location: e.target.value
              })
              }
              className="w-full bg-white dark:bg-slate-card border-2 border-sand dark:border-slate-border focus:border-gold rounded-xl py-2.5 px-4 focus:outline-none transition-colors text-navy dark:text-slate-100"
              placeholder="City, Country" />
            
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-2">
              <label
                htmlFor="edit-bio"
                className="block text-sm font-medium text-navy dark:text-slate-100">
                
                Bio
              </label>
              <span
                className={`text-xs ${form.bio.length > 200 ? 'text-red-500' : 'text-navy/40 dark:text-slate-400'}`}>
                
                {form.bio.length}/200
              </span>
            </div>
            <textarea
              id="edit-bio"
              value={form.bio}
              onChange={(e) =>
              setForm({
                ...form,
                bio: e.target.value
              })
              }
              rows={3}
              className="w-full bg-white dark:bg-slate-card border-2 border-sand dark:border-slate-border focus:border-gold rounded-xl py-2.5 px-4 focus:outline-none transition-colors resize-none text-navy dark:text-slate-100"
              placeholder="Tell other travelers about yourself..." />
            
            {errors.bio &&
            <p className="text-red-500 text-xs mt-1">{errors.bio}</p>
            }
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-6 py-3 border-2 border-sand dark:border-slate-border rounded-xl font-medium text-navy dark:text-slate-100 hover:bg-sand/30 dark:hover:bg-slate-border transition-colors disabled:opacity-50">
              
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-gold text-white py-3 rounded-xl font-medium hover:bg-gold/90 hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              
              {isSaving ?
              <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </> :

              'Save changes'
              }
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>);

}