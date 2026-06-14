import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Home,
  Compass,
  Users,
  HelpCircle,
  ArrowRight } from
'lucide-react';
import { SearchDropdown } from '../components/SearchDropdown';
export function NotFound() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  const quickLinks = [
  {
    icon: Home,
    label: 'Home',
    description: 'Back to start',
    path: '/',
    color: 'royal'
  },
  {
    icon: Compass,
    label: 'Discover',
    description: 'Browse landmarks',
    path: '/discover',
    color: 'gold'
  },
  {
    icon: Users,
    label: 'Community',
    description: 'See travel stories',
    path: '/community',
    color: 'royal'
  },
  {
    icon: HelpCircle,
    label: 'Help',
    description: 'Get support',
    path: '/help',
    color: 'gold'
  }];

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Decorative floating orbs */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [0, 5, 0]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute top-1/4 left-10 w-40 h-40 bg-gold/10 rounded-full blur-3xl" />
      
      <motion.div
        animate={{
          y: [0, 30, 0],
          rotate: [0, -5, 0]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute bottom-1/4 right-10 w-56 h-56 bg-royal/10 rounded-full blur-3xl" />
      

      <div className="max-w-3xl mx-auto text-center relative z-10">
        {/* Tut-Bot Mascot */}
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.5
          }}
          animate={{
            opacity: 1,
            scale: 1
          }}
          transition={{
            type: 'spring',
            damping: 12,
            stiffness: 100
          }}
          className="relative w-48 h-48 mx-auto mb-8">
          
          {/* Floating animation wrapper */}
          <motion.div
            animate={{
              y: [0, -10, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="relative w-full h-full">
            
            {/* Bot body */}
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {/* Shadow */}
              <ellipse
                cx="100"
                cy="185"
                rx="50"
                ry="6"
                fill="#0F172A"
                opacity="0.15" />
              

              {/* Sarcophagus/Mummy body */}
              <motion.g
                animate={{
                  rotate: [-3, 3, -3]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                style={{
                  transformOrigin: '100px 110px'
                }}>
                
                {/* Body */}
                <rect
                  x="55"
                  y="70"
                  width="90"
                  height="110"
                  rx="40"
                  fill="#D4A85A" />
                
                {/* Body shading */}
                <rect
                  x="55"
                  y="70"
                  width="20"
                  height="110"
                  rx="20"
                  fill="#000"
                  opacity="0.1" />
                

                {/* Headdress (Nemes) */}
                <path
                  d="M 50 80 Q 50 35 100 30 Q 150 35 150 80 L 145 90 Q 100 85 55 90 Z"
                  fill="#1E3A8A" />
                
                {/* Headdress stripes */}
                <path
                  d="M 65 55 Q 100 50 135 55"
                  stroke="#D4A85A"
                  strokeWidth="3"
                  fill="none" />
                
                <path
                  d="M 60 70 Q 100 65 140 70"
                  stroke="#D4A85A"
                  strokeWidth="3"
                  fill="none" />
                

                {/* Face */}
                <rect
                  x="65"
                  y="70"
                  width="70"
                  height="55"
                  rx="20"
                  fill="#F3EFE6" />
                

                {/* Confused eyes (X marks) */}
                <g stroke="#0F172A" strokeWidth="3" strokeLinecap="round">
                  <line x1="78" y1="88" x2="86" y2="96" />
                  <line x1="86" y1="88" x2="78" y2="96" />
                  <line x1="114" y1="88" x2="122" y2="96" />
                  <line x1="122" y1="88" x2="114" y2="96" />
                </g>

                {/* Wavy confused mouth */}
                <path
                  d="M 88 112 Q 94 108 100 112 T 112 112"
                  stroke="#0F172A"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round" />
                

                {/* Body wrap lines (mummy bandages) */}
                <line
                  x1="60"
                  y1="135"
                  x2="140"
                  y2="135"
                  stroke="#0F172A"
                  strokeWidth="1.5"
                  opacity="0.3" />
                
                <line
                  x1="60"
                  y1="150"
                  x2="140"
                  y2="150"
                  stroke="#0F172A"
                  strokeWidth="1.5"
                  opacity="0.3" />
                
                <line
                  x1="60"
                  y1="165"
                  x2="140"
                  y2="165"
                  stroke="#0F172A"
                  strokeWidth="1.5"
                  opacity="0.3" />
                

                {/* Ankh symbol on chest */}
                <g transform="translate(100, 145)">
                  <circle
                    cx="0"
                    cy="-6"
                    r="5"
                    fill="none"
                    stroke="#1E3A8A"
                    strokeWidth="2" />
                  
                  <line
                    x1="0"
                    y1="-1"
                    x2="0"
                    y2="12"
                    stroke="#1E3A8A"
                    strokeWidth="2" />
                  
                  <line
                    x1="-6"
                    y1="3"
                    x2="6"
                    y2="3"
                    stroke="#1E3A8A"
                    strokeWidth="2" />
                  
                </g>
              </motion.g>

              {/* Question marks floating */}
              <motion.text
                x="40"
                y="50"
                fontSize="24"
                fill="#D4A85A"
                fontFamily="serif"
                fontWeight="bold"
                animate={{
                  y: [50, 40, 50],
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity
                }}>
                
                ?
              </motion.text>
              <motion.text
                x="160"
                y="60"
                fontSize="20"
                fill="#1E3A8A"
                fontFamily="serif"
                fontWeight="bold"
                animate={{
                  y: [60, 50, 60],
                  opacity: [0.4, 1, 0.4]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: 0.5
                }}>
                
                ?
              </motion.text>
              <motion.text
                x="170"
                y="100"
                fontSize="18"
                fill="#D4A85A"
                fontFamily="serif"
                fontWeight="bold"
                animate={{
                  y: [100, 92, 100],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  delay: 1
                }}>
                
                ?
              </motion.text>
            </svg>
          </motion.div>
        </motion.div>

        {/* 404 Text */}
        <motion.div
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: 0.2
          }}>
          
          <p className="text-7xl md:text-8xl font-serif font-bold text-royal/20 dark:text-gold/25 mb-2 tracking-tighter">
            404
          </p>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-navy dark:text-slate-100 mb-4">
            Oops! Tut-Bot is <span className="text-gold">Lost</span>
          </h1>
          <p className="text-navy/60 dark:text-slate-300 text-lg max-w-xl mx-auto mb-10">
            Looks like this pyramid hasn't been discovered yet. The page you're
            looking for has wandered off into the desert.
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.form
          onSubmit={handleSearch}
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: 0.3
          }}
          className="max-w-lg mx-auto mb-12 relative"
          autoComplete="off">
          
          <div className="relative glass rounded-2xl p-2 shadow-soft border border-white/50">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-navy/40 dark:text-slate-400 z-10" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="Search for a landmark or region..."
              aria-label="Search landmarks"
              className="w-full bg-white/50 dark:bg-slate-card/40 border border-sand dark:border-slate-border rounded-xl py-3 pl-12 pr-32 focus:outline-none focus:ring-2 focus:ring-gold/50 text-navy dark:text-slate-100 placeholder:text-navy/40 dark:placeholder:text-slate-400" />
            
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-gold text-white px-5 py-2 rounded-xl font-medium hover:bg-gold/90 hover:shadow-glow transition-all flex items-center gap-2">
              
              Search <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <SearchDropdown
            query={searchQuery}
            scope="all"
            open={searchFocused && searchQuery.trim().length > 0}
            onClose={() => setSearchFocused(false)} />
          
        </motion.form>

        {/* Quick Links */}
        <motion.div
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: 0.4
          }}>
          
          <p className="text-sm font-medium text-navy/60 dark:text-slate-400 uppercase tracking-wider mb-4">
            Or jump to
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {quickLinks.map((link, idx) =>
            <motion.div
              key={link.label}
              initial={{
                opacity: 0,
                y: 10
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                delay: 0.5 + idx * 0.08
              }}
              whileHover={{
                y: -4
              }}>
              
                <Link
                to={link.path}
                className="block bg-white dark:bg-slate-card rounded-2xl p-4 shadow-soft border border-sand dark:border-slate-border hover:border-gold/30 dark:hover:border-gold/40 transition-colors group">
                
                  <div
                  className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${link.color === 'gold' ? 'bg-gold/10 text-gold' : 'bg-royal/10 dark:bg-gold/10 text-royal dark:text-gold'}`}>
                  
                    <link.icon className="w-5 h-5" />
                  </div>
                  <p className="font-medium text-navy dark:text-slate-100 text-sm">
                    {link.label}
                  </p>
                  <p className="text-xs text-navy/50 dark:text-slate-400 mt-0.5">
                    {link.description}
                  </p>
                </Link>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>);

}