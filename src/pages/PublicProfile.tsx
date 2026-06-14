import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin, Award, Star, MessageSquare, Calendar,
  ArrowLeft, ChevronRight
} from 'lucide-react';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { api } from '../lib/api';

export function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'Posts' | 'Reviews'>('Posts');
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setDataError('');
    Promise.all([
      api.get<any>(`/users/${id}`),
      api.get<any>(`/users/${id}/posts`),
      api.get<any>(`/users/${id}/reviews`),
    ])
      .then(([userRes, postsRes, reviewsRes]) => {
        setUser(userRes);
        setPosts(postsRes.data ?? []);
        setReviews(reviewsRes.data ?? []);
        setLoading(false);
      })
      .catch(() => { setDataError('Failed to load profile'); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <Skeleton className="h-5 w-24" />
        <div className="bg-white dark:bg-slate-card rounded-[30px] p-8 border border-sand dark:border-slate-border">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <Skeleton className="w-32 h-32 rounded-full" />
            <div className="flex-1 space-y-4 w-full">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 text-center">
        <p className="text-navy/60 dark:text-slate-300/60 mb-4">{dataError}</p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => window.location.reload()}
          className="bg-gold text-white px-6 py-2.5 rounded-xl font-medium hover:bg-gold/90 transition-colors"
        >
          Retry
        </motion.button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 text-center">
        <p className="text-navy/60">User not found.</p>
      </div>
    );
  }

  const progressPercentage = (user.xp ?? 0) / (user.next_level_xp ?? 1) * 100;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: -3 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-navy/60 dark:text-slate-400 hover:text-navy dark:hover:text-slate-100 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </motion.button>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-card rounded-[30px] p-8 shadow-soft dark:shadow-soft-dark border border-sand dark:border-slate-border mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-bl-full -z-0" />

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-card shadow-lg"
          />

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-serif font-bold text-navy dark:text-slate-100">
              {user.name}
            </h1>
            {user.location && (
              <p className="text-sm text-navy/50 dark:text-slate-400 mt-1 flex items-center justify-center md:justify-start gap-1">
                <MapPin className="w-3.5 h-3.5" /> {user.location}
              </p>
            )}
            {user.bio && (
              <p className="text-sm text-navy/70 dark:text-slate-300 mt-2 max-w-md">
                {user.bio}
              </p>
            )}

            {/* Stats row */}
            <div className="flex gap-4 mt-4 justify-center md:justify-start">
              <div className="flex items-center gap-2 px-4 py-2 bg-gold/10 rounded-xl">
                <Star className="w-4 h-4 text-gold" />
                <span className="text-sm font-medium text-navy dark:text-slate-100">{user.reviews_count}</span>
                <span className="text-xs text-navy/60 dark:text-slate-400">reviews</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-royal/10 rounded-xl">
                <MessageSquare className="w-4 h-4 text-royal dark:text-gold" />
                <span className="text-sm font-medium text-navy dark:text-slate-100">{user.posts_count}</span>
                <span className="text-xs text-navy/60 dark:text-slate-400">posts</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-xl">
                <Calendar className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-navy/60 dark:text-slate-400">{user.member_since}</span>
              </div>
            </div>

            {/* Level bar */}
            <div className="bg-sand/30 dark:bg-slate-border rounded-2xl p-4 mt-6">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <span className="text-sm text-navy/60 dark:text-slate-400">Traveler Level</span>
                  <p className="text-xl font-bold text-royal dark:text-gold">Level {user.level}</p>
                </div>
                <span className="text-xs text-navy/50 dark:text-slate-400 font-medium">
                  {user.xp} / {user.next_level_xp} XP
                </span>
              </div>
              <div className="h-2 bg-white dark:bg-slate-card rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Badges */}
        {user.badges?.length > 0 && (
          <div className="mt-8 pt-8 border-t border-sand dark:border-slate-border relative z-10">
            <h3 className="text-sm font-medium text-navy/60 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Award className="w-4 h-4" /> Earned Badges
            </h3>
            <div className="flex flex-wrap gap-4">
              {user.badges.map((badge: any) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-3 bg-white dark:bg-slate-card border border-gold/30 shadow-sm px-4 py-2 rounded-xl group cursor-help relative"
                >
                  <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                    <Award className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm text-navy dark:text-slate-100">{badge.name}</span>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-navy text-white text-xs p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 text-center">
                    {badge.description}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-navy" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Tabs */}
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {(['Posts', 'Reviews'] as const).map((tab) => {
          const count = tab === 'Posts' ? user.posts_count : user.reviews_count;
          return (
            <motion.button
              key={tab}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab(tab)}
              className={`relative px-6 py-3 rounded-xl text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab
                  ? 'text-royal dark:text-gold'
                  : 'text-navy/60 dark:text-slate-400 hover:text-navy dark:hover:text-slate-100 hover:bg-sand/30 dark:hover:bg-slate-border'
              }`}
            >
              {tab}
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                  activeTab === tab
                    ? 'bg-gold/20 text-gold'
                    : 'bg-sand/60 dark:bg-slate-border text-navy/60 dark:text-slate-400'
                }`}
              >
                {count}
              </span>
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white dark:bg-slate-card shadow-sm border border-sand dark:border-slate-border rounded-xl -z-10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div layout className="space-y-4">
        {activeTab === 'Posts' && posts.length === 0 && (
          <EmptyState icon={MessageSquare} title="No posts yet." />
        )}
        {activeTab === 'Posts' && posts.map((post: any) => (
          <motion.div
            key={post.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate('/community')}
            whileHover={{ y: -2, boxShadow: '0 8px 25px rgba(0,0,0,0.08)' }}
            className="bg-white dark:bg-slate-card rounded-[20px] p-5 shadow-soft dark:shadow-soft-dark border border-sand dark:border-slate-border cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium bg-sand dark:bg-slate-border px-2 py-1 rounded-md text-navy/80 dark:text-slate-300">
                    {post.category || 'General'}
                  </span>
                  {post.location && (
                    <span className="text-xs text-navy/50 dark:text-slate-400">{post.location}</span>
                  )}
                </div>
                <p className="text-navy dark:text-slate-100">{post.excerpt || post.text}</p>
                {(post.image || post.video) && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-navy/50 dark:text-slate-400">
                    {post.image && '📷 Photo attached'}
                    {post.video && '🎬 Video attached'}
                  </div>
                )}
                <div className="flex items-center gap-4 mt-3 text-xs text-navy/50 dark:text-slate-400">
                  <span>❤️ {post.likes}</span>
                  <span>💬 {post.comments}</span>
                  <span>{post.date}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-navy/30 dark:text-slate-400 shrink-0 mt-2" />
            </div>
          </motion.div>
        ))}

        {activeTab === 'Reviews' && reviews.length === 0 && (
          <EmptyState icon={Star} title="No reviews yet." />
        )}
        {activeTab === 'Reviews' && reviews.map((review: any) => (
          <motion.div
            key={review.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate(`/landmark/${review.landmark_id || ''}`)}
            whileHover={{ y: -2, boxShadow: '0 8px 25px rgba(0,0,0,0.08)' }}
            className="bg-white dark:bg-slate-card rounded-[20px] p-5 shadow-soft dark:shadow-soft-dark border border-sand dark:border-slate-border cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-navy/60 dark:text-slate-400">
                    Reviewed {review.landmark_name}
                  </span>
                  <span className="text-xs text-navy/50 dark:text-slate-400">{review.created_at}</span>
                </div>
                <div className="flex gap-1 mb-2">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-sm text-navy/70 dark:text-slate-300">{review.text}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-navy/30 dark:text-slate-400 shrink-0 mt-2" />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
