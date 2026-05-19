import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { reviews } from '../data/mockData';
import { api, setAuthToken } from '../lib/api';
import type { AuthResponse } from '../lib/types';
type ViewType = 'login' | 'forgot' | 'otp' | 'reset' | 'success';
interface FormData {
  email: string;
  password: string;
  otp: string[];
  newPassword: string;
  confirmPassword: string;
  rememberMe: boolean;
}
export function Login() {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewType>('login');
  const [direction, setDirection] = useState(1);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const loginEmailRef = useRef<HTMLInputElement>(null);
  const loginPasswordRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    otp: ['', '', '', '', '', ''],
    newPassword: '',
    confirmPassword: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );
  const [showAdminChoice, setShowAdminChoice] = useState(false);
  const [adminData, setAdminData] = useState<AuthResponse | null>(null);
  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  // OTP timer
  useEffect(() => {
    if (view === 'otp' && resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [view, resendTimer]);
  const getPasswordStrength = (password: string) => {
    if (password.length === 0)
    return {
      label: '',
      strength: 0
    };
    if (password.length < 6)
    return {
      label: 'Weak',
      strength: 1
    };
    if (password.length < 10)
    return {
      label: 'Medium',
      strength: 2
    };
    return {
      label: 'Strong',
      strength: 3
    };
  };
  const passwordStrength = getPasswordStrength(formData.newPassword);
  const goToView = (newView: ViewType) => {
    setDirection(
      ['login', 'forgot', 'otp', 'reset', 'success'].indexOf(newView) >
      ['login', 'forgot', 'otp', 'reset', 'success'].indexOf(view) ?
      1 :
      -1
    );
    setView(newView);
    setErrors({});
  };
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = loginEmailRef.current?.value?.trim() || '';
    const password = loginPasswordRef.current?.value || '';
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      try {
        const res = await api.post<AuthResponse>('/auth/login', {
          email,
          password,
        });
        setAuthToken(res.token);
        if (res.user.is_admin) {
          setAdminData(res);
          setShowAdminChoice(true);
        } else {
          navigate('/');
        }
      } catch (err: any) {
        if (err.body?.errors?.email) {
          setErrors({ email: err.body.errors.email[0] });
        } else {
          setErrors({ email: 'Invalid credentials. Please try again.' });
        }
      }
    }
  };
  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setResendTimer(60);
      setCanResend(false);
      goToView('otp');
    }
  };
  const handleOtpChange = (index: number, value: string) => {
    // Only allow single digit
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...formData.otp];
    newOtp[index] = value;
    setFormData({
      ...formData,
      otp: newOtp
    });
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  const handleOtpKeyDown = (
  index: number,
  e: React.KeyboardEvent<HTMLInputElement>) =>
  {
    if (e.key === 'Backspace' && !formData.otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;
    const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setFormData({
      ...formData,
      otp: newOtp
    });
    // Focus last filled input or first empty
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };
  const handleVerifyOtp = () => {
    if (formData.otp.every((digit) => digit !== '')) {
      goToView('reset');
    } else {
      setErrors({
        otp: 'Please enter all 6 digits'
      });
    }
  };
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      goToView('success');
    }
  };
  const handleResendCode = () => {
    if (canResend) {
      setResendTimer(60);
      setCanResend(false);
      // In real app, would trigger API call to resend code
    }
  };
  const resetToLogin = () => {
    setFormData({
      email: '',
      password: '',
      otp: ['', '', '', '', '', ''],
      newPassword: '',
      confirmPassword: '',
      rememberMe: false
    });
    setErrors({});
    goToView('login');
  };
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0
    })
  };
  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL - Desktop only */}
      <div className="hidden lg:flex lg:w-[40%] relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1539768942893-daf53e448371?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
          alt="Egyptian pyramids"
          className="absolute inset-0 w-full h-full object-cover" />
        
        <div className="absolute inset-0 bg-gradient-to-br from-navy/90 via-royal/80 to-navy/90" />

        {/* Floating orbs */}
        <motion.div
          animate={{
            y: [0, -30, 0],
            rotate: [0, 10, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute top-1/4 left-10 w-40 h-40 bg-gold/20 rounded-full blur-3xl" />
        
        <motion.div
          animate={{
            y: [0, 40, 0],
            rotate: [0, -10, 0]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute bottom-1/3 right-10 w-56 h-56 bg-gold/15 rounded-full blur-3xl" />
        

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo */}
          <Link to="/" className="flex items-center" aria-label="TUTBOT home">
            <img
              src="/6a9310a4-4037-4c9e-9d02-b510d3e7b3fc-removebg-preview.png"
              alt="TUTBOT"
              className="h-12 w-auto object-contain [filter:brightness(0)_saturate(100%)_invert(72%)_sepia(67%)_saturate(458%)_hue-rotate(2deg)_brightness(89%)_contrast(91%)]" />
            
          </Link>

          {/* Testimonial */}
          <div className="space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
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
                  y: -20
                }}
                transition={{
                  duration: 0.5
                }}
                className="glass-dark rounded-2xl p-6 max-w-md">
                
                <p className="text-white/90 italic mb-4">
                  "{reviews[currentTestimonial].text}"
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src={reviews[currentTestimonial].avatar}
                    alt={reviews[currentTestimonial].name}
                    className="w-10 h-10 rounded-full" />
                  
                  <div>
                    <p className="font-medium text-white">
                      {reviews[currentTestimonial].name}
                    </p>
                    <p className="text-xs text-white/60">
                      {reviews[currentTestimonial].location}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <p className="font-serif text-2xl text-white/90 leading-relaxed">
              Welcome back, traveler
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Form */}
      <div className="w-full lg:w-[60%] bg-offwhite dark:bg-midnight flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={view}
                custom={direction}
                variants={slideVariants}
                initial={view === 'login' ? 'center' : 'enter'}
                animate="center"
                exit="exit"
                transition={{
                  duration: 0.3
                }}>
                
                {/* VIEW 1 - LOGIN */}
                {view === 'login' &&
                <div>
                    <h1 className="text-4xl font-serif font-bold text-navy dark:text-slate-100 mb-2">
                      Welcome back
                    </h1>
                    <p className="text-navy/60 dark:text-slate-300 mb-8">
                      Sign in to continue your journey
                    </p>

                    {/* Social Login */}
                    <div className="space-y-3 mb-6">
                      <button className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-card border-2 border-sand dark:border-slate-border hover:border-gold/30 rounded-xl py-3 font-medium text-navy dark:text-slate-100 transition-colors">
                        <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none">
                        
                          <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4" />
                        
                          <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853" />
                        
                          <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05" />
                        
                          <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335" />
                        
                        </svg>
                        Continue with Google
                      </button>
                      <button className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-card border-2 border-sand dark:border-slate-border hover:border-gold/30 rounded-xl py-3 font-medium text-navy dark:text-slate-100 transition-colors">
                        <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="currentColor">
                        
                          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                        </svg>
                        Continue with Apple
                      </button>
                    </div>

                    <div className="relative mb-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-sand dark:border-slate-border" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-offwhite dark:bg-midnight text-navy/60 dark:text-slate-400">
                          or sign in with email
                        </span>
                      </div>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleLogin} autoComplete="on" className="space-y-4">
                      <div>
                        <label htmlFor="login-email" className="block text-sm font-medium text-navy dark:text-slate-200 mb-2">
                          Email
                        </label>
                        <input
                        id="login-email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        ref={loginEmailRef}
                        className="w-full bg-white dark:bg-slate-card border-2 border-sand dark:border-slate-border focus:border-gold rounded-xl py-3 px-4 focus:outline-none transition-colors text-navy dark:text-slate-100 placeholder:text-navy/40 dark:placeholder:text-slate-400"
                        placeholder="you@example.com" />
                      
                        {errors.email &&
                      <p className="text-red-500 text-xs mt-1">
                            {errors.email}
                          </p>
                      }
                      </div>
                      <div>
                        <label htmlFor="login-password" className="block text-sm font-medium text-navy dark:text-slate-200 mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          autoComplete="current-password"
                          ref={loginPasswordRef}
                          className="w-full bg-white dark:bg-slate-card border-2 border-sand dark:border-slate-border focus:border-gold rounded-xl py-3 px-4 pr-12 focus:outline-none transition-colors text-navy dark:text-slate-100 placeholder:text-navy/40 dark:placeholder:text-slate-400"
                          placeholder="Enter your password" />
                        
                          <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-navy/40 dark:text-slate-400 hover:text-navy dark:hover:text-slate-100">
                          
                            {showPassword ?
                          <EyeOff className="w-5 h-5" /> :

                          <Eye className="w-5 h-5" />
                          }
                          </button>
                        </div>
                        {errors.password &&
                      <p className="text-red-500 text-xs mt-1">
                            {errors.password}
                          </p>
                      }
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                          type="checkbox"
                          id="remember"
                          checked={formData.rememberMe}
                          onChange={(e) =>
                          setFormData({
                            ...formData,
                            rememberMe: e.target.checked
                          })
                          }
                          className="w-4 h-4 rounded border-sand text-gold focus:ring-gold" />
                        
                          <label
                          htmlFor="remember"
                          className="text-sm text-navy/70 dark:text-slate-300">
                          
                            Remember me
                          </label>
                        </div>
                        <button
                        type="button"
                        onClick={() => { setFormData(prev => ({ ...prev, email: loginEmailRef.current?.value?.trim() || prev.email })); goToView('forgot'); }}
                        className="text-sm text-royal dark:text-gold hover:text-gold transition-colors">
                        
                          Forgot password?
                        </button>
                      </div>

                      <button
                      type="submit"
                      className="w-full bg-gold text-white py-3 rounded-xl font-medium hover:bg-gold/90 hover:shadow-glow transition-all">
                      
                        Sign in
                      </button>
                    </form>

                    <p className="text-center text-sm text-navy/60 dark:text-slate-400 mt-6">
                      Don't have an account?{' '}
                      <Link
                      to="/signup"
                      className="text-royal dark:text-gold hover:text-gold font-medium">
                      
                        Sign up
                      </Link>
                    </p>
                  </div>
                }

                {/* VIEW 2 - FORGOT PASSWORD */}
                {view === 'forgot' &&
                <div>
                    <button
                    onClick={() => goToView('login')}
                    className="flex items-center gap-2 text-navy/60 dark:text-slate-300 hover:text-royal dark:hover:text-gold mb-6 transition-colors">
                    
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>

                    <h1 className="text-4xl font-serif font-bold text-navy dark:text-slate-100 mb-2">
                      Reset your password
                    </h1>
                    <p className="text-navy/60 dark:text-slate-300 mb-8">
                      Enter your email and we'll send you a 6-digit verification
                      code
                    </p>

                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-navy dark:text-slate-200 mb-2">
                          Email
                        </label>
                        <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                        setFormData({
                          ...formData,
                          email: e.target.value
                        })
                        }
                        className="w-full bg-white dark:bg-slate-card border-2 border-sand dark:border-slate-border focus:border-gold rounded-xl py-3 px-4 focus:outline-none transition-colors text-navy dark:text-slate-100 placeholder:text-navy/40 dark:placeholder:text-slate-400"
                        placeholder="you@example.com" />
                      
                        {errors.email &&
                      <p className="text-red-500 text-xs mt-1">
                            {errors.email}
                          </p>
                      }
                      </div>

                      <button
                      type="submit"
                      className="w-full bg-gold text-white py-3 rounded-xl font-medium hover:bg-gold/90 hover:shadow-glow transition-all">
                      
                        Send code
                      </button>
                    </form>

                    <p className="text-center text-sm text-navy/60 dark:text-slate-400 mt-6">
                      Remember your password?{' '}
                      <button
                      onClick={() => goToView('login')}
                      className="text-royal dark:text-gold hover:text-gold font-medium">
                      
                        Sign in
                      </button>
                    </p>
                  </div>
                }

                {/* VIEW 3 - OTP VERIFICATION */}
                {view === 'otp' &&
                <div>
                    <button
                    onClick={() => goToView('forgot')}
                    className="flex items-center gap-2 text-navy/60 dark:text-slate-300 hover:text-royal dark:hover:text-gold mb-6 transition-colors">
                    
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>

                    <h1 className="text-4xl font-serif font-bold text-navy dark:text-slate-100 mb-2">
                      Check your email
                    </h1>
                    <p className="text-navy/60 dark:text-slate-300 mb-8">
                      We sent a 6-digit code to{' '}
                      <span className="font-medium text-navy dark:text-slate-100">
                        {formData.email}
                      </span>
                    </p>

                    <div className="space-y-6">
                      <div className="flex gap-3 justify-center">
                        {formData.otp.map((digit, index) =>
                      <input
                        key={index}
                        ref={(el) => inputRefs.current[index] = el}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) =>
                        handleOtpChange(index, e.target.value)
                        }
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={index === 0 ? handleOtpPaste : undefined}
                        className="w-12 h-14 sm:w-14 sm:h-16 bg-white dark:bg-slate-card border-2 border-sand dark:border-slate-border focus:border-gold rounded-xl text-2xl text-center font-serif font-bold text-navy dark:text-slate-100 focus:outline-none transition-colors" />

                      )}
                      </div>

                      {errors.otp &&
                    <p className="text-red-500 text-sm text-center">
                          {errors.otp}
                        </p>
                    }

                      <div className="text-center">
                        {canResend ?
                      <button
                        onClick={handleResendCode}
                        className="text-sm text-royal dark:text-gold hover:text-gold font-medium transition-colors">
                        
                            Resend code
                          </button> :

                      <p className="text-sm text-navy/60 dark:text-slate-400">
                            Resend code in 0:
                            {resendTimer.toString().padStart(2, '0')}
                          </p>
                      }
                      </div>

                      <button
                      onClick={handleVerifyOtp}
                      disabled={!formData.otp.every((digit) => digit !== '')}
                      className="w-full bg-gold text-white py-3 rounded-xl font-medium hover:bg-gold/90 hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      
                        Verify
                      </button>
                    </div>
                  </div>
                }

                {/* VIEW 4 - RESET PASSWORD */}
                {view === 'reset' &&
                <div>
                    <h1 className="text-4xl font-serif font-bold text-navy dark:text-slate-100 mb-2">
                      Create new password
                    </h1>
                    <p className="text-navy/60 dark:text-slate-300 mb-8">
                      Choose a strong password for your account
                    </p>

                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-navy dark:text-slate-200 mb-2">
                          New password
                        </label>
                        <div className="relative">
                          <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={formData.newPassword}
                          onChange={(e) =>
                          setFormData({
                            ...formData,
                            newPassword: e.target.value
                          })
                          }
                          className="w-full bg-white dark:bg-slate-card border-2 border-sand dark:border-slate-border focus:border-gold rounded-xl py-3 px-4 pr-12 focus:outline-none transition-colors text-navy dark:text-slate-100 placeholder:text-navy/40 dark:placeholder:text-slate-400"
                          placeholder="Create a strong password" />
                        
                          <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-navy/40 dark:text-slate-400 hover:text-navy dark:hover:text-slate-100">
                          
                            {showNewPassword ?
                          <EyeOff className="w-5 h-5" /> :

                          <Eye className="w-5 h-5" />
                          }
                          </button>
                        </div>
                        {formData.newPassword &&
                      <div className="mt-2">
                            <div className="flex gap-1 mb-1">
                              {[1, 2, 3].map((level) =>
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-all ${level <= passwordStrength.strength ? passwordStrength.strength === 1 ? 'bg-red-500' : passwordStrength.strength === 2 ? 'bg-yellow-500' : 'bg-green-500' : 'bg-sand dark:bg-slate-border'}`} />

                          )}
                            </div>
                            <p className="text-xs text-navy/60 dark:text-slate-400">
                              {passwordStrength.label}
                            </p>
                          </div>
                      }
                        {errors.newPassword &&
                      <p className="text-red-500 text-xs mt-1">
                            {errors.newPassword}
                          </p>
                      }
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-navy dark:text-slate-200 mb-2">
                          Confirm new password
                        </label>
                        <div className="relative">
                          <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={(e) =>
                          setFormData({
                            ...formData,
                            confirmPassword: e.target.value
                          })
                          }
                          className="w-full bg-white dark:bg-slate-card border-2 border-sand dark:border-slate-border focus:border-gold rounded-xl py-3 px-4 pr-12 focus:outline-none transition-colors text-navy dark:text-slate-100 placeholder:text-navy/40 dark:placeholder:text-slate-400"
                          placeholder="Re-enter your password" />
                        
                          <button
                          type="button"
                          onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-navy/40 dark:text-slate-400 hover:text-navy dark:hover:text-slate-100">
                          
                            {showConfirmPassword ?
                          <EyeOff className="w-5 h-5" /> :

                          <Eye className="w-5 h-5" />
                          }
                          </button>
                        </div>
                        {errors.confirmPassword &&
                      <p className="text-red-500 text-xs mt-1">
                            {errors.confirmPassword}
                          </p>
                      }
                      </div>

                      <button
                      type="submit"
                      className="w-full bg-gold text-white py-3 rounded-xl font-medium hover:bg-gold/90 hover:shadow-glow transition-all">
                      
                        Reset password
                      </button>
                    </form>
                  </div>
                }

                {/* VIEW 5 - SUCCESS */}
                {view === 'success' &&
                <div className="text-center">
                    <motion.div
                    initial={{
                      scale: 0
                    }}
                    animate={{
                      scale: 1
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 200,
                      damping: 15
                    }}
                    className="w-24 h-24 mx-auto mb-6 bg-gold/10 rounded-full flex items-center justify-center relative">
                    
                      <motion.div
                      animate={{
                        scale: [1, 1.2, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity
                      }}
                      className="absolute inset-0 bg-gold/20 rounded-full" />
                    
                      <CheckCircle2 className="w-12 h-12 text-gold relative z-10" />
                    </motion.div>

                    <h1 className="text-4xl font-serif font-bold text-navy dark:text-slate-100 mb-2">
                      Password reset!
                    </h1>
                    <p className="text-navy/60 dark:text-slate-300 mb-8 max-w-sm mx-auto">
                      Your password has been successfully updated. You can now
                      sign in with your new password.
                    </p>

                    <button
                    onClick={resetToLogin}
                    className="w-full bg-gold text-white py-3 rounded-xl font-medium hover:bg-gold/90 hover:shadow-glow transition-all">
                    
                      Sign in
                    </button>
                  </div>
                }
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Admin choice overlay */}
      {showAdminChoice && adminData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-card rounded-2xl w-full max-w-md p-8 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-gold/10 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-gold" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-navy dark:text-slate-100 mb-2">
              Welcome, Admin!
            </h2>
            <p className="text-sm text-navy/60 dark:text-slate-400 mb-6">
              You are logged in as an administrator. Where would you like to go?
            </p>
            <div className="space-y-3">
              <button
                onClick={() => { setShowAdminChoice(false); navigate('/admin'); }}
                className="w-full bg-gold text-white py-3 rounded-xl font-medium hover:bg-gold/90 transition-all"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => { setShowAdminChoice(false); navigate('/'); }}
                className="w-full border-2 border-sand dark:border-slate-border text-navy dark:text-slate-200 py-3 rounded-xl font-medium hover:border-gold/30 transition-colors"
              >
                Go to Home
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>);

}