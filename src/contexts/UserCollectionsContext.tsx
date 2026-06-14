import { useCallback, useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { getAuthToken, AUTH_CHANGED_EVENT } from '../lib/api';
import { api } from '../lib/api';
export interface Landmark {
  id: string;
  name: string;
  region: string;
  category: string;
  rating: number;
  image: string | null;
  lat: number;
  lng: number;
  [key: string]: any;
}
interface ToastMessage {
  id: number;
  text: string;
  type: 'favorite-add' | 'favorite-remove' | 'wishlist-add' | 'wishlist-remove';
  landmark?: Landmark;
}
interface UserCollectionsContextValue {
  favorites: Landmark[];
  wishlist: Landmark[];
  isFavorite: (id: string) => boolean;
  isInWishlist: (id: string) => boolean;
  toggleFavorite: (landmark: Landmark) => void;
  toggleWishlist: (landmark: Landmark) => void;
  toasts: ToastMessage[];
}
const UserCollectionsContext = createContext<
  UserCollectionsContextValue | undefined>(
  undefined);
export function UserCollectionsProvider({ children }: {children: ReactNode;}) {
  const [favorites, setFavorites] = useState<Landmark[]>([]);
  const [wishlist, setWishlist] = useState<Landmark[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const fetchCollections = useCallback(() => {
    const token = getAuthToken();
    if (!token) {
      setFavorites([]);
      setWishlist([]);
      return;
    }
    api.get<{ data: Landmark[] }>('/me/favorites').then(r => setFavorites(r.data)).catch(() => setFavorites([]));
    api.get<{ data: Landmark[] }>('/me/wishlist').then(r => setWishlist(r.data)).catch(() => setWishlist([]));
  }, []);

  useEffect(() => {
    fetchCollections();
    const handler = () => fetchCollections();
    window.addEventListener(AUTH_CHANGED_EVENT, handler);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, handler);
  }, [fetchCollections]);

  const pushToast = useCallback(
    (text: string, type: ToastMessage['type'], landmark?: Landmark) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [
      ...prev,
      {
        id,
        text,
        type,
        landmark
      }]
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );
  const isFavorite = useCallback(
    (id: string) => favorites.some((l) => l.id === id),
    [favorites]
  );
  const isInWishlist = useCallback(
    (id: string) => wishlist.some((l) => l.id === id),
    [wishlist]
  );
  const toggleFavorite = useCallback(
    (landmark: Landmark) => {
      const exists = favorites.some((l) => l.id === landmark.id);
      if (exists) {
        api.delete(`/me/favorites/${landmark.id}`).catch(() => {});
        setFavorites((prev) => prev.filter((l) => l.id !== landmark.id));
        pushToast(`Removed from Favorites`, 'favorite-remove', landmark);
      } else {
        api.post('/me/favorites', { landmark_id: landmark.id }).catch(() => {});
        setFavorites((prev) => [...prev, landmark]);
        pushToast(`Added to Favorites`, 'favorite-add', landmark);
      }
    },
    [favorites, pushToast]
  );
  const toggleWishlist = useCallback(
    (landmark: Landmark) => {
      const exists = wishlist.some((l) => l.id === landmark.id);
      if (exists) {
        api.delete(`/me/wishlist/${landmark.id}`).catch(() => {});
        setWishlist((prev) => prev.filter((l) => l.id !== landmark.id));
        pushToast(`Removed from Wishlist`, 'wishlist-remove', landmark);
      } else {
        api.post('/me/wishlist', { landmark_id: landmark.id }).catch(() => {});
        setWishlist((prev) => [...prev, landmark]);
        pushToast(`Added to Wishlist`, 'wishlist-add', landmark);
      }
    },
    [wishlist, pushToast]
  );
  return (
    <UserCollectionsContext.Provider
      value={{
        favorites,
        wishlist,
        isFavorite,
        isInWishlist,
        toggleFavorite,
        toggleWishlist,
        toasts
      }}>
      
      {children}
    </UserCollectionsContext.Provider>);

}
export function useUserCollections() {
  const ctx = useContext(UserCollectionsContext);
  if (!ctx)
  throw new Error(
    'useUserCollections must be used within UserCollectionsProvider'
  );
  return ctx;
}