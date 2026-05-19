import { useEffect, useState, useCallback, useRef, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, MapPin, ShieldCheck, FileDown,
  Plus, Pencil, Trash2, X, Search, Loader2, Download,
  Sun, Moon, Mail, AlertTriangle, XCircle, CheckCircle2, QrCode, ScanLine, Upload, Camera, CameraOff,
  Users, Shield, Medal, Map, BadgeCheck, Wallet
} from 'lucide-react';
import { api, getAuthToken } from '../lib/api';
import { ConfirmModal } from '../components/ConfirmModal';
import { useTheme } from '../contexts/ThemeContext';
import type { Landmark, User } from '../lib/types';

type Tab = 'stats' | 'users' | 'landmarks' | 'moderation' | 'bookings' | 'payments' | 'verify';
type ModSubTab = 'reviews' | 'posts' | 'comments';

interface AdminStats {
  users: number;
  landmarks: number;
  bookings: number;
  reviews: number;
  posts: number;
  comments: number;
  recent_bookings: {
    id: number;
    user: string;
    landmark: string;
    total: number;
    currency: string;
    status: string;
    created_at: string;
  }[];
}

interface ReviewItem {
  id: number;
  user: { id: number; name: string; avatar: string | null; email?: string };
  landmark?: { id: number; name: string };
  rating: number;
  text: string;
  created_at: string;
}

interface PostItem {
  id: number;
  user: { id: number; name: string; avatar: string | null; email?: string };
  landmark?: { id: number; name: string };
  location: string;
  category: string;
  excerpt: string;
  image: string | null;
  created_at: string;
}

interface CommentItem {
  id: number;
  user: { id: number; name: string; avatar: string | null; email?: string };
  post?: { id: number };
  text: string;
  created_at: string;
}

interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'stats', label: 'Stats', icon: <LayoutDashboard className="w-4 h-4" /> },
  { key: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
  { key: 'landmarks', label: 'Landmarks', icon: <MapPin className="w-4 h-4" /> },
  { key: 'moderation', label: 'Moderation', icon: <ShieldCheck className="w-4 h-4" /> },
  { key: 'bookings', label: 'Bookings', icon: <FileDown className="w-4 h-4" /> },
  { key: 'payments', label: 'Payments', icon: <Wallet className="w-4 h-4" /> },
  { key: 'verify', label: 'Verify Ticket', icon: <QrCode className="w-4 h-4" /> },
];

const modSubTabs: { key: ModSubTab; label: string }[] = [
  { key: 'reviews', label: 'Reviews' },
  { key: 'posts', label: 'Posts' },
  { key: 'comments', label: 'Comments' },
];

const emptyLandmark = {
  name: '', region: '', city: '', area: '', category: 'Archaeological',
  description: '', image: '', lat: 0, lng: 0, price: 0,
  opening_hours: '', closing_hours: '',
};

