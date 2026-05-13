import React, { useEffect, useState, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Star,
  Clock,
  Calendar,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudFog,
  CloudLightning,
  Wind,
  Eye,
  ArrowLeft,
  Accessibility,
  Timer,
  X,
  Send } from
'lucide-react';
import { api } from '../lib/api';
// ---- Weather helpers (Open-Meteo — free, no API key required) ----------
interface WeatherSnapshot {
  tempC: number;
  windKmh: number;
  code: number;
  isDay: boolean;
}
// Open-Meteo WMO weather codes → human label + matching lucide icon
function describeWeather(code: number): {
  label: string;
  Icon: any;
} {
  if (code === 0)
  return {
    label: 'Clear sky',
    Icon: Sun
  };
  if (code <= 3)
  return {
    label: 'Partly cloudy',
    Icon: Cloud
  };
  if (code <= 48)
  return {
    label: 'Foggy',
    Icon: CloudFog
  };
  if (code <= 57)
  return {
    label: 'Drizzle',
    Icon: CloudRain
  };
  if (code <= 67)
  return {
    label: 'Rain',
    Icon: CloudRain
  };
  if (code <= 77)
  return {
    label: 'Snow',
    Icon: CloudSnow
  };
  if (code <= 82)
  return {
    label: 'Rain showers',
    Icon: CloudRain
  };
  if (code <= 86)
  return {
    label: 'Snow showers',
    Icon: CloudSnow
  };
  if (code <= 99)
  return {
    label: 'Thunderstorm',
    Icon: CloudLightning
  };
  return {
    label: 'Unknown',
    Icon: Cloud
  };
}
// Format helpers — turn raw mock-data strings into nice display text.
const formatTime = (t: string) => {
  if (!t) return '—';
  // Mock data uses "9:00" / "17:00" — pad and add label.
  const [hStr, mStr = '00'] = t.split(':');
  const h = parseInt(hStr, 10);
  if (isNaN(h)) return t;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hh = (h + 11) % 12 + 1;
  return `${hh}:${mStr.padStart(2, '0')} ${suffix}`;
};
const formatSeason = (s: string) =>
s === 'All_Year' ? 'All year' : s.replace(/_/g, ' ');
const formatDuration = (mins: number) => {
  if (!mins) return '—';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};
