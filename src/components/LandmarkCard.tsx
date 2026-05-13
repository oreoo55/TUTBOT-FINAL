import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Bookmark, MapPin, Star, Eye } from 'lucide-react';
import {
  useUserCollections,
  Landmark } from
'../contexts/UserCollectionsContext';
interface LandmarkCardProps {
  landmark: Landmark;
  variant?: 'default' | 'tall';
}
export function LandmarkCard({
  landmark,
  variant = 'default'
}: LandmarkCardProps) {
  const navigate = useNavigate();
  const { isFavorite, isInWishlist, toggleFavorite, toggleWishlist } =
  useUserCollections();
  const favorited = isFavorite(landmark.id);
  const wishlisted = isInWishlist(landmark.id);
  const handleAction = (
  e: React.MouseEvent,
  action: 'favorite' | 'wishlist') =>
  {
    e.stopPropagation();
    if (action === 'favorite') toggleFavorite(landmark);else
    toggleWishlist(landmark);
  };
  const isTall = variant === 'tall';
  return (
    <motion.div
      whileHover={{
        y: -4
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25
      }}
      onClick={() => navigate(`/landmark/${landmark.id}`)}
      className={`group relative bg-white dark:bg-slate-card rounded-[24px] overflow-hidden shadow-soft dark:shadow-soft-dark border border-sand dark:border-slate-border cursor-pointer flex flex-col ${isTall ? 'h-[400px]' : ''}`}>
      
      {/* Image */}
      <div className={`relative overflow-hidden ${isTall ? 'flex-1' : 'h-48'}`}>
        <img
          src={landmark.image ?? undefined}
          alt={landmark.name}
          onError={(e) => {
            const img = e.currentTarget;
            const fallback = (landmark as any).fallback_image;
            if (fallback && img.src !== fallback) {
              img.src = fallback;
            }
          }}
          className="w-full h-full object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-105" />
        

        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/40 backdrop-blur-0 group-hover:backdrop-blur-[2px] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]" />

        {/* Rating badge */}
        <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-card/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-navy dark:text-slate-100 flex items-center gap-1 shadow-sm z-10">
          <Star className="w-3 h-3 fill-gold text-gold" /> {landmark.rating}
        </div>

        {/* Quick Action Icons - top right */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-20">
          <QuickActionButton
            active={favorited}
            onClick={(e) => handleAction(e, 'favorite')}
            label={favorited ? 'Remove from favorites' : 'Add to favorites'}
            tooltip="Favorite">
            
            <motion.span
              animate={
              favorited ?
              {
                scale: [1, 1.35, 1]
              } :
              {
                scale: 1
              }
              }
              transition={{
                duration: 0.35,
                ease: 'easeOut'
              }}
              className="flex">
              
              <Heart
                className={`w-4 h-4 transition-colors duration-300 ${favorited ? 'text-red-500 fill-red-500' : 'text-white'}`}
                style={
                favorited ?
                {
                  filter: 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.6))'
                } :
                undefined
                } />
              
            </motion.span>
          </QuickActionButton>

          <QuickActionButton
            active={wishlisted}
            onClick={(e) => handleAction(e, 'wishlist')}
            label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            tooltip="Wishlist">
            
            <motion.span
              animate={
              wishlisted ?
              {
                scale: [1, 1.35, 1]
              } :
              {
                scale: 1
              }
              }
              transition={{
                duration: 0.35,
                ease: 'easeOut'
              }}
              className="flex">
              
              <Bookmark
                className={`w-4 h-4 transition-colors duration-300 ${wishlisted ? 'text-gold fill-gold' : 'text-white'}`}
                style={
                wishlisted ?
                {
                  filter: 'drop-shadow(0 0 4px rgba(212, 168, 90, 0.7))'
                } :
                undefined
                } />
              
            </motion.span>
          </QuickActionButton>
        </div>

        {/* 360° Preview button - center on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none">
          <button className="bg-white/20 backdrop-blur-md border border-white/50 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium pointer-events-auto hover:bg-white/30 transition-colors">
            <Eye className="w-4 h-4" /> 360° Preview
          </button>
        </div>

        {/* Tall variant overlay info — adaptive gradient via CSS variable */}
        {isTall &&
        <div className="absolute bottom-0 left-0 right-0 p-5 image-overlay-bottom text-white z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-gold/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-medium">
                {landmark.category}
              </span>
            </div>
            <h3 className="text-2xl font-serif font-bold mb-1 text-white group-hover:text-gold transition-colors">
              {landmark.name}
            </h3>
            <p className="flex items-center gap-1 text-white/80 text-sm">
              <MapPin className="w-4 h-4" /> {landmark.region}
            </p>
          </div>
        }
      </div>

      {/* Default variant info below image */}
      {!isTall &&
      <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-serif font-bold text-lg text-navy dark:text-slate-100 group-hover:text-royal dark:group-hover:text-gold transition-colors line-clamp-1">
            {landmark.name}
          </h3>
          <p className="flex items-center gap-1 text-navy/60 dark:text-slate-400 text-xs mb-4 mt-1">
            <MapPin className="w-3 h-3" /> {landmark.region}
          </p>

          <div className="mt-auto flex items-center justify-between pt-4 border-t border-sand dark:border-slate-border">
            <span className="text-xs font-medium text-royal dark:text-gold bg-royal/5 dark:bg-gold/10 px-2 py-1 rounded-md">
              {landmark.era}
            </span>
            <span className="font-semibold text-navy dark:text-slate-100">
              {landmark.price === 0 ? 'Free' : `${landmark.price} EGP`}
            </span>
          </div>
        </div>
      }
    </motion.div>);

}
interface QuickActionButtonProps {
  active: boolean;
  onClick: (e: React.MouseEvent) => void;
  label: string;
  tooltip: string;
  children: React.ReactNode;
}
function QuickActionButton({
  active,
  onClick,
  label,
  tooltip,
  children
}: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`relative w-9 h-9 rounded-full backdrop-blur-md border flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-110 group/btn ${active ? 'bg-white/40 border-white/60' : 'bg-white/10 border-white/30 hover:bg-white/25'}`}>
      
      {children}
      <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-navy text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none">
        {tooltip}
      </span>
    </button>);

}