import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Image as ImageIcon,
  Award,
  Map,
  Heart,
  MessageCircle,
  Share2,
  Medal,
  Video,
  MapPin,
  X,
  Send,
  Sparkles,
  Smile,
  Reply,
  Bot,
  Edit3,
  Trash2,
  Check } from
'lucide-react';
import { Counter } from '../components/Counter';
import { topTravelers, travelStories, landmarks } from '../data/mockData';
import { api, getAuthToken } from '../lib/api';
import { ConfirmModal } from '../components/ConfirmModal';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
interface Comment {
  id: string;
  userId?: string;
  author: {
    name: string;
    avatar: string;
  };
  text: string;
  timeAgo: string;
  isAI?: boolean;
  replies?: Comment[];
}
interface Post {
  id: string;
  traveler: {
    id?: string;
    name: string;
    avatar: string;
  };
  location: string;
  category: string;
  image?: string;
  video?: string;
  excerpt: string;
  likes: number;
  comments: number;
  date: string;
  liked?: boolean;
  commentList?: Comment[];
}
// AI Guide mock suggestions per landmark
const AI_SUGGESTIONS: Record<string, string> = {
  'Pyramids of Giza':
  'Best visited at sunrise (6-7 AM) to avoid crowds and heat. Consider hiring a licensed guide near the entrance for ~150 EGP.',
  'Luxor Temple':
  'The temple is magical after dark when fully illuminated. Combine with a Karnak Temple visit for a full day of history.',
  'Abu Simbel':
  "Don't miss the Sun Festival (Feb 22 & Oct 22) when sunlight illuminates the inner sanctuary statues.",
  'Karnak Temple':
  'Allow at least 3 hours. The Great Hypostyle Hall with its 134 columns is the highlight — visit early morning for best light.',
  'Siwa Oasis':
  "Stay at an eco-lodge for the authentic experience. Try the salt lake floating and Cleopatra's spring at sunset.",
  'Al-Azhar Mosque':
  'Dress modestly (shoulders & knees covered). Free entry — explore the historic Khan El-Khalili bazaar nearby.'
};
const getAISuggestion = (location: string) =>
AI_SUGGESTIONS[location] ||
'Tut-Bot suggests booking ahead during peak season (Oct–Apr) and bringing sun protection year-round.';
export function Community() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All');
  const filters = [
  'All',
  'Archaeological',
  'Religious',
  'Recreational',
  'Recent'];

  const [posts, setPosts] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);
  const [landmarks, setLandmarks] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set()
  );
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState('');
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState('');

  useEffect(() => {
    const abort = new AbortController();
    api.get<any>('/me', { signal: abort.signal })
      .then((res) => setCurrentUser(res || null))
      .catch(() => {});
    setPostsLoading(true);
    setLeaderboardLoading(true);
    api.get<any>('/community/posts?per_page=20', { signal: abort.signal })
      .then((res) => { setPosts(res.data || []); setPostsError(''); })
      .catch(() => { setPostsError('Failed to load posts'); })
      .finally(() => setPostsLoading(false));
    api.get<any>('/community/leaderboard', { signal: abort.signal })
      .then((res) => { setLeaderboard(res.data || []); setLeaderboardError(''); })
      .catch(() => { setLeaderboardError('Failed to load leaderboard'); })
      .finally(() => setLeaderboardLoading(false));
    api.get<any>('/landmarks?per_page=100', { signal: abort.signal })
      .then((res) => setLandmarks(res.data || []))
      .catch(() => {});
    return () => abort.abort();
  }, []);

  const filteredPosts =
  activeFilter === 'All' || activeFilter === 'Recent' ?
  posts :
  posts.filter((p) => p.category === activeFilter);
  const handleAddPost = async (newPost: Post, imageFile?: File, videoFile?: File) => {
    try {
      const matched = landmarks.find((l: any) => l.name === newPost.location);
      const fd = new FormData();
      fd.append('text', newPost.excerpt);
      if (matched?.id) fd.append('landmark_id', String(matched.id));
      fd.append('category', newPost.category);
      if (imageFile) fd.append('image', imageFile);
      if (videoFile) fd.append('video', videoFile);
      const res = await api.post<any>('/community/posts', fd);
      if (res.id) newPost.id = res.id;
      if (res.image) newPost.image = res.image;
      if (res.video) newPost.video = res.video;
      if (res.traveler?.id) newPost.traveler = { ...newPost.traveler, id: res.traveler.id };
      setPosts((prev) => [{ ...newPost }, ...prev]);
    } catch {
      setPosts((prev) => [newPost, ...prev]);
    }
  };
  const handleToggleLike = (id: string) => {
    api.post<any>(`/community/posts/${id}/like`).catch(() => {});
    setPosts((prev) =>
    prev.map((p) =>
    p.id === id ?
    {
      ...p,
      liked: !p.liked,
      likes: p.liked ? p.likes - 1 : p.likes + 1
    } :
    p
    )
    );
  };
  const handleToggleComments = (id: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setPosts((prev) => {
      const post = prev.find((x) => x.id === id);
      if (post && !post.commentList) {
        api.get<any>(`/community/posts/${id}/comments`).then((res) => {
          const data = Array.isArray(res) ? res : res.data ?? [];
          setPosts((p) =>
            p.map((pp) => (pp.id === id ? { ...pp, commentList: data } : pp))
          );
        }).catch(() => {});
      }
      return prev;
    });
  };
  const handleAddComment = async (postId: string, text: string) => {
    const tempId = `c-${Date.now()}`;
    const newComment: Comment = {
      id: tempId,
      userId: currentUser?.id,
      author: {
        name: currentUser?.name || 'You',
        avatar: currentUser?.avatar || leaderboard[0]?.avatar || ''
      },
      text,
      timeAgo: 'Just now',
      replies: []
    };
    setPosts((prev) =>
    prev.map((p) =>
    p.id === postId ?
    {
      ...p,
      comments: p.comments + 1,
      commentList: [...(p.commentList || []), newComment]
    } :
    p
    )
    );
    if (/^\d+$/.test(postId)) {
      try {
        const res = await api.post<any>(`/community/posts/${postId}/comments`, { text });
        setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, commentList: (p.commentList || []).map((c) => c.id === tempId ? { ...c, id: res.id } : c) } : p));
      } catch { /* comment is already in local state */ }
    }
  };
  const handleAddReply = async (postId: string, commentId: string, text: string) => {
    const tempId = `r-${Date.now()}`;
    const newReply: Comment = {
      id: tempId,
      userId: currentUser?.id,
      author: {
        name: currentUser?.name || 'You',
        avatar: currentUser?.avatar || leaderboard[0]?.avatar || ''
      },
      text,
      timeAgo: 'Just now'
    };
    setPosts((prev) =>
    prev.map((p) =>
    p.id === postId ?
    {
      ...p,
      comments: p.comments + 1,
      commentList: (p.commentList || []).map((c) =>
      c.id === commentId ?
      {
        ...c,
        replies: [...(c.replies || []), newReply]
      } :
      c
      )
    } :
    p
    )
    );
    if (/^\d+$/.test(postId) && /^\d+$/.test(commentId)) {
      try {
        await api.post<any>(`/community/posts/${postId}/comments`, { text, parent_id: commentId });
      } catch { /* reply is already in local state */ }
    }
  };
  const handleAddAISuggestion = (postId: string, location: string) => {
    const newComment: Comment = {
      id: `ai-${Date.now()}`,
      author: {
        name: 'Tut-Bot AI',
        avatar: ''
      },
      text: getAISuggestion(location),
      timeAgo: 'Just now',
      isAI: true
    };
    setPosts((prev) =>
    prev.map((p) =>
    p.id === postId ?
    {
      ...p,
      comments: p.comments + 1,
      commentList: [...(p.commentList || []), newComment]
    } :
    p
    )
    );
    setExpandedComments((prev) => new Set(prev).add(postId));
  };
  return (
    <div className="pb-20">
      {/* Hero Strip */}
      <section className="relative pt-20 pb-32 px-6 overflow-hidden bg-navy">
        <div className="absolute inset-0 z-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
            alt="Community Background"
            className="w-full h-full object-cover" />
          
          <div className="absolute inset-0 bg-gradient-to-b from-navy via-navy/80 to-navy" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            className="text-5xl md:text-6xl font-serif font-bold text-white mb-6">
            
            Traveler <span className="text-gold">Community</span>
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
              delay: 0.1
            }}
            className="text-white/70 text-lg max-w-2xl mx-auto mb-16">
            
            Connect with fellow explorers, share your Egyptian adventures, and
            discover hidden gems through the eyes of others.
          </motion.p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
            {
              icon: Users,
              label: 'Travelers',
              value: 12500,
              suffix: '+'
            },
            {
              icon: Map,
              label: 'Trips Shared',
              value: 45000,
              suffix: '+'
            },
            {
              icon: ImageIcon,
              label: 'Photos',
              value: 150000,
              suffix: '+'
            },
            {
              icon: Award,
              label: 'Badges Earned',
              value: 8500,
              suffix: '+'
            }].
            map((stat, idx) =>
            <motion.div
              key={idx}
              initial={{
                opacity: 0,
                y: 20
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                delay: 0.2 + idx * 0.1
              }}
              className="glass-dark rounded-2xl p-6 border border-white/10">
              
                <stat.icon className="w-8 h-8 text-gold mx-auto mb-3" />
                <div className="text-3xl font-serif font-bold text-white mb-1">
                  <Counter to={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-8">
            {/* Post Creator */}
            <PostCreator onPublish={handleAddPost} landmarks={landmarks} currentUserAvatar={currentUser?.avatar || ''} />

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {filters.map((filter) =>
              <motion.button
                key={filter}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveFilter(filter)}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${activeFilter === filter ? 'bg-royal dark:bg-gold text-white shadow-md' : 'bg-white dark:bg-slate-card text-navy/60 dark:text-slate-400 hover:bg-sand/50 dark:hover:bg-slate-border border border-sand dark:border-slate-border'}`}>
                
                  {filter}
                </motion.button>
              )}
            </div>

            {/* Posts Feed */}
            <div className="space-y-6">
              {postsLoading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white dark:bg-slate-card rounded-[25px] overflow-hidden border border-sand dark:border-slate-border">
                      <div className="p-5 flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <Skeleton className="h-48 w-full !rounded-none" />
                      <div className="p-5 space-y-3">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex gap-4 pt-4 border-t border-sand dark:border-slate-border">
                          <Skeleton className="h-8 w-20 rounded-lg" />
                          <Skeleton className="h-8 w-20 rounded-lg" />
                          <Skeleton className="h-8 w-20 rounded-lg" />
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : postsError ? (
                <div className="bg-white dark:bg-slate-card rounded-[25px] p-8 border border-sand dark:border-slate-border text-center">
                  <p className="text-navy/60 dark:text-slate-300/60 mb-4">{postsError}</p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => window.location.reload()}
                    className="bg-gold text-white px-6 py-2.5 rounded-xl font-medium hover:bg-gold/90 transition-colors"
                  >
                    Retry
                  </motion.button>
                </div>
              ) : filteredPosts.length === 0 ? (
                <EmptyState icon={MessageCircle} title="No posts in this category yet." />
              ) : (
                filteredPosts.map((post, idx) =>
                <PostCard
                  key={post.id}
                  post={post}
                  idx={idx}
                  isCommentsOpen={expandedComments.has(post.id)}
                  onToggleLike={() => handleToggleLike(post.id)}
                  onToggleComments={() => handleToggleComments(post.id)}
                  onAddComment={(text) => handleAddComment(post.id, text)}
                  onAddReply={(cid, text) => handleAddReply(post.id, cid, text)}
                  onAskAI={() => handleAddAISuggestion(post.id, post.location)}
                  currentUser={currentUser}
                  onDeletePost={(pid) => setPosts((prev) => prev.filter((p) => p.id !== pid))}
                  onUpdatePost={(pid, text) => setPosts((prev) => prev.map((p) => p.id === pid ? { ...p, excerpt: text } : p))}
                  onDeleteComment={(pid, cid) => setPosts((prev) => prev.map((p) => p.id === pid ? { ...p, comments: Math.max(0, p.comments - 1), commentList: (p.commentList || []).filter((c: Comment) => c.id !== cid).map((c: Comment) => ({ ...c, replies: c.replies?.filter((r) => r.id !== cid) })) } : p))}
                  onUpdateComment={(pid, cid, text) => setPosts((prev) => prev.map((p) => p.id === pid ? { ...p, commentList: (p.commentList || []).map((c: Comment) => c.id === cid ? { ...c, text } : { ...c, replies: c.replies?.map((r) => r.id === cid ? { ...r, text } : r) }) } : p))}
                  currentUserAvatar={currentUser?.avatar || ''} />
                )
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <motion.div
              initial={{
                opacity: 0,
                x: 20
              }}
              animate={{
                opacity: 1,
                x: 0
              }}
              className="bg-white dark:bg-slate-card rounded-[25px] p-6 shadow-soft border border-sand dark:border-slate-border sticky top-28">
              
              <div className="flex items-center gap-2 mb-6">
                <Award className="w-5 h-5 text-gold" />
                <h3 className="font-serif font-bold text-xl text-navy dark:text-slate-100">
                  Top Explorers
                </h3>
              </div>

              <div className={showFullLeaderboard ? 'space-y-4 max-h-[420px] overflow-y-auto' : 'space-y-4'}>
                {leaderboardLoading ? (
                  <>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-6 w-16 rounded-md" />
                      </div>
                    ))}
                  </>
                ) : leaderboardError ? (
                  <p className="text-sm text-navy/60 dark:text-slate-300/60 text-center py-4">{leaderboardError}</p>
                ) : leaderboard.length === 0 ? (
                  <EmptyState icon={Award} title="No explorers yet." />
                ) : (
                leaderboard.slice(0, showFullLeaderboard ? 20 : 5).map((t, idx) =>
                <div
                  key={t.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-sand/30 dark:hover:bg-slate-border transition-colors cursor-pointer"
                  onClick={() => { navigate('/user/' + t.id); }}>
                  
                    <div className="relative">
                      <img
                      src={t.avatar}
                      alt={t.name}
                      className="w-12 h-12 rounded-full object-cover" />
                    
                      {idx < 3 &&
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                          <Medal
                        className={'w-3 h-3 ' + (idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : 'text-amber-600')} />
                      
                        </div>
                    }
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-navy dark:text-slate-100 text-sm">
                        {t.name}
                      </h4>
                      <p className="text-xs text-navy/50 dark:text-slate-400">
                        Level {t.level}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-gold bg-gold/10 px-2 py-1 rounded-md">
                        {t.badges} Badges
                      </span>
                    </div>
                    </div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFullLeaderboard(!showFullLeaderboard)}
                className="w-full mt-4 py-3 border border-sand dark:border-slate-border rounded-xl text-navy dark:text-slate-100 text-sm font-medium hover:bg-sand/30 dark:hover:bg-slate-border transition-colors">
                {showFullLeaderboard ? 'Show Less' : 'View Full Leaderboard'}
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>);

}
// =====================================================
// POST CREATOR
// =====================================================
function PostCreator({ onPublish, landmarks, currentUserAvatar }: {onPublish: (post: Post, imageFile?: File, videoFile?: File) => void; landmarks: any[]; currentUserAvatar: string;}) {
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState('');
  const [mediaPreview, setMediaPreview] = useState<{
    url: string;
    type: 'image' | 'video';
  } | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [taggedLandmark, setTaggedLandmark] = useState<string>('');
  const [showLandmarkDropdown, setShowLandmarkDropdown] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const handleFile = (file: File, type: 'image' | 'video') => {
    if (file.size > 20 * 1024 * 1024) return;
    const url = URL.createObjectURL(file);
    setMediaPreview({ url, type });
    if (type === 'image') setImageFile(file);
    else setVideoFile(file);
  };
  const handlePublish = () => {
    if (!text.trim() && !mediaPreview) return;
    const newPost: Post = {
      id: `post-${Date.now()}`,
      traveler: {
        name: 'You',
        avatar: currentUserAvatar
      },
      location: taggedLandmark || 'Egypt',
      category: (landmarks.find((l: any) => l.name === taggedLandmark)?.category) || 'General',
      image: mediaPreview?.type === 'image' ? mediaPreview.url : undefined,
      video: mediaPreview?.type === 'video' ? mediaPreview.url : undefined,
      excerpt: text,
      likes: 0,
      comments: 0,
      date: 'Just now',
      liked: false,
      commentList: []
    };
    onPublish(newPost, imageFile ?? undefined, videoFile ?? undefined);
    setText('');
    setMediaPreview(null);
    setImageFile(null);
    setVideoFile(null);
    setTaggedLandmark('');
    setExpanded(false);
  };
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      className={`bg-white dark:bg-slate-card rounded-[25px] shadow-soft border border-sand dark:border-slate-border ${expanded ? '' : 'overflow-hidden'}`}>
      
      {!expanded ?
      <div className="p-6 flex gap-4 items-center">
          <img
          src={currentUserAvatar}
          alt="You"
          className="w-12 h-12 rounded-full object-cover" />
        
          <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setExpanded(true)}
          className="flex-1 bg-sand/30 dark:bg-slate-border/40 hover:bg-sand/50 dark:hover:bg-slate-border transition-colors rounded-xl py-3 px-4 text-left text-navy/50 dark:text-slate-400 text-sm">
          
            What's on your mind?
          </motion.button>
          <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setExpanded(true);
            setTimeout(() => imageInputRef.current?.click(), 0);
          }}
          className="bg-royal text-white p-3 rounded-xl hover:bg-royal/90 transition-colors"
          aria-label="Add photo">
          
            <ImageIcon className="w-5 h-5" />
          </motion.button>
        </div> :

      <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <img
            src={currentUserAvatar}
            alt="You"
            className="w-12 h-12 rounded-full object-cover" />
          
            <div className="flex-1">
              <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              autoFocus
              placeholder="Share your Egyptian adventure..."
              className="w-full bg-sand/20 dark:bg-slate-card/40 border-2 border-transparent focus:border-gold focus:bg-white dark:focus:bg-slate-card rounded-xl py-3 px-4 focus:outline-none transition-colors resize-none text-navy dark:text-slate-100 placeholder:text-navy/40 dark:placeholder:text-slate-400" />
            
            </div>
            <button
            onClick={() => {
              setExpanded(false);
              setText('');
              setMediaPreview(null);
              setImageFile(null);
              setVideoFile(null);
              setTaggedLandmark('');
            }}
            className="text-navy/40 dark:text-slate-400 hover:text-navy dark:hover:text-slate-100"
            aria-label="Close">
            
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Media Preview */}
          {mediaPreview &&
        <div className="relative rounded-xl overflow-hidden border border-sand dark:border-slate-border">
              {mediaPreview.type === 'image' ?
          <img
            src={mediaPreview.url}
            alt="Upload preview"
            className="w-full max-h-80 object-cover" /> :


          <video
            src={mediaPreview.url}
            controls
            className="w-full max-h-80" />

          }
              <button
            onClick={() => { setMediaPreview(null); setImageFile(null); setVideoFile(null); }}
            className="absolute top-2 right-2 bg-navy/80 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-navy"
            aria-label="Remove media">
            
                <X className="w-4 h-4" />
              </button>
            </div>
        }

          {/* Tagged Landmark */}
          {taggedLandmark &&
        <div className="inline-flex items-center gap-2 bg-gold/10 text-gold px-3 py-1.5 rounded-lg text-sm font-medium">
              <MapPin className="w-3.5 h-3.5" /> {taggedLandmark}
              <button
            onClick={() => setTaggedLandmark('')}
            aria-label="Remove tag"
            className="hover:text-gold/70">
            
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
        }

          {/* Toolbar */}
          <div className="flex items-center justify-between pt-4 border-t border-sand dark:border-slate-border">
            <div className="flex items-center gap-1">
              <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sand/40 dark:hover:bg-slate-border text-navy/70 dark:text-slate-400 text-sm transition-colors"
              aria-label="Add image">
              
                <ImageIcon className="w-4 h-4 text-green-600" />
                <span className="hidden sm:inline">Photo</span>
              </motion.button>
              <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => videoInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sand/40 dark:hover:bg-slate-border text-navy/70 dark:text-slate-400 text-sm transition-colors"
              aria-label="Add video">
              
                <Video className="w-4 h-4 text-red-500" />
                <span className="hidden sm:inline">Video</span>
              </motion.button>
              <div className="relative">
                <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowLandmarkDropdown((s) => !s)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sand/40 dark:hover:bg-slate-border text-navy/70 dark:text-slate-400 text-sm transition-colors">
                
                  <MapPin className="w-4 h-4 text-royal dark:text-gold" />
                  <span className="hidden sm:inline">Tag landmark</span>
                </motion.button>
                <AnimatePresence>
                  {showLandmarkDropdown &&
                <motion.div
                  initial={{
                    opacity: 0,
                    y: -5
                  }}
                  animate={{
                    opacity: 1,
                    y: 0
                  }}
                  exit={{
                    opacity: 0,
                    y: -5
                  }}
                  className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-card rounded-xl shadow-xl border border-sand dark:border-slate-border py-2 z-50 max-h-64 overflow-y-auto">
                  
                      {landmarks.map((l) =>
                  <button
                    key={l.id}
                    onClick={() => {
                      setTaggedLandmark(l.name);
                      setShowLandmarkDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-sand/30 dark:hover:bg-slate-border flex items-center gap-2">
                    
                          <MapPin className="w-4 h-4 text-royal/60 dark:text-gold/60" />
                          <div>
                            <p className="text-sm font-medium text-navy dark:text-slate-100">
                              {l.name}
                            </p>
                            <p className="text-xs text-navy/50 dark:text-slate-400">
                              {l.region}
                            </p>
                          </div>
                        </button>
                  )}
                    </motion.div>
                }
                </AnimatePresence>
              </div>
              <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sand/40 dark:hover:bg-slate-border text-navy/70 dark:text-slate-400 text-sm transition-colors"
              aria-label="Add emoji"
              onClick={() => setText(text + ' 🌟')}>
              
                <Smile className="w-4 h-4 text-amber-500" />
              </motion.button>
            </div>

            <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handlePublish}
            disabled={!text.trim() && !mediaPreview}
            className="bg-gold text-white px-6 py-2 rounded-xl font-medium hover:bg-gold/90 hover:shadow-glow transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
            
              <Send className="w-4 h-4" /> Post
            </motion.button>
          </div>

          <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f, 'image');
          }} />
        
          <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f, 'video');
          }} />
        
        </div>
      }
    </motion.div>);

}
// =====================================================
// POST CARD
// =====================================================
interface PostCardProps {
  post: Post;
  idx: number;
  isCommentsOpen: boolean;
  onToggleLike: () => void;
  onToggleComments: () => void;
  onAddComment: (text: string) => void;
  onAddReply: (commentId: string, text: string) => void;
  onAskAI: () => void;
  currentUser: any;
  onDeletePost: (id: string) => void;
  onUpdatePost: (id: string, text: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onUpdateComment: (postId: string, commentId: string, text: string) => void;
  currentUserAvatar: string;
}
const PostCard = React.memo(function PostCard({
  post,
  idx,
  isCommentsOpen,
  onToggleLike,
  onToggleComments,
  onAddComment,
  onAddReply,
  onAskAI,
  currentUser,
  onDeletePost,
  onUpdatePost,
  onDeleteComment,
  onUpdateComment,
  currentUserAvatar
}: PostCardProps) {
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingPost, setEditingPost] = useState(false);
  const [editPostText, setEditPostText] = useState(post.excerpt);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [editReplyText, setEditReplyText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{type: string; id?: string} | null>(null);
  const isOwnPost = currentUser && String(post.traveler?.id) === String(currentUser.id);
  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    onAddComment(commentText);
    setCommentText('');
  };
  const handleSubmitReply = (cid: string) => {
    if (!replyText.trim()) return;
    onAddReply(cid, replyText);
    setReplyText('');
    setReplyingTo(null);
  };
  const handleDeletePost = () => {
    api.delete(`/community/posts/${post.id}`).catch(() => {});
    onDeletePost(post.id);
  };
  const handleSavePostEdit = () => {
    if (!editPostText.trim()) return;
    api.put(`/community/posts/${post.id}`, { text: editPostText }).catch(() => {});
    onUpdatePost(post.id, editPostText);
    setEditingPost(false);
  };
  const handleDeleteComment = (cid: string) => {
    api.delete(`/community/posts/${post.id}/comments/${cid}`).catch(() => {});
    onDeleteComment(post.id, cid);
  };
  const handleSaveCommentEdit = (cid: string) => {
    if (!editCommentText.trim()) return;
    api.put(`/community/posts/${post.id}/comments/${cid}`, { text: editCommentText }).catch(() => {});
    onUpdateComment(post.id, cid, editCommentText);
    setEditingComment(null);
  };
  const handleDeleteReply = (rid: string) => {
    api.delete(`/community/posts/${post.id}/comments/${rid}`).catch(() => {});
    onDeleteComment(post.id, rid);
  };
  const handleSaveReplyEdit = (rid: string) => {
    if (!editReplyText.trim()) return;
    api.put(`/community/posts/${post.id}/comments/${rid}`, { text: editReplyText }).catch(() => {});
    onUpdateComment(post.id, rid, editReplyText);
    setEditingReply(null);
  };
  const confirmDeleteAction = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'post') handleDeletePost();
    else if (confirmDelete.type === 'comment') handleDeleteComment(confirmDelete.id!);
    else if (confirmDelete.type === 'reply') handleDeleteReply(confirmDelete.id!);
    setConfirmDelete(null);
  };
  const isOwnComment = (c: Comment) => currentUser && c.userId && String(c.userId) === String(currentUser.id);
  const isOwnReply = (r: Comment) => currentUser && r.userId && String(r.userId) === String(currentUser.id);
  return (
    <motion.div
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
        delay: idx * 0.05
      }}
      className="bg-white dark:bg-slate-card rounded-[25px] overflow-hidden shadow-soft border border-sand dark:border-slate-border">
      
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={post.traveler.avatar}
            alt={post.traveler.name}
            className="w-10 h-10 rounded-full object-cover cursor-pointer"
            onClick={() => post.traveler?.id && navigate(`/user/${post.traveler.id}`)} />
          
          <div>
            <h4
              className="font-medium text-navy dark:text-slate-100 text-sm cursor-pointer hover:text-royal dark:hover:text-gold transition-colors"
              onClick={() => post.traveler?.id && navigate(`/user/${post.traveler.id}`)}>
              {post.traveler.name}
            </h4>
            <p className="text-xs text-navy/50 dark:text-slate-400">
              {post.date}
            </p>
          </div>
        </div>
        <span className="bg-sand dark:bg-slate-border px-3 py-1 rounded-lg text-xs font-medium text-navy/70 dark:text-slate-300 flex items-center gap-1">
          <MapPin className="w-3 h-3" /> {post.location}
        </span>
      </div>

      {(post.image || post.video) &&
      <div className="relative max-h-[480px] overflow-hidden bg-navy/5">
          {post.image ?
        <img
          src={post.image}
          alt={post.location}
          className="w-full max-h-[480px] object-cover" /> :


        <video src={post.video} controls className="w-full max-h-[480px]" />
        }
        </div>
      }

      <div className="p-5">
        {editingPost ?
        <div className="mb-4 space-y-2">
            <textarea
            value={editPostText}
            onChange={(e) => setEditPostText(e.target.value)}
            rows={3}
            autoFocus
            className="w-full bg-sand/20 dark:bg-slate-card/40 border border-sand dark:border-slate-border rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-gold/30 text-navy dark:text-slate-100 text-sm resize-none" />
            <div className="flex gap-2">
              <button
              onClick={handleSavePostEdit}
              disabled={!editPostText.trim()}
              className="flex items-center gap-1.5 bg-gold text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-gold/90 transition-colors disabled:opacity-40">
              
                <Check className="w-3.5 h-3.5" /> Save
              </button>
              <button
              onClick={() => { setEditingPost(false); setEditPostText(post.excerpt); }}
              className="flex items-center gap-1.5 text-navy/50 dark:text-slate-400 px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-sand/30 dark:hover:bg-slate-border transition-colors">
              
                Cancel
              </button>
            </div>
          </div> :

        post.excerpt &&
        <p className="text-navy/80 dark:text-slate-300 text-sm mb-4 leading-relaxed whitespace-pre-wrap">
            {post.excerpt}
          </p>
        }

        <div className="flex items-center gap-2 border-t border-sand dark:border-slate-border pt-4">
          <button
            onClick={onToggleLike}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${post.liked ? 'text-red-500 bg-red-50 dark:bg-red-500/10' : 'text-navy/50 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'}`}
            aria-label={post.liked ? 'Unlike' : 'Like'}>
            
            <motion.span
              animate={
              post.liked ?
              {
                scale: [1, 1.3, 1]
              } :
              {
                scale: 1
              }
              }
              transition={{
                duration: 0.3
              }}>
              
              <Heart
                className={`w-5 h-5 ${post.liked ? 'fill-red-500' : ''}`} />
              
            </motion.span>
            {post.likes}
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleComments}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-navy/50 dark:text-slate-400 hover:text-royal dark:hover:text-gold hover:bg-royal/5 dark:hover:bg-gold/10 transition-colors">
            
            <MessageCircle className="w-5 h-5" /> {post.comments}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAskAI}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-navy/50 dark:text-slate-400 hover:text-gold hover:bg-gold/5 dark:hover:bg-gold/10 transition-colors"
            title="Ask Tut-Bot AI for tips about this place">
            
            <Sparkles className="w-5 h-5" />
            <span className="hidden sm:inline">AI Guide</span>
          </motion.button>
          {isOwnPost &&
          <>
              <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => { setEditingPost(true); setEditPostText(post.excerpt); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-navy/50 dark:text-slate-400 hover:text-royal dark:hover:text-gold hover:bg-royal/5 dark:hover:bg-gold/10 transition-colors"
              aria-label="Edit post">
              
                <Edit3 className="w-4 h-4" />
              </motion.button>
              <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setConfirmDelete({type: 'post'})}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-navy/50 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              aria-label="Delete post">
              
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </>}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-navy/50 dark:text-slate-400 hover:text-navy dark:hover:text-slate-100 hover:bg-sand/40 dark:hover:bg-slate-border transition-colors">
            <Share2 className="w-5 h-5" />
            <span className="hidden sm:inline">Share</span>
          </motion.button>
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {isCommentsOpen &&
          <motion.div
            initial={{
              opacity: 0,
              height: 0
            }}
            animate={{
              opacity: 1,
              height: 'auto'
            }}
            exit={{
              opacity: 0,
              height: 0
            }}
            className="overflow-hidden">
            
              <div className="border-t border-sand dark:border-slate-border mt-4 pt-4 space-y-4">
                {/* Existing comments */}
                {(post.commentList || []).length === 0 ?
              <p className="text-xs text-navy/50 dark:text-slate-400 text-center py-2">
                    No comments yet. Be the first!
                  </p> :

              (post.commentList || []).slice(0, 4).map((c) =>
              <div key={c.id} className="space-y-2">
                      <div
                  className={`flex gap-3 ${c.isAI ? 'bg-gold/5 dark:bg-gold/5 border border-gold/20 dark:border-gold/20 rounded-xl p-3' : ''}`}>
                  
                        {c.isAI ?
                  <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center shrink-0">
                            <Bot className="w-5 h-5 text-white" />
                          </div> :

                  <img
                    src={c.author.avatar}
                    alt={c.author.name}
                    className="w-9 h-9 rounded-full object-cover shrink-0 cursor-pointer"
                    onClick={() => c.userId && navigate(`/user/${c.userId}`)} />

                  }
                        <div className="flex-1 min-w-0">
                          <div
                      className={`${c.isAI ? '' : 'bg-sand/30 dark:bg-slate-border rounded-xl px-3 py-2'}`}>
                      
                            <p
                        className={`text-sm font-medium ${c.isAI ? 'text-gold' : 'text-navy dark:text-slate-100'} flex items-center gap-1`}>
                        
                              {c.isAI ? c.author.name :
                        <span className="cursor-pointer hover:text-royal dark:hover:text-gold transition-colors" onClick={() => c.userId && navigate(`/user/${c.userId}`)}>{c.author.name}</span>
                        }
                              {c.isAI &&
                        <span className="text-[10px] font-semibold bg-gold/20 text-gold px-1.5 py-0.5 rounded">
                                  AI GUIDE
                                </span>
                        }
                            </p>
                            {editingComment === c.id ?
                            <textarea
                              value={editCommentText}
                              onChange={(e) => setEditCommentText(e.target.value)}
                              rows={2}
                              autoFocus
                              className="w-full bg-white dark:bg-slate-card border border-sand dark:border-slate-border rounded-lg py-1.5 px-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 text-navy dark:text-slate-100 resize-none" /> :
                            <p className="text-sm text-navy/80 dark:text-slate-300 mt-0.5">
                              {c.text}
                            </p>}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 pl-1 text-xs text-navy/50 dark:text-slate-400">
                            {editingComment === c.id ?
                            <div className="flex gap-2">
                                <button
                                onClick={() => handleSaveCommentEdit(c.id)}
                                disabled={!editCommentText.trim()}
                                className="flex items-center gap-1 text-royal dark:text-gold font-medium hover:text-gold transition-colors disabled:opacity-40">
                                
                                  <Check className="w-3 h-3" /> Save
                                </button>
                                <button
                                onClick={() => setEditingComment(null)}
                                className="text-navy/50 dark:text-slate-400 hover:text-navy dark:hover:text-slate-100 transition-colors">
                                
                                  Cancel
                                </button>
                              </div> :
                            <>
                                <span>{c.timeAgo}</span>
                                {!c.isAI &&
                            <button
                              onClick={() =>
                              setReplyingTo(
                                replyingTo === c.id ? null : c.id
                              )
                              }
                              className="flex items-center gap-1 hover:text-royal dark:hover:text-gold font-medium transition-colors">
                              
                                      <Reply className="w-3 h-3" /> Reply
                                    </button>
                            }
                                {!c.isAI && isOwnComment(c) &&
                            <>
                                    <button
                              onClick={() => { setEditingComment(c.id); setEditCommentText(c.text); }}
                              className="flex items-center gap-1 hover:text-royal dark:hover:text-gold transition-colors">
                              
                                        <Edit3 className="w-3 h-3" />
                                      </button>
                                    <button
                              onClick={() => setConfirmDelete({type: 'comment', id: c.id})}
                              className="flex items-center gap-1 hover:text-red-500 transition-colors">
                              
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                  </>}
                              </>}
                          </div>

                          {/* Replies */}
                          {c.replies && c.replies.length > 0 &&
                    <div className="mt-3 space-y-2 pl-2 border-l-2 border-sand dark:border-slate-border">
                              {c.replies.map((r) =>
                      <div key={r.id} className="flex gap-2">
                                  <img
                          src={r.author.avatar}
                          alt={r.author.name}
                          className="w-7 h-7 rounded-full object-cover shrink-0 cursor-pointer"
                          onClick={() => r.userId && navigate(`/user/${r.userId}`)} />
                        
                                  <div className="flex-1">
                                    <div className="bg-sand/30 dark:bg-slate-border rounded-xl px-3 py-1.5">
                                      <p className="text-xs font-medium text-navy dark:text-slate-100 cursor-pointer hover:text-royal dark:hover:text-gold transition-colors"
                                         onClick={() => r.userId && navigate(`/user/${r.userId}`)}>
                                        {r.author.name}
                                      </p>
                                      {editingReply === r.id ?
                                      <textarea
                                        value={editReplyText}
                                        onChange={(e) => setEditReplyText(e.target.value)}
                                        rows={2}
                                        autoFocus
                                        className="w-full bg-white dark:bg-slate-card border border-sand dark:border-slate-border rounded-lg py-1 px-2 mt-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-gold/30 text-navy dark:text-slate-100 resize-none" /> :
                                      <p className="text-xs text-navy/80 dark:text-slate-300">
                                        {r.text}
                                      </p>}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-navy/50 dark:text-slate-400 mt-1 pl-1">
                                      {editingReply === r.id ?
                                      <div className="flex gap-2">
                                          <button
                                          onClick={() => handleSaveReplyEdit(r.id)}
                                          disabled={!editReplyText.trim()}
                                          className="flex items-center gap-0.5 text-royal dark:text-gold font-medium hover:text-gold transition-colors disabled:opacity-40">
                                          
                                            <Check className="w-2.5 h-2.5" /> Save
                                          </button>
                                          <button
                                          onClick={() => setEditingReply(null)}
                                          className="hover:text-navy dark:hover:text-slate-100 transition-colors">
                                          
                                            Cancel
                                          </button>
                                        </div> :
                                      <>
                                          <span>{r.timeAgo}</span>
                                          {isOwnReply(r) &&
                                      <>
                                              <button
                                        onClick={() => { setEditingReply(r.id); setEditReplyText(r.text); }}
                                        className="hover:text-royal dark:hover:text-gold transition-colors">
                                        
                                                  <Edit3 className="w-2.5 h-2.5" />
                                                </button>
                                              <button
                                        onClick={() => setConfirmDelete({type: 'reply', id: r.id})}
                                        className="hover:text-red-500 transition-colors">
                                        
                                                  <Trash2 className="w-2.5 h-2.5" />
                                                </button>
                                            </>}
                                        </>}
                                    </div>
                                  </div>
                                </div>
                      )}
                            </div>
                    }

                          {/* Reply Input */}
                          {replyingTo === c.id &&
                    <div className="mt-2 flex gap-2 items-center">
                              <img
                        src={currentUserAvatar}
                        alt="You"
                        className="w-7 h-7 rounded-full object-cover" />
                      
                              <input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) =>
                        e.key === 'Enter' && handleSubmitReply(c.id)
                        }
                        placeholder={`Reply to ${c.author.name}...`}
                        autoFocus
                        className="flex-1 bg-sand/30 dark:bg-slate-border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 text-navy dark:text-slate-100 dark:placeholder:text-slate-400" />
                      
                              <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleSubmitReply(c.id)}
                        disabled={!replyText.trim()}
                        className="text-royal dark:text-gold hover:text-gold disabled:text-navy/30 dark:disabled:text-slate-500 transition-colors"
                        aria-label="Send reply">
                        
                                <Send className="w-4 h-4" />
                              </motion.button>
                            </div>
                    }
                        </div>
                      </div>
                    </div>
              )
              }

                {/* Add comment */}
                <div className="flex gap-3 items-center pt-2">
                  <img
                  src={currentUserAvatar}
                  alt="You"
                  className="w-9 h-9 rounded-full object-cover shrink-0" />
                
                  <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) =>
                  e.key === 'Enter' && handleSubmitComment()
                  }
                  placeholder="Write a comment..."
                  className="flex-1 bg-sand/30 dark:bg-slate-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 text-navy dark:text-slate-100 dark:placeholder:text-slate-400" />
                
                  <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim()}
                  className="bg-royal text-white p-2 rounded-xl hover:bg-royal/90 disabled:opacity-40 transition-colors"
                  aria-label="Post comment">
                  
                    <Send className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          }
        </AnimatePresence>
      </div>

      <ConfirmModal
        open={!!confirmDelete}
        title={`Delete ${confirmDelete?.type === 'post' ? 'Post' : confirmDelete?.type === 'comment' ? 'Comment' : 'Reply'}`}
        message={`Are you sure you want to delete this ${confirmDelete?.type ?? 'item'}? This cannot be undone.`}
        confirmLabel="Delete"
        confirmDanger
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete(null)}
      />
    </motion.div>);

});
export default Community;