interface UserReview {
  id: string;
  name: string;
  rating: number;
  text: string;
  createdAt: string;
}
export function LandmarkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [show360, setShow360] = useState(false);
  const [landmark, setLandmark] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get<any>(`/landmarks/${id}`)
      .then(data => { setLandmark(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api.get<any>(`/landmarks/${id}/reviews?per_page=50`)
      .then(data => { setReviews(data.data ?? []); })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    api.get<any>('/me').then(u => setCurrentUser(u)).catch(() => {});
  }, []);

  // ---- Live weather ------------------------------------------------------
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [weatherStatus, setWeatherStatus] = useState<
    'loading' | 'ok' | 'error'>(
    'loading');

  useEffect(() => {
    if (!landmark) return;
    let cancelled = false;
    setWeatherStatus('loading');
    setWeather(null);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${landmark.lat}&longitude=${landmark.lng}&current_weather=true`;
    fetch(url).
    then((r) => {
      if (!r.ok) throw new Error('weather request failed');
      return r.json();
    }).
    then((data) => {
      if (cancelled) return;
      const cw = data?.current_weather;
      if (!cw) {
        setWeatherStatus('error');
        return;
      }
      setWeather({
        tempC: Math.round(cw.temperature),
        windKmh: Math.round(cw.windspeed),
        code: cw.weathercode,
        isDay: cw.is_day === 1
      });
      setWeatherStatus('ok');
    }).
    catch(() => !cancelled && setWeatherStatus('error'));
    return () => {
      cancelled = true;
    };
  }, [landmark?.lat, landmark?.lng]);
  // ---- User reviews (local state — would post to API in production) -----
  const [userReviews, setUserReviews] = useState<UserReview[]>([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editText, setEditText] = useState('');
  const [editHoverRating, setEditHoverRating] = useState(0);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim() || reviewRating === 0) return;
    try {
      const created = await api.post<any>(`/landmarks/${id}/reviews`, { rating: reviewRating, text: reviewText.trim() });
      setUserReviews((prev) => [created, ...prev]);
      setReviewText('');
      setReviewRating(0);
      setReviewSubmitted(true);
      setTimeout(() => setReviewSubmitted(false), 3500);
      const res = await api.get<any>(`/landmarks/${id}/reviews?per_page=50`);
      setReviews(res.data ?? []);
    } catch {
      // submission failed
    }
  };
  const handleEditReview = (review: any) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditText(review.text);
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditRating(0);
    setEditText('');
  };

  const handleUpdateReview = async (reviewId: string) => {
    if (!editText.trim() || editRating === 0) return;
    try {
      await api.put<any>(`/reviews/${reviewId}`, { rating: editRating, text: editText.trim() });
      setEditingReviewId(null);
      setEditRating(0);
      setEditText('');
      const res = await api.get<any>(`/landmarks/${id}/reviews?per_page=50`);
      setReviews(res.data ?? []);
      const ld = await api.get<any>(`/landmarks/${id}`);
      setLandmark(ld);
    } catch {
      // update failed
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await api.delete(`/reviews/${reviewId}`);
      setDeletingReviewId(null);
      setUserReviews(prev => prev.filter(r => r.id !== reviewId));
      const res = await api.get<any>(`/landmarks/${id}/reviews?per_page=50`);
      setReviews(res.data ?? []);
      const ld = await api.get<any>(`/landmarks/${id}`);
      setLandmark(ld);
    } catch {
      // delete failed
    }
  };

  if (loading) {
    return (
      <div className="pb-20 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-10 h-10 border-4 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!landmark) {
    return (
      <div className="pb-20 flex items-center justify-center min-h-[60vh]">
        <p className="text-navy/60 dark:text-slate-300/60 text-lg">Landmark not found.</p>
      </div>
    );
  }

  const accessibilityLabel = landmark.accessibility_wheelchair ?
  'Wheelchair friendly' :
  'Limited access';
  return (
    <div className="pb-20">
      {/* Hero Image Section */}
      <div className="relative h-[60vh] w-full">
        <img
          src={landmark.image}
          alt={landmark.name}
          onError={(e) => {
            const img = e.currentTarget;
            const fallback = (landmark as any).fallback_image;
            if (fallback && img.src !== fallback) {
              img.src = fallback;
            }
          }}
          className="w-full h-full object-cover" />
        
        <div className="absolute inset-0 bg-gradient-to-t from-offwhite via-navy/20 to-navy/40" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 glass text-white p-3 rounded-full hover:bg-white/20 transition-colors z-10">
          
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-32 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-slate-card rounded-[30px] p-8 shadow-soft dark:shadow-soft-dark border border-sand dark:border-slate-border">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="bg-gold/10 text-gold px-3 py-1 rounded-lg text-sm font-medium">
                  {landmark.category}
                </span>
                <span className="bg-royal/10 text-royal dark:text-gold px-3 py-1 rounded-lg text-sm font-medium">
                  {landmark.era} Era
                </span>
                <div className="flex items-center gap-1 text-navy dark:text-slate-100 font-medium ml-auto">
                  <Star className="w-5 h-5 fill-gold text-gold" />
                  {landmark.rating}{' '}
                  <span className="text-navy/50 dark:text-slate-300/50 text-sm font-normal">
                    ({landmark.reviews} reviews)
                  </span>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-serif font-bold text-navy dark:text-slate-100 mb-4">
                {landmark.name}
              </h1>
              <p className="flex items-center gap-2 text-navy/60 dark:text-slate-300/60 mb-8 text-lg">
                <MapPin className="w-5 h-5" /> {landmark.region}, Egypt
              </p>

              <h3 className="text-xl font-serif font-bold text-navy dark:text-slate-100 mb-3">
                About
              </h3>
              <p className="text-navy/70 dark:text-slate-300/70 leading-relaxed mb-8">
                {landmark.description}
                <br />
                <br />
                Experience the grandeur of ancient history. This site offers a
                profound glimpse into the architectural and cultural
                achievements of its era, preserved through millennia for modern
                explorers to witness.
              </p>

              {/* Quick facts — sourced from mockData for this landmark */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-sand/30 dark:bg-slate-border/30 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                  <Clock className="w-6 h-6 text-royal dark:text-gold mb-2" />
                  <span className="text-xs text-navy/60 dark:text-slate-300/60 mb-1">
                    Opening Hours
                  </span>
                  <span className="text-sm font-medium text-navy dark:text-slate-100">
                    {formatTime(landmark.opening_hours)} –{' '}
                    {formatTime(landmark.closing_hours)}
                  </span>
                </div>
                <div className="bg-sand/30 dark:bg-slate-border/30 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                  <Calendar className="w-6 h-6 text-royal dark:text-gold mb-2" />
                  <span className="text-xs text-navy/60 dark:text-slate-300/60 mb-1">Best Time</span>
                  <span className="text-sm font-medium text-navy dark:text-slate-100 capitalize">
                    {(landmark.best_day_visit ?? '').toLowerCase()} ·{' '}
                    {formatSeason(landmark.best_season).toLowerCase()}
                  </span>
                </div>
                <div className="bg-sand/30 dark:bg-slate-border/30 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                  <Accessibility className="w-6 h-6 text-royal dark:text-gold mb-2" />
                  <span className="text-xs text-navy/60 dark:text-slate-300/60 mb-1">
                    Accessibility
                  </span>
                  <span className="text-sm font-medium text-navy dark:text-slate-100">
                    {accessibilityLabel}
                  </span>
                </div>
                <div className="bg-sand/30 dark:bg-slate-border/30 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                  <Timer className="w-6 h-6 text-royal dark:text-gold mb-2" />
                  <span className="text-xs text-navy/60 dark:text-slate-300/60 mb-1">Avg. Visit</span>
                  <span className="text-sm font-medium text-navy dark:text-slate-100">
                    {formatDuration(landmark.avg_visit_duration)}
                  </span>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white dark:bg-slate-card rounded-[30px] p-8 shadow-soft dark:shadow-soft-dark border border-sand dark:border-slate-border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-serif font-bold text-navy dark:text-slate-100">
                  Traveler Reviews
                </h3>
                <div className="flex items-center gap-1 text-sm text-navy/60 dark:text-slate-300/60">
                  <Star className="w-4 h-4 fill-gold text-gold" />
                  {landmark.rating} · {landmark.reviews + userReviews.length}{' '}
                  reviews
                </div>
              </div>

              {/* User-submitted reviews appear first */}
              <div className="space-y-6">
                {userReviews.map((r) =>
                <div
                  key={r.id}
                  className="bg-gold/5 border border-gold/20 rounded-2xl p-5">
                  
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-navy dark:text-slate-100 text-sm">
                          {r.name}
                        </h4>
                        <p className="text-xs text-navy/50 dark:text-slate-300/50">
                          Your review · {r.createdAt}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[...Array(r.rating)].map((_, i) =>
                        <Star
                          key={i}
                          className="w-3.5 h-3.5 fill-gold text-gold" />
                        )}
                        </div>
                        <button
                          onClick={() => handleEditReview(r)}
                          className="text-navy/40 dark:text-slate-300/40 hover:text-royal dark:hover:text-gold transition-colors p-1"
                          title="Edit review">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        <button
                          onClick={() => setDeletingReviewId(r.id)}
                          className="text-navy/40 dark:text-slate-300/40 hover:text-red-500 transition-colors p-1"
                          title="Delete review">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-navy/70 dark:text-slate-300/70 text-sm">{r.text}</p>
                  </div>
                )}

                {reviews.map((review: any) => {
                  const isOwn = currentUser && review.user?.id === currentUser.id;
                  const isEditing = editingReviewId === review.id;
                  const isDeleting = deletingReviewId === review.id;

                  if (isEditing) {
                    return (
                      <div key={review.id} className="border-b border-sand dark:border-b-slate-border pb-6 last:border-0 last:pb-0">
                        <div className="flex items-center gap-1 mb-3">
                          {[1,2,3,4,5].map(n => {
                            const filled = (editHoverRating || editRating) >= n;
                            return (
                              <button key={n} type="button"
                                onMouseEnter={() => setEditHoverRating(n)}
                                onMouseLeave={() => setEditHoverRating(0)}
                                onClick={() => setEditRating(n)}
                                className="p-0.5">
                                <Star className={`w-5 h-5 ${filled ? 'fill-gold text-gold' : 'text-navy/20 dark:text-slate-300/20'}`} />
                              </button>
                            );
                          })}
                          <span className="ml-2 text-xs text-navy/60 dark:text-slate-300/60">{editRating}/5</span>
                        </div>
                        <textarea
                          rows={3}
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          className="w-full bg-sand/30 dark:bg-slate-border/30 border border-sand dark:border-slate-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold/50 text-sm resize-none text-navy dark:text-slate-100 mb-3"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateReview(review.id)}
                            disabled={!editText.trim() || editRating === 0}
                            className="bg-gold text-white px-4 py-1.5 rounded-xl text-sm font-medium hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-navy/60 dark:text-slate-300/60 hover:text-navy dark:hover:text-slate-100 px-4 py-1.5 rounded-xl text-sm transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={review.id} className={`border-b border-sand dark:border-b-slate-border pb-6 last:border-0 last:pb-0 ${isDeleting ? 'opacity-40' : ''}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={review.user?.avatar || review.avatar}
                            alt={review.user?.name || review.name}
                            className="w-10 h-10 rounded-full object-cover cursor-pointer"
                            onClick={() => review.user?.id && navigate(`/user/${review.user.id}`)} />
                          <div>
                            <h4
                              className="font-medium text-navy dark:text-slate-100 text-sm cursor-pointer hover:text-royal dark:hover:text-gold transition-colors"
                              onClick={() => review.user?.id && navigate(`/user/${review.user.id}`)}>
                              {review.user?.name || review.name}
                            </h4>
                            <p className="text-xs text-navy/50 dark:text-slate-300/50">
                              {review.location || 'Verified traveler'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[...Array(review.rating)].map((_, i) =>
                              <Star key={i} className="w-3 h-3 fill-gold text-gold" />
                            )}
                          </div>
                          {isOwn && !isDeleting && (
                            <>
                              <button
                                onClick={() => handleEditReview(review)}
                                className="text-navy/40 dark:text-slate-300/40 hover:text-royal dark:hover:text-gold transition-colors p-1"
                                title="Edit review">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                              </button>
                              <button
                                onClick={() => setDeletingReviewId(review.id)}
                                className="text-navy/40 dark:text-slate-300/40 hover:text-red-500 transition-colors p-1"
                                title="Delete review">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-navy/70 dark:text-slate-300/70 text-sm">{review.text}</p>
                      {isDeleting && (
                        <div className="mt-3 flex items-center gap-2">
                          <p className="text-sm text-red-600">Delete this review?</p>
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
                          >
                            Yes, delete
                          </button>
                          <button
                            onClick={() => setDeletingReviewId(null)}
                            className="text-navy/60 dark:text-slate-300/60 hover:text-navy dark:hover:text-slate-100 px-3 py-1 rounded-lg text-xs transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit a review form */}
              <div className="mt-8 pt-8 border-t border-sand dark:border-t-slate-border">
                <h4 className="text-lg font-serif font-bold text-navy dark:text-slate-100 mb-1">
                  Share your experience
                </h4>
                <p className="text-sm text-navy/60 dark:text-slate-300/60 mb-5">
                  Help other travelers by leaving a review of your visit.
                </p>

                {reviewSubmitted &&
                <motion.div
                  initial={{
                    opacity: 0,
                    y: -6
                  }}
                  animate={{
                    opacity: 1,
                    y: 0
                  }}
                  className="mb-4 bg-green-50 dark:bg-green-500/10 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
                  
                    Thanks for sharing! Your review has been added.
                  </motion.div>
                }

                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-navy/70 dark:text-slate-300/70 mb-2">
                      Rating
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => {
                        const filled = (hoverRating || reviewRating) >= n;
                        return (
                          <button
                            key={n}
                            type="button"
                            onMouseEnter={() => setHoverRating(n)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setReviewRating(n)}
                            aria-label={`${n} star${n > 1 ? 's' : ''}`}
                            className="p-1 hover:scale-110 transition-transform">
                            
                            <Star
                              className={`w-7 h-7 transition-colors ${filled ? 'fill-gold text-gold' : 'text-navy/20 dark:text-slate-300/30'}`} />
                            
                          </button>);

                      })}
                      {reviewRating > 0 &&
                      <span className="ml-2 text-sm text-navy/60 dark:text-slate-300/60">
                          {reviewRating}/5
                        </span>
                      }
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-navy/70 dark:text-slate-300/70 mb-1">
                      Your review
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder={`What stood out about ${landmark.name}?`}
                      className="w-full bg-sand/30 dark:bg-slate-border/30 border border-sand dark:border-slate-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold/50 text-sm resize-none text-navy dark:text-slate-100" />
                    
                  </div>

                  <button
                    type="submit"
                    disabled={
                    !reviewText.trim() ||
                    reviewRating === 0
                    }
                    className="inline-flex items-center gap-2 bg-gold text-white px-6 py-2.5 rounded-xl font-medium hover:bg-gold/90 transition-colors shadow-glow disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
                    
                    <Send className="w-4 h-4" /> Submit Review
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <div className="bg-white dark:bg-slate-card rounded-[30px] p-6 shadow-soft dark:shadow-soft-dark border border-sand dark:border-slate-border sticky top-28">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-navy/60 dark:text-slate-300/60 text-sm mb-1">Entry Ticket</p>
                  <p className="text-3xl font-serif font-bold text-navy dark:text-slate-100">
                    {landmark.price === 0 ? 'Free' : `${landmark.price} EGP`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShow360(true)}
                className="w-full mb-4 bg-royal/5 text-royal dark:text-gold border border-royal/20 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-royal/10 transition-colors">
                
                <Eye className="w-5 h-5" /> Virtual 360° Tour
              </button>

              <button
                onClick={() => navigate(`/book/${landmark.id}`)}
                className="w-full bg-gold text-white py-4 rounded-xl font-medium shadow-glow hover:bg-gold/90 transition-colors text-lg animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] hover:animate-none">
                
                Book Ticket Now
              </button>

              <p className="text-center text-xs text-navy/40 dark:text-slate-300/40 mt-4">
                Secure booking via TUTBOT. Free cancellation up to 24h before.
              </p>
            </div>

            {/* Live Weather Widget — Open-Meteo */}
            <WeatherCard
              region={landmark.region}
              weather={weather}
              status={weatherStatus} />
            
          </div>
        </div>
      </div>

      {/* Functional 360° Street View Modal */}
      <AnimatePresence>
        {show360 &&
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/90 backdrop-blur-sm p-4 md:p-6"
          onClick={() => setShow360(false)}>
          
            <motion.div
            initial={{
              scale: 0.9,
              opacity: 0
            }}
            animate={{
              scale: 1,
              opacity: 1
            }}
            exit={{
              scale: 0.9,
              opacity: 0
            }}
            onClick={(e) => e.stopPropagation()}
            className="bg-navy w-full max-w-6xl aspect-video rounded-[24px] relative overflow-hidden border border-white/20 shadow-2xl">
            
              <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
                <div className="flex items-center justify-between pointer-events-auto">
                  <div className="flex items-center gap-2 text-white">
                    <Eye className="w-5 h-5 text-gold" />
                    <div>
                      <h2 className="font-serif font-bold text-lg leading-tight">
                        360° Street View
                      </h2>
                      <p className="text-xs text-white/70">
                        {landmark.name} — drag to look around
                      </p>
                    </div>
                  </div>
                  <button
                  onClick={() => setShow360(false)}
                  aria-label="Close 360 view"
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors text-white">
                  
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <iframe
              title={`360° tour of ${landmark.name}`}
              src={(landmark as any).panorama_url}
              className="w-full h-full border-0"
              loading="lazy"
              allow="fullscreen"
              referrerPolicy="no-referrer-when-downgrade" />
            

              <div className="absolute bottom-0 left-0 right-0 z-20 p-3 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
                <p className="text-xs text-white/70 text-center">
                  Live Google Street View · If unavailable at this spot, you'll
                  see the satellite view of the area.
                </p>
              </div>
            </motion.div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}

function WeatherCard({
  region,
  weather,
  status




}: {region: string;weather: WeatherSnapshot | null;status: 'loading' | 'ok' | 'error';}) {
  return (
    <div className="bg-gradient-to-br from-blue-50 dark:from-blue-500/10 to-blue-100 dark:to-blue-500/20 rounded-[30px] p-6 shadow-soft dark:shadow-soft-dark border border-blue-200 dark:border-blue-500/20">
      <h4 className="font-serif font-bold text-navy dark:text-slate-100 mb-4 flex items-center gap-2">
        Current Weather in {region}
      </h4>

      {status === 'loading' &&
      <div className="flex items-center gap-3 text-navy/60 dark:text-slate-300/60 text-sm">
          <div className="w-10 h-10 rounded-full bg-white/60 animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-24 bg-white/60 rounded animate-pulse" />
            <div className="h-3 w-32 bg-white/60 rounded animate-pulse" />
          </div>
        </div>
      }

      {status === 'error' &&
      <p className="text-sm text-navy/60 dark:text-slate-300/60">
          Weather data is currently unavailable. Please check again shortly.
        </p>
      }

      {status === 'ok' && weather &&
      <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(() => {
              const { Icon } = describeWeather(weather.code);
              return (
                <Icon
                  className={`w-10 h-10 ${weather.isDay ? 'text-yellow-500' : 'text-navy/70 dark:text-slate-300/70'}`} />);


            })()}
              <div>
                <p className="text-3xl font-bold text-navy dark:text-slate-100">
                  {weather.tempC}°C
                </p>
                <p className="text-sm text-navy/60 dark:text-slate-300/60">
                  {describeWeather(weather.code).label}
                </p>
              </div>
            </div>
            <div className="text-right text-sm text-navy/60 dark:text-slate-300/60 space-y-1">
              <p className="flex items-center justify-end gap-1.5">
                <Wind className="w-3.5 h-3.5" /> {weather.windKmh} km/h
              </p>
              <p className="text-xs text-navy/40 dark:text-slate-300/40">
                {weather.isDay ? 'Daytime' : 'Nighttime'}
              </p>
            </div>
          </div>
          <p className="text-[11px] text-navy/40 dark:text-slate-300/40 mt-3">
            Live data · Open-Meteo
          </p>
        </>
      }
    </div>);

}
