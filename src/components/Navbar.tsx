import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Heart,
  Map,
  Star,
  LogOut,
  Menu,
  X,
  Sun,
  Moon } from
'lucide-react';
import { getAuthToken, setAuthToken, api } from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';
import { NotificationBell } from './NotificationBell';
export function Navbar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(!!getAuthToken());
  const [user, setUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      setIsLoggedIn(true);
      api.get<any>('/me').then(setUser).catch(() => {
        setIsLoggedIn(false);
        setUser(null);
      });
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
  }, [location]);
  const navLinks = [
  {
    name: 'Home',
    path: '/'
  },
  {
    name: 'Discover',
    path: '/discover'
  },
  {
    name: 'Community',
    path: '/community'
  },
  {
    name: 'About',
    path: '/about'
  },
  {
    name: 'Help',
    path: '/help'
  }];

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 px-6 py-4">
      <div className="max-w-7xl mx-auto glass rounded-2xl px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center" aria-label="TUTBOT home">
          <img
            src="/6a9310a4-4037-4c9e-9d02-b510d3e7b3fc-removebg-preview.png"
            alt="TUTBOT"
            className="h-9 md:h-10 w-auto object-contain transition-[filter] duration-300 dark:[filter:brightness(0)_saturate(100%)_invert(72%)_sepia(67%)_saturate(458%)_hue-rotate(2deg)_brightness(89%)_contrast(91%)]" />
          
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) =>
          <Link
            key={link.name}
            to={link.path}
            className={`text-sm font-medium transition-colors hover:text-gold ${location.pathname === link.path ? 'text-royal dark:text-gold font-semibold' : 'text-navy/70 dark:text-slate-300'}`}>
            
              {link.name}
            </Link>
          )}
        </div>

        {/* Auth / Profile / Theme */}
        <div className="hidden md:flex items-center gap-1">
          {isLoggedIn && <NotificationBell />}

          {/* Theme toggle */}
          <ThemeToggle theme={theme} onToggle={toggleTheme} />

          {!isLoggedIn ?
          <>
              <Link to="/login">
                <button className="px-5 py-2 text-sm font-medium text-royal dark:text-gold hover:bg-royal/5 dark:hover:bg-gold/10 rounded-xl transition-colors">
                  Login
                </button>
              </Link>
              <Link to="/signup">
                <button className="px-5 py-2 text-sm font-medium text-white rounded-xl hover:bg-gold/90 hover:shadow-glow transition-all bg-[#D4AF37]">
                  Sign Up
                </button>
              </Link>
            </> :

          <div className="relative">
              <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-gold/50 hover:border-gold transition-colors">
              
                <img
                src={user?.avatar || 'https://ui-avatars.com/api/?name=User&background=D4AF37&color=fff'}
                alt="Profile"
                className="w-full h-full object-cover" />
              
              </button>

              <AnimatePresence>
                {showDropdown &&
              <motion.div
                initial={{
                  opacity: 0,
                  y: 10
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                exit={{
                  opacity: 0,
                  y: 10
                }}
                className="absolute right-0 mt-2 w-56 glass rounded-2xl py-2 shadow-xl border border-white/40 dark:border-slate-border">
                
                    <div className="px-4 py-2 border-b border-navy/5 dark:border-slate-border mb-2">
                      <p className="font-medium text-navy dark:text-slate-100">
                        {user?.name || 'Traveler'}
                      </p>
                      <p className="text-xs text-navy/60 dark:text-slate-400">
                        Level {user?.level || 1} Traveler
                      </p>
                    </div>

                    <Link
                  to="/profile"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-navy/80 dark:text-slate-300 hover:bg-royal/5 dark:hover:bg-gold/10 hover:text-royal dark:hover:text-gold transition-colors"
                  onClick={() => setShowDropdown(false)}>
                  
                      <User className="w-4 h-4" /> Profile
                    </Link>
                    <Link
                  to="/profile?tab=wishlist"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-navy/80 dark:text-slate-300 hover:bg-royal/5 dark:hover:bg-gold/10 hover:text-royal dark:hover:text-gold transition-colors"
                  onClick={() => setShowDropdown(false)}>
                  
                      <Heart className="w-4 h-4" /> Wishlist
                    </Link>
                    <Link
                  to="/profile"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-navy/80 dark:text-slate-300 hover:bg-royal/5 dark:hover:bg-gold/10 hover:text-royal dark:hover:text-gold transition-colors"
                  onClick={() => setShowDropdown(false)}>
                  
                      <Map className="w-4 h-4" /> My Trips
                    </Link>
                    <Link
                  to="/profile?tab=favorites"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-navy/80 dark:text-slate-300 hover:bg-royal/5 dark:hover:bg-gold/10 hover:text-royal dark:hover:text-gold transition-colors"
                  onClick={() => setShowDropdown(false)}>
                  
                      <Star className="w-4 h-4" /> Favorites
                    </Link>

                    <div className="mt-2 pt-2 border-t border-navy/5 dark:border-slate-border">
                      <button
                    onClick={() => {
                      api.post('/auth/logout').catch(() => {});
                      setAuthToken(null);
                      setIsLoggedIn(false);
                      setUser(null);
                      setShowDropdown(false);
                      navigate('/');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                    
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </motion.div>
              }
              </AnimatePresence>
            </div>
          }
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center gap-1">
          {isLoggedIn && <NotificationBell />}
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <button
            className="p-2 text-navy dark:text-slate-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu">
            
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen &&
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
          className="md:hidden mt-2 glass rounded-2xl overflow-hidden">
          
            <div className="p-4 flex flex-col gap-4">
              {navLinks.map((link) =>
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-navy/80 dark:text-slate-200 hover:text-royal dark:hover:text-gold">
              
                  {link.name}
                </Link>
            )}
              <div className="h-px bg-navy/10 dark:bg-slate-border my-2" />
              {!isLoggedIn ?
            <div className="flex flex-col gap-2">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-5 py-2 text-sm font-medium text-royal dark:text-gold border border-royal/20 dark:border-gold/30 rounded-xl">
                      Login
                    </button>
                  </Link>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-5 py-2 text-sm font-medium bg-gold text-white rounded-xl">
                      Sign Up
                    </button>
                  </Link>
                </div> :

            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 text-royal dark:text-gold font-medium">
              
                  <img
                src={user?.avatar || 'https://ui-avatars.com/api/?name=User&background=D4AF37&color=fff'}
                alt="Profile"
                className="w-8 h-8 rounded-full" />
              
                  My Profile
                </Link>
            }
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </nav>);

}
function ThemeToggle({
  theme,
  onToggle



}: {theme: 'light' | 'dark';onToggle: () => void;}) {
  const isDark = theme === 'dark';
  return (
    <button
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative w-14 h-8 rounded-full bg-sand dark:bg-slate-border border border-sand dark:border-gold/30 flex items-center transition-colors duration-300">
      
      <motion.span
        layout
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30
        }}
        className={`absolute top-1 ${isDark ? 'right-1' : 'left-1'} w-6 h-6 rounded-full bg-white dark:bg-gold flex items-center justify-center shadow-md`}>
        
        {isDark ?
        <Moon className="w-3.5 h-3.5 text-navy" /> :

        <Sun className="w-3.5 h-3.5 text-gold" />
        }
      </motion.span>
    </button>);

}