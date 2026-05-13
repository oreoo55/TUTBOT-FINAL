import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Heart, MessageCircle, Reply, CalendarCheck, ShieldCheck, XCircle, Mail, CheckCheck, Loader2, CheckCircle2, Ban, DollarSign } from 'lucide-react';
import { api } from '../lib/api';

interface NotificationItem {
  id: number;
  type: string;
  data: {
    actor_name?: string;
    actor_id?: string;
    post_id?: string;
    comment_id?: string;
    post_excerpt?: string;
    comment_excerpt?: string;
    booking_id?: string;
    landmark_name?: string;
    booking_date?: string;
    refund_amount?: number;
    message?: string;
    admin_name?: string;
    reason?: string;
    amount?: number;
    currency?: string;
  };
  read_at: string | null;
  created_at: string;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  like: { icon: <Heart className="w-3.5 h-3.5" />, color: 'text-red-500' },
  comment: { icon: <MessageCircle className="w-3.5 h-3.5" />, color: 'text-blue-500' },
  reply: { icon: <Reply className="w-3.5 h-3.5" />, color: 'text-purple-500' },
  trip_reminder: { icon: <CalendarCheck className="w-3.5 h-3.5" />, color: 'text-emerald-500' },
  admin_message: { icon: <Mail className="w-3.5 h-3.5" />, color: 'text-amber-500' },
  cancellation_approved: { icon: <ShieldCheck className="w-3.5 h-3.5" />, color: 'text-emerald-500' },
  cancellation_rejected: { icon: <XCircle className="w-3.5 h-3.5" />, color: 'text-red-500' },
  booking_confirmed: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-green-500' },
  booking_cancelled: { icon: <Ban className="w-3.5 h-3.5" />, color: 'text-red-500' },
  payment_refunded: { icon: <DollarSign className="w-3.5 h-3.5" />, color: 'text-emerald-500' },
};

const typeLabel: Record<string, string> = {
  like: 'liked your post',
  comment: 'commented on your post',
  reply: 'replied to your comment',
  trip_reminder: 'Trip reminder',
  admin_message: 'Message from admin',
  cancellation_approved: 'Cancellation approved',
  cancellation_rejected: 'Cancellation rejected',
  booking_confirmed: 'Booking confirmed',
  booking_cancelled: 'Booking cancelled',
  payment_refunded: 'Payment refunded',
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get<{ count: number }>('/notifications/unread-count');
      setUnreadCount(res.count);
    } catch {
      // ignore
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: NotificationItem[] }>('/notifications');
      setNotifications(res.data);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const getLink = (n: NotificationItem): string => {
    if (n.type === 'like' || n.type === 'comment' || n.type === 'reply') {
      return n.data.post_id ? `/community?post=${n.data.post_id}` : '/community';
    }
    if (n.type === 'payment_refunded' || n.type === 'booking_confirmed' || n.type === 'booking_cancelled' || n.type === 'cancellation_approved' || n.type === 'cancellation_rejected') {
      return n.data.booking_id ? `/trip/${n.data.booking_id}` : '/profile';
    }
    if (n.type === 'trip_reminder') {
      return n.data.booking_id ? `/trip/${n.data.booking_id}` : '/profile';
    }
    return '/profile';
  };

  const renderText = (n: NotificationItem) => {
    const d = n.data;
    switch (n.type) {
      case 'like':
        return <><strong>{d.actor_name}</strong> liked your post{d.post_excerpt ? `: "${d.post_excerpt}"` : ''}</>;
      case 'comment':
        return <><strong>{d.actor_name}</strong> commented: "{d.comment_excerpt}"</>;
      case 'reply':
        return <><strong>{d.actor_name}</strong> replied: "{d.comment_excerpt}"</>;
      case 'trip_reminder':
        return <>Your trip to <strong>{d.landmark_name}</strong> is tomorrow ({d.booking_date})!</>;
      case 'admin_message':
        return <><strong>{d.admin_name || 'Admin'}:</strong> {d.message}</>;
      case 'cancellation_approved':
        return <>Cancellation for <strong>{d.landmark_name}</strong> approved{d.refund_amount ? ` — ${d.refund_amount} EGP refund` : ''}</>;
      case 'cancellation_rejected':
        return <>Cancellation request for <strong>{d.landmark_name}</strong> was rejected</>;
      case 'booking_confirmed':
        return <>Booking confirmed for <strong>{d.landmark_name}</strong> on {d.booking_date}!</>;
      case 'booking_cancelled':
        return <><strong>{d.admin_name || 'TUTBOT Support'}</strong> cancelled your booking at <strong>{d.landmark_name}</strong>{d.reason ? `: ${d.reason}` : ''}</>;
      case 'payment_refunded':
        return <>Payment of <strong>{d.amount} {d.currency}</strong> refunded for <strong>{d.landmark_name}</strong></>;
      default:
        return d.message || 'New notification';
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 text-navy/70 dark:text-slate-300 hover:text-royal dark:hover:text-gold transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] min-h-[18px] leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 glass rounded-2xl shadow-xl border border-white/40 dark:border-slate-border overflow-hidden z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-navy/5 dark:border-slate-border">
              <h3 className="text-sm font-semibold text-navy dark:text-slate-100">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs text-royal dark:text-gold hover:underline flex items-center gap-1">
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-gold animate-spin" /></div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-navy/40 dark:text-slate-500 text-xs">No notifications yet</div>
              ) : (
                notifications.map(n => {
                  const cfg = typeConfig[n.type] || { icon: <Bell className="w-3.5 h-3.5" />, color: 'text-navy' };
                  return (
                    <Link
                      key={n.id}
                      to={getLink(n)}
                      onClick={() => { if (!n.read_at) handleMarkRead(n.id); setOpen(false); }}
                      className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-sand/30 dark:hover:bg-slate-border/30 border-b border-navy/5 dark:border-slate-border/50 last:border-0 ${
                        !n.read_at ? 'bg-royal/5 dark:bg-gold/5' : ''
                      }`}
                    >
                      <span className={`mt-0.5 ${cfg.color}`}>{cfg.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-navy dark:text-slate-200 leading-relaxed">
                          {renderText(n)}
                        </p>
                        <p className="text-[10px] text-navy/40 dark:text-slate-500 mt-1">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!n.read_at && (
                        <button
                          onClick={e => { e.preventDefault(); e.stopPropagation(); handleMarkRead(n.id); }}
                          className="shrink-0 p-1 text-navy/30 dark:text-slate-500 hover:text-royal dark:hover:text-gold transition-colors"
                          title="Mark as read"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </Link>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