export function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('stats');
  const [modSubTab, setModSubTab] = useState<ModSubTab>('reviews');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Stats
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Users
  const [users, setUsers] = useState<User[]>([]);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersSortField, setUsersSortField] = useState<string>('name');
  const [usersSortDir, setUsersSortDir] = useState<'asc' | 'desc'>('asc');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);

  // Landmarks
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [landmarkSearch, setLandmarkSearch] = useState('');
  const [landmarkSortField, setLandmarkSortField] = useState<string>('name');
  const [landmarkSortDir, setLandmarkSortDir] = useState<'asc' | 'desc'>('asc');
  const [showLandmarkModal, setShowLandmarkModal] = useState(false);
  const [editingLandmark, setEditingLandmark] = useState<Landmark | null>(null);
  const [landmarkForm, setLandmarkForm] = useState(emptyLandmark);
  const [savingLandmark, setSavingLandmark] = useState(false);
  const [deleteLandmarkId, setDeleteLandmarkId] = useState<number | null>(null);
  const [imageMode, setImageMode] = useState<'url' | 'file'>('url');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Moderation lists
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [modPage, setModPage] = useState(1);
  const [modTotal, setModTotal] = useState(0);
  const [modLastPage, setModLastPage] = useState(1);
  const [modLoading, setModLoading] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{ type: ModSubTab; id: number } | null>(null);
  const [selectedModIds, setSelectedModIds] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  // Moderation filters
  const [modFilters, setModFilters] = useState({ landmark: '', city: '', username: '', email: '', date_from: '', date_to: '' });
  const [modFilterOpen, setModFilterOpen] = useState(false);

  // Admin Notify
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [notifySending, setNotifySending] = useState(false);
  const [allUsers, setAllUsers] = useState<{ id: number; name: string; email: string }[]>([]);

  // QR Verify
  const [qrTokenInput, setQrTokenInput] = useState('');
  const [qrVerifying, setQrVerifying] = useState(false);
  const [qrResult, setQrResult] = useState<{ valid: boolean; error?: string; booking?: any } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera scanning
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number>(0);

  // Payment approvals
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState('');
  const [processingPaymentId, setProcessingPaymentId] = useState<number | null>(null);
  const [rejectPaymentId, setRejectPaymentId] = useState<number | null>(null);
  const [rejectPaymentReason, setRejectPaymentReason] = useState('');

  const handleQrVerify = async (token: string) => {
    if (!token || token.length !== 64) {
      setQrResult({ valid: false, error: 'Invalid QR token — must be 64 characters.' });
      return;
    }
    setQrVerifying(true);
    setQrResult(null);
    try {
      const res = await api.post<{ valid: boolean; error?: string; booking?: any }>('/admin/bookings/verify-qr', { qr_token: token });
      setQrResult(res);
    } catch (err: any) {
      const msg = err?.body?.error || err?.message || 'Failed to verify QR code.';
      setQrResult({ valid: false, error: msg });
    }
    setQrVerifying(false);
  };

  const handleQrFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { setQrResult({ valid: false, error: 'Failed to read image.' }); return; }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      try {
        const jsQR = (await import('jsqr')).default;
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          setQrTokenInput(code.data);
          handleQrVerify(code.data);
        } else {
          setQrResult({ valid: false, error: 'No QR code found in the image.' });
          setQrVerifying(false);
        }
      } catch {
        setQrResult({ valid: false, error: 'Failed to decode QR image.' });
        setQrVerifying(false);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const startCameraScan = async () => {
    setScanning(true);
    setQrResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        scanFrame();
      }
    } catch {
      setScanning(false);
      setQrResult({ valid: false, error: 'Failed to access camera. Please check permissions.' });
    }
  };

  const stopCameraScan = () => {
    setScanning(false);
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const scanFrame = async () => {
    if (!scanning || !videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState < 2) {
      scanLoopRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    try {
      const jsQR = (await import('jsqr')).default;
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) {
        stopCameraScan();
        setQrTokenInput(code.data);
        handleQrVerify(code.data);
        return;
      }
    } catch {
      // ignore decode errors in loop
    }
    scanLoopRef.current = requestAnimationFrame(scanFrame);
  };

  // Bookings management
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsSortField, setBookingsSortField] = useState<string>('created_at');
  const [bookingsSortDir, setBookingsSortDir] = useState<'asc' | 'desc'>('desc');
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsTotal, setBookingsTotal] = useState(0);
  const [bookingsLastPage, setBookingsLastPage] = useState(1);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsFilters, setBookingsFilters] = useState({ landmark: '', city: '', username: '', phone: '', email: '', date_from: '', date_to: '' });
  const [bookingsFilterOpen, setBookingsFilterOpen] = useState(false);

  // Booking export
  const [exporting, setExporting] = useState(false);
  const [exportStart, setExportStart] = useState('');
  const [exportEnd, setExportEnd] = useState('');
  const [exportFilters, setExportFilters] = useState({ landmark: '', city: '', username: '', phone: '', email: '' });

  // Cancellation Requests
  const [cancelRequests, setCancelRequests] = useState<any[]>([]);
  const [cancelRequestsLoading, setCancelRequestsLoading] = useState(false);
  const [processingCancelId, setProcessingCancelId] = useState<number | null>(null);
  const [rejectConfirmId, setRejectConfirmId] = useState<number | null>(null);

  const checkAdmin = useCallback(async () => {
    try {
      const me = await api.get<User>('/me');
      if (!me.is_admin) {
        navigate('/', { replace: true });
        return false;
      }
      return true;
    } catch {
      navigate('/login', { replace: true });
      return false;
    }
  }, [navigate]);

  const fetchStats = useCallback(async () => {
    try {
      const [data, users] = await Promise.all([
        api.get<AdminStats>('/admin/stats'),
        api.get<{ id: number; name: string; email: string }[]>('/admin/users'),
      ]);
      setStats(data);
      setAllUsers(users);
    } catch {
      setError('Failed to load stats');
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const data = await api.get<User[]>('/admin/users/detailed');
      setUsers(data);
    } catch {
      const basic = await api.get<{ id: number; name: string; email: string }[]>('/admin/users');
      setUsers(basic.map(u => ({
        id: String(u.id), name: u.name, email: u.email, level: 0, xp: 0,
        next_level_xp: 100, badges: [], created_at: '', avatar: null, location: null, bio: null, is_admin: false,
      } as User)));
    }
    setUsersLoading(false);
  }, []);

  const fetchLandmarks = useCallback(async () => {
    try {
      const data = await api.get<Paginated<Landmark>>('/landmarks?per_page=200');
      setLandmarks(data.data);
    } catch {
      setError('Failed to load landmarks');
    }
  }, []);

  const fetchModeration = useCallback(async () => {
    setModLoading(true);
    try {
      const f = modFilters;
      const params = new URLSearchParams({ page: String(modPage), per_page: '20' });
      if (f.landmark) params.set('landmark', f.landmark);
      if (f.city) params.set('city', f.city);
      if (f.username) params.set('username', f.username);
      if (f.email) params.set('email', f.email);
      if (f.date_from) params.set('date_from', f.date_from);
      if (f.date_to) params.set('date_to', f.date_to);
      const qs = params.toString();
      const path = `/admin/${modSubTab}?${qs}`;
      if (modSubTab === 'reviews') {
        const data = await api.get<Paginated<ReviewItem>>(path);
        setReviews(data.data);
        setModTotal(data.total);
        setModLastPage(data.last_page);
      } else if (modSubTab === 'posts') {
        const data = await api.get<Paginated<PostItem>>(path);
        setPosts(data.data);
        setModTotal(data.total);
        setModLastPage(data.last_page);
      } else {
        const data = await api.get<Paginated<CommentItem>>(path);
        setComments(data.data);
        setModTotal(data.total);
        setModLastPage(data.last_page);
      }
    } catch {
      setError('Failed to load content');
    }
    setModLoading(false);
  }, [modSubTab, modPage, modFilters]);

  const fetchCancelRequests = useCallback(async () => {
    setCancelRequestsLoading(true);
    try {
      const data = await api.get<any[]>('/admin/cancellation-requests');
      setCancelRequests(data);
    } catch {
      // ignore
    }
    setCancelRequestsLoading(false);
  }, []);

  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const f = bookingsFilters;
      const params = new URLSearchParams({ page: String(bookingsPage), per_page: '10' });
      if (f.landmark) params.set('landmark', f.landmark);
      if (f.city) params.set('city', f.city);
      if (f.username) params.set('username', f.username);
      if (f.phone) params.set('phone', f.phone);
      if (f.email) params.set('email', f.email);
      if (f.date_from) params.set('date_from', f.date_from);
      if (f.date_to) params.set('date_to', f.date_to);
      const data = await api.get<Paginated<any>>(`/admin/bookings?${params.toString()}`);
      setBookings(data.data);
      setBookingsTotal(data.total);
      setBookingsLastPage(data.last_page);
    } catch {
      setError('Failed to load bookings');
    }
    setBookingsLoading(false);
  }, [bookingsPage, bookingsFilters]);

  const fetchPayments = useCallback(async () => {
    setPaymentsLoading(true);
    setPaymentsError('');
    try {
      const data = await api.get<any[]>('/admin/payments');
      setPayments(data);
    } catch {
      setPaymentsError('Failed to load payment approvals');
    }
    setPaymentsLoading(false);
  }, []);

  const handleApprovePayment = async (id: number) => {
    setProcessingPaymentId(id);
    try {
      await api.post(`/admin/payments/${id}/approve`);
      setPayments(prev => prev.filter(p => Number(p.id) !== id));
    } catch {
      setPaymentsError('Failed to approve payment');
    }
    setProcessingPaymentId(null);
  };

  const handleRejectPayment = async (id: number) => {
    setProcessingPaymentId(id);
    try {
      await api.post(`/admin/payments/${id}/reject`, { reason: rejectPaymentReason || undefined });
      setPayments(prev => prev.filter(p => Number(p.id) !== id));
      setRejectPaymentId(null);
      setRejectPaymentReason('');
    } catch {
      setPaymentsError('Failed to reject payment');
    }
    setProcessingPaymentId(null);
  };

  const handleApproveCancel = async (id: number) => {
    setProcessingCancelId(id);
    try {
      await api.post(`/admin/bookings/${id}/approve-cancellation`);
      setCancelRequests(prev => prev.filter(r => Number(r.id) !== id));
    } catch {
      setError('Failed to approve cancellation');
    }
    setProcessingCancelId(null);
  };

  const handleRejectCancel = async (id: number) => {
    setProcessingCancelId(id);
    try {
      await api.post(`/admin/bookings/${id}/reject-cancellation`);
      setCancelRequests(prev => prev.filter(r => Number(r.id) !== id));
      setRejectConfirmId(null);
    } catch {
      setError('Failed to reject cancellation');
    }
    setProcessingCancelId(null);
  };

  useEffect(() => {
    checkAdmin().then(isAdmin => {
      if (!isAdmin) return;
      setLoading(false);
      fetchStats();
      fetchLandmarks();
      fetchCancelRequests();
      fetchUsers();
    });
  }, [checkAdmin, fetchStats, fetchLandmarks, fetchCancelRequests, fetchUsers]);

  useEffect(() => {
    if (tab === 'users') fetchUsers();
    if (tab === 'moderation') fetchModeration();
    if (tab === 'bookings') fetchBookings();
    if (tab === 'payments') fetchPayments();
  }, [tab, fetchUsers, fetchModeration, fetchBookings, fetchPayments]);

  // Stop camera when leaving verify tab or unmounting
  useEffect(() => {
    return () => { if (scanning) stopCameraScan(); };
  }, [tab]);

  // ─── Landmark CRUD ─────────────────────────────────────────────────

  const resetImageState = () => {
    setImageMode('url');
    setImageFile(null);
    setImagePreview(null);
  };

  const openAddLandmark = () => {
    setEditingLandmark(null);
    setLandmarkForm(emptyLandmark);
    resetImageState();
    setShowLandmarkModal(true);
  };

  const openEditLandmark = (lm: Landmark) => {
    setEditingLandmark(lm);
    setLandmarkForm({
      name: lm.name,
      region: lm.region,
      city: lm.city ?? '',
      area: lm.area ?? '',
      category: lm.category,
      description: lm.description ?? '',
      image: lm.image,
      lat: lm.lat,
      lng: lm.lng,
      price: lm.price,
      opening_hours: lm.opening_hours ?? '',
      closing_hours: lm.closing_hours ?? '',
    });
    resetImageState();
    setImagePreview(lm.image || null);
    setShowLandmarkModal(true);
  };

  const handleSaveLandmark = async () => {
    setSavingLandmark(true);
    try {
      const hasFile = imageFile !== null;
      const body = hasFile ? (() => {
        const fd = new FormData();
        (Object.keys(landmarkForm) as (keyof typeof landmarkForm)[]).forEach(k => {
          const v = landmarkForm[k];
          if (v !== undefined && v !== null) fd.append(k, String(v));
        });
        fd.append('image', imageFile);
        if (editingLandmark) fd.append('_method', 'PUT');
        return fd;
      })() : landmarkForm;

      if (editingLandmark) {
        if (hasFile) {
          await api.post(`/admin/landmarks/${editingLandmark.id}`, body);
        } else {
          await api.put(`/admin/landmarks/${editingLandmark.id}`, body);
        }
      } else {
        await api.post('/admin/landmarks', body);
      }
      setShowLandmarkModal(false);
      fetchLandmarks();
    } catch (err: any) {
      setError(err.body?.message ?? 'Failed to save landmark');
    }
    setSavingLandmark(false);
  };

  const handleDeleteLandmark = async () => {
    if (!deleteLandmarkId) return;
    try {
      await api.delete(`/admin/landmarks/${deleteLandmarkId}`);
      setDeleteLandmarkId(null);
      fetchLandmarks();
    } catch {
      setError('Failed to delete landmark');
    }
  };

  // ─── Moderation ────────────────────────────────────────────────────

  const handleDeleteItem = async () => {
    if (!deleteItem) return;
    try {
      await api.delete(`/admin/${deleteItem.type}/${deleteItem.id}`);
      setDeleteItem(null);
      fetchModeration();
    } catch {
      setError('Failed to delete');
    }
  };

  // ─── Delete Booking ──────────────────────────────────────────────

  const [deletingBookingId, setDeletingBookingId] = useState<number | null>(null);

  const handleDeleteBooking = async (id: number) => {
    setDeletingBookingId(id);
    try {
      await api.delete(`/admin/bookings/${id}`);
      setBookings(prev => prev.filter(b => Number(b.id) !== id));
    } catch {
      setError('Failed to delete booking');
    }
    setDeletingBookingId(null);
  };

  // ─── Edit Booking ─────────────────────────────────────────────────

  const [editBookingData, setEditBookingData] = useState<any>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const handleEditBooking = async () => {
    if (!editBookingData) return;
    const id = Number(editBookingData.id);
    setSavingEdit(true);
    try {
      const payload: any = {};
      if (editBookingData.booking_date) payload.booking_date = editBookingData.booking_date;
      if (editBookingData.adults) payload.adults = editBookingData.adults;
      if (editBookingData.children !== undefined) payload.children = editBookingData.children;
      if (editBookingData.payment_method) payload.payment_method = editBookingData.payment_method;
      if (editBookingData.payment_status) payload.payment_status = editBookingData.payment_status;
      if (editBookingData.status) payload.status = editBookingData.status;
      if (editBookingData.payer_name) payload.payer_name = editBookingData.payer_name;
      if (editBookingData.payer_email) payload.payer_email = editBookingData.payer_email;
      if (editBookingData.payer_phone !== undefined) payload.payer_phone = editBookingData.payer_phone;
      await api.put(`/admin/bookings/${id}`, payload);
      setEditBookingData(null);
      fetchBookings();
    } catch {
      setError('Failed to update booking');
    }
    setSavingEdit(false);
  };

  // ─── Expandable Booking Row ───────────────────────────────────────
  const [expandedBookingId, setExpandedBookingId] = useState<number | null>(null);

  // ─── Direct Admin Cancel ──────────────────────────────────────────

  const [cancelModalBookingId, setCancelModalBookingId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancellingBookingId, setCancellingBookingId] = useState<number | null>(null);

  const handleAdminCancelBooking = async () => {
    const id = cancelModalBookingId;
    if (!id) return;
    setCancellingBookingId(id);
    try {
      await api.post(`/admin/bookings/${id}/cancel`, { reason: cancelReason || undefined });
      setBookings(prev => prev.filter(b => Number(b.id) !== id));
      setCancelModalBookingId(null);
      setCancelReason('');
    } catch {
      setError('Failed to cancel booking');
    }
    setCancellingBookingId(null);
  };

  // ─── Admin Notification ────────────────────────────────────────────

  const handleSendNotify = async () => {
    if (!notifyEmail || !notifyMessage) return;
    setNotifySending(true);
    try {
      await api.post(`/admin/users/notify`, { email: notifyEmail, message: notifyMessage });
      setNotifyOpen(false);
      setNotifyEmail('');
      setNotifyMessage('');
    } catch {
      setError('Failed to send notification');
    }
    setNotifySending(false);
  };

  // ─── Booking Export ────────────────────────────────────────────────

  const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').toLowerCase();

  const handleExportBookings = async () => {
    setExporting(true);
    try {
      const token = getAuthToken();
      const baseUrl = (import.meta as any).env?.VITE_API_URL ?? '/api';
      const params = new URLSearchParams();
      if (exportStart) params.set('start_date', exportStart);
      if (exportEnd) params.set('end_date', exportEnd);
      const ef = exportFilters;
      if (ef.landmark) params.set('landmark', ef.landmark);
      if (ef.city) params.set('city', ef.city);
      if (ef.username) params.set('username', ef.username);
      if (ef.phone) params.set('phone', ef.phone);
      if (ef.email) params.set('email', ef.email);
      const qs = params.toString();
      const url = `${baseUrl}/admin/bookings/export${qs ? '?' + qs : ''}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const nameParts: string[] = [];
      if (ef.landmark) nameParts.push(sanitize(ef.landmark));
      if (ef.city) nameParts.push(sanitize(ef.city));
      if (ef.username) nameParts.push(sanitize(ef.username));
      if (exportStart) nameParts.push(`from_${exportStart}`);
      if (exportEnd) nameParts.push(`to_${exportEnd}`);
      const filterSuffix = nameParts.length ? `_${nameParts.join('_')}` : '';
      a.download = `bookings_export${filterSuffix}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      setError('Failed to export bookings');
    }
    setExporting(false);
  };

  // ─── Theme ────────────────────────────────────────────────────────────
  const { theme, toggleTheme } = useTheme();

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showLandmarkModal) setShowLandmarkModal(false);
        else if (notifyOpen) setNotifyOpen(false);
        else if (editBookingData) setEditBookingData(null);
        else if (cancelModalBookingId) { setCancelModalBookingId(null); setCancelReason(''); }
        else if (deleteLandmarkId !== null || deleteItem !== null) { setDeleteLandmarkId(null); setDeleteItem(null); }
        else if (rejectConfirmId !== null) setRejectConfirmId(null);
        else if (rejectPaymentId !== null) { setRejectPaymentId(null); setRejectPaymentReason(''); }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (showLandmarkModal && !savingLandmark) handleSaveLandmark();
        if (editBookingData && !savingEdit) handleEditBooking();
        if (notifyOpen && !notifySending) handleSendNotify();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showLandmarkModal, notifyOpen, editBookingData, cancelModalBookingId, deleteLandmarkId, deleteItem, rejectConfirmId, savingLandmark, savingEdit, notifySending]);

  // ─── UI ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-offwhite dark:bg-midnight flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-offwhite dark:bg-midnight">
      {/* Header */}
      <header className="bg-white dark:bg-slate-card border-b border-sand dark:border-slate-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/6a9310a4-4037-4c9e-9d02-b510d3e7b3fc-removebg-preview.png"
            alt="TUTBOT"
            className="h-8 w-auto object-contain [filter:brightness(0)_saturate(100%)_invert(72%)_sepia(67%)_saturate(458%)_hue-rotate(2deg)_brightness(89%)_contrast(91%)]"
          />
          <span className="text-lg font-serif font-bold text-navy dark:text-slate-100">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="relative w-14 h-8 rounded-full bg-sand dark:bg-slate-border border border-sand dark:border-gold/30 flex items-center transition-colors duration-300"
          >
            <motion.span
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`absolute top-1 ${theme === 'dark' ? 'right-1' : 'left-1'} w-6 h-6 rounded-full bg-white dark:bg-gold flex items-center justify-center shadow-md`}
            >
              {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-navy" /> : <Sun className="w-3.5 h-3.5 text-gold" />}
            </motion.span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-navy/60 dark:text-slate-300 hover:text-royal dark:hover:text-gold transition-colors"
          >
            Back to Site
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-56 shrink-0 bg-white dark:bg-slate-card border-r border-sand dark:border-slate-border min-h-[calc(100vh-64px)] p-4 space-y-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-gold text-white'
                  : 'text-navy/70 dark:text-slate-300 hover:bg-sand/50 dark:hover:bg-slate-border/50'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* ─── STATS TAB ────────────────────────────────────────── */}
          {tab === 'stats' && stats && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-2xl font-serif font-bold text-navy dark:text-slate-100 mb-6">Dashboard Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {[
                  { label: 'Users', value: stats.users, color: 'bg-blue-500', chartColor: '#3B82F6', sparkData: [12, 19, 15, 22, 28, 24, stats.users] },
                  { label: 'Landmarks', value: stats.landmarks, color: 'bg-emerald-500', chartColor: '#10B981', sparkData: [5, 8, 12, 15, 18, 20, stats.landmarks] },
                  { label: 'Bookings', value: stats.bookings, color: 'bg-amber-500', chartColor: '#F59E0B', sparkData: stats.recent_bookings.length ? stats.recent_bookings.map((_, i) => i + 1) : [1, 3, 5, 7, 9, stats.bookings] },
                  { label: 'Reviews', value: stats.reviews, color: 'bg-purple-500', chartColor: '#8B5CF6', sparkData: [3, 7, 5, 12, 9, 15, stats.reviews] },
                  { label: 'Posts', value: stats.posts, color: 'bg-rose-500', chartColor: '#F43F5E', sparkData: [2, 4, 8, 6, 10, 12, stats.posts] },
                  { label: 'Comments', value: stats.comments, color: 'bg-cyan-500', chartColor: '#06B6D4', sparkData: [5, 9, 14, 11, 18, 16, stats.comments] },
                ].map(s => {
                  const tabMap: Record<string, Tab> = { Users: 'users', Landmarks: 'landmarks', Bookings: 'bookings', Reviews: 'moderation', Posts: 'moderation', Comments: 'moderation' };
                  return (
                  <motion.div
                    key={s.label}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    onClick={() => { if (s.label === 'Reviews' || s.label === 'Posts' || s.label === 'Comments') { setModSubTab((s.label.toLowerCase()) as ModSubTab); setTab('moderation'); } else { setTab(tabMap[s.label]); } }}
                    className="bg-white dark:bg-slate-card rounded-2xl p-4 border border-sand dark:border-slate-border cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-navy/60 dark:text-slate-400 uppercase tracking-wider">{s.label}</p>
                      <Sparkline data={s.sparkData} color={s.chartColor} />
                    </div>
                    <motion.p
                      key={s.value}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-3xl font-bold mt-1 ${s.color} bg-clip-text text-transparent`}
                    >
                      <AnimatedCounter value={s.value} />
                    </motion.p>
                  </motion.div>
                  );
                })}
              </div>

              {/* Booking Trend Chart */}
              {stats.recent_bookings.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-card rounded-2xl border border-sand dark:border-slate-border p-4 mb-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-navy dark:text-slate-100">Booking Trend</h3>
                    <span className="text-[10px] text-navy/40 dark:text-slate-500">Last 7 bookings</span>
                  </div>
                  <div className="h-28">
                    <BarChart
                      data={stats.recent_bookings.slice(0, 7).reverse().map(b => ({
                        label: new Date(b.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                        value: b.total,
                      }))}
                      color="#D4AF37"
                    />
                  </div>
                </motion.div>
              )}

              <h3 className="text-lg font-semibold text-navy dark:text-slate-100 mb-4">Recent Bookings</h3>
              <div className="bg-white dark:bg-slate-card rounded-2xl border border-sand dark:border-slate-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-sand dark:border-slate-border text-left text-navy/60 dark:text-slate-400 text-xs uppercase tracking-wider">
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Landmark</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent_bookings.map(b => (
                      <tr key={b.id} className="border-b border-sand/50 dark:border-slate-border/50 text-navy dark:text-slate-200">
                        <td className="px-4 py-3">{b.user}</td>
                        <td className="px-4 py-3">{b.landmark}</td>
                        <td className="px-4 py-3">{b.total} {b.currency}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            b.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-navy/60 dark:text-slate-400 text-xs"><RelativeTime date={b.created_at} /></td>
                      </tr>
                    ))}
                    {stats.recent_bookings.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-navy/40 dark:text-slate-500">No bookings yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ─── Cancellation Requests ───────────────────────────── */}
              <h3 className="text-lg font-semibold text-navy dark:text-slate-100 mb-4 mt-8">
                Cancellation Requests
                {cancelRequests.length > 0 && (
                  <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    {cancelRequests.length} pending
                  </span>
                )}
              </h3>
              <div className="bg-white dark:bg-slate-card rounded-2xl border border-sand dark:border-slate-border overflow-hidden">
                {cancelRequestsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                  </div>
                ) : cancelRequests.length === 0 ? (
                  <div className="px-4 py-8 text-center text-navy/40 dark:text-slate-500 text-sm">No pending cancellation requests</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-sand dark:border-slate-border text-left text-navy/60 dark:text-slate-400 text-xs uppercase tracking-wider">
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Landmark</th>
                        <th className="px-4 py-3">Booking Date</th>
                        <th className="px-4 py-3">Total</th>
                        <th className="px-4 py-3">Ref. Code</th>
                        <th className="px-4 py-3">Requested</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cancelRequests.map(r => (
                        <tr key={r.id} className="border-b border-sand/50 dark:border-slate-border/50 text-navy dark:text-slate-200">
                          <td className="px-4 py-3">{r.user?.name ?? 'N/A'}</td>
                          <td className="px-4 py-3">{r.landmark}</td>
                          <td className="px-4 py-3">{r.booking_date}</td>
                          <td className="px-4 py-3">{r.total} {r.currency}</td>
                          <td className="px-4 py-3 font-mono text-xs">{r.confirmation_code}</td>
                          <td className="px-4 py-3 text-xs text-navy/60 dark:text-slate-400">
                            <RelativeTime date={r.requested_at} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleApproveCancel(Number(r.id))}
                                disabled={processingCancelId === Number(r.id)}
                                className="px-3 py-1.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                              >
                                {processingCancelId === Number(r.id) ? '...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => setRejectConfirmId(Number(r.id))}
                                disabled={processingCancelId === Number(r.id)}
                                className="px-3 py-1.5 text-xs font-medium bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {/* ─── Admin Send Notification ──────────────────────────── */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-navy dark:text-slate-100">Send Notification</h3>
                  <button
                    onClick={() => setNotifyOpen(true)}
                    className="flex items-center gap-2 bg-gold text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gold/90 transition-colors"
                  >
                    <Mail className="w-4 h-4" /> Send Message
                  </button>
                </div>
                <p className="text-xs text-navy/50 dark:text-slate-400">
                  Send a notification message to any user. They will see it in their notification bell.
                </p>
              </div>
            </motion.div>
          )}

          {/* ─── USERS TAB ──────────────────────────────────────────── */}
          {tab === 'users' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif font-bold text-navy dark:text-slate-100">Users</h2>
                <span className="text-sm text-navy/50 dark:text-slate-400">
                  {users.length} total
                </span>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Total Users', value: users.length, icon: <Users className="w-4 h-4" />, color: 'bg-blue-500' },
                  { label: 'Admins', value: users.filter(u => u.is_admin).length, icon: <Shield className="w-4 h-4" />, color: 'bg-amber-500' },
                  { label: 'Avg Level', value: users.length ? Math.round(users.reduce((s, u) => s + (u.level || 0), 0) / users.length) : 0, icon: <Medal className="w-4 h-4" />, color: 'bg-purple-500' },
                  { label: 'Total XP', value: users.reduce((s, u) => s + (u.xp || 0), 0).toLocaleString(), icon: <Map className="w-4 h-4" />, color: 'bg-emerald-500' },
                ].map(s => (
                  <div key={s.label} className="bg-white dark:bg-slate-card rounded-2xl p-4 border border-sand dark:border-slate-border">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-navy/60 dark:text-slate-400 uppercase tracking-wider">{s.label}</p>
                      <span className={`${s.color} bg-clip-text text-transparent`}>{s.icon}</span>
                    </div>
                    <p className={`text-2xl font-bold ${s.color} bg-clip-text text-transparent`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40 dark:text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={usersSearch}
                  onChange={e => setUsersSearch(e.target.value)}
                  className="w-full bg-white dark:bg-slate-card border border-sand dark:border-slate-border rounded-xl py-2.5 pl-10 pr-10 text-sm text-navy dark:text-slate-100 focus:outline-none focus:border-gold transition-colors"
                />
                {usersSearch && (
                  <button onClick={() => setUsersSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/40 dark:text-slate-400 hover:text-navy dark:hover:text-slate-100 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {usersLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-gold animate-spin" /></div>
              ) : (
                <div className="bg-white dark:bg-slate-card rounded-2xl border border-sand dark:border-slate-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-sand dark:border-slate-border text-left text-navy/60 dark:text-slate-400 text-xs uppercase tracking-wider">
                        <SortHeader label="Name" field="name" currentField={usersSortField} direction={usersSortDir} onSort={f => { if (usersSortField === f) setUsersSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setUsersSortField(f); setUsersSortDir('asc'); } }} />
                        <SortHeader label="Email" field="email" currentField={usersSortField} direction={usersSortDir} onSort={f => { if (usersSortField === f) setUsersSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setUsersSortField(f); setUsersSortDir('asc'); } }} />
                        <SortHeader label="Level" field="level" currentField={usersSortField} direction={usersSortDir} onSort={f => { if (usersSortField === f) setUsersSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setUsersSortField(f); setUsersSortDir('asc'); } }} />
                        <SortHeader label="XP" field="xp" currentField={usersSortField} direction={usersSortDir} onSort={f => { if (usersSortField === f) setUsersSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setUsersSortField(f); setUsersSortDir('asc'); } }} />
                        <SortHeader label="Role" field="is_admin" currentField={usersSortField} direction={usersSortDir} onSort={f => { if (usersSortField === f) setUsersSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setUsersSortField(f); setUsersSortDir('asc'); } }} />
                        <SortHeader label="Created" field="created_at" currentField={usersSortField} direction={usersSortDir} onSort={f => { if (usersSortField === f) setUsersSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setUsersSortField(f); setUsersSortDir('asc'); } }} />
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...users]
                        .filter(u => !usersSearch || u.name.toLowerCase().includes(usersSearch.toLowerCase()) || u.email.toLowerCase().includes(usersSearch.toLowerCase()))
                        .sort((a, b) => {
                          const aVal = String(a[usersSortField as keyof User] ?? '');
                          const bVal = String(b[usersSortField as keyof User] ?? '');
                          const aNum = Number(a[usersSortField as keyof User]);
                          const bNum = Number(b[usersSortField as keyof User]);
                          const cmp = !isNaN(aNum) && !isNaN(bNum) ? aNum - bNum : aVal.localeCompare(bVal);
                          return usersSortDir === 'asc' ? cmp : -cmp;
                        })
                        .map(u => {
                          const isExpanded = expandedUserId === u.id;
                          return (
                            <Fragment key={u.id}>
                              <tr
                                onClick={() => setExpandedUserId(isExpanded ? null : u.id)}
                                className={`border-b border-sand/50 dark:border-slate-border/50 text-navy dark:text-slate-200 cursor-pointer transition-colors hover:bg-sand/20 dark:hover:bg-slate-border/30 ${
                                  isExpanded ? 'bg-sand/30 dark:bg-slate-border/40' : ''
                                }`}
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2.5">
                                    {u.avatar ? (
                                      <img src={u.avatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                                    ) : (
                                      <div className="w-7 h-7 rounded-full bg-royal/20 flex items-center justify-center text-xs font-bold text-royal shrink-0">
                                        {u.name.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <div>
                                      <span className="font-medium">{u.name}</span>
                                      {u.location && <span className="text-xs text-navy/50 dark:text-slate-400 ml-1">• {u.location}</span>}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs text-navy/60 dark:text-slate-400">{u.email}</td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-royal/10 text-royal dark:bg-royal/20 dark:text-royal/80">
                                    <Medal className="w-3 h-3" />{u.level ?? 0}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="text-navy dark:text-slate-200">{u.xp ?? 0}</span>
                                    {u.next_level_xp > 0 && (
                                      <div className="hidden lg:flex items-center gap-1">
                                        <div className="w-16 h-1.5 rounded-full bg-sand dark:bg-slate-border overflow-hidden">
                                          <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, ((u.xp ?? 0) / u.next_level_xp) * 100)}%` }}
                                            className="h-full rounded-full bg-gold"
                                          />
                                        </div>
                                        <span className="text-[10px] text-navy/40 dark:text-slate-500">/{u.next_level_xp}</span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  {u.is_admin ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                                      <Shield className="w-3 h-3" /> Admin
                                    </span>
                                  ) : (
                                    <span className="text-xs text-navy/40 dark:text-slate-500">User</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-xs text-navy/60 dark:text-slate-400">
                                  {u.created_at ? <RelativeTime date={u.created_at} /> : '-'}
                                </td>
                                <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => { setNotifyOpen(true); setNotifyEmail(u.email); }}
                                      className="p-1.5 text-navy/50 dark:text-slate-400 hover:text-royal dark:hover:text-gold transition-colors"
                                      title="Send notification"
                                    >
                                      <Mail className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => window.open(`/user/${u.id}`, '_blank')}
                                      className="p-1.5 text-navy/50 dark:text-slate-400 hover:text-royal dark:hover:text-gold transition-colors"
                                      title="View profile"
                                    >
                                      <BadgeCheck className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {/* Expanded details */}
                              {isExpanded && (
                                <tr>
                                  <td colSpan={7} className="px-6 py-4 bg-sand/10 dark:bg-slate-border/20">
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                                    >
                                      <div className="bg-white dark:bg-slate-card rounded-xl p-4 border border-sand dark:border-slate-border">
                                        <p className="text-[10px] text-navy/50 dark:text-slate-400 uppercase tracking-wider mb-2">Bio</p>
                                        <p className="text-sm text-navy dark:text-slate-200">{u.bio || 'No bio'}</p>
                                      </div>
                                      <div className="bg-white dark:bg-slate-card rounded-xl p-4 border border-sand dark:border-slate-border">
                                        <p className="text-[10px] text-navy/50 dark:text-slate-400 uppercase tracking-wider mb-2">Location</p>
                                        <p className="text-sm text-navy dark:text-slate-200">{u.location || 'Not set'}</p>
                                        <p className="text-[10px] text-navy/40 dark:text-slate-500 mt-1">Joined {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}</p>
                                      </div>
                                      <div className="bg-white dark:bg-slate-card rounded-xl p-4 border border-sand dark:border-slate-border">
                                        <p className="text-[10px] text-navy/50 dark:text-slate-400 uppercase tracking-wider mb-2">Badges ({u.badges?.length || 0})</p>
                                        {u.badges?.length ? (
                                          <div className="flex flex-wrap gap-1.5">
                                            {u.badges.map(b => (
                                              <span key={b.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gold/10 text-gold dark:bg-gold/20 border border-gold/20" title={b.description}>
                                                {b.icon && <span className="text-xs">{b.icon}</span>}
                                                {b.name}
                                              </span>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-xs text-navy/40 dark:text-slate-500">No badges earned</p>
                                        )}
                                      </div>
                                    </motion.div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      {users.length === 0 && (
                        <tr><td colSpan={7} className="px-4 py-8 text-center text-navy/40 dark:text-slate-500">No users found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── LANDMARKS TAB ────────────────────────────────────── */}
          {tab === 'landmarks' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif font-bold text-navy dark:text-slate-100">Landmarks</h2>
                <button
                  onClick={openAddLandmark}
                  className="flex items-center gap-2 bg-gold text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gold/90 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Landmark
                </button>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40 dark:text-slate-400" />
                <input
                  type="text"
                  placeholder="Search landmarks..."
                  value={landmarkSearch}
                  onChange={e => setLandmarkSearch(e.target.value)}
                  className="w-full bg-white dark:bg-slate-card border border-sand dark:border-slate-border rounded-xl py-2.5 pl-10 pr-10 text-sm text-navy dark:text-slate-100 focus:outline-none focus:border-gold transition-colors"
                />
                {landmarkSearch && (
                  <button
                    onClick={() => setLandmarkSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/40 dark:text-slate-400 hover:text-navy dark:hover:text-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-navy/50 dark:text-slate-400">
                  {landmarkSearch
                    ? `${landmarks.filter(l => l.name.toLowerCase().includes(landmarkSearch.toLowerCase()) || l.region.toLowerCase().includes(landmarkSearch.toLowerCase())).length} of ${landmarks.length} landmarks`
                    : `${landmarks.length} landmarks`}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-card rounded-2xl border border-sand dark:border-slate-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-sand dark:border-slate-border text-left text-navy/60 dark:text-slate-400 text-xs uppercase tracking-wider">
                      <SortHeader label="Name" field="name" currentField={landmarkSortField} direction={landmarkSortDir} onSort={f => { if (landmarkSortField === f) setLandmarkSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setLandmarkSortField(f); setLandmarkSortDir('asc'); } }} />
                      <SortHeader label="Region" field="region" currentField={landmarkSortField} direction={landmarkSortDir} onSort={f => { if (landmarkSortField === f) setLandmarkSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setLandmarkSortField(f); setLandmarkSortDir('asc'); } }} />
                      <SortHeader label="City" field="city" currentField={landmarkSortField} direction={landmarkSortDir} onSort={f => { if (landmarkSortField === f) setLandmarkSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setLandmarkSortField(f); setLandmarkSortDir('asc'); } }} />
                      <SortHeader label="Category" field="category" currentField={landmarkSortField} direction={landmarkSortDir} onSort={f => { if (landmarkSortField === f) setLandmarkSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setLandmarkSortField(f); setLandmarkSortDir('asc'); } }} />
                      <SortHeader label="Rating" field="rating" currentField={landmarkSortField} direction={landmarkSortDir} onSort={f => { if (landmarkSortField === f) setLandmarkSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setLandmarkSortField(f); setLandmarkSortDir('asc'); } }} />
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {landmarks
                      .filter(l => !landmarkSearch || l.name.toLowerCase().includes(landmarkSearch.toLowerCase()) || l.region.toLowerCase().includes(landmarkSearch.toLowerCase()))
                      .sort((a, b) => {
                        const aVal = String(a[landmarkSortField as keyof Landmark] ?? '');
                        const bVal = String(b[landmarkSortField as keyof Landmark] ?? '');
                        const aNum = Number(a[landmarkSortField as keyof Landmark]);
                        const bNum = Number(b[landmarkSortField as keyof Landmark]);
                        const cmp = !isNaN(aNum) && !isNaN(bNum) ? aNum - bNum : aVal.localeCompare(bVal);
                        return landmarkSortDir === 'asc' ? cmp : -cmp;
                      })
                      .map(lm => (
                        <tr key={lm.id} className="border-b border-sand/50 dark:border-slate-border/50 text-navy dark:text-slate-200">
                          <td className="px-4 py-3 font-medium">
                            <HoverPreview content={
                              <div className="space-y-2">
                                {lm.image && <img src={lm.image} alt={lm.name} className="w-full h-20 object-cover rounded-lg" />}
                                <p className="text-sm font-medium text-navy dark:text-slate-100">{lm.name}</p>
                                <div className="flex flex-wrap gap-1">
                                  <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-royal/10 text-royal dark:bg-royal/20 dark:text-royal/80">{lm.category}</span>
                                  <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{lm.region}</span>
                                </div>
                                <p className="text-xs text-navy/60 dark:text-slate-400 line-clamp-2">{lm.description || 'No description'}</p>
                                <div className="flex items-center justify-between text-xs text-navy/70 dark:text-slate-300">
                                  <span>{lm.city || lm.area || '—'}</span>
                                  <span className="font-semibold text-gold">{lm.price} EGP</span>
                                </div>
                                {lm.lat && lm.lng && <p className="text-[10px] text-navy/40 dark:text-slate-500 font-mono">{lm.lat.toFixed(4)}, {lm.lng.toFixed(4)}</p>}
                              </div>
                            }>
                              <span className="cursor-pointer hover:text-royal dark:hover:text-gold transition-colors">{lm.name}</span>
                            </HoverPreview>
                          </td>
                          <td className="px-4 py-3">{lm.region}</td>
                          <td className="px-4 py-3">{lm.city ?? '-'}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-royal/10 text-royal dark:bg-royal/20 dark:text-royal/80">
                              {lm.category}
                            </span>
                          </td>
                          <td className="px-4 py-3">{lm.rating} ({lm.reviews})</td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => openEditLandmark(lm)} className="p-1.5 text-navy/50 dark:text-slate-400 hover:text-royal dark:hover:text-gold transition-colors" title="Edit">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteLandmarkId(Number(lm.id))} className="p-1.5 text-navy/50 dark:text-slate-400 hover:text-red-500 transition-colors ml-1" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    {landmarks.filter(l => !landmarkSearch || l.name.toLowerCase().includes(landmarkSearch.toLowerCase())).length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-navy/40 dark:text-slate-500">No landmarks found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ─── MODERATION TAB ───────────────────────────────────── */}
          {tab === 'moderation' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-2xl font-serif font-bold text-navy dark:text-slate-100 mb-6">Content Moderation</h2>

              <div className="flex gap-2 mb-6">
                {modSubTabs.map(st => (
                  <button
                    key={st.key}
                    onClick={() => { setModSubTab(st.key); setModPage(1); }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      modSubTab === st.key
                        ? 'bg-gold text-white'
                        : 'bg-white dark:bg-slate-card text-navy/70 dark:text-slate-300 border border-sand dark:border-slate-border hover:border-gold/30'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Moderation Filters */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setModFilterOpen(f => !f)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    Object.values(modFilters).some(v => v)
                      ? 'bg-gold text-white'
                      : 'bg-white dark:bg-slate-card text-navy/70 dark:text-slate-300 border border-sand dark:border-slate-border'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" /> Filters
                </button>
                {Object.values(modFilters).some(v => v) && (
                  <button
                    onClick={() => { setModFilters({ landmark: '', city: '', username: '', email: '', date_from: '', date_to: '' }); setModPage(1); }}
                    className="text-xs text-navy/50 dark:text-slate-400 hover:text-red-500 transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {modFilterOpen && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white dark:bg-slate-card rounded-2xl border border-sand dark:border-slate-border p-4 mb-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {([['landmark', 'Landmark'], ['city', 'City'], ['username', 'Username'], ['email', 'Email'], ['date_from', 'Date From'], ['date_to', 'Date To']] as const).map(([key, label]) => {
                      const currentItems = modSubTab === 'reviews' ? reviews : modSubTab === 'posts' ? posts : comments;
                      if (key === 'landmark') {
                        const opts = [...new Set(landmarks.map(l => l.name))].sort();
                        return <FilterCombobox key={key} label={label} value={modFilters[key]} onChange={v => setModFilters(f => ({ ...f, [key]: v }))} options={opts} placeholder="Type or pick a landmark" />;
                      }
                      if (key === 'city') {
                        const opts = [...new Set(landmarks.map(l => l.city).filter(Boolean))].sort() as string[];
                        return <FilterCombobox key={key} label={label} value={modFilters[key]} onChange={v => setModFilters(f => ({ ...f, [key]: v }))} options={opts} placeholder="Type or pick a city" />;
                      }
                      if (key === 'username') {
                        const opts = [...new Set(currentItems.map(i => i.user.name))].sort();
                        return <FilterCombobox key={key} label={label} value={modFilters[key]} onChange={v => setModFilters(f => ({ ...f, [key]: v }))} options={opts} placeholder="Type or pick a username" />;
                      }
                      if (key === 'email') {
                        const opts = [...new Set(currentItems.map(i => i.user.email).filter(Boolean))].sort() as string[];
                        return <FilterCombobox key={key} label={label} value={modFilters[key]} onChange={v => setModFilters(f => ({ ...f, [key]: v }))} options={opts} placeholder="Type or pick an email" />;
                      }
                      return (
                        <div key={key}>
                          <label className="block text-xs font-medium text-navy/60 dark:text-slate-400 mb-1">{label}</label>
                          <input
                            type={key.startsWith('date') ? 'date' : 'text'}
                            value={modFilters[key]}
                            onChange={e => setModFilters(f => ({ ...f, [key]: e.target.value }))}
                            placeholder={label}
                            className="w-full bg-offwhite dark:bg-midnight border border-sand dark:border-slate-border rounded-lg py-1.5 px-2.5 text-xs text-navy dark:text-slate-100 focus:outline-none focus:border-gold transition-colors"
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      onClick={() => { setModFilters({ landmark: '', city: '', username: '', email: '', date_from: '', date_to: '' }); setModPage(1); }}
                      className="px-3 py-1.5 text-xs font-medium text-navy/70 dark:text-slate-300 border border-sand dark:border-slate-border rounded-lg hover:bg-sand/50 dark:hover:bg-slate-border/50 transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setModPage(1)}
                      className="px-3 py-1.5 text-xs font-medium bg-gold text-white rounded-lg hover:bg-gold/90 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Bulk Actions */}
              {selectedModIds.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-gold/10 dark:bg-gold/5 border border-gold/20 rounded-xl"
                >
                  <span className="text-sm font-medium text-navy dark:text-slate-100">{selectedModIds.size} selected</span>
                  <button
                    onClick={() => setSelectedModIds(new Set())}
                    className="text-xs text-navy/60 dark:text-slate-400 hover:text-navy dark:hover:text-slate-100 transition-colors"
                  >
                    Deselect all
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={async () => {
                      if (!confirm(`Delete ${selectedModIds.size} items?`)) return;
                      setBulkDeleting(true);
                      try {
                        await Promise.all(
                          [...selectedModIds].map(id => api.delete(`/admin/${modSubTab}/${id}`))
                        );
                        setSelectedModIds(new Set());
                        fetchModeration();
                      } catch {
                        setError('Failed to delete some items');
                      }
                      setBulkDeleting(false);
                    }}
                    disabled={bulkDeleting}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-60 transition-colors"
                  >
                    {bulkDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    Delete Selected
                  </button>
                </motion.div>
              )}

              {modLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-gold animate-spin" /></div>
              ) : (
                <div className="bg-white dark:bg-slate-card rounded-2xl border border-sand dark:border-slate-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-sand dark:border-slate-border text-left text-navy/60 dark:text-slate-400 text-xs uppercase tracking-wider">
                        <th className="px-4 py-3 w-8">
                          <input
                            type="checkbox"
                            checked={selectedModIds.size > 0}
                            onChange={() => {
                              const items = modSubTab === 'reviews' ? reviews : modSubTab === 'posts' ? posts : comments;
                              if (selectedModIds.size === items.length) {
                                setSelectedModIds(new Set());
                              } else {
                                setSelectedModIds(new Set(items.map(i => i.id)));
                              }
                            }}
                            className="rounded border-sand dark:border-slate-border text-gold focus:ring-gold"
                          />
                        </th>
                        <th className="px-4 py-3">User</th>
                        {modSubTab !== 'comments' && <th className="px-4 py-3">Content</th>}
                        {modSubTab === 'reviews' && <th className="px-4 py-3">Landmark</th>}
                        {modSubTab === 'reviews' && <th className="px-4 py-3">Rating</th>}
                        {modSubTab === 'posts' && <th className="px-4 py-3">Location</th>}
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(modSubTab === 'reviews' ? reviews : modSubTab === 'posts' ? posts : comments).map(item => {
                        const r = item as ReviewItem;
                        const p = item as PostItem;
                        return (
                          <tr key={item.id} className="border-b border-sand/50 dark:border-slate-border/50 text-navy dark:text-slate-200">
                            <td className="px-4 py-3 w-8">
                              <input
                                type="checkbox"
                                checked={selectedModIds.has(item.id)}
                                onChange={() => {
                                  const next = new Set(selectedModIds);
                                  if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
                                  setSelectedModIds(next);
                                }}
                                className="rounded border-sand dark:border-slate-border text-gold focus:ring-gold"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-royal/20 flex items-center justify-center text-xs font-bold text-royal">
                                  {item.user.name.charAt(0)}
                                </div>
                                <span>{item.user.name}</span>
                              </div>
                            </td>
                            {modSubTab !== 'comments' && (
                              <td className="px-4 py-3 max-w-xs truncate">
                                {modSubTab === 'reviews' ? (r.text || '-') : (p.excerpt || '-')}
                              </td>
                            )}
                            {modSubTab === 'reviews' && (
                              <td className="px-4 py-3">{r.landmark?.name ?? '-'}</td>
                            )}
                            {modSubTab === 'reviews' && (
                              <td className="px-4 py-3">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</td>
                            )}
                            {modSubTab === 'posts' && (
                              <td className="px-4 py-3">{p.location}</td>
                            )}
                            <td className="px-4 py-3 text-navy/60 dark:text-slate-400 text-xs">
                              {new Date(item.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => setDeleteItem({ type: modSubTab, id: item.id })}
                                className="p-1.5 text-navy/50 dark:text-slate-400 hover:text-red-500 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {(modSubTab === 'reviews' ? reviews : modSubTab === 'posts' ? posts : comments).length === 0 && (
                        <tr><td colSpan={7} className="px-4 py-8 text-center text-navy/40 dark:text-slate-500">Nothing to moderate</td></tr>
                      )}
                    </tbody>
                  </table>

                  {modLastPage > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-sand dark:border-slate-border">
                      <span className="text-xs text-navy/60 dark:text-slate-400">
                        Page {modPage} of {modLastPage} ({modTotal} total)
                      </span>
                      <div className="flex gap-2">
                        <button
                          disabled={modPage <= 1}
                          onClick={() => setModPage(p => p - 1)}
                          className="px-3 py-1 text-xs rounded-lg bg-sand/50 dark:bg-slate-border/50 text-navy/70 dark:text-slate-300 disabled:opacity-40 hover:bg-sand dark:hover:bg-slate-border transition-colors"
                        >
                          Previous
                        </button>
                        <button
                          disabled={modPage >= modLastPage}
                          onClick={() => setModPage(p => p + 1)}
                          className="px-3 py-1 text-xs rounded-lg bg-sand/50 dark:bg-slate-border/50 text-navy/70 dark:text-slate-300 disabled:opacity-40 hover:bg-sand dark:hover:bg-slate-border transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ─── BOOKINGS TAB ─────────────────────────────────────── */}
          {tab === 'bookings' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-serif font-bold text-navy dark:text-slate-100">All Bookings</h2>
                <button
                  onClick={() => setBookingsFilterOpen(f => !f)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    Object.values(bookingsFilters).some(v => v)
                      ? 'bg-gold text-white'
                      : 'bg-white dark:bg-slate-card text-navy/70 dark:text-slate-300 border border-sand dark:border-slate-border'
                  }`}
                >
                  <Search className="w-4 h-4" /> Filters
                </button>
              </div>

              {/* Filters */}
              {bookingsFilterOpen && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white dark:bg-slate-card rounded-2xl border border-sand dark:border-slate-border p-4 mb-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                    {([['landmark', 'Landmark'], ['city', 'City'], ['username', 'Username'], ['phone', 'Phone'], ['email', 'Email'], ['date_from', 'Date From'], ['date_to', 'Date To']] as const).map(([key, label]) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-navy/60 dark:text-slate-400 mb-1">{label}</label>
                        <input
                          type={key.startsWith('date') ? 'date' : 'text'}
                          value={bookingsFilters[key]}
                          onChange={e => setBookingsFilters(f => ({ ...f, [key]: e.target.value }))}
                          placeholder={label}
                          className="w-full bg-offwhite dark:bg-midnight border border-sand dark:border-slate-border rounded-lg py-1.5 px-2.5 text-xs text-navy dark:text-slate-100 focus:outline-none focus:border-gold transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      onClick={() => { setBookingsFilters({ landmark: '', city: '', username: '', phone: '', email: '', date_from: '', date_to: '' }); setBookingsPage(1); }}
                      className="px-3 py-1.5 text-xs font-medium text-navy/70 dark:text-slate-300 border border-sand dark:border-slate-border rounded-lg hover:bg-sand/50 dark:hover:bg-slate-border/50 transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setBookingsPage(1)}
                      className="px-3 py-1.5 text-xs font-medium bg-gold text-white rounded-lg hover:bg-gold/90 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Bookings Table */}
              <div className="bg-white dark:bg-slate-card rounded-2xl border border-sand dark:border-slate-border overflow-hidden mb-6">
                {bookingsLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-gold animate-spin" /></div>
                ) : (
                  <>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-sand dark:border-slate-border text-left text-navy/60 dark:text-slate-400 text-xs uppercase tracking-wider">
                          <SortHeader label="Ref" field="confirmation_code" currentField={bookingsSortField} direction={bookingsSortDir} onSort={f => { if (bookingsSortField === f) setBookingsSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setBookingsSortField(f); setBookingsSortDir('asc'); } }} />
                          <SortHeader label="User" field="user" currentField={bookingsSortField} direction={bookingsSortDir} onSort={f => { if (bookingsSortField === f) setBookingsSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setBookingsSortField(f); setBookingsSortDir('asc'); } }} />
                          <SortHeader label="Landmark" field="landmark" currentField={bookingsSortField} direction={bookingsSortDir} onSort={f => { if (bookingsSortField === f) setBookingsSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setBookingsSortField(f); setBookingsSortDir('asc'); } }} />
                          <SortHeader label="Booking Date" field="booking_date" currentField={bookingsSortField} direction={bookingsSortDir} onSort={f => { if (bookingsSortField === f) setBookingsSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setBookingsSortField(f); setBookingsSortDir('asc'); } }} />
                          <SortHeader label="Total" field="total" currentField={bookingsSortField} direction={bookingsSortDir} onSort={f => { if (bookingsSortField === f) setBookingsSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setBookingsSortField(f); setBookingsSortDir('asc'); } }} />
                          <SortHeader label="Status" field="status" currentField={bookingsSortField} direction={bookingsSortDir} onSort={f => { if (bookingsSortField === f) setBookingsSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setBookingsSortField(f); setBookingsSortDir('asc'); } }} />
                          <SortHeader label="Payment" field="payment_status" currentField={bookingsSortField} direction={bookingsSortDir} onSort={f => { if (bookingsSortField === f) setBookingsSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setBookingsSortField(f); setBookingsSortDir('asc'); } }} />
                          <th className="px-4 py-3">Actions</th>
                          <SortHeader label="Created" field="created_at" currentField={bookingsSortField} direction={bookingsSortDir} onSort={f => { if (bookingsSortField === f) setBookingsSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setBookingsSortField(f); setBookingsSortDir('asc'); } }} />
                        </tr>
                      </thead>
                      <tbody>
                        {[...bookings].sort((a: any, b: any) => {
                          const getVal = (obj: any, field: string): string => {
                            if (field === 'user') return obj.user?.name ?? '';
                            if (field === 'landmark') return obj.landmark?.name ?? '';
                            return String(obj[field] ?? '');
                          };
                          const aVal = getVal(a, bookingsSortField);
                          const bVal = getVal(b, bookingsSortField);
                          const aNum = Number(aVal);
                          const bNum = Number(bVal);
                          const cmp = !isNaN(aNum) && !isNaN(bNum) ? aNum - bNum : aVal.localeCompare(bVal);
                          return bookingsSortDir === 'asc' ? cmp : -cmp;
                        }).map((b: any) => {
                          const isExpanded = expandedBookingId === Number(b.id);
                          return (
                            <Fragment key={b.id}>
                              <tr
                                onClick={() => setExpandedBookingId(isExpanded ? null : Number(b.id))}
                                className={`border-b border-sand/50 dark:border-slate-border/50 text-navy dark:text-slate-200 cursor-pointer transition-colors hover:bg-sand/20 dark:hover:bg-slate-border/30 ${
                                  isExpanded ? 'bg-sand/30 dark:bg-slate-border/40' : ''
                                }`}
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-xs">{b.confirmation_code}</span>
                                    <CopyButton text={b.confirmation_code} />
                                  </div>
                                </td>
                                <td className="px-4 py-3">{b.user?.name ?? 'N/A'}</td>
                                <td className="px-4 py-3">{b.landmark?.name ?? 'N/A'}</td>
                                <td className="px-4 py-3">{b.booking_date}</td>
                                <td className="px-4 py-3">{b.total} {b.currency}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                    b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                    b.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                  }`}>{b.status}</span>
                                </td>
                                <td className="px-4 py-3 text-xs">{b.payment_status}</td>
                                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => { setEditBookingData(b); }}
                                      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-sand/50 dark:bg-slate-border/50 text-navy/70 dark:text-slate-300 hover:bg-sand dark:hover:bg-slate-border transition-colors"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                    {b.status !== 'cancelled' && b.status !== 'cancellation_requested' && (
                                      <button
                                        onClick={() => { setCancelModalBookingId(Number(b.id)); setCancelReason(''); }}
                                        disabled={cancellingBookingId === Number(b.id)}
                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors"
                                      >
                                        {cancellingBookingId === Number(b.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                                        Cancel
                                      </button>
                                    )}
                                    {b.status === 'cancelled' && (
                                      <button
                                        onClick={() => handleDeleteBooking(Number(b.id))}
                                        disabled={deletingBookingId === Number(b.id)}
                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors"
                                      >
                                        {deletingBookingId === Number(b.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs text-navy/60 dark:text-slate-400">
                                  <RelativeTime date={b.created_at} />
                                </td>
                              </tr>
                              {/* Expanded details */}
                              {isExpanded && (
                                <tr>
                                  <td colSpan={9} className="px-6 py-4 bg-sand/10 dark:bg-slate-border/20">
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
                                    >
                                      <div className="bg-white dark:bg-slate-card rounded-xl p-3 border border-sand dark:border-slate-border">
                                        <p className="text-[10px] text-navy/50 dark:text-slate-400 uppercase tracking-wider mb-1">Payer</p>
                                        <p className="text-sm font-medium text-navy dark:text-slate-100">{b.payer_name || '-'}</p>
                                        {b.payer_email && <p className="text-xs text-navy/60 dark:text-slate-400 mt-0.5">{b.payer_email}</p>}
                                        {b.payer_phone && <p className="text-xs text-navy/60 dark:text-slate-400">{b.payer_phone}</p>}
                                      </div>
                                      <div className="bg-white dark:bg-slate-card rounded-xl p-3 border border-sand dark:border-slate-border">
                                        <p className="text-[10px] text-navy/50 dark:text-slate-400 uppercase tracking-wider mb-1">Tickets</p>
                                        <p className="text-sm font-medium text-navy dark:text-slate-100">
                                          {b.adults} Adult{+b.adults > 1 ? 's' : ''}
                                          {+b.children > 0 && `, ${b.children} Child${+b.children > 1 ? 'ren' : ''}`}
                                        </p>
                                      </div>
                                      <div className="bg-white dark:bg-slate-card rounded-xl p-3 border border-sand dark:border-slate-border">
                                        <p className="text-[10px] text-navy/50 dark:text-slate-400 uppercase tracking-wider mb-1">Payment Method</p>
                                        <p className="text-sm font-medium text-navy dark:text-slate-100 capitalize">{b.payment_method || '-'}</p>
                                      </div>
                                      <div className="bg-white dark:bg-slate-card rounded-xl p-3 border border-sand dark:border-slate-border">
                                        <p className="text-[10px] text-navy/50 dark:text-slate-400 uppercase tracking-wider mb-1">Service Fee</p>
                                        <p className="text-sm font-medium text-navy dark:text-slate-100">{b.service_fee || 0} {b.currency}</p>
                                      </div>
                                      {b.notes && (
                                        <div className="col-span-full bg-white dark:bg-slate-card rounded-xl p-3 border border-sand dark:border-slate-border">
                                          <p className="text-[10px] text-navy/50 dark:text-slate-400 uppercase tracking-wider mb-1">Notes</p>
                                          <p className="text-sm text-navy dark:text-slate-200">{b.notes}</p>
                                        </div>
                                      )}
                                    </motion.div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                          {bookings.length === 0 && (
                          <tr><td colSpan={9} className="px-4 py-8 text-center text-navy/40 dark:text-slate-500">No bookings found</td></tr>
                        )}
                      </tbody>
                    </table>

                    {bookingsLastPage > 1 && (
                      <div className="flex items-center justify-between px-4 py-3 border-t border-sand dark:border-slate-border">
                        <span className="text-xs text-navy/60 dark:text-slate-400">
                          Page {bookingsPage} of {bookingsLastPage} ({bookingsTotal} total)
                        </span>
                        <div className="flex gap-2">
                          <button
                            disabled={bookingsPage <= 1}
                            onClick={() => setBookingsPage(p => p - 1)}
                            className="px-3 py-1 text-xs rounded-lg bg-sand/50 dark:bg-slate-border/50 text-navy/70 dark:text-slate-300 disabled:opacity-40 hover:bg-sand dark:hover:bg-slate-border transition-colors"
                          >
                            Previous
                          </button>
                          <button
                            disabled={bookingsPage >= bookingsLastPage}
                            onClick={() => setBookingsPage(p => p + 1)}
                            className="px-3 py-1 text-xs rounded-lg bg-sand/50 dark:bg-slate-border/50 text-navy/70 dark:text-slate-300 disabled:opacity-40 hover:bg-sand dark:hover:bg-slate-border transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Booking Export */}
              <div className="bg-white dark:bg-slate-card rounded-2xl border border-sand dark:border-slate-border">
                <div className="px-4 pt-4 pb-2 border-b border-sand/50 dark:border-slate-border/50">
                  <h3 className="text-sm font-semibold text-navy dark:text-slate-100 flex items-center gap-2">
                    <Download className="w-4 h-4 text-gold" /> Download CSV Export
                  </h3>
                  <p className="text-xs text-navy/50 dark:text-slate-400 mt-0.5">
                    Filter bookings and export as Excel-compatible CSV
                  </p>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-3">
                    <FilterCombobox
                      label="Landmark"
                      value={exportFilters.landmark}
                      onChange={v => setExportFilters(f => ({ ...f, landmark: v }))}
                      options={[...new Set(landmarks.map(l => l.name))].sort()}
                      placeholder="All landmarks"
                    />
                    <FilterCombobox
                      label="City"
                      value={exportFilters.city}
                      onChange={v => setExportFilters(f => ({ ...f, city: v }))}
                      options={[...new Set(landmarks.map(l => l.city).filter(Boolean))].sort() as string[]}
                      placeholder="All cities"
                    />
                    <FilterCombobox
                      label="Username"
                      value={exportFilters.username}
                      onChange={v => setExportFilters(f => ({ ...f, username: v }))}
                      options={[...new Set(bookings.map(b => b.user?.name).filter(Boolean))].sort()}
                      placeholder="All users"
                    />
                    <div>
                      <label className="block text-xs font-medium text-navy/60 dark:text-slate-400 mb-1">Phone</label>
                      <input
                        type="text"
                        value={exportFilters.phone}
                        onChange={e => setExportFilters(f => ({ ...f, phone: e.target.value }))}
                        placeholder="Filter by phone"
                        className="w-full bg-offwhite dark:bg-midnight border border-sand dark:border-slate-border rounded-lg py-1.5 px-2.5 text-xs text-navy dark:text-slate-100 focus:outline-none focus:border-gold transition-colors"
                      />
                    </div>
                    <FilterCombobox
                      label="Email"
                      value={exportFilters.email}
                      onChange={v => setExportFilters(f => ({ ...f, email: v }))}
                      options={[...new Set(bookings.map(b => b.payer_email).filter(Boolean))].sort()}
                      placeholder="All emails"
                    />
                    <div>
                      <label className="block text-xs font-medium text-navy/60 dark:text-slate-400 mb-1">Date From</label>
                      <input
                        type="date"
                        value={exportStart}
                        onChange={e => setExportStart(e.target.value)}
                        className="w-full bg-offwhite dark:bg-midnight border border-sand dark:border-slate-border rounded-lg py-1.5 px-2.5 text-xs text-navy dark:text-slate-100 focus:outline-none focus:border-gold transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-navy/60 dark:text-slate-400 mb-1">Date To</label>
                      <input
                        type="date"
                        value={exportEnd}
                        onChange={e => setExportEnd(e.target.value)}
                        className="w-full bg-offwhite dark:bg-midnight border border-sand dark:border-slate-border rounded-lg py-1.5 px-2.5 text-xs text-navy dark:text-slate-100 focus:outline-none focus:border-gold transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleExportBookings}
                      disabled={exporting}
                      className="flex items-center gap-2 bg-gold text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gold/90 disabled:opacity-60 transition-all shadow-sm"
                    >
                      {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      {exporting ? 'Exporting...' : 'Export CSV'}
                    </button>
                    {(exportStart || exportEnd || Object.values(exportFilters).some(v => v)) && (
                      <button
                        onClick={() => { setExportStart(''); setExportEnd(''); setExportFilters({ landmark: '', city: '', username: '', phone: '', email: '' }); }}
                        className="text-xs text-navy/50 dark:text-slate-400 hover:text-red-500 transition-colors"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── PAYMENTS TAB ───────────────────────────────────── */}
          {tab === 'payments' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif font-bold text-navy dark:text-slate-100">Payment Approvals</h2>
                {payments.length > 0 && (
                  <span className="text-sm bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full font-medium">
                    {payments.length} pending
                  </span>
                )}
              </div>

              {paymentsError && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                  {paymentsError}
                  <button onClick={() => setPaymentsError('')} className="ml-2 underline">Dismiss</button>
                </div>
              )}

              <div className="bg-white dark:bg-slate-card rounded-2xl border border-sand dark:border-slate-border overflow-hidden">
                {paymentsLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-gold animate-spin" /></div>
                ) : payments.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-sand/40 dark:bg-slate-border rounded-full flex items-center justify-center">
                      <Wallet className="w-8 h-8 text-navy/40 dark:text-slate-400" />
                    </div>
                    <p className="text-navy/60 dark:text-slate-400 font-medium">No pending payment approvals</p>
                    <p className="text-sm text-navy/40 dark:text-slate-500 mt-1">Payments made via Vodafone Cash or InstaPay will appear here for review.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-sand dark:divide-slate-border">
                    {payments.map((p: any) => (
                      <div key={p.id} className="p-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                          {/* Receipt image */}
                          <div className="shrink-0">
                            {p.receipt_url ? (
                              <a href={p.receipt_url} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={p.receipt_url}
                                  alt="Payment receipt"
                                  className="w-48 h-48 object-contain rounded-xl border border-sand dark:border-slate-border bg-sand/20 hover:border-gold/50 transition-colors cursor-pointer"
                                />
                              </a>
                            ) : (
                              <div className="w-48 h-48 rounded-xl border-2 border-dashed border-sand dark:border-slate-border flex items-center justify-center text-navy/30 dark:text-slate-500">
                                No receipt
                              </div>
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0 space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                              <div>
                                <p className="text-xs text-navy/50 dark:text-slate-400 uppercase tracking-wider">User</p>
                                <p className="text-sm font-medium text-navy dark:text-slate-100 mt-0.5">{p.user?.name || 'N/A'}</p>
                                {p.user?.email && <p className="text-xs text-navy/60 dark:text-slate-400">{p.user.email}</p>}
                              </div>
                              <div>
                                <p className="text-xs text-navy/50 dark:text-slate-400 uppercase tracking-wider">Landmark</p>
                                <p className="text-sm font-medium text-navy dark:text-slate-100 mt-0.5">{p.landmark?.name || p.landmark || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-navy/50 dark:text-slate-400 uppercase tracking-wider">Amount</p>
                                <p className="text-sm font-bold text-gold mt-0.5">{p.total} {p.currency || 'EGP'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-navy/50 dark:text-slate-400 uppercase tracking-wider">Payment Method</p>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium mt-0.5 bg-royal/10 text-royal dark:bg-royal/20 dark:text-royal/80 capitalize">
                                  {p.payment_method || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <p className="text-xs text-navy/50 dark:text-slate-400 uppercase tracking-wider">Booking Date</p>
                                <p className="text-sm text-navy dark:text-slate-100 mt-0.5">{p.booking_date || '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-navy/50 dark:text-slate-400 uppercase tracking-wider">Reference</p>
                                <p className="text-sm font-mono text-navy dark:text-slate-100 mt-0.5">{p.confirmation_code || '-'}</p>
                              </div>
                            </div>

                            {/* Payer details */}
                            {(p.payer_name || p.payer_email || p.payer_phone) && (
                              <div className="bg-sand/20 dark:bg-slate-border/30 rounded-xl p-3">
                                <p className="text-xs text-navy/50 dark:text-slate-400 uppercase tracking-wider mb-1">Payer Details</p>
                                <div className="text-sm text-navy dark:text-slate-200 space-y-0.5">
                                  {p.payer_name && <p>Name: {p.payer_name}</p>}
                                  {p.payer_email && <p>Email: {p.payer_email}</p>}
                                  {p.payer_phone && <p>Phone: {p.payer_phone}</p>}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="shrink-0 flex flex-row lg:flex-col gap-2 items-start">
                            {rejectPaymentId === Number(p.id) ? (
                              <div className="space-y-2 w-full">
                                <textarea
                                  value={rejectPaymentReason}
                                  onChange={e => setRejectPaymentReason(e.target.value)}
                                  placeholder="Reason for rejection..."
                                  rows={2}
                                  className="w-full bg-offwhite dark:bg-midnight border border-red-300 dark:border-red-700 rounded-lg py-1.5 px-2.5 text-xs text-navy dark:text-slate-100 focus:outline-none focus:border-red-500 resize-none"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleRejectPayment(Number(p.id))}
                                    disabled={processingPaymentId === Number(p.id)}
                                    className="flex-1 px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-60 transition-colors"
                                  >
                                    {processingPaymentId === Number(p.id) ? '...' : 'Confirm Reject'}
                                  </button>
                                  <button
                                    onClick={() => { setRejectPaymentId(null); setRejectPaymentReason(''); }}
                                    className="px-3 py-1.5 text-xs font-medium text-navy/70 dark:text-slate-300 border border-sand dark:border-slate-border rounded-lg hover:bg-sand/50 dark:hover:bg-slate-border/50 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleApprovePayment(Number(p.id))}
                                  disabled={processingPaymentId === Number(p.id)}
                                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-60 transition-colors"
                                >
                                  {processingPaymentId === Number(p.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                  Approve Payment
                                </button>
                                <button
                                  onClick={() => setRejectPaymentId(Number(p.id))}
                                  disabled={processingPaymentId === Number(p.id)}
                                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-500/30 disabled:opacity-60 transition-colors"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ─── VERIFY TAB ──────────────────────────────────────────── */}
          {tab === 'verify' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-serif font-bold text-navy dark:text-slate-100">Verify Ticket</h2>
              </div>

              <div className="bg-white dark:bg-slate-card rounded-2xl border border-sand dark:border-slate-border p-6 mb-6">
                <p className="text-sm text-navy/60 dark:text-slate-400 mb-4">Scan, upload, or paste a QR code to verify a booking.</p>

                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleQrFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={qrVerifying || scanning}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-offwhite dark:bg-midnight border border-sand dark:border-slate-border rounded-xl hover:bg-sand/50 dark:hover:bg-slate-border/50 transition-colors disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" /> Upload QR Image
                  </button>
                  <button
                    onClick={scanning ? stopCameraScan : startCameraScan}
                    disabled={qrVerifying}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 ${
                      scanning
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-offwhite dark:bg-midnight border border-sand dark:border-slate-border hover:bg-sand/50 dark:hover:bg-slate-border/50'
                    }`}
                  >
                    {scanning ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                    {scanning ? 'Stop Camera' : 'Scan with Camera'}
                  </button>
                </div>

                {/* Camera viewfinder */}
                {scanning && (
                  <div className="relative mb-4 rounded-xl overflow-hidden border-2 border-gold/50 bg-black">
                    <video ref={videoRef} className="w-full max-h-80 object-contain" playsInline muted />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 border-2 border-gold/70 rounded-lg" />
                    </div>
                    <div className="absolute bottom-3 left-0 right-0 text-center">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/60 text-white text-xs rounded-full">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Scanning for QR code...
                      </span>
                    </div>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={qrTokenInput}
                    onChange={e => { setQrTokenInput(e.target.value); setQrResult(null); }}
                    placeholder="Or paste QR token here..."
                    className="flex-1 bg-offwhite dark:bg-midnight border border-sand dark:border-slate-border rounded-xl py-2.5 px-3 text-sm text-navy dark:text-slate-100 focus:outline-none focus:border-gold transition-colors font-mono"
                  />
                  <button
                    onClick={() => handleQrVerify(qrTokenInput)}
                    disabled={qrVerifying || !qrTokenInput}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-gold text-white rounded-xl hover:bg-gold/90 disabled:opacity-60 transition-colors"
                  >
                    {qrVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                    Verify
                  </button>
                </div>
              </div>

              {/* Result */}
              <AnimatePresence>
                {qrResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    {qrResult.valid && qrResult.booking ? (
                      <div className="bg-white dark:bg-slate-card rounded-2xl border border-emerald-200 dark:border-emerald-500/30 overflow-hidden">
                        {/* Valid header */}
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 px-6 py-4 flex items-center gap-3 border-b border-emerald-200 dark:border-emerald-500/30">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <div>
                            <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-300">Ticket Valid</h3>
                            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Verified at {new Date().toLocaleTimeString()}</p>
                          </div>
                        </div>

                        {/* Landmark header */}
                        <div className="relative h-36 sm:h-44">
                          <img
                            src={qrResult.booking.landmark_image}
                            alt={qrResult.booking.landmark}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-5">
                            <h4 className="text-xl font-serif font-bold text-white">{qrResult.booking.landmark}</h4>
                            {qrResult.booking.landmark_region && (
                              <p className="text-white/80 text-xs flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3.5 h-3.5" /> {qrResult.booking.landmark_region}
                              </p>
                            )}
                          </div>
                          <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {qrResult.booking.status}
                          </div>
                        </div>

                        <div className="p-5 space-y-5">
                          {/* Reference */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-navy/50 dark:text-slate-400">Reference Code</span>
                            <span className="text-lg font-bold font-mono text-navy dark:text-slate-100 tracking-wider">{qrResult.booking.confirmation_code}</span>
                          </div>

                          <hr className="border-sand dark:border-slate-border" />

                          {/* Booking details grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="bg-sand/20 dark:bg-slate-border/40 rounded-xl p-3">
                              <p className="text-xs text-navy/50 dark:text-slate-400 mb-1">Date</p>
                              <p className="font-semibold text-sm text-navy dark:text-slate-100">{qrResult.booking.booking_date}</p>
                            </div>
                            <div className="bg-sand/20 dark:bg-slate-border/40 rounded-xl p-3">
                              <p className="text-xs text-navy/50 dark:text-slate-400 mb-1">Tickets</p>
                              <p className="font-semibold text-sm text-navy dark:text-slate-100">
                                {qrResult.booking.adults} Adult{+qrResult.booking.adults > 1 ? 's' : ''}
                                {+qrResult.booking.children > 0 && `, ${qrResult.booking.children} Child${+qrResult.booking.children > 1 ? 'ren' : ''}`}
                              </p>
                            </div>
                            <div className="bg-sand/20 dark:bg-slate-border/40 rounded-xl p-3">
                              <p className="text-xs text-navy/50 dark:text-slate-400 mb-1">Payment</p>
                              <p className="font-semibold text-sm text-navy dark:text-slate-100 capitalize">{qrResult.booking.payment_method}</p>
                              <p className={`text-xs font-medium ${
                                qrResult.booking.payment_status === 'paid' || qrResult.booking.payment_status === 'refunded'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-amber-600 dark:text-amber-400'
                              }`}>{qrResult.booking.payment_status}</p>
                            </div>
                          </div>

                          {/* Price breakdown */}
                          <div className="bg-sand/20 dark:bg-slate-border/40 rounded-xl p-4">
                            <h5 className="text-xs font-semibold text-navy dark:text-slate-100 mb-2">Price Breakdown</h5>
                            <div className="space-y-1.5 text-sm">
                              <div className="flex justify-between">
                                <span className="text-navy/70 dark:text-slate-300">{qrResult.booking.adults}x Adult Ticket</span>
                                <span className="text-navy dark:text-slate-100">
                                  {qrResult.booking.subtotal - (+qrResult.booking.children > 0 ? +qrResult.booking.children * (+qrResult.booking.subtotal / (+qrResult.booking.adults + +qrResult.booking.children * 0.5)) * 0.5 : 0)} {qrResult.booking.currency}
                                </span>
                              </div>
                              {+qrResult.booking.children > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-navy/70 dark:text-slate-300">{qrResult.booking.children}x Child Ticket (50%)</span>
                                  <span className="text-navy dark:text-slate-100">
                                    {+qrResult.booking.children * (+qrResult.booking.subtotal / (+qrResult.booking.adults + +qrResult.booking.children * 0.5)) * 0.5} {qrResult.booking.currency}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-navy/70 dark:text-slate-300">Service Fee</span>
                                <span className="text-navy dark:text-slate-100">{qrResult.booking.service_fee} {qrResult.booking.currency}</span>
                              </div>
                              <hr className="border-sand dark:border-slate-border" />
                              <div className="flex justify-between font-semibold text-navy dark:text-slate-100">
                                <span>Total</span>
                                <span className="text-gold">{qrResult.booking.total} {qrResult.booking.currency}</span>
                              </div>
                            </div>
                          </div>

                          {/* Payer & User info */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="bg-sand/20 dark:bg-slate-border/40 rounded-xl p-3">
                              <p className="text-xs text-navy/50 dark:text-slate-400 mb-1">Payer</p>
                              <p className="font-semibold text-sm text-navy dark:text-slate-100">{qrResult.booking.payer_name}</p>
                              {qrResult.booking.payer_email && <p className="text-xs text-navy/60 dark:text-slate-400 mt-0.5">{qrResult.booking.payer_email}</p>}
                              {qrResult.booking.payer_phone && <p className="text-xs text-navy/60 dark:text-slate-400">{qrResult.booking.payer_phone}</p>}
                            </div>
                            <div className="bg-sand/20 dark:bg-slate-border/40 rounded-xl p-3">
                              <p className="text-xs text-navy/50 dark:text-slate-400 mb-1">Booked By (User)</p>
                              <p className="font-semibold text-sm text-navy dark:text-slate-100">{qrResult.booking.user}</p>
                              {qrResult.booking.created_at && (
                                <p className="text-xs text-navy/60 dark:text-slate-400 mt-0.5">
                                  {new Date(qrResult.booking.created_at).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50 dark:bg-red-500/10 rounded-2xl p-6 border border-red-200 dark:border-red-500/30 flex items-start gap-3">
                        <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Invalid Ticket</h3>
                          <p className="text-sm text-red-600 dark:text-red-300 mt-1">{qrResult.error}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </main>
      </div>

      {/* ─── LANDMARK MODAL ──────────────────────────────────────── */}
      {showLandmarkModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowLandmarkModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-white dark:bg-slate-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-serif font-bold text-navy dark:text-slate-100">
                {editingLandmark ? 'Edit Landmark' : 'Add Landmark'}
              </h3>
              <button onClick={() => setShowLandmarkModal(false)} className="text-navy/50 dark:text-slate-400 hover:text-navy dark:hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {([
                ['name', 'Name', 'text'],
                ['region', 'Region', 'text'],
                ['city', 'City', 'text'],
                ['area', 'Area', 'text'],
                ['category', 'Category', 'select'],
                ['price', 'Price (EGP)', 'number'],
                ['lat', 'Latitude', 'number'],
                ['lng', 'Longitude', 'number'],
                ['opening_hours', 'Opening Hours', 'text'],
                ['closing_hours', 'Closing Hours', 'text'],
              ] as const).map(([field, label, type]) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-navy dark:text-slate-200 mb-1">{label}</label>
                  {type === 'select' ? (
                    <select
                      value={landmarkForm[field as keyof typeof landmarkForm] as string}
                      onChange={e => setLandmarkForm(f => ({ ...f, [field]: e.target.value }))}
                      className="w-full bg-offwhite dark:bg-midnight border border-sand dark:border-slate-border rounded-xl py-2.5 px-3 text-sm text-navy dark:text-slate-100 focus:outline-none focus:border-gold transition-colors"
                    >
                      {['Archaeological', 'Museum', 'Religious', 'Recreational', 'Cultural'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={type}
                      value={landmarkForm[field as keyof typeof landmarkForm] as string | number}
                      onChange={e => setLandmarkForm(f => ({ ...f, [field]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                      className="w-full bg-offwhite dark:bg-midnight border border-sand dark:border-slate-border rounded-xl py-2.5 px-3 text-sm text-navy dark:text-slate-100 focus:outline-none focus:border-gold transition-colors"
                    />
                  )}
                </div>
              ))}

              {/* Image field — supports URL or file upload */}
              <div>
                <label className="block text-sm font-medium text-navy dark:text-slate-200 mb-2">Photo</label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setImageMode('url')}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${imageMode === 'url' ? 'bg-gold text-white' : 'bg-sand/50 dark:bg-slate-border/50 text-navy/70 dark:text-slate-300'}`}
                  >
                    URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode('file')}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${imageMode === 'file' ? 'bg-gold text-white' : 'bg-sand/50 dark:bg-slate-border/50 text-navy/70 dark:text-slate-300'}`}
                  >
                    Upload
                  </button>
                </div>

                {imageMode === 'url' ? (
                  <input
                    type="text"
                    value={landmarkForm.image}
                    onChange={e => setLandmarkForm(f => ({ ...f, image: e.target.value }))}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full bg-offwhite dark:bg-midnight border border-sand dark:border-slate-border rounded-xl py-2.5 px-3 text-sm text-navy dark:text-slate-100 focus:outline-none focus:border-gold transition-colors"
                  />
                ) : (
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={e => {
                      const file = e.target.files?.[0] ?? null;
                      setImageFile(file);
                      if (file) {
                        setLandmarkForm(f => ({ ...f, image: '' }));
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                    className="w-full text-sm text-navy/70 dark:text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gold file:text-white hover:file:bg-gold/90"
                  />
                )}

                {imagePreview && (
                  <div className="mt-2 relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-xl" />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); setLandmarkForm(f => ({ ...f, image: '' })); }}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-navy dark:text-slate-200 mb-1">Description</label>
                <textarea
                  value={landmarkForm.description}
                  onChange={e => setLandmarkForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full bg-offwhite dark:bg-midnight border border-sand dark:border-slate-border rounded-xl py-2.5 px-3 text-sm text-navy dark:text-slate-100 focus:outline-none focus:border-gold transition-colors resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowLandmarkModal(false)}
                className="px-4 py-2 text-sm font-medium text-navy/70 dark:text-slate-300 border border-sand dark:border-slate-border rounded-xl hover:bg-sand/50 dark:hover:bg-slate-border/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLandmark}
                disabled={savingLandmark}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gold text-white rounded-xl hover:bg-gold/90 disabled:opacity-60 transition-colors"
              >
                {savingLandmark && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingLandmark ? 'Update' : 'Create'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ─── NOTIFY MODAL ────────────────────────────────────────── */}
      {notifyOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setNotifyOpen(false)}>
          <div className="bg-white dark:bg-slate-card rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-serif font-bold text-navy dark:text-slate-100 flex items-center gap-2">
                <Mail className="w-5 h-5 text-gold" /> Send Notification
              </h3>
              <button onClick={() => setNotifyOpen(false)} className="text-navy/50 dark:text-slate-400 hover:text-navy dark:hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <FilterCombobox
                  label="User Email"
                  value={notifyEmail}
                  onChange={setNotifyEmail}
                  options={allUsers.map(u => u.email)}
                  placeholder="Type or select an email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy dark:text-slate-200 mb-1">Message</label>
                <textarea
                  value={notifyMessage}
                  onChange={e => setNotifyMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={4}
                  className="w-full bg-offwhite dark:bg-midnight border border-sand dark:border-slate-border rounded-xl py-2.5 px-3 text-sm text-navy dark:text-slate-100 focus:outline-none focus:border-gold transition-colors resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setNotifyOpen(false)}
                className="px-4 py-2 text-sm font-medium text-navy/70 dark:text-slate-300 border border-sand dark:border-slate-border rounded-xl hover:bg-sand/50 dark:hover:bg-slate-border/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNotify}
                disabled={notifySending || !notifyEmail || !notifyMessage}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gold text-white rounded-xl hover:bg-gold/90 disabled:opacity-60 transition-colors"
              >
                {notifySending && <Loader2 className="w-4 h-4 animate-spin" />}
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── EDIT BOOKING MODAL ──────────────────────────────────── */}
      {editBookingData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditBookingData(null)}>
          <div className="bg-white dark:bg-slate-card rounded-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-serif font-bold text-navy dark:text-slate-100">Edit Booking</h3>
              <button onClick={() => setEditBookingData(null)} className="text-navy/50 dark:text-slate-400 hover:text-navy dark:hover:text-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-navy/60 dark:text-slate-400 mb-1">Booking Date</label>
                <input type="date" value={editBookingData.booking_date || ''} onChange={e => setEditBookingData((prev: any) => ({ ...prev, booking_date: e.target.value }))} className="w-full bg-offwhite dark:bg-midnight border border-sand dark:border-slate-border rounded-lg py-2 px-3 text-sm text-navy dark:text-slate-100 focus:outline-none focus:border-gold transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy/60 dark:text-slate-400 mb-1">Status</label>
                <select value={editBookingData.status || 'confirmed'} onChange={e => setEditBookingData((prev: any) => ({ ...prev, status: e.target.value }))} className="w-full bg-offwhite dark:bg-midnight border border-sand dark:border-slate-border rounded-lg py-2 px-3 text-sm text-navy dark:text-slate-100 focus:outline-none focus:border-gold transition-colors">
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                  <option value="no_show">No Show</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-navy/60 dark:text-slate-400 mb-1">Adults</label>
                <input type="number" min="1" max="50" value={editBookingData.adults || 1} onChange={e => setEditBookingData((prev: any) => ({ ...prev, adults: Number(e.target.value) }))} className="w-full bg-offwhite dark:bg-midnight border border-sand dark:border-slate-border rounded-lg py-2 px-3 text-sm text-navy dark:text-slate-100 focus:outline-none focus:border-gold transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy/60 dark:text-slate-400 mb-1">Children</label>
                <input type="number" min="0" max="50" value={editBookingData.children || 0} onChange={e => setEditBookingData((prev: any) => ({ ...prev, children: Number(e.target.value) }))} className="w-full bg-offwhite dark:bg-midnight border border-sand dark:border-slate-border rounded-lg py-2 px-3 text-sm text-navy dark:text-slate-100 focus:outline-none focus:border-gold transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy/60 dark:text-slate-400 mb-1">Payment Method</label>
                <select value={editBookingData.payment_method || 'cash'} onChange={e => setEditBookingData((prev: any) => ({ ...prev, payment_method: e.target.value }))} className="w-full bg-offwhite dark:bg-midnight border border-sand dark:border-slate-border rounded-lg py-2 px-3 text-sm text-navy dark:text-slate-100 focus:outline-none focus:border-gold transition-colors">
                  <option value="card">Card</option>
                  <option value="vodafone">Vodafone</option>
                  <option value="instapay">Instapay</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-navy/60 dark:text-slate-400 mb-1">Payment Status</label>
                <select value={editBookingData.payment_status || 'pending'} onChange={e => setEditBookingData((prev: any) => ({ ...prev, payment_status: e.target.value }))} className="w-full bg-offwhite dark:bg-midnight border border-sand dark:border-slate-border rounded-lg py-2 px-3 text-sm text-navy dark:text-slate-100 focus:outline-none focus:border-gold transition-colors">
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-navy/60 dark:text-slate-400 mb-1">Payer Name</label>
                <input type="text" value={editBookingData.payer_name || ''} onChange={e => setEditBookingData((prev: any) => ({ ...prev, payer_name: e.target.value }))} className="w-full bg-offwhite dark:bg-midnight border border-sand dark:border-slate-border rounded-lg py-2 px-3 text-sm text-navy dark:text-slate-100 focus:outline-none focus:border-gold transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy/60 dark:text-slate-400 mb-1">Payer Email</label>
                <input type="email" value={editBookingData.payer_email || ''} onChange={e => setEditBookingData((prev: any) => ({ ...prev, payer_email: e.target.value }))} className="w-full bg-offwhite dark:bg-midnight border border-sand dark:border-slate-border rounded-lg py-2 px-3 text-sm text-navy dark:text-slate-100 focus:outline-none focus:border-gold transition-colors" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-navy/60 dark:text-slate-400 mb-1">Payer Phone</label>
                <input type="text" value={editBookingData.payer_phone || ''} onChange={e => setEditBookingData((prev: any) => ({ ...prev, payer_phone: e.target.value }))} className="w-full bg-offwhite dark:bg-midnight border border-sand dark:border-slate-border rounded-lg py-2 px-3 text-sm text-navy dark:text-slate-100 focus:outline-none focus:border-gold transition-colors" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditBookingData(null)} className="px-4 py-2 text-sm font-medium text-navy/70 dark:text-slate-300 border border-sand dark:border-slate-border rounded-xl hover:bg-sand/50 dark:hover:bg-slate-border/50 transition-colors">Cancel</button>
              <button onClick={handleEditBooking} disabled={savingEdit} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gold text-white rounded-xl hover:bg-gold/90 disabled:opacity-60 transition-colors">
                {savingEdit && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CANCEL BOOKING MODAL ────────────────────────────────── */}
      {cancelModalBookingId !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setCancelModalBookingId(null); setCancelReason(''); }}>
          <div className="bg-white dark:bg-slate-card rounded-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center bg-red-50 dark:bg-red-500/10">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-serif font-bold text-navy dark:text-slate-100 mb-2 text-center">Cancel Booking</h3>
            <p className="text-sm text-navy/60 dark:text-slate-400 mb-4 text-center">
              Are you sure you want to cancel this booking?
            </p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-navy/60 dark:text-slate-400 mb-1">Reason (optional)</label>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Enter cancellation reason..."
                rows={3}
                className="w-full bg-offwhite dark:bg-midnight border border-sand dark:border-slate-border rounded-xl py-2.5 px-3 text-sm text-navy dark:text-slate-100 focus:outline-none focus:border-gold transition-colors resize-none"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setCancelModalBookingId(null); setCancelReason(''); }}
                disabled={cancellingBookingId === cancelModalBookingId}
                className="px-4 py-2 text-sm font-medium text-navy/70 dark:text-slate-300 border border-sand dark:border-slate-border rounded-xl hover:bg-sand/50 dark:hover:bg-slate-border/50 transition-colors disabled:opacity-50"
              >
                Keep Booking
              </button>
              <button
                onClick={handleAdminCancelBooking}
                disabled={cancellingBookingId === cancelModalBookingId}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-60 transition-colors"
              >
                {cancellingBookingId === cancelModalBookingId && <Loader2 className="w-4 h-4 animate-spin" />}
                Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION ─────────────────────────────────── */}
      {(deleteLandmarkId !== null || deleteItem !== null) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setDeleteLandmarkId(null); setDeleteItem(null); }}>
          <div className="bg-white dark:bg-slate-card rounded-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-serif font-bold text-navy dark:text-slate-100 mb-2">Confirm Delete</h3>
            <p className="text-sm text-navy/60 dark:text-slate-400 mb-6">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setDeleteLandmarkId(null); setDeleteItem(null); }}
                className="px-4 py-2 text-sm font-medium text-navy/70 dark:text-slate-300 border border-sand dark:border-slate-border rounded-xl hover:bg-sand/50 dark:hover:bg-slate-border/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteLandmarkId !== null ? handleDeleteLandmark : handleDeleteItem}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Mini Sparkline Chart ──────────────────────────────────────────
function Sparkline({ data, color = '#D4AF37' }: { data: number[]; color?: string }) {
  const w = 80;
  const h = 28;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts.split(' ').pop()?.split(',')[0]} cy={pts.split(' ').pop()?.split(',')[1]} r="2" fill={color} />
    </svg>
  );
}

// ─── Bar Chart ─────────────────────────────────────────────────────
function BarChart({
  data,
  bars = 7,
  color = '#D4AF37',
}: {
  data: { label: string; value: number }[];
  bars?: number;
  color?: string;
}) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-full">
      {data.slice(-bars).map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(d.value / max) * 100}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: i * 0.05 }}
            className="w-full rounded-t-md transition-colors duration-300"
            style={{ backgroundColor: color, opacity: 0.3 + 0.7 * (d.value / max) }}
            title={`${d.label}: ${d.value}`}
          />
          <span className="text-[8px] text-navy/50 dark:text-slate-400 truncate w-full text-center leading-tight">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Animated Counter ──────────────────────────────────────────────
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 800;
    const step = Math.max(1, Math.floor(end / 30));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { start = end; clearInterval(timer); }
      setDisplay(start);
    }, duration / 30);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}{suffix}</>;
}

// ─── Sortable Column Header ────────────────────────────────────────
function SortHeader({ label, field, currentField, direction, onSort }: {
  label: string;
  field: string;
  currentField: string;
  direction: 'asc' | 'desc';
  onSort: (field: string) => void;
}) {
  const isActive = currentField === field;
  const ArrowIcon = direction === 'asc' ? '▲' : '▼';
  return (
    <th
      className="px-4 py-3 cursor-pointer select-none hover:text-navy dark:hover:text-slate-100 transition-colors"
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive && <span className="text-[8px] leading-none">{ArrowIcon}</span>}
      </span>
    </th>
  );
}

// ─── Hover Preview Card ───────────────────────────────────────────
function HoverPreview({ children, content }: { children: React.ReactNode; content: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  return (
    <div
      className="relative"
      onMouseEnter={() => { clearTimeout(timeoutRef.current); showTimeoutRef.current = setTimeout(() => setShow(true), 350); }}
      onMouseLeave={() => { clearTimeout(showTimeoutRef.current); timeoutRef.current = setTimeout(() => setShow(false), 150); }}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full left-0 mt-1 w-64 bg-white dark:bg-slate-card border border-sand dark:border-slate-border rounded-xl shadow-lg p-3 pointer-events-auto"
            onMouseEnter={() => { clearTimeout(timeoutRef.current); setShow(true); }}
            onMouseLeave={() => { setShow(false); }}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Copy Button ──────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {}); }}
      className="inline-flex items-center gap-1 text-[10px] text-navy/40 dark:text-slate-500 hover:text-royal dark:hover:text-gold transition-colors"
      title="Copy to clipboard"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

// ─── Relative Time ─────────────────────────────────────────────────
function RelativeTime({ date }: { date: string }) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = Date.now() - new Date(date).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) setLabel('just now');
      else if (mins < 60) setLabel(`${mins}m ago`);
      else if (mins < 1440) setLabel(`${Math.floor(mins / 60)}h ago`);
      else setLabel(`${Math.floor(mins / 1440)}d ago`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [date]);
  return <span title={new Date(date).toLocaleString()}>{label}</span>;
}

// ─── Searchable Combobox ───────────────────────────────────────────
function FilterCombobox({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = options.filter(o =>
    o.toLowerCase().includes(input.toLowerCase())
  );

  useEffect(() => {
    setInput(value);
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (v: string) => {
    setInput(v);
    onChange(v);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium text-navy/60 dark:text-slate-400 mb-1">{label}</label>
      <input
        type="text"
        value={input}
        onChange={e => { setInput(e.target.value); setOpen(true); onChange(e.target.value); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? label}
        className="w-full bg-offwhite dark:bg-midnight border border-sand dark:border-slate-border rounded-lg py-1.5 px-2.5 text-xs text-navy dark:text-slate-100 focus:outline-none focus:border-gold transition-colors"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-0.5 w-full bg-white dark:bg-slate-card border border-sand dark:border-slate-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {filtered.map(o => (
            <button
              key={o}
              onClick={() => handleSelect(o)}
              className={`w-full text-left px-2.5 py-1.5 text-xs transition-colors hover:bg-sand/50 dark:hover:bg-slate-border/50 ${
                o === value ? 'text-gold font-medium' : 'text-navy dark:text-slate-200'
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      )}
      {open && filtered.length === 0 && (
        <div className="absolute z-50 mt-0.5 w-full bg-white dark:bg-slate-card border border-sand dark:border-slate-border rounded-lg shadow-lg px-2.5 py-2 text-xs text-navy/40 dark:text-slate-500">
          No matches
        </div>
      )}
    </div>
  );
}
export default AdminDashboard;
