import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Facebook, Twitter, Instagram, Youtube, Mail, Check } from 'lucide-react';

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Youtube, href: '#', label: 'Youtube' },
];

const stagger = {
  animate: { transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setTimeout(() => { setSubscribed(false); setEmail(''); }, 3000);
  };

  return (
    <footer className="bg-navy text-white pt-16 pb-8 px-6 mt-20 rounded-t-[40px]">
      <motion.div
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: '-50px' }}
        variants={stagger}
        className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12"
      >
        <motion.div variants={fadeUp} className="col-span-1 md:col-span-1">
          <Link to="/" className="flex items-center mb-6" aria-label="TUTBOT home">
            <motion.img
              whileHover={{ scale: 1.05 }}
              src="/6a9310a4-4037-4c9e-9d02-b510d3e7b3fc-removebg-preview.png"
              alt="TUTBOT"
              className="h-10 w-auto object-contain [filter:brightness(0)_saturate(100%)_invert(72%)_sepia(67%)_saturate(458%)_hue-rotate(2deg)_brightness(89%)_contrast(91%)]"
            />
          </Link>
          <p className="text-white/60 text-sm leading-relaxed mb-6">
            Discover the magic of Egypt with intelligent travel planning,
            immersive experiences, and curated adventures.
          </p>
          <div className="flex gap-4">
            {socialLinks.map((s) => (
              <motion.a
                key={s.label}
                href={s.href}
                whileHover={{ scale: 1.15, backgroundColor: 'rgba(212, 175, 55, 1)' }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80"
                aria-label={s.label}
              >
                <s.icon className="w-5 h-5" />
              </motion.a>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeUp}>
          <h4 className="font-serif text-xl font-semibold mb-6 text-gold">Explore</h4>
          <ul className="space-y-3">
            {[
              { label: 'Destinations', to: '/discover' },
              { label: 'Archaeological Sites', to: '/discover' },
              { label: 'Religious Landmarks', to: '/discover' },
              { label: 'Recreational', to: '/discover' },
            ].map((item) => (
              <li key={item.label}>
                <Link to={item.to} className="text-white/70 hover:text-white transition-colors text-sm">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div variants={fadeUp}>
          <h4 className="font-serif text-xl font-semibold mb-6 text-gold">Company</h4>
          <ul className="space-y-3">
            <li><Link to="/about" className="text-white/70 hover:text-white transition-colors text-sm">About Us</Link></li>
            <li><Link to="/community" className="text-white/70 hover:text-white transition-colors text-sm">Community</Link></li>
            <li><Link to="/help" className="text-white/70 hover:text-white transition-colors text-sm">Contact</Link></li>
          </ul>
        </motion.div>

        <motion.div variants={fadeUp}>
          <h4 className="font-serif text-xl font-semibold mb-6 text-gold">Newsletter</h4>
          <p className="text-white/60 text-sm mb-4">
            Subscribe for travel tips and exclusive offers.
          </p>
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                required
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-gold transition-colors"
              />
            </div>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="bg-gold text-white px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-1.5"
            >
              {subscribed ? <><Check className="w-4 h-4" /> Sent</> : 'Subscribe'}
            </motion.button>
          </form>
          <AnimatePresence>
            {subscribed && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-emerald-400 text-xs mt-2"
              >
                Thanks for subscribing!
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4"
      >
        <p className="text-white/40 text-sm">© 2026 TUTBOT. All rights reserved.</p>
        <div className="flex gap-6">
          {['Privacy Policy', 'Terms of Service'].map((label) => (
            <a key={label} href="#" className="text-white/40 hover:text-white transition-colors text-sm">
              {label}
            </a>
          ))}
        </div>
      </motion.div>
    </footer>
  );
}