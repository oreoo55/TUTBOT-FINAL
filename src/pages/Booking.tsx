import React, { useState, useEffect, Fragment } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api, getAuthToken } from '../lib/api';
import { Skeleton } from '../components/Skeleton';
import { ErrorBoundary } from '../components/ErrorBoundary';
import QRCode from 'qrcode';
import { downloadTicketPdf } from '../lib/pdfTicket';

import {
  ChevronLeft,
  Calendar as CalendarIcon,
  Users,
  CreditCard,
  Smartphone,
  QrCode,
  Banknote,
  CheckCircle2,
  Download,
  ArrowRight,
  MapPin,
  Upload,
  X } from
'lucide-react';
export function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!getAuthToken()) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);
  const [landmark, setLandmark] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [dataError, setDataError] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [date, setDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [personalDetails, setPersonalDetails] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [vodafonePhone, setVodafonePhone] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    const abort = new AbortController();
    api.get<any>(`/landmarks/${id}`, { signal: abort.signal })
      .then(res => {
        setLandmark(res);
        setDataError('');
        setLoading(false);
      })
      .catch(() => {
        if (!abort.signal.aborted) {
          setDataError('Failed to load landmark details');
          setLoading(false);
        }
      });
    api.get<any>('/me', { signal: abort.signal }).then(u => {
      setPersonalDetails(p => ({ ...p, name: u.name || '', email: u.email || '' }));
    }).catch(() => {});
    return () => abort.abort();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-64 rounded-[25px]" />
            <Skeleton className="h-48 rounded-[25px]" />
          </div>
          <div>
            <Skeleton className="h-72 rounded-[30px]" />
          </div>
        </div>
      </div>
    );
  }
  if (dataError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
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
  if (!landmark) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-serif font-bold text-navy dark:text-slate-100 mb-4">
          Landmark not found
        </h2>
        <button
          onClick={() => navigate('/discover')}
          className="text-royal hover:underline">
          
          Return to Discover
        </button>
      </div>);

  }
  const ticketPrice = landmark.price;
  const subtotal = adults * ticketPrice + children * ticketPrice * 0.5;
  const serviceFee = ticketPrice === 0 ? 0 : 50;
  const total = ticketPrice === 0 ? 0 : subtotal + serviceFee;
  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };
  const handleBack = () => {
    if (step > 1) setStep(step - 1);else
    navigate(-1);
  };
  const handleDownloadPdf = async () => {
    if (!bookingResult || !qrDataUrl) return;
    await downloadTicketPdf({
      landmarkName: landmark.name,
      landmarkImage: landmark.image,
      region: landmark.region,
      confirmationCode: bookingResult.confirmation_code || bookingResult.confirmationCode || 'N/A',
      bookingDate: date,
      adults,
      children,
      subtotal: bookingResult.subtotal,
      serviceFee: bookingResult.service_fee || bookingResult.serviceFee || 50,
      total: bookingResult.total,
      currency: bookingResult.currency || 'EGP',
      paymentMethod: paymentMethod,
      paymentStatus: bookingResult.payment_status || bookingResult.paymentStatus || 'pending',
      payerName: personalDetails.name,
      payerEmail: personalDetails.email,
      payerPhone: personalDetails.phone,
      qrDataUrl,
      userName: personalDetails.name,
      createdAt: bookingResult.created_at,
    }, `ticket-${bookingResult.confirmation_code || 'booking'}.pdf`);
  };
    const toBase64 = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = () => reject(new Error('Failed to read receipt file'));
        reader.readAsDataURL(file);
      });

    const handleCheckout = async () => {
      if (paymentMethod === 'vodafone') {
        if (!/^010\d{8}$/.test(vodafonePhone)) {
          setError('Enter a valid Vodafone Cash number starting with 010 (11 digits)');
          return;
        }
      }
      if ((paymentMethod === 'vodafone' || paymentMethod === 'instapay') && !receiptFile) {
        setError('Please upload a photo of the transaction receipt.');
        return;
      }
      setIsProcessing(true);
      setError('');
      const abortCtrl = new AbortController();
      const timeoutId = setTimeout(() => abortCtrl.abort(), 30000);
      try {
        const body: any = {
          landmark_id: id,
          booking_date: date,
          adults,
          children,
          payment_method: paymentMethod,
          payer_details: {
            name: personalDetails.name,
            email: personalDetails.email,
            phone: paymentMethod === 'vodafone' ? vodafonePhone : personalDetails.phone,
          },
        };
        if (receiptFile && (paymentMethod === 'vodafone' || paymentMethod === 'instapay')) {
          body.receipt_base64 = await toBase64(receiptFile);
          body.receipt_extension = receiptFile.name.split('.').pop() || 'png';
        }
        const res = await api.post<any>('/bookings', body, { signal: abortCtrl.signal });
        clearTimeout(timeoutId);
        setBookingResult(res);
        if (res?.qr_token) {
          QRCode.toDataURL(res.qr_token, { width: 320, margin: 2 }).then(setQrDataUrl);
        }
        setStep(4);
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
          setError('Request timed out. The server may be busy — please try again.');
        } else {
          setError(err?.body?.message || err?.message || 'Booking failed. Please try again.');
        }
      } finally {
        setIsProcessing(false);
      }
    };
  return (
    <ErrorBoundary>
    <div className="max-w-6xl mx-auto px-6 py-12 pb-24">
      {step < 4 &&
        <motion.button
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleBack}
          className="flex items-center gap-2 text-navy/60 dark:text-slate-400 hover:text-navy dark:hover:text-slate-100 transition-colors mb-8 font-medium">
          
          <ChevronLeft className="w-5 h-5" /> Back
        </motion.button>
      }

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Form Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2">
          {step < 4 &&
          <div className="mb-10">
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-navy dark:text-slate-100 mb-4">
                {step === 1 && 'Select Tickets'}
                {step === 2 && 'Personal Details'}
                {step === 3 && 'Payment Method'}
              </h1>

              {/* Progress Steps */}
              <div className="flex items-center gap-2 mt-6">
                {[1, 2, 3].map((s) =>
              <Fragment key={s}>
                    <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s ? 'bg-gold text-white shadow-glow' : 'bg-sand/50 dark:bg-slate-border text-navy/40 dark:text-slate-400'}`}>
                  
                      {s}
                    </div>
                    {s < 3 &&
                <div
                  className={`h-1 w-12 rounded-full transition-colors ${step > s ? 'bg-gold' : 'bg-sand/50 dark:bg-slate-border'}`} />

                }
                  </Fragment>
              )}
              </div>
            </div>
          }

          <AnimatePresence mode="wait">
            {step === 1 &&
            <motion.div
              key="step1"
              initial={{
                opacity: 0,
                x: 20
              }}
              animate={{
                opacity: 1,
                x: 0
              }}
              exit={{
                opacity: 0,
                x: -20
              }}
              className="space-y-8">
              
                <div className="bg-white dark:bg-slate-card rounded-[25px] p-8 shadow-soft border border-sand dark:border-slate-border">
                  <h3 className="text-xl font-serif font-bold text-navy dark:text-slate-100 mb-6 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-royal dark:text-gold" />{' '}
                    Select Date
                  </h3>
                  <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full max-w-md bg-sand/20 dark:bg-slate-card border border-sand dark:border-slate-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold/50 text-navy dark:text-slate-100"
                  min={new Date().toISOString().split('T')[0]} />
                
                </div>

                <div className="bg-white dark:bg-slate-card rounded-[25px] p-8 shadow-soft border border-sand dark:border-slate-border">
                  <h3 className="text-xl font-serif font-bold text-navy dark:text-slate-100 mb-6 flex items-center gap-2">
                    <Users className="w-5 h-5 text-royal dark:text-gold" />{' '}
                    Number of Tickets
                  </h3>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-navy dark:text-slate-100">
                          Adults
                        </p>
                        <p className="text-sm text-navy/60 dark:text-slate-400">
                          {ticketPrice === 0 ? 'Free' : `${ticketPrice} EGP`}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 bg-sand/20 dark:bg-slate-border/40 rounded-xl p-1 border border-sand dark:border-slate-border">
                        <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setAdults(Math.max(1, adults - 1))}
                        className="w-10 h-10 rounded-lg bg-white dark:bg-slate-card shadow-sm flex items-center justify-center text-navy dark:text-slate-100 font-bold hover:bg-sand/50 dark:hover:bg-slate-border transition-colors">
                        
                          -
                        </motion.button>
                        <span className="w-4 text-center font-bold text-navy dark:text-slate-100">
                          {adults}
                        </span>
                        <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setAdults(adults + 1)}
                        className="w-10 h-10 rounded-lg bg-white dark:bg-slate-card shadow-sm flex items-center justify-center text-navy dark:text-slate-100 font-bold hover:bg-sand/50 dark:hover:bg-slate-border transition-colors">
                        
                          +
                        </motion.button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-navy dark:text-slate-100">
                          Children (Under 12)
                        </p>
                        <p className="text-sm text-navy/60 dark:text-slate-400">
                          {ticketPrice === 0 ?
                        'Free' :
                        `${ticketPrice * 0.5} EGP`}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 bg-sand/20 dark:bg-slate-border/40 rounded-xl p-1 border border-sand dark:border-slate-border">
                        <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setChildren(Math.max(0, children - 1))}
                        className="w-10 h-10 rounded-lg bg-white dark:bg-slate-card shadow-sm flex items-center justify-center text-navy dark:text-slate-100 font-bold hover:bg-sand/50 dark:hover:bg-slate-border transition-colors">
                        
                          -
                        </motion.button>
                        <span className="w-4 text-center font-bold text-navy dark:text-slate-100">
                          {children}
                        </span>
                        <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setChildren(children + 1)}
                        className="w-10 h-10 rounded-lg bg-white dark:bg-slate-card shadow-sm flex items-center justify-center text-navy dark:text-slate-100 font-bold hover:bg-sand/50 dark:hover:bg-slate-border transition-colors">
                        
                          +
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>

                <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleNext}
                disabled={!date}
                className="w-full bg-gold text-white py-4 rounded-xl font-medium shadow-glow hover:bg-gold/90 transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                
                  Continue to Details <ArrowRight className="w-5 h-5" />
                </motion.button>
              </motion.div>
            }

            {step === 2 &&
            <motion.div
              key="step2"
              initial={{
                opacity: 0,
                x: 20
              }}
              animate={{
                opacity: 1,
                x: 0
              }}
              exit={{
                opacity: 0,
                x: -20
              }}
              className="space-y-8">
              
                <div className="bg-white dark:bg-slate-card rounded-[25px] p-8 shadow-soft border border-sand dark:border-slate-border space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-navy dark:text-slate-100 mb-2">
                      Full Name
                    </label>
                    <input
                    type="text"
                    value={personalDetails.name}
                    onChange={(e) =>
                    setPersonalDetails({
                      ...personalDetails,
                      name: e.target.value
                    })
                    }
                    className="w-full bg-sand/20 dark:bg-slate-card border border-sand dark:border-slate-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold/50 text-navy dark:text-slate-100" />
                  
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy dark:text-slate-100 mb-2">
                      Email Address
                    </label>
                    <input
                    type="email"
                    value={personalDetails.email}
                    onChange={(e) =>
                    setPersonalDetails({
                      ...personalDetails,
                      email: e.target.value
                    })
                    }
                    className="w-full bg-sand/20 dark:bg-slate-card border border-sand dark:border-slate-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold/50 text-navy dark:text-slate-100" />
                  
                    <p className="text-xs text-navy/50 dark:text-slate-400 mt-2">
                      Your tickets will be sent to this email.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy dark:text-slate-100 mb-2">
                      Phone Number
                    </label>
                    <input
                    type="tel"
                    value={personalDetails.phone}
                    onChange={(e) =>
                    setPersonalDetails({
                      ...personalDetails,
                      phone: e.target.value
                    })
                    }
                    placeholder="+20 123 456 7890"
                    className="w-full bg-sand/20 dark:bg-slate-card border border-sand dark:border-slate-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold/50 text-navy dark:text-slate-100 dark:placeholder:text-slate-400" />
                  
                  </div>
                </div>

                <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleNext}
                disabled={
                !personalDetails.name ||
                !personalDetails.email ||
                !personalDetails.phone
                }
                className="w-full bg-gold text-white py-4 rounded-xl font-medium shadow-glow hover:bg-gold/90 transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                
                  Continue to Payment <ArrowRight className="w-5 h-5" />
                </motion.button>
              </motion.div>
            }

            {step === 3 &&
            <motion.div
              key="step3"
              initial={{
                opacity: 0,
                x: 20
              }}
              animate={{
                opacity: 1,
                x: 0
              }}
              exit={{
                opacity: 0,
                x: -20
              }}
              className="space-y-8">
              
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                {
                  id: 'card',
                  icon: CreditCard,
                  label: 'Credit / Debit Card'
                },
                {
                  id: 'vodafone',
                  icon: Smartphone,
                  label: 'Vodafone Cash'
                },
                {
                  id: 'instapay',
                  icon: QrCode,
                  label: 'InstaPay'
                },
                {
                  id: 'cash',
                  icon: Banknote,
                  label: 'Cash on Arrival'
                }].
                map((method) =>
                <motion.button
                  key={method.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-6 rounded-[20px] border-2 flex flex-col items-center justify-center gap-3 transition-all ${paymentMethod === method.id ? 'border-gold bg-gold/5 shadow-md' : 'border-sand dark:border-slate-border bg-white dark:bg-slate-card hover:border-gold/30'}`}>
                  
                      <method.icon
                    className={`w-8 h-8 ${paymentMethod === method.id ? 'text-gold' : 'text-navy/40 dark:text-slate-400'}`} />
                  
                      <span
                    className={`font-medium ${paymentMethod === method.id ? 'text-navy dark:text-slate-100' : 'text-navy/60 dark:text-slate-400'}`}>
                    
                        {method.label}
                      </span>
                    </motion.button>
                )}
                </div>

                <div className="bg-white dark:bg-slate-card rounded-[25px] p-8 shadow-soft border border-sand dark:border-slate-border">
                  {paymentMethod === 'card' &&
                <div className="space-y-4">
                      <div className="relative">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy/40 dark:text-slate-400" />
                        <input
                      type="text"
                      placeholder="Card Number"
                      className="w-full bg-sand/20 dark:bg-slate-card border border-sand dark:border-slate-border rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold/50 text-navy dark:text-slate-100 dark:placeholder:text-slate-400" />
                    
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full bg-sand/20 dark:bg-slate-card border border-sand dark:border-slate-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold/50 text-navy dark:text-slate-100 dark:placeholder:text-slate-400" />
                    
                        <input
                      type="text"
                      placeholder="CVC"
                      className="w-full bg-sand/20 dark:bg-slate-card border border-sand dark:border-slate-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold/50 text-navy dark:text-slate-100 dark:placeholder:text-slate-400" />
                    
                      </div>
                      <input
                    type="text"
                    placeholder="Cardholder Name"
                    className="w-full bg-sand/20 dark:bg-slate-card border border-sand dark:border-slate-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold/50 text-navy dark:text-slate-100 dark:placeholder:text-slate-400" />
                  
                    </div>
                }
                  {paymentMethod === 'vodafone' &&
                <div className="space-y-4">
                      <p className="text-sm text-navy/70 dark:text-slate-300 mb-4">
                        Enter your Vodafone Cash wallet number. You will receive
                        a prompt on your phone to confirm the payment.
                      </p>
                      <div className="relative">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy/40 dark:text-slate-400" />
                        <input
                      type="tel"
                      placeholder="010 XXXX XXXX"
                      value={vodafonePhone}
                      onChange={(e) => { setError(''); setVodafonePhone(e.target.value.replace(/\D/g, '').slice(0, 11)); }}
                      className="w-full bg-sand/20 dark:bg-slate-card border border-sand dark:border-slate-border rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold/50 text-navy dark:text-slate-100 dark:placeholder:text-slate-400" />
                    
                      </div>
                    </div>
                }
                  {paymentMethod === 'instapay' &&
                <div className="flex flex-col items-center justify-center py-6 text-center">
                      <div className="w-48 h-48 bg-sand/30 dark:bg-slate-border/40 rounded-2xl border-2 border-dashed border-sand dark:border-slate-border flex items-center justify-center mb-4">
                        <QrCode className="w-16 h-16 text-navy/20 dark:text-slate-400" />
                      </div>
                      <p className="text-sm text-navy/70 dark:text-slate-300">
                        Scan the QR code with your InstaPay app or enter our
                        VPA: <strong>tutbot@instapay</strong>
                      </p>
                    </div>
                }
                  {paymentMethod === 'cash' &&
                <div className="text-center py-6">
                      <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Banknote className="w-8 h-8 text-gold" />
                      </div>
                      <p className="text-navy dark:text-slate-100 font-medium mb-2">
                        Pay when you arrive
                      </p>
                      <p className="text-sm text-navy/60 dark:text-slate-400 max-w-sm mx-auto">
                        Your tickets will be reserved. Please present your
                        booking confirmation at the ticket counter to pay and
                        collect your physical tickets.
                      </p>
                    </div>
                }
                </div>

                {(paymentMethod === 'vodafone' || paymentMethod === 'instapay') && (
                <div className="bg-white dark:bg-slate-card rounded-[25px] p-8 shadow-soft border border-sand dark:border-slate-border mt-4">
                  <h4 className="text-lg font-serif font-bold text-navy dark:text-slate-100 mb-4 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-royal dark:text-gold" />
                    Upload Transaction Receipt
                  </h4>
                  <p className="text-sm text-navy/60 dark:text-slate-400 mb-4">
                    Please upload a clear photo of the transaction receipt or payment confirmation so the admin can verify your payment. Your booking will remain pending until approved.
                  </p>
                  <div className="flex flex-col items-center gap-4">
                    {receiptPreview ? (
                      <div className="relative w-full max-w-sm">
                        <img src={receiptPreview} alt="Receipt preview" className="w-full h-48 object-contain rounded-xl border border-sand dark:border-slate-border bg-sand/20" />
                        <button
                          onClick={() => { setReceiptFile(null); setReceiptPreview(''); }}
                          className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full max-w-sm h-40 border-2 border-dashed border-sand dark:border-slate-border rounded-xl cursor-pointer hover:border-gold/50 hover:bg-gold/5 transition-all">
                        <Upload className="w-8 h-8 text-navy/30 dark:text-slate-500 mb-2" />
                        <span className="text-sm text-navy/50 dark:text-slate-400">Click to upload receipt photo</span>
                        <span className="text-xs text-navy/40 dark:text-slate-500 mt-1">PNG, JPG or WEBP</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setReceiptFile(file);
                              setReceiptPreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
                )}

                {error &&
                  <p className="text-red-500 text-sm text-center mb-4">{error}</p>
                }

                <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full bg-gold text-white py-4 rounded-xl font-medium shadow-glow hover:bg-gold/90 transition-colors text-lg disabled:opacity-70 flex items-center justify-center gap-2">
                
                  {isProcessing ?
                <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </> :

                paymentMethod === 'cash' ? 'Confirm Booking' : 'Pay ' + total + ' EGP'
                }
                </motion.button>
              </motion.div>
            }

            {step === 4 &&
            <motion.div
              key="step4"
              initial={{
                opacity: 0,
                scale: 0.95
              }}
              animate={{
                opacity: 1,
                scale: 1
              }}
              className="bg-white dark:bg-slate-card rounded-[30px] p-10 shadow-soft border border-sand dark:border-slate-border text-center">
              
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-3xl font-serif font-bold text-navy dark:text-slate-100 mb-2">
                  Booking Confirmed!
                </h2>
                <p className="text-navy/60 dark:text-slate-400 mb-8">
                  Your tickets for {landmark.name} have been successfully
                  booked. A confirmation email has been sent to{' '}
                  {personalDetails.email}.
                </p>

                <div className="bg-sand/20 dark:bg-slate-border/40 rounded-2xl p-6 max-w-md mx-auto mb-8 border border-sand dark:border-slate-border">
                  <div className="flex justify-between text-sm mb-4">
                    <span className="text-navy/60 dark:text-slate-400">
                      Booking Reference
                    </span>
                    <span className="font-bold text-navy dark:text-slate-100">
                      {bookingResult?.confirmation_code || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-4">
                    <span className="text-navy/60 dark:text-slate-400">
                      Date
                    </span>
                    <span className="font-bold text-navy dark:text-slate-100">
                      {date}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-6">
                    <span className="text-navy/60 dark:text-slate-400">
                      Tickets
                    </span>
                    <span className="font-bold text-navy dark:text-slate-100">
                      {adults} Adult{adults > 1 ? 's' : ''}
                      {children > 0 ?
                    `, ${children} Child${children > 1 ? 'ren' : ''}` :
                    ''}
                    </span>
                  </div>

                  <div className="w-48 h-48 bg-white dark:bg-slate-card mx-auto rounded-xl p-2 shadow-sm border border-sand dark:border-slate-border flex items-center justify-center mb-4">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="Booking QR Code" className="w-full h-full" />
                    ) : (
                      <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                    )}
                  </div>
                  <p className="text-xs text-navy/50 dark:text-slate-400">
                    Show this QR code at the entrance
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button onClick={handleDownloadPdf} className="flex items-center justify-center gap-2 px-6 py-3 bg-royal/5 dark:bg-gold/10 text-royal dark:text-gold font-medium rounded-xl hover:bg-royal/10 dark:hover:bg-gold/20 transition-colors">
                    <Download className="w-5 h-5" /> Download PDF Ticket
                  </button>
                  <Link
                  to="/profile"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gold text-white font-medium rounded-xl hover:bg-gold/90 shadow-glow transition-colors">
                  
                    View in Profile
                  </Link>
                </div>
              </motion.div>
            }
          </AnimatePresence>
        </motion.div>

        {/* Sticky Order Summary */}
        {step < 4 &&
        <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-card rounded-[30px] p-6 shadow-soft border border-sand dark:border-slate-border sticky top-28">
              <h3 className="text-xl font-serif font-bold text-navy dark:text-slate-100 mb-6">
                Order Summary
              </h3>

              <div className="flex gap-4 mb-6 pb-6 border-b border-sand dark:border-slate-border">
                <img
                src={landmark.image}
                alt={landmark.name}
                className="w-20 h-20 rounded-xl object-cover" />
              
                <div>
                  <h4 className="font-bold text-navy dark:text-slate-100 line-clamp-1">
                    {landmark.name}
                  </h4>
                  <p className="text-xs text-navy/60 dark:text-slate-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {landmark.region}
                  </p>
                  {date &&
                <p className="text-xs font-medium text-royal dark:text-gold mt-2">
                      {date}
                    </p>
                }
                </div>
              </div>

              <div className="space-y-4 mb-6 pb-6 border-b border-sand dark:border-slate-border">
                <div className="flex justify-between text-sm">
                  <span className="text-navy/70 dark:text-slate-300">
                    {adults}x Adult Ticket
                  </span>
                  <span className="font-medium text-navy dark:text-slate-100">
                    {adults * ticketPrice} EGP
                  </span>
                </div>
                {children > 0 &&
              <div className="flex justify-between text-sm">
                    <span className="text-navy/70 dark:text-slate-300">
                      {children}x Child Ticket
                    </span>
                    <span className="font-medium text-navy dark:text-slate-100">
                      {children * ticketPrice * 0.5} EGP
                    </span>
                  </div>
              }
                <div className="flex justify-between text-sm">
                  <span className="text-navy/70 dark:text-slate-300">
                    Service Fee
                  </span>
                  <span className="font-medium text-navy dark:text-slate-100">
                    {serviceFee} EGP
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-end mb-2">
                <span className="text-navy dark:text-slate-100 font-bold">
                  Grand Total
                </span>
                <span className="text-2xl font-serif font-bold text-gold">
                  {total} EGP
                </span>
              </div>
              <p className="text-xs text-navy/40 dark:text-slate-400 text-right">
                Including all taxes and fees
              </p>
            </div>
          </div>
        }
      </div>
    </div>
    </ErrorBoundary>);

}