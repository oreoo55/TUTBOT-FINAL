import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Triangle,
  Church,
  Palmtree,
  Drama,
  UtensilsCrossed,
  Mountain,
  User,
  Heart,
  Users,
  UsersRound,
  Check,
  Sparkles,
  Award,
  ArrowLeft } from
'lucide-react';
import { reviews } from '../data/mockData';
import { api, setAuthToken } from '../lib/api';
type InterestType =
'Archaeological' |
'Religious' |
'Recreational' |
'Cultural' |
'Cuisine' |
'Adventure';
interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  interests: InterestType[];
  budget: 'Backpacker' | 'Comfort' | 'Luxury' | '';
  pace: 'Relaxed' | 'Balanced' | 'Action-packed' | '';
  companion: 'Solo' | 'Couple' | 'Family' | 'Group' | '';
  agreedToTerms: boolean;
}
export function Signup() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    interests: [],
    budget: '',
    pace: '',
    companion: '',
    agreedToTerms: false
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );
  const [apiError, setApiError] = useState('');
  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  const interests: Array<{
    name: InterestType;
    icon: React.ElementType;
  }> = [
  {
    name: 'Archaeological',
    icon: Triangle
  },
  {
    name: 'Religious',
    icon: Church
  },
  {
    name: 'Recreational',
    icon: Palmtree
  },
  {
    name: 'Cultural',
    icon: Drama
  },
  {
    name: 'Cuisine',
    icon: UtensilsCrossed
  },
  {
    name: 'Adventure',
    icon: Mountain
  }];

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
  const passwordStrength = getPasswordStrength(formData.password);
  const validateStep1 = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.agreedToTerms) {
      newErrors.agreedToTerms = 'You must agree to the terms';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const validateStep2 = () => {
    if (formData.interests.length < 2) {
      setErrors({
        interests: 'Select at least 2 interests'
      });
      return false;
    }
    setErrors({});
    return true;
  };
  const validateStep3 = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.budget) newErrors.budget = 'Select a budget';
    if (!formData.pace) newErrors.pace = 'Select a pace';
    if (!formData.companion) newErrors.companion = 'Select travel companion';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleContinue = async () => {
    if (isSubmitting) return;
    setApiError('');
    let isValid = false;
    if (currentStep === 1) isValid = validateStep1();
    if (currentStep === 2) isValid = validateStep2();
    if (currentStep === 3) { isValid = validateStep3(); }
    if (isValid && currentStep < 4) {
      if (currentStep === 3) {
        setIsSubmitting(true);
        try {
          const res = await api.post<{ token: string; user: any }>('/auth/register', {
            name: formData.fullName,
            email: formData.email,
            password: formData.password,
          });
          setAuthToken(res.token);
        } catch (err: any) {
          const msg = err.body?.errors?.email?.[0] || err.body?.message || 'Registration failed. Please try again.';
          setApiError(msg);
          setIsSubmitting(false);
          return;
        }
        setIsSubmitting(false);
      }
      setCurrentStep(currentStep + 1);
    }
  };
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
      setApiError('');
    }
  };
  const toggleInterest = (interest: InterestType) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest) ?
      prev.interests.filter((i) => i !== interest) :
      [...prev.interests, interest]
    }));
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
  const [direction, setDirection] = useState(1);
  const goToStep = (step: number) => {
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
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
              Begin your journey through 5,000 years of wonder
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Form */}
      <div className="w-full lg:w-[60%] bg-offwhite dark:bg-midnight flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {/* Progress Indicator */}
            <div className="flex items-center justify-center gap-2 mb-12">
              {[1, 2, 3, 4].map((step) =>
              <div
                key={step}
                className={`h-2 rounded-full transition-all duration-300 ${step === currentStep ? 'w-12 bg-gold' : step < currentStep ? 'w-8 bg-royal' : 'w-8 bg-sand dark:bg-slate-border'}`} />

              )}
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  duration: 0.3
                }}>
                
                {currentStep === 1 &&
                <div>
                    <h1 className="text-4xl font-serif font-bold text-navy dark:text-slate-100 mb-2">
                      Create your account
                    </h1>
                    <p className="text-navy/60 dark:text-slate-300 mb-8">
                      Start exploring Egypt in seconds
                    </p>

                    {/* Social Signup */}
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
                          or continue with email
                        </span>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-navy dark:text-slate-200 mb-2">
                          Full Name
                        </label>
                        <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) =>
                        setFormData({
                          ...formData,
                          fullName: e.target.value
                        })
                        }
                        className="w-full bg-white dark:bg-slate-card border-2 border-sand dark:border-slate-border focus:border-gold rounded-xl py-3 px-4 focus:outline-none transition-colors text-navy dark:text-slate-100 placeholder:text-navy/40 dark:placeholder:text-slate-400"
                        placeholder="Enter your full name" />
                      
                        {errors.fullName &&
                      <p className="text-red-500 text-xs mt-1">
                            {errors.fullName}
                          </p>
                      }
                      </div>

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

                      <div>
                        <label className="block text-sm font-medium text-navy dark:text-slate-200 mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) =>
                          setFormData({
                            ...formData,
                            password: e.target.value
                          })
                          }
                          className="w-full bg-white dark:bg-slate-card border-2 border-sand dark:border-slate-border focus:border-gold rounded-xl py-3 px-4 pr-12 focus:outline-none transition-colors text-navy dark:text-slate-100 placeholder:text-navy/40 dark:placeholder:text-slate-400"
                          placeholder="Create a strong password" />
                        
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
                        {formData.password &&
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
                        {errors.password &&
                      <p className="text-red-500 text-xs mt-1">
                            {errors.password}
                          </p>
                      }
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-navy dark:text-slate-200 mb-2">
                          Confirm Password
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

                      <div className="flex items-start gap-2">
                        <input
                        type="checkbox"
                        id="terms"
                        checked={formData.agreedToTerms}
                        onChange={(e) =>
                        setFormData({
                          ...formData,
                          agreedToTerms: e.target.checked
                        })
                        }
                        className="mt-1 w-4 h-4 rounded border-sand text-gold focus:ring-gold" />
                      
                        <label
                        htmlFor="terms"
                        className="text-sm text-navy/70 dark:text-slate-300">
                        
                          I agree to the{' '}
                          <a
                          href="#"
                          className="text-royal dark:text-gold hover:text-gold">
                          
                            Terms of Service
                          </a>{' '}
                          and{' '}
                          <a
                          href="#"
                          className="text-royal dark:text-gold hover:text-gold">
                          
                            Privacy Policy
                          </a>
                        </label>
                      </div>
                      {errors.agreedToTerms &&
                    <p className="text-red-500 text-xs">
                          {errors.agreedToTerms}
                        </p>
                    }
                    </div>

                    <button
                    onClick={handleContinue}
                    className="w-full bg-gold text-white py-3 rounded-xl font-medium mt-6 hover:bg-gold/90 hover:shadow-glow transition-all">
                    
                      Continue
                    </button>
                  </div>
                }

                {currentStep === 2 &&
                <div>
                    <h1 className="text-4xl font-serif font-bold text-navy dark:text-slate-100 mb-2">
                      What calls to you?
                    </h1>
                    <p className="text-navy/60 dark:text-slate-300 mb-8">
                      Pick the experiences you want to discover. Select at least
                      2.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      {interests.map((interest) => {
                      const isSelected = formData.interests.includes(
                        interest.name
                      );
                      const Icon = interest.icon;
                      return (
                        <motion.button
                          key={interest.name}
                          onClick={() => toggleInterest(interest.name)}
                          whileHover={{
                            y: -4
                          }}
                          className={`relative p-6 rounded-2xl border-2 transition-all ${isSelected ? 'border-gold bg-gold/5 dark:bg-gold/10' : 'border-sand dark:border-slate-border bg-white dark:bg-slate-card hover:border-gold/30'}`}>
                          
                            {isSelected &&
                          <div className="absolute top-3 right-3 w-6 h-6 bg-gold rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                          }
                            <Icon
                            className={`w-8 h-8 mb-3 ${isSelected ? 'text-gold' : 'text-royal dark:text-gold'}`} />
                          
                            <p className="font-medium text-navy dark:text-slate-100 text-sm">
                              {interest.name}
                            </p>
                          </motion.button>);

                    })}
                    </div>

                    <p className="text-sm text-navy/60 dark:text-slate-400 mb-6">
                      {formData.interests.length} selected
                    </p>
                    {errors.interests &&
                  <p className="text-red-500 text-sm mb-4">
                        {errors.interests}
                      </p>
                  }

                    <div className="flex gap-3">
                      <button
                      onClick={handleBack}
                      className="flex items-center gap-2 px-6 py-3 border-2 border-sand dark:border-slate-border rounded-xl font-medium text-navy dark:text-slate-100 hover:border-gold/30 transition-colors">
                      
                        <ArrowLeft className="w-4 h-4" /> Back
                      </button>
                      <button
                      onClick={handleContinue}
                      disabled={formData.interests.length < 2}
                      className="flex-1 bg-gold text-white py-3 rounded-xl font-medium hover:bg-gold/90 hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      
                        Continue
                      </button>
                    </div>
                  </div>
                }

                {currentStep === 3 &&
                <div>
                    <h1 className="text-4xl font-serif font-bold text-navy dark:text-slate-100 mb-2">
                      Tell us your style
                    </h1>
                    <p className="text-navy/60 dark:text-slate-300 mb-8">
                      We'll personalize your AI recommendations
                    </p>

                    <div className="space-y-8">
                      {/* Budget */}
                      <div>
                        <label className="block text-sm font-medium text-navy dark:text-slate-200 mb-3">
                          Budget
                        </label>
                        <div className="flex gap-3">
                          {[
                        {
                          value: 'Backpacker',
                          label: 'Backpacker $'
                        },
                        {
                          value: 'Comfort',
                          label: 'Comfort $$'
                        },
                        {
                          value: 'Luxury',
                          label: 'Luxury $$$'
                        }].
                        map((option) =>
                        <button
                          key={option.value}
                          onClick={() =>
                          setFormData({
                            ...formData,
                            budget: option.value as FormData['budget']
                          })
                          }
                          className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${formData.budget === option.value ? 'bg-royal text-white' : 'bg-white dark:bg-slate-card border-2 border-sand dark:border-slate-border text-navy dark:text-slate-100 hover:border-gold/30'}`}>
                          
                              {option.label}
                            </button>
                        )}
                        </div>
                      </div>

                      {/* Pace */}
                      <div>
                        <label className="block text-sm font-medium text-navy dark:text-slate-200 mb-3">
                          Pace
                        </label>
                        <div className="flex gap-3">
                          {['Relaxed', 'Balanced', 'Action-packed'].map(
                          (option) =>
                          <button
                            key={option}
                            onClick={() =>
                            setFormData({
                              ...formData,
                              pace: option as FormData['pace']
                            })
                            }
                            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${formData.pace === option ? 'bg-royal text-white' : 'bg-white dark:bg-slate-card border-2 border-sand dark:border-slate-border text-navy dark:text-slate-100 hover:border-gold/30'}`}>
                            
                                {option}
                              </button>

                        )}
                        </div>
                      </div>

                      {/* Travel Companion */}
                      <div>
                        <label className="block text-sm font-medium text-navy dark:text-slate-200 mb-3">
                          Travel companion
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                          {[
                        {
                          value: 'Solo',
                          icon: User,
                          label: 'Solo'
                        },
                        {
                          value: 'Couple',
                          icon: Heart,
                          label: 'Couple'
                        },
                        {
                          value: 'Family',
                          icon: Users,
                          label: 'Family'
                        },
                        {
                          value: 'Group',
                          icon: UsersRound,
                          label: 'Group'
                        }].
                        map((option) => {
                          const Icon = option.icon;
                          const isSelected =
                          formData.companion === option.value;
                          return (
                            <button
                              key={option.value}
                              onClick={() =>
                              setFormData({
                                ...formData,
                                companion:
                                option.value as FormData['companion']
                              })
                              }
                              className={`p-4 rounded-xl transition-all ${isSelected ? 'bg-gold/5 dark:bg-gold/10 border-2 border-gold' : 'bg-white dark:bg-slate-card border-2 border-sand dark:border-slate-border hover:border-gold/30'}`}>
                              
                                <Icon
                                className={`w-6 h-6 mx-auto mb-2 ${isSelected ? 'text-gold' : 'text-royal dark:text-gold'}`} />
                              
                                <p className="text-xs font-medium text-navy dark:text-slate-100">
                                  {option.label}
                                </p>
                              </button>);

                        })}
                        </div>
                      </div>
                    </div>

                    {apiError &&
                    <p className="text-red-500 text-sm text-center mb-4">{apiError}</p>
                    }
                    <div className="flex gap-3 mt-8">
                      <button
                      onClick={handleBack}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-6 py-3 border-2 border-sand dark:border-slate-border rounded-xl font-medium text-navy dark:text-slate-100 hover:border-gold/30 transition-colors disabled:opacity-50">
                      
                        <ArrowLeft className="w-4 h-4" /> Back
                      </button>
                      <button
                      onClick={handleContinue}
                      disabled={isSubmitting}
                      className="flex-1 bg-gold text-white py-3 rounded-xl font-medium hover:bg-gold/90 hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      
                        {isSubmitting ? 'Creating account...' : 'Continue'}
                      </button>
                    </div>
                  </div>
                }

                {currentStep === 4 &&
                <div className="text-center">
                    {[...Array(12)].map((_, i) =>
                  <motion.div
                    key={i}
                    initial={{
                      y: -100,
                      opacity: 1,
                      x: 0
                    }}
                    animate={{
                      y: 600,
                      opacity: 0,
                      x: Math.random() * 400 - 200
                    }}
                    transition={{
                      duration: 2 + Math.random(),
                      delay: Math.random() * 0.5,
                      ease: 'easeIn'
                    }}
                    className="absolute w-2 h-2 bg-gold rounded-full"
                    style={{
                      left: `${50 + (Math.random() - 0.5) * 20}%`
                    }} />

                  )}

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
                    className="w-24 h-24 mx-auto mb-6 bg-gold/10 rounded-full flex items-center justify-center">
                    
                      <motion.div
                      animate={{
                        scale: [1, 1.2, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity
                      }}>
                      
                        <Sparkles className="w-12 h-12 text-gold" />
                      </motion.div>
                    </motion.div>

                    <h1 className="text-4xl font-serif font-bold text-navy dark:text-slate-100 mb-2">
                      Welcome to the journey, {formData.fullName.split(' ')[0]}!
                    </h1>
                    <p className="text-navy/60 dark:text-slate-300 mb-8">
                      Your adventure through Egypt begins now
                    </p>

                    <motion.div
                    initial={{
                      opacity: 0,
                      scale: 0.9,
                      rotate: -5
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      rotate: 0
                    }}
                    transition={{
                      delay: 0.3
                    }}
                    className="glass rounded-2xl p-6 mb-8 max-w-sm mx-auto">
                    
                      <div className="w-16 h-16 mx-auto mb-4 bg-gold/10 rounded-full flex items-center justify-center">
                        <Award className="w-8 h-8 text-gold" />
                      </div>
                      <p className="text-sm text-navy/60 dark:text-slate-400 mb-1">
                        First Badge Unlocked
                      </p>
                      <h3 className="text-2xl font-serif font-bold text-navy dark:text-slate-100 mb-2">
                        The Explorer
                      </h3>
                      <p className="text-gold font-medium">+50 XP earned</p>
                    </motion.div>

                    <div className="space-y-3">
                      <Link
                      to="/discover"
                      className="block w-full bg-gold text-white py-3 rounded-xl font-medium hover:bg-gold/90 hover:shadow-glow transition-all">
                      
                        Start exploring
                      </Link>
                      <Link
                      to="/profile"
                      className="block w-full border-2 border-sand dark:border-slate-border text-navy dark:text-slate-100 py-3 rounded-xl font-medium hover:border-gold/30 transition-colors">
                      
                        Complete profile
                      </Link>
                    </div>
                  </div>
                }
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Already have account link */}
          {currentStep < 4 &&
          <p className="text-center text-sm text-navy/60 dark:text-slate-400 mt-8">
              Already have an account?{' '}
              <Link
              to="/signup"
              className="text-royal dark:text-gold hover:text-gold font-medium">
              
                Sign in
              </Link>
            </p>
          }
        </div>
      </div>
    </div>);

}