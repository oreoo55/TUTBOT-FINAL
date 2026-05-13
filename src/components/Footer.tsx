import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
export function Footer() {
  return (
    <footer className="bg-navy text-white pt-16 pb-8 px-6 mt-20 rounded-t-[40px]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div className="col-span-1 md:col-span-1">
          <Link
            to="/"
            className="flex items-center mb-6"
            aria-label="TUTBOT home">
            
            <img
              src="/6a9310a4-4037-4c9e-9d02-b510d3e7b3fc-removebg-preview.png"
              alt="TUTBOT"
              className="h-10 w-auto object-contain [filter:brightness(0)_saturate(100%)_invert(72%)_sepia(67%)_saturate(458%)_hue-rotate(2deg)_brightness(89%)_contrast(91%)]" />
            
          </Link>
          <p className="text-white/60 text-sm leading-relaxed mb-6">
            Discover the magic of Egypt with intelligent travel planning,
            immersive experiences, and curated adventures.
          </p>
          <div className="flex gap-4">
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-gold hover:text-white transition-colors text-white/80">
              
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-gold hover:text-white transition-colors text-white/80">
              
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-gold hover:text-white transition-colors text-white/80">
              
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-gold hover:text-white transition-colors text-white/80">
              
              <Youtube className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-serif text-xl font-semibold mb-6 text-gold">
            Explore
          </h4>
          <ul className="space-y-3">
            <li>
              <Link
                to="/discover"
                className="text-white/70 hover:text-white transition-colors text-sm">
                
                Destinations
              </Link>
            </li>
            <li>
              <a
                href="#"
                className="text-white/70 hover:text-white transition-colors text-sm">
                
                Archaeological Sites
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-white/70 hover:text-white transition-colors text-sm">
                
                Religious Landmarks
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-white/70 hover:text-white transition-colors text-sm">
                
                Recreational
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-xl font-semibold mb-6 text-gold">
            Company
          </h4>
          <ul className="space-y-3">
            <li>
              <a
                href="#"
                className="text-white/70 hover:text-white transition-colors text-sm">
                
                About Us
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-white/70 hover:text-white transition-colors text-sm">
                
                Community
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-white/70 hover:text-white transition-colors text-sm">
                
                Careers
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-white/70 hover:text-white transition-colors text-sm">
                
                Contact
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-xl font-semibold mb-6 text-gold">
            Newsletter
          </h4>
          <p className="text-white/60 text-sm mb-4">
            Subscribe for travel tips and exclusive offers.
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Your email"
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-gold w-full" />
            
            <button className="bg-gold text-white px-4 py-2 rounded-xl hover:bg-gold/90 transition-colors font-medium text-sm">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-white/40 text-sm">
          © 2026 TUTBOT. All rights reserved.
        </p>
        <div className="flex gap-6">
          <a
            href="#"
            className="text-white/40 hover:text-white transition-colors text-sm">
            
            Privacy Policy
          </a>
          <a
            href="#"
            className="text-white/40 hover:text-white transition-colors text-sm">
            
            Terms of Service
          </a>
        </div>
      </div>
    </footer>);

}