import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { ConfirmModal } from '../components/ConfirmModal';
import QRCode from 'qrcode';
import { downloadTicketPdf } from '../lib/pdfTicket';
import {
  ChevronLeft,
  Calendar,
  Users,
  CreditCard,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Hourglass,
  Download,
} from 'lucide-react';

export function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelRequested, setCancelRequested] = useState(false);
  const [cancelResult, setCancelResult] = useState<any>(null);
  const [cancelError, setCancelError] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<any>(`/bookings/${id}`)
      .then(setBooking)
      .catch(() => navigate('/profile'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    if (booking?.qr_token) {
      QRCode.toDataURL(booking.qr_token, { width: 320, margin: 2 }).then(setQrDataUrl);
    }
  }, [booking?.qr_token]);

  const handleCancelRequest = async () => {
    setCancelling(true);
    setCancelError('');
    try {
      const res = await api.post<any>(`/bookings/${id}/request-cancellation`);
      setCancelResult(res);
      setCancelRequested(true);
      setBooking((prev: any) => ({ ...prev, cancellation_requested_at: new Date().toISOString() }));
      setConfirmOpen(false);
    } catch {
      setCancelError('Failed to request cancellation. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!qrDataUrl) return;
    await downloadTicketPdf({
      landmarkName: booking.landmark?.name || 'Landmark',
      landmarkImage: booking.landmark?.image,
      region: booking.landmark?.region,
      confirmationCode: booking.confirmation_code,
      bookingDate: booking.booking_date,
      adults: booking.adults,
      children: booking.children,
      subtotal: booking.subtotal,
      serviceFee: booking.service_fee,
      total: booking.total,
      currency: booking.currency,
      paymentMethod: booking.payment_method,
      paymentStatus: booking.payment_status,
      payerName: booking.payer_name,
      payerEmail: booking.payer_email,
      payerPhone: booking.payer_phone,
      qrDataUrl,
      userName: booking.user?.name || booking.user,
    }, `ticket-${booking.confirmation_code || 'booking'}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) return null;

  const lm = booking.landmark;
  const isCancelled = booking.status === 'cancelled';
  const isCancellationRequested = !!booking.cancellation_requested_at || cancelRequested;
  const isPast = booking.booking_date < new Date().toISOString().slice(0, 10);
  const canCancel = !isCancelled && !isCancellationRequested && !isPast;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 pb-24">
      <button
        onClick={() => navigate('/profile')}
        className="flex items-center gap-2 text-navy/60 dark:text-slate-400 hover:text-navy dark:hover:text-slate-100 transition-colors mb-8 font-medium"
      >
        <ChevronLeft className="w-5 h-5" /> Back to Profile
      </button>

      {cancelResult && cancelResult.refund && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-800 dark:text-emerald-300">
            Booking cancelled successfully. Refund of <strong>{cancelResult.refund.amount} EGP</strong> will be processed within {cancelResult.refund.eta_days} business days.
          </p>
        </motion.div>
      )}

      <div ref={ticketRef} className="bg-white dark:bg-slate-card rounded-[30px] shadow-soft dark:shadow-soft-dark border border-sand dark:border-slate-border overflow-hidden">
        {/* Header */}
        <div className="relative h-48 sm:h-56">
          <img
            src={lm.image}
            alt={lm.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-1">
              {lm.name}
            </h1>
            <p className="text-white/80 text-sm flex items-center gap-1">
              <MapPin className="w-4 h-4" /> {lm.region}
            </p>
          </div>
          {isCancelled ? (
            <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> Cancelled
            </div>
          ) : isCancellationRequested ? (
            <div className="absolute top-4 right-4 bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
              <Hourglass className="w-3.5 h-3.5" /> Cancellation Requested
            </div>
          ) : null}
        </div>

        <div className="p-6 space-y-6">
          {/* Status & Reference */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {isCancellationRequested ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <Hourglass className="w-3.5 h-3.5" /> Pending Approval
                </span>
              ) : (
                <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full ${
                  isCancelled
                    ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                    : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                }`}>
                  {isCancelled ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {isCancelled ? 'Cancelled' : 'Confirmed'}
                </span>
              )}
              {isPast && !isCancelled && !isCancellationRequested && (
                <span className="inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-border/50 text-navy/60 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5" /> Completed
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-navy/50 dark:text-slate-400">Reference</p>
              <p className="text-lg font-bold font-mono text-navy dark:text-slate-100 tracking-wider">
                {booking.confirmation_code}
              </p>
            </div>
          </div>

          {/* Cancellation Reason */}
          {isCancelled && booking.cancellation_reason && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">Cancellation Reason</p>
                <p className="text-sm text-red-600/80 dark:text-red-300/80 mt-0.5">{booking.cancellation_reason}</p>
              </div>
            </div>
          )}

          <hr className="border-sand dark:border-slate-border" />

          {/* Booking Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-sand/20 dark:bg-slate-border/40 rounded-xl p-4">
              <p className="text-xs text-navy/50 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Date
              </p>
              <p className="font-semibold text-navy dark:text-slate-100">{booking.booking_date}</p>
              <p className="text-xs text-navy/40 dark:text-slate-500 mt-0.5">
                Booked {new Date(booking.created_at).toLocaleString()}
              </p>
            </div>
            <div className="bg-sand/20 dark:bg-slate-border/40 rounded-xl p-4">
              <p className="text-xs text-navy/50 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Tickets
              </p>
              <p className="font-semibold text-navy dark:text-slate-100">
                {booking.adults} Adult{booking.adults > 1 ? 's' : ''}
                {booking.children > 0 && `, ${booking.children} Child${booking.children > 1 ? 'ren' : ''}`}
              </p>
            </div>
            <div className="bg-sand/20 dark:bg-slate-border/40 rounded-xl p-4">
              <p className="text-xs text-navy/50 dark:text-slate-400 mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5" /> Payment
              </p>
              <p className="font-semibold text-navy dark:text-slate-100 capitalize">{booking.payment_method}</p>
              <p className={`text-xs font-medium ${
                booking.payment_status === 'paid' || booking.payment_status === 'refunded'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}>
                {booking.payment_status}
              </p>
            </div>
            <div className="bg-sand/20 dark:bg-slate-border/40 rounded-xl p-4">
              <p className="text-xs text-navy/50 dark:text-slate-400 mb-1">Total Paid</p>
              <p className="text-xl font-bold text-gold">{booking.total} {booking.currency}</p>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-sand/20 dark:bg-slate-border/40 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-navy dark:text-slate-100 mb-3">Price Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-navy/70 dark:text-slate-300">{booking.adults}x Adult Ticket</span>
                <span className="text-navy dark:text-slate-100">{booking.subtotal - booking.children * (booking.subtotal / (booking.adults + booking.children * 0.5)) * 0.5} EGP</span>
              </div>
              {booking.children > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-navy/70 dark:text-slate-300">{booking.children}x Child Ticket (50%)</span>
                  <span className="text-navy dark:text-slate-100">{booking.children * (booking.subtotal / (booking.adults + booking.children * 0.5)) * 0.5} EGP</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-navy/70 dark:text-slate-300">Service Fee</span>
                <span className="text-navy dark:text-slate-100">{booking.service_fee} EGP</span>
              </div>
              <hr className="border-sand dark:border-slate-border" />
              <div className="flex justify-between font-semibold text-navy dark:text-slate-100">
                <span>Total</span>
                <span>{booking.total} {booking.currency}</span>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-sand/20 dark:bg-slate-border/40 rounded-2xl p-6 text-center">
            <div className="w-48 h-48 bg-white dark:bg-slate-card mx-auto rounded-xl p-2 shadow-sm border border-sand dark:border-slate-border flex items-center justify-center mb-3">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Booking QR Code" className="w-full h-full" />
              ) : (
                <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
              )}
            </div>
            <p className="text-sm text-navy/60 dark:text-slate-400">
              Show this QR code at the entrance
            </p>
          </div>

          {/* Payer Details */}
          <div className="bg-sand/20 dark:bg-slate-border/40 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-navy dark:text-slate-100 mb-3">Payer Details</h3>
            <div className="space-y-1 text-sm text-navy/70 dark:text-slate-300">
              <p><span className="text-navy/50 dark:text-slate-400">Name:</span> {booking.payer_name}</p>
              <p><span className="text-navy/50 dark:text-slate-400">Email:</span> {booking.payer_email}</p>
              {booking.payer_phone && (
                <p><span className="text-navy/50 dark:text-slate-400">Phone:</span> {booking.payer_phone}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleDownloadPdf}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-sand dark:border-slate-border rounded-xl font-medium text-navy dark:text-slate-100 hover:bg-sand/30 dark:hover:bg-slate-border transition-colors"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
            <Link
              to={`/landmark/${lm.id}`}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-sand dark:border-slate-border rounded-xl font-medium text-navy dark:text-slate-100 hover:bg-sand/30 dark:hover:bg-slate-border transition-colors"
            >
              <MapPin className="w-4 h-4" /> View Landmark
            </Link>
            {isCancellationRequested ? (
              <div className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-400 text-sm font-medium">
                <Hourglass className="w-4 h-4" /> Cancellation pending admin approval
              </div>
            ) : canCancel ? (
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={cancelling}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-red-200 dark:border-red-500/30 rounded-xl font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                {cancelling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" /> Request Cancellation
                  </>
                )}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Request Cancellation"
        message="Are you sure you want to request cancellation? An admin will review and approve your request."
        confirmLabel="Request Cancellation"
        confirmDanger
        loading={cancelling}
        onConfirm={handleCancelRequest}
        onCancel={() => { setConfirmOpen(false); setCancelError(''); }}
      />

      <AnimatePresence>
        {cancelError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 right-8 bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg z-50"
          >
            <span className="text-sm font-medium">{cancelError}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
